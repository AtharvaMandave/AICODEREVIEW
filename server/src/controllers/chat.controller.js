import { chatWithCodebase, getSuggestedQuestions, reindexProject } from '../services/chat.service.js';
import { logger } from '../utils/logger.js';

/**
 * Handle chat message
 */
export const sendChatMessage = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        logger.info(`Chat request for project ${projectId}`);

        const result = await chatWithCodebase(projectId, message.trim(), history || []);

        if (result.success) {
            res.json({
                success: true,
                response: result.message,
                relevantFiles: result.relevantFiles || [],
                searchMethod: result.searchMethod || 'keyword'
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.message
            });
        }

    } catch (error) {
        logger.error('Chat controller error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process chat message'
        });
    }
};

/**
 * Get suggested questions for a project
 */
export const getQuestionSuggestions = async (req, res) => {
    try {
        const { projectId } = req.params;
        const suggestions = await getSuggestedQuestions(projectId);

        res.json({
            success: true,
            suggestions
        });

    } catch (error) {
        logger.error('Suggestions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get suggestions'
        });
    }
};

/**
 * Reindex a project for RAG
 */
export const reindexProjectHandler = async (req, res) => {
    try {
        const { projectId } = req.params;
        logger.info(`Reindex request for project ${projectId}`);

        const result = await reindexProject(projectId);

        if (result.success) {
            res.json({
                success: true,
                message: result.message
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.message
            });
        }

    } catch (error) {
        logger.error('Reindex controller error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reindex project'
        });
    }
};
