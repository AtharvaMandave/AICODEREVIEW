import { GROQ_API_KEY } from '../config/env.js';
import { logger } from '../utils/logger.js';
import Project from '../models/Project.js';
import { readDirectoryRecursive } from './file-reader.service.js';
import {
    queryRelevantChunks,
    indexProjectFiles,
    isProjectIndexed
} from './embedding.service.js';

/**
 * Truncate text to stay within token limits
 */
const truncateText = (text, maxChars = 8000) => {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + '\n... [truncated]';
};

/**
 * Call Groq API for chat completion
 */
const callGroqChat = async (messages, maxTokens = 2048) => {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not defined');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: maxTokens,
            temperature: 0.4,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
        throw new Error('Invalid response from Groq API');
    }

    return data.choices[0].message.content;
};

/**
 * Fallback: Simple keyword-based file retrieval
 * Used when vector search is not available
 */
const findRelevantFilesFallback = (files, query) => {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(w => w.length > 2);

    const scoredFiles = files.map(file => {
        let score = 0;
        const pathLower = file.path.toLowerCase();
        const contentLower = (file.content || '').toLowerCase();

        keywords.forEach(keyword => {
            if (pathLower.includes(keyword)) score += 10;
            if (contentLower.includes(keyword)) score += 1;
        });

        // Boost important file types
        if (file.path.includes('controller')) score += 5;
        if (file.path.includes('service')) score += 5;
        if (file.path.includes('model')) score += 5;
        if (file.path.includes('route')) score += 5;
        if (file.path.includes('auth')) score += 5;
        if (file.path.includes('config')) score += 3;

        // Check for specific terms in query
        if (queryLower.includes('auth') && pathLower.includes('auth')) score += 20;
        if (queryLower.includes('api') && pathLower.includes('route')) score += 15;
        if (queryLower.includes('database') && (pathLower.includes('model') || pathLower.includes('db'))) score += 15;
        if (queryLower.includes('user') && pathLower.includes('user')) score += 15;

        return { file, score };
    });

    return scoredFiles
        .filter(sf => sf.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(sf => sf.file);
};

/**
 * Format chunks for context
 */
const formatChunksForContext = (chunks) => {
    return chunks.map(chunk => {
        const lineInfo = chunk.startLine ? ` (lines ${chunk.startLine}-${chunk.endLine})` : '';
        return `### File: ${chunk.path}${lineInfo}\n\`\`\`\n${truncateText(chunk.content, 2000)}\n\`\`\``;
    }).join('\n\n');
};

/**
 * Format files for context (fallback)
 */
const formatFilesForContext = (files) => {
    return files.map(file => {
        const content = truncateText(file.content || '', 2000);
        return `### File: ${file.path}\n\`\`\`\n${content}\n\`\`\``;
    }).join('\n\n');
};

/**
 * Build the system prompt for the chat
 */
const buildSystemPrompt = (projectName, fileList) => {
    return `You are an expert code assistant analyzing a codebase called "${projectName}".

Your role is to:
1. Answer questions about the code structure, logic, and implementation
2. Explain how different parts of the code work together
3. Help users understand the architecture and design patterns used
4. Provide insights about potential improvements
5. Reference specific files and line numbers when relevant

Important guidelines:
- Be helpful, accurate, and cite specific files/line numbers when relevant
- Keep responses concise but informative
- If you're not sure about something, say so
- Use code blocks when showing code examples
- Format your responses with markdown for better readability

Here's the project structure:
${fileList}`;
};

/**
 * Ensure project is indexed for RAG
 */
const ensureProjectIndexed = async (projectId, files) => {
    try {
        const indexed = await isProjectIndexed(projectId);
        if (!indexed && files.length > 0) {
            logger.info(`Indexing project ${projectId} for RAG...`);
            await indexProjectFiles(projectId, files);
            logger.info(`Project ${projectId} indexed successfully`);
        }
        return true;
    } catch (error) {
        logger.warn(`Failed to index project ${projectId}, using fallback:`, error.message);
        return false;
    }
};

/**
 * Main chat function with RAG support
 */
export const chatWithCodebase = async (projectId, userMessage, conversationHistory = []) => {
    try {
        // Fetch project and files
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Get files from the filesystem
        let files = [];
        try {
            files = readDirectoryRecursive(project.uploadPath);
        } catch (error) {
            logger.error(`Failed to read project files: ${error.message}`);
        }

        if (files.length === 0) {
            return {
                success: false,
                message: 'No files found in this project. The project may have been deleted or moved.'
            };
        }

        // Create file list for context
        const fileList = files.map(f => `- ${f.path} (${f.lines || 0} lines)`).join('\n');

        logger.info(`Chat query for project ${projectId}: "${userMessage.substring(0, 50)}..."`);

        // Try to use vector search (RAG)
        let contextContent = '';
        let relevantPaths = [];
        let useVectorSearch = false;

        try {
            // Ensure project is indexed
            await ensureProjectIndexed(projectId, files);

            // Query relevant chunks using vector search
            const relevantChunks = await queryRelevantChunks(projectId, userMessage, 6);

            if (relevantChunks.length > 0) {
                useVectorSearch = true;
                contextContent = formatChunksForContext(relevantChunks);
                relevantPaths = [...new Set(relevantChunks.map(c => c.path))];
                logger.info(`Found ${relevantChunks.length} relevant chunks via vector search`);
            }
        } catch (error) {
            logger.warn('Vector search failed, using fallback:', error.message);
        }

        // Fallback to keyword-based search if vector search didn't work
        if (!useVectorSearch) {
            const relevantFiles = findRelevantFilesFallback(files, userMessage);
            if (relevantFiles.length > 0) {
                contextContent = formatFilesForContext(relevantFiles);
                relevantPaths = relevantFiles.map(f => f.path);
                logger.info(`Found ${relevantFiles.length} relevant files via fallback search`);
            }
        }

        // Build messages for the API
        const systemPrompt = buildSystemPrompt(project.name, fileList);

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history (last 6 messages max)
        const recentHistory = conversationHistory.slice(-6);
        messages.push(...recentHistory);

        // Add context and current query
        let userPrompt = '';
        if (contextContent) {
            userPrompt = `Here is relevant code context (retrieved via ${useVectorSearch ? 'semantic search' : 'keyword matching'}):\n\n${contextContent}\n\n---\n\nUser question: ${userMessage}`;
        } else {
            userPrompt = `User question: ${userMessage}`;
        }

        messages.push({ role: 'user', content: truncateText(userPrompt, 12000) });

        // Call the AI
        const response = await callGroqChat(messages);

        return {
            success: true,
            message: response,
            relevantFiles: relevantPaths,
            searchMethod: useVectorSearch ? 'vector' : 'keyword'
        };

    } catch (error) {
        logger.error('Chat error:', error.message);
        return {
            success: false,
            message: `Error: ${error.message}`
        };
    }
};

/**
 * Get suggested questions for a project
 */
export const getSuggestedQuestions = async (projectId) => {
    try {
        const project = await Project.findById(projectId);
        if (!project) return [];

        const files = project.files || [];
        const suggestions = [
            'What is the overall architecture of this project?',
            'How is error handling implemented?',
        ];

        // Add dynamic suggestions based on file structure
        if (files.some(f => f.path.includes('auth'))) {
            suggestions.push('How does authentication work in this project?');
        }
        if (files.some(f => f.path.includes('api') || f.path.includes('route'))) {
            suggestions.push('What API endpoints are available?');
        }
        if (files.some(f => f.path.includes('model'))) {
            suggestions.push('What database models are defined?');
        }
        if (files.some(f => f.path.includes('test'))) {
            suggestions.push('What testing strategy is used?');
        }
        if (files.some(f => f.path.includes('component') || f.path.includes('.jsx') || f.path.includes('.tsx'))) {
            suggestions.push('What React components are used and how do they interact?');
        }
        if (files.some(f => f.path.includes('hook'))) {
            suggestions.push('What custom hooks are defined?');
        }
        if (files.some(f => f.path.includes('middleware'))) {
            suggestions.push('What middleware is used and what does it do?');
        }
        if (files.some(f => f.path.includes('config') || f.path.includes('.env'))) {
            suggestions.push('How is configuration managed?');
        }

        return suggestions.slice(0, 6);

    } catch (error) {
        logger.error('Error generating suggestions:', error.message);
        return [];
    }
};

/**
 * Reindex a project (useful after code changes)
 */
export const reindexProject = async (projectId) => {
    try {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Read files from filesystem
        const files = readDirectoryRecursive(project.uploadPath);
        const count = await indexProjectFiles(projectId, files);

        return {
            success: true,
            message: `Indexed ${count} chunks from ${files.length} files`
        };
    } catch (error) {
        logger.error('Reindex error:', error.message);
        return {
            success: false,
            message: error.message
        };
    }
};
