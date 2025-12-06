import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Project from './src/models/Project.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const createProject = async () => {
    try {
        await connectDB();

        const project = new Project({
            name: 'Test Project',
            sourceType: 'file',
            uploadPath: path.resolve('./src'), // Use server src as test code
            fileCount: 10,
            status: 'uploaded'
        });

        await project.save();
        console.log(`Created project: ${project.name} (${project._id})`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createProject();
