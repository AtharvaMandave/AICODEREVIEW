import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_DIR, MAX_FILE_SIZE } from '../config/env.js';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const projectId = uuidv4();
        const projectDir = path.join(UPLOAD_DIR, projectId);

        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        req.projectId = projectId;
        req.projectDir = projectDir;

        cb(null, projectDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/javascript',
        'text/javascript',
        'application/typescript',
        'text/x-python',
        'text/x-java-source',
        'text/plain'
    ];

    const allowedExtensions = ['.zip', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only code files and ZIP archives are allowed.'), false);
    }
};

// Export configured multer
export const uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});
