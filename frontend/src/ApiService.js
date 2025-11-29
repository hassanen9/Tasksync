import axios from 'axios';

// Create an Axios instance with default settings
const api = axios.create({
    baseURL: "http://localhost:8000/api",
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a response interceptor for consistent error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response || error);
        return Promise.reject(error);
    }
);

// API functions for Projects
export const getProjects = () => api.get('/project/');
export const getProjectById = (id) => api.get(`/project/${id}/`);
export const addProject = (project) => api.post('/project/', project);
export const updateProject = (id, project) => api.put(`/project/${id}/`, project);
export const deleteProject = (id) => api.delete(`/project/${id}/`);
export const getProjectTasks = (id) => api.get(`/project/${id}/tasks/`);

// API functions for Tasks
export const getTasks = () => api.get('/task/');
export const getTaskById = (id) => api.get(`/task/${id}/`);
export const addTask = (task) => api.post('/task/', task);
export const updateTask = (id, task) => api.put(`/task/${id}/`, task);
export const deleteTask = (id) => api.delete(`/task/${id}/`);
export const markTaskComplete = (id) => api.patch(`/task/${id}/`, { is_completed: true });
export const markTaskIncomplete = (id) => api.patch(`/task/${id}/`, { is_completed: false });

// API function for Task Dependencies
export const getDependencies = () => api.get('/task/dependencies/');
export const addDependency = (taskId, depTaskId) => 
    api.post(`/task/${taskId}/add_dependency/`, null, {
        params: { dependentOnTaskId: depTaskId }
    });
export const removeDependency = (taskId, depTaskId) => 
    api.delete(`/task/${taskId}/remove_dependency/`, {
        params: { dependentOnTaskId: depTaskId }
    });
