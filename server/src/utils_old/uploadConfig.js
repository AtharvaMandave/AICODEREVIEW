import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create unique folder for each upload
        const projectId = uuidv4();
        const projectDir = path.join(uploadDir, projectId);

        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        // Store projectId in request for later use
        req.projectId = projectId;
        req.projectDir = projectDir;

        cb(null, projectDir);
    },
    filename: (req, file, cb) => {
        // Keep original filename
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

// Create multer instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 262144000 // 250MB default
    }
});

/**
 * Clean up uploaded files
 */
export const cleanupUpload = (projectDir) => {
    try {
        if (fs.existsSync(projectDir)) {
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error('Error cleaning up upload:', error);
    }
};
