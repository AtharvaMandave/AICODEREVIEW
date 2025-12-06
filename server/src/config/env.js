import dotenv from 'dotenv';
dotenv.config();

export const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-analyzer';
export const PORT = process.env.PORT || 5000;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 262144000; // 250MB
export const MAX_CODEBASE_SIZE = parseInt(process.env.MAX_CODEBASE_SIZE) || 1073741824; // 1GB

// Analysis Configuration
export const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 1500;
export const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP) || 50;
export const MAX_CONCURRENT_AI_REQUESTS = parseInt(process.env.MAX_CONCURRENT_AI_REQUESTS) || 5;
