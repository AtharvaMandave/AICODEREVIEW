import express from 'express';
import { sendChatMessage, getQuestionSuggestions, reindexProjectHandler } from '../controllers/chat.controller.js';

const router = express.Router();

// POST /api/chat/:projectId - Send a chat message
router.post('/:projectId', sendChatMessage);

// GET /api/chat/:projectId/suggestions - Get suggested questions
router.get('/:projectId/suggestions', getQuestionSuggestions);

// POST /api/chat/:projectId/reindex - Reindex project for RAG
router.post('/:projectId/reindex', reindexProjectHandler);

export default router;
