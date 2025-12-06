import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';

/**
 * Extract ZIP file to destination directory
 */
export const extractZip = async (zipPath, extractDir) => {
    try {
        // Create extraction directory if it doesn't exist
        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir, { recursive: true });
        }

        // Extract ZIP
        await fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: extractDir }))
            .promise();

        // Delete the ZIP file after extraction
        fs.unlinkSync(zipPath);

        return { success: true, extractDir };
    } catch (error) {
        throw new Error(`ZIP extraction failed: ${error.message}`);
    }
};
