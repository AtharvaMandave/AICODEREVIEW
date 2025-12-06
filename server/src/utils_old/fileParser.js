import fs from 'fs';
import path from 'path';

/**
 * Recursively read directory structure and filter supported file types
 */
export const parseDirectory = (dirPath, baseDir = dirPath) => {
    const supportedExtensions = [
        '.js', '.jsx', '.ts', '.tsx',  // JavaScript/TypeScript
        '.py',                          // Python
        '.java',                        // Java
        '.go',                          // Go
        '.rs'                           // Rust
    ];

    const files = [];
    const stats = {
        totalFiles: 0,
        totalLines: 0,
        languages: {}
    };

    const traverse = (currentPath) => {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const stat = fs.statSync(fullPath);

            // Skip node_modules, .git, and other common directories
            if (stat.isDirectory()) {
                const dirName = path.basename(fullPath);
                if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__'].includes(dirName)) {
                    continue;
                }
                traverse(fullPath);
            } else if (stat.isFile()) {
                const ext = path.extname(fullPath);
                if (supportedExtensions.includes(ext)) {
                    const relativePath = path.relative(baseDir, fullPath);
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lineCount = content.split('\n').length;

                    files.push({
                        path: relativePath,
                        fullPath: fullPath,
                        extension: ext,
                        size: stat.size,
                        lines: lineCount,
                        content: content
                    });

                    stats.totalFiles++;
                    stats.totalLines += lineCount;

                    // Track language stats
                    const language = getLanguageFromExtension(ext);
                    if (!stats.languages[language]) {
                        stats.languages[language] = { fileCount: 0, lineCount: 0 };
                    }
                    stats.languages[language].fileCount++;
                    stats.languages[language].lineCount += lineCount;
                }
            }
        }
    };

    traverse(dirPath);

    return { files, stats };
};

/**
 * Get language name from file extension
 */
const getLanguageFromExtension = (ext) => {
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
 * Detect primary language of the codebase
 */
export const detectPrimaryLanguage = (stats) => {
    if (!stats.languages || Object.keys(stats.languages).length === 0) {
        return 'Unknown';
    }

    let maxLines = 0;
    let primaryLanguage = 'Unknown';

    for (const [language, data] of Object.entries(stats.languages)) {
        if (data.lineCount > maxLines) {
            maxLines = data.lineCount;
            primaryLanguage = language;
        }
    }

    return primaryLanguage;
};

/**
 * Generate file manifest for the project
 */
export const generateManifest = (files, stats) => {
    return {
        totalFiles: stats.totalFiles,
        totalLines: stats.totalLines,
        languages: Object.entries(stats.languages).map(([language, data]) => ({
            language,
            fileCount: data.fileCount,
            lineCount: data.lineCount,
            percentage: ((data.lineCount / stats.totalLines) * 100).toFixed(2)
        })),
        files: files.map(f => ({
            path: f.path,
            extension: f.extension,
            lines: f.lines,
            size: f.size
        }))
    };
};
