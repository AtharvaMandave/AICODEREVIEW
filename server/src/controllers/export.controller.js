import { generatePDFReport } from '../services/pdf.service.js';
import { logger } from '../utils/logger.js';

/**
 * Export project report as PDF
 */
export const exportPDF = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        logger.info(`Exporting PDF for project: ${projectId}`);

        // Generate PDF
        const pdfBuffer = await generatePDFReport(projectId);

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="code-audit-report-${projectId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

        logger.info(`PDF exported successfully for project: ${projectId}`);

    } catch (error) {
        logger.error('PDF export error:', error);
        next(error);
    }
};
