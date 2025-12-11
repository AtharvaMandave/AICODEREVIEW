import axios from 'axios';

async function getLatestProject() {
    try {
        const response = await axios.get('http://localhost:5000/api/projects');
        const projects = response.data.projects;
        if (projects.length > 0) {
            const latest = projects[0];
            console.log('Latest Project ID:', latest._id);
            console.log('Latest Project Name:', latest.name);
        } else {
            console.log('No projects found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

getLatestProject();
