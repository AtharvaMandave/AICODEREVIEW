import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { simpleGit } from 'simple-git';
import fs from 'fs';
import Project from '../models/Project.js';
import { extractZip } from '../services/zip.service.js';
import { readDirectoryRecursive, calculateStats } from '../services/file-reader.service.js';
import { cleanupDirectory } from '../services/file-reader.service.js';
import { UPLOAD_DIR } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Upload single file
 */
export const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { projectId, projectDir } = req;
        const { name, description } = req.body;

        // Read and analyze files
        const files = readDirectoryRecursive(projectDir);
        const stats = calculateStats(files);

        if (files.length === 0) {
            cleanupDirectory(projectDir);
            return res.status(400).json({ error: 'No supported code files found' });
        }

        // Create project
        const project = new Project({
            userId: req.user ? req.user._id : null,
            name: name || req.file.originalname,
            description: description || '',
            sourceType: 'file',
            uploadPath: projectDir,
            fileCount: stats.totalFiles,
            totalLines: stats.totalLines,
            languages: Object.entries(stats.languages).map(([language, data]) => ({
                language,
                fileCount: data.fileCount,
                lineCount: data.lineCount
            })),
            status: 'uploaded'
        });

        await project.save();
        logger.info(`File uploaded: ${project.name} (ID: ${project._id})`);

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            project: {
                id: project._id,
                name: project.name,
                fileCount: project.fileCount,
                totalLines: project.totalLines,
                languages: project.languages,
                status: project.status
            }
        });

    } catch (error) {
        logger.error('Upload file error:', error);
        if (req.projectDir) cleanupDirectory(req.projectDir);
        next(error);
    }
};

/**
 * Upload and extract ZIP
 */
export const uploadZip = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No ZIP file uploaded' });
        }

        const { projectId, projectDir } = req;
        const { name, description } = req.body;
        const zipPath = req.file.path;

        // Extract ZIP
        const extractDir = path.join(projectDir, 'extracted');
        await extractZip(zipPath, extractDir);

        // Read and analyze files
        const files = readDirectoryRecursive(extractDir);
        const stats = calculateStats(files);

        if (files.length === 0) {
            cleanupDirectory(projectDir);
            return res.status(400).json({ error: 'No supported code files found in ZIP' });
        }

        // Create project
        const project = new Project({
            userId: req.user ? req.user._id : null,
            name: name || req.file.originalname.replace('.zip', ''),
            description: description || '',
            sourceType: 'zip',
            uploadPath: extractDir,
            fileCount: stats.totalFiles,
            totalLines: stats.totalLines,
            languages: Object.entries(stats.languages).map(([language, data]) => ({
                language,
                fileCount: data.fileCount,
                lineCount: data.lineCount
            })),
            status: 'uploaded'
        });

        await project.save();
        logger.info(`ZIP uploaded: ${project.name} (ID: ${project._id})`);

        res.status(201).json({
            success: true,
            message: 'ZIP file uploaded and extracted successfully',
            project: {
                id: project._id,
                name: project.name,
                fileCount: project.fileCount,
                totalLines: project.totalLines,
                languages: project.languages,
                status: project.status
            }
        });

    } catch (error) {
        logger.error('Upload ZIP error:', error);
        if (req.projectDir) cleanupDirectory(req.projectDir);
        next(error);
    }
};

/**
 * Clone GitHub repository
 */
export const uploadGithub = async (req, res, next) => {
    try {
        const { githubUrl, name, description } = req.body;

        if (!githubUrl) {
            return res.status(400).json({ error: 'GitHub URL is required' });
        }

        // Validate GitHub URL
        const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+/;
        if (!githubRegex.test(githubUrl)) {
            return res.status(400).json({ error: 'Invalid GitHub URL' });
        }

        // Create project directory
        const projectId = uuidv4();
        const projectDir = path.join(UPLOAD_DIR, projectId);

        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        const cloneDir = path.join(projectDir, 'repo');

        // Clone repository
        const git = simpleGit();
        await git.clone(githubUrl, cloneDir, ['--depth', '1']);

        // Read and analyze files
        const files = readDirectoryRecursive(cloneDir);
        const stats = calculateStats(files);

        if (files.length === 0) {
            cleanupDirectory(projectDir);
            return res.status(400).json({ error: 'No supported code files found in repository' });
        }

        // Extract repo name
        const repoName = githubUrl.split('/').pop().replace('.git', '');

        // Create project
        const project = new Project({
            userId: req.user ? req.user._id : null,
            name: name || repoName,
            description: description || '',
            sourceType: 'github',
            githubUrl: githubUrl,
            uploadPath: cloneDir,
            fileCount: stats.totalFiles,
            totalLines: stats.totalLines,
            languages: Object.entries(stats.languages).map(([language, data]) => ({
                language,
                fileCount: data.fileCount,
                lineCount: data.lineCount
            })),
            status: 'uploaded'
        });

        await project.save();
        logger.info(`GitHub repo cloned: ${project.name} (ID: ${project._id})`);

        res.status(201).json({
            success: true,
            message: 'GitHub repository cloned successfully',
            project: {
                id: project._id,
                name: project.name,
                githubUrl: project.githubUrl,
                fileCount: project.fileCount,
                totalLines: project.totalLines,
                languages: project.languages,
                status: project.status
            }
        });

    } catch (error) {
        logger.error('GitHub clone error:', error);
        next(error);
    }
};
