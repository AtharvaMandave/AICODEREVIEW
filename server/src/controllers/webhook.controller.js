import { simpleGit } from 'simple-git';
import Project from '../models/Project.js';
import { performAnalysis } from '../services/analysis.service.js';
import { logger } from '../utils/logger.js';

export const handleGithubWebhook = async (req, res) => {
    try {
        const event = req.headers['x-github-event'];
        const payload = req.body;

        if (event === 'ping') {
            return res.status(200).json({ message: 'Pong' });
        }

        if (event !== 'push') {
            return res.status(200).json({ message: 'Ignored event' });
        }

        const repoUrl = payload.repository.clone_url;
        const htmlUrl = payload.repository.html_url;

        logger.info(`Received GitHub push event for ${repoUrl}`);

        // Find project by GitHub URL (try both clone_url and html_url)
        const projects = await Project.find({
            sourceType: 'github',
            $or: [
                { githubUrl: repoUrl },
                { githubUrl: htmlUrl },
                { githubUrl: { $regex: new RegExp(payload.repository.full_name, 'i') } } // Fallback: try to match by full name
            ]
        });

        if (projects.length === 0) {
            logger.warn(`No project found for GitHub repo: ${repoUrl}`);
            return res.status(404).json({ message: 'Project not found' });
        }

        // Trigger update for all matching projects
        for (const project of projects) {
            logger.info(`Triggering update for project: ${project.name} (${project._id})`);

            try {
                // Pull latest code
                const git = simpleGit(project.uploadPath);
                await git.pull();
                logger.info(`Pulled latest code for ${project.name}`);

                // Trigger analysis
                // We don't await this so the webhook returns quickly
                performAnalysis(project._id)
                    .then(() => logger.info(`Webhook analysis completed for ${project.name}`))
                    .catch(err => logger.error(`Webhook analysis failed for ${project.name}:`, err));

            } catch (err) {
                logger.error(`Failed to pull code for ${project.name}:`, err);
            }
        }

        res.status(200).json({ success: true, message: 'Update triggered' });

    } catch (error) {
        logger.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};
