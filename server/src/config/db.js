import mongoose from 'mongoose';
import { DB_URI } from './env.js';

export const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};
