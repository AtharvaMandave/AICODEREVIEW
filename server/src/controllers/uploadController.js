import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';
import Project from '../models/Project.js';
import { parseDirectory, detectPrimaryLanguage, generateManifest } from '../utils/fileParser.js';
import { cleanupUpload } from '../utils/uploadConfig.js';

/**
 * Handle single file upload
 */
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { projectId, projectDir } = req;
        const { name, description } = req.body;

        // Parse the uploaded file
        const { files, stats } = parseDirectory(projectDir);

        if (files.length === 0) {
            cleanupUpload(projectDir);
            return res.status(400).json({ error: 'No supported code files found' });
        }

        // Create project in database
        const project = new Project({
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
            },
            manifest: generateManifest(files, stats)
        });

    } catch (error) {
        console.error('Upload error:', error);
        if (req.projectDir) {
            cleanupUpload(req.projectDir);
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handle ZIP file upload and extraction
 */
export const uploadZip = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No ZIP file uploaded' });
        }

        const { projectId, projectDir } = req;
        const { name, description } = req.body;
        const zipPath = req.file.path;

        // Extract ZIP file
        const extractDir = path.join(projectDir, 'extracted');
        await fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: extractDir }))
            .promise();

        // Delete the ZIP file after extraction
        fs.unlinkSync(zipPath);

        // Parse extracted files
        const { files, stats } = parseDirectory(extractDir);

        if (files.length === 0) {
            cleanupUpload(projectDir);
            return res.status(400).json({ error: 'No supported code files found in ZIP' });
        }

        // Create project in database
        const project = new Project({
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
            },
            manifest: generateManifest(files, stats)
        });

    } catch (error) {
        console.error('ZIP upload error:', error);
        if (req.projectDir) {
            cleanupUpload(req.projectDir);
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handle GitHub repository cloning
 */
export const uploadGithub = async (req, res) => {
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
        const projectId = require('uuid').v4();
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const projectDir = path.join(uploadDir, projectId);

        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        const cloneDir = path.join(projectDir, 'repo');

        // Clone repository (shallow clone for speed)
        const git = simpleGit();
        await git.clone(githubUrl, cloneDir, ['--depth', '1']);

        // Parse cloned repository
        const { files, stats } = parseDirectory(cloneDir);

        if (files.length === 0) {
            cleanupUpload(projectDir);
            return res.status(400).json({ error: 'No supported code files found in repository' });
        }

        // Extract repo name from URL
        const repoName = githubUrl.split('/').pop().replace('.git', '');

        // Create project in database
        const project = new Project({
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
            },
            manifest: generateManifest(files, stats)
        });

    } catch (error) {
        console.error('GitHub clone error:', error);
        res.status(500).json({ error: error.message });
    }
};
