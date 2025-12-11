import { ChromaClient } from 'chromadb';
import { logger } from '../utils/logger.js';

/**
 * Embedding Service using ChromaDB with default embeddings
 * Uses the built-in ONNX-based embeddings from chromadb-default-embed
 */

let chromaClient = null;
let embeddingFunction = null;

/**
 * Initialize ChromaDB client
 */
const initializeChroma = async () => {
    if (chromaClient) return chromaClient;

    try {
        // Use ephemeral client (in-memory) - data persists only during runtime
        // For production, use PersistentClient with a path
        chromaClient = new ChromaClient();
        logger.info('ChromaDB client initialized successfully');
        return chromaClient;
    } catch (error) {
        logger.error('Failed to initialize ChromaDB:', error.message);
        throw error;
    }
};

/**
 * Simple TF-IDF based embedding for code
 * This is a lightweight alternative when no external embedding API is available
 */
const createSimpleEmbedding = (text, dimensions = 384) => {
    // Tokenize the text
    const tokens = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);

    // Create a simple hash-based embedding
    const embedding = new Array(dimensions).fill(0);

    tokens.forEach((token, idx) => {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
        }

        // Distribute across embedding dimensions
        const position = Math.abs(hash) % dimensions;
        embedding[position] += 1 / (1 + idx * 0.1); // Weight by position
    });

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map(val => val / magnitude);
};

/**
 * Custom embedding function for ChromaDB
 */
class CodeEmbeddingFunction {
    async generate(texts) {
        return texts.map(text => createSimpleEmbedding(text));
    }
}

/**
 * Get or create a collection for a project
 */
export const getProjectCollection = async (projectId) => {
    const client = await initializeChroma();
    const collectionName = `project_${projectId}`;

    try {
        // Try to get existing collection
        const collection = await client.getOrCreateCollection({
            name: collectionName,
            embeddingFunction: new CodeEmbeddingFunction(),
            metadata: {
                "hnsw:space": "cosine",
                "description": "Code embeddings for RAG"
            }
        });

        return collection;
    } catch (error) {
        logger.error(`Failed to get collection ${collectionName}:`, error.message);
        throw error;
    }
};

/**
 * Index project files into ChromaDB
 */
export const indexProjectFiles = async (projectId, files) => {
    try {
        const collection = await getProjectCollection(projectId);

        // Clear existing documents for this project
        try {
            const existingDocs = await collection.get();
            if (existingDocs.ids && existingDocs.ids.length > 0) {
                await collection.delete({ ids: existingDocs.ids });
            }
        } catch (e) {
            // Collection might be empty
        }

        // Prepare documents for indexing
        const documents = [];
        const metadatas = [];
        const ids = [];

        files.forEach((file, index) => {
            if (!file.content || file.content.length < 10) return;

            // Split large files into chunks
            const chunks = splitIntoChunks(file.content, file.path);

            chunks.forEach((chunk, chunkIndex) => {
                const docId = `${projectId}_${index}_${chunkIndex}`;
                documents.push(chunk.content);
                metadatas.push({
                    path: file.path,
                    extension: file.extension || '',
                    chunkIndex: chunkIndex,
                    startLine: chunk.startLine,
                    endLine: chunk.endLine
                });
                ids.push(docId);
            });
        });

        if (documents.length === 0) {
            logger.warn(`No documents to index for project ${projectId}`);
            return 0;
        }

        // Add documents to collection in batches
        const batchSize = 100;
        for (let i = 0; i < documents.length; i += batchSize) {
            const batchDocs = documents.slice(i, i + batchSize);
            const batchMeta = metadatas.slice(i, i + batchSize);
            const batchIds = ids.slice(i, i + batchSize);

            await collection.add({
                documents: batchDocs,
                metadatas: batchMeta,
                ids: batchIds
            });
        }

        logger.info(`Indexed ${documents.length} chunks for project ${projectId}`);
        return documents.length;

    } catch (error) {
        logger.error(`Failed to index project ${projectId}:`, error.message);
        throw error;
    }
};

/**
 * Split file content into meaningful chunks
 */
const splitIntoChunks = (content, filePath, maxChunkSize = 1500) => {
    const chunks = [];
    const lines = content.split('\n');
    let currentChunk = [];
    let currentSize = 0;
    let startLine = 1;

    // Try to split at function/class boundaries for code files
    const isCodeFile = /\.(js|jsx|ts|tsx|py|java|go|rs|c|cpp|cs)$/i.test(filePath);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineSize = line.length + 1;

        // Check if we should start a new chunk
        const shouldSplit = currentSize + lineSize > maxChunkSize && currentChunk.length > 0;
        const isBoundary = isCodeFile && (
            /^(function|class|const|let|var|export|def |async |public |private )/.test(line.trim()) ||
            /^(import |from |require)/.test(line.trim())
        );

        if (shouldSplit || (isBoundary && currentSize > maxChunkSize / 2)) {
            chunks.push({
                content: currentChunk.join('\n'),
                startLine: startLine,
                endLine: startLine + currentChunk.length - 1
            });
            currentChunk = [];
            currentSize = 0;
            startLine = i + 1;
        }

        currentChunk.push(line);
        currentSize += lineSize;
    }

    // Add remaining content
    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk.join('\n'),
            startLine: startLine,
            endLine: startLine + currentChunk.length - 1
        });
    }

    return chunks;
};

/**
 * Query similar documents using vector search
 */
export const queryRelevantChunks = async (projectId, query, nResults = 5) => {
    try {
        const collection = await getProjectCollection(projectId);

        const results = await collection.query({
            queryTexts: [query],
            nResults: nResults
        });

        if (!results.documents || results.documents.length === 0) {
            return [];
        }

        // Format results
        const relevantChunks = results.documents[0].map((doc, idx) => ({
            content: doc,
            path: results.metadatas[0][idx]?.path || 'unknown',
            startLine: results.metadatas[0][idx]?.startLine || 0,
            endLine: results.metadatas[0][idx]?.endLine || 0,
            distance: results.distances ? results.distances[0][idx] : 0
        }));

        return relevantChunks;

    } catch (error) {
        logger.error(`Failed to query project ${projectId}:`, error.message);
        return [];
    }
};

/**
 * Check if project is indexed
 */
export const isProjectIndexed = async (projectId) => {
    try {
        const collection = await getProjectCollection(projectId);
        const count = await collection.count();
        return count > 0;
    } catch (error) {
        return false;
    }
};

/**
 * Delete project index
 */
export const deleteProjectIndex = async (projectId) => {
    try {
        const client = await initializeChroma();
        const collectionName = `project_${projectId}`;
        await client.deleteCollection({ name: collectionName });
        logger.info(`Deleted index for project ${projectId}`);
    } catch (error) {
        logger.warn(`Failed to delete index for project ${projectId}:`, error.message);
    }
};

export default {
    indexProjectFiles,
    queryRelevantChunks,
    isProjectIndexed,
    deleteProjectIndex,
    getProjectCollection
};
