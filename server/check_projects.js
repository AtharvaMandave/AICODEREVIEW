import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Project from './src/models/Project.js';
import dotenv from 'dotenv';

dotenv.config();

const checkProjects = async () => {
    try {
        await connectDB();
        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects.`);
        projects.forEach(p => console.log(`- ${p.name} (${p._id})`));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkProjects();
