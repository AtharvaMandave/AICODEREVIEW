import fs from 'fs';
import path from 'path';

/**
 * Read directory recursively and get all files
 */
export const readDirectoryRecursive = (dirPath, baseDir = dirPath) => {
    const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs'];
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__', 'venv'];

    const files = [];

    const traverse = (currentPath) => {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!excludeDirs.includes(path.basename(fullPath))) {
                    traverse(fullPath);
                }
            } else if (stat.isFile()) {
                const ext = path.extname(fullPath);
                if (supportedExtensions.includes(ext)) {
                    const relativePath = path.relative(baseDir, fullPath);
                    const content = fs.readFileSync(fullPath, 'utf-8');

                    files.push({
                        path: relativePath,
                        fullPath: fullPath,
                        extension: ext,
                        size: stat.size,
                        lines: content.split('\n').length,
                        content: content
                    });
                }
            }
        }
    };

    traverse(dirPath);
    return files;
};

/**
 * Calculate statistics from files
 */
export const calculateStats = (files) => {
    const stats = {
        totalFiles: files.length,
        totalLines: 0,
        totalSize: 0,
        languages: {}
    };

    for (const file of files) {
        stats.totalLines += file.lines;
        stats.totalSize += file.size;

        const language = getLanguageFromExtension(file.extension);
        if (!stats.languages[language]) {
            stats.languages[language] = { fileCount: 0, lineCount: 0 };
        }
        stats.languages[language].fileCount++;
        stats.languages[language].lineCount += file.lines;
    }

    return stats;
};

/**
 * Get language name from extension
 */
export const getLanguageFromExtension = (ext) => {
    const languageMap = {
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.py': 'Python',
        '.java': 'Java',
        '.go': 'Go',
        '.rs': 'Rust'
    };
    return languageMap[ext] || 'Unknown';
};

/**
 * Clean up directory
 */
export const cleanupDirectory = (dirPath) => {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    } catch (error) {
        console.error('Error cleaning up directory:', error);
    }
};
