import React, { useState, useEffect } from 'react';
import { getProjects, getTasks } from '../../ApiService';
import './Analytics.css';

const Analytics = ({ showToast }) => {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        tasksDistribution: {
            todo: 0,
            inProgress: 0,
            review: 0,
            completed: 0,
            blocked: 0
        },
        priorityDistribution: {
            low: 0,
            medium: 0,
            high: 0
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                const [projectsResponse, tasksResponse] = await Promise.all([
                    getProjects(),
                    getTasks()
                ]);

                // Parse the data based on Django REST Framework format
                const projectsData = projectsResponse.data?.results || 
                    (Array.isArray(projectsResponse.data) ? projectsResponse.data : []);
                
                const tasksData = tasksResponse.data?.results || 
                    (Array.isArray(tasksResponse.data) ? tasksResponse.data : []);

                setProjects(projectsData);
                setTasks(tasksData);
                calculateStats(projectsData, tasksData);
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                showToast('Failed to load analytics data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showToast]);

    const calculateStats = (projects, tasks) => {
        // Calculate project stats
        const totalProjects = projects.length;
        const completedProjects = projects.filter(p => p.is_completed).length;

        // Calculate task stats
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.is_completed).length;

        // Task status distribution (based on our model)
        const tasksDistribution = {
            todo: tasks.filter(t => !t.is_completed && !t.start_date).length,
            inProgress: tasks.filter(t => !t.is_completed && t.start_date && !t.end_date).length,
            review: 0, // We could add a 'status' field to tasks model for this
            completed: completedTasks,
            blocked: 0 // This would also require a 'status' field
        };

        // Priority distribution
        const priorityDistribution = {
            low: tasks.filter(t => t.priority === 1).length,
            medium: tasks.filter(t => t.priority === 2).length,
            high: tasks.filter(t => t.priority === 3).length
        };

        setStats({
            totalProjects,
            completedProjects,
            totalTasks,
            completedTasks,
            tasksDistribution,
            priorityDistribution
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const projectCompletionRate = stats.totalProjects > 0 
        ? Math.round((stats.completedProjects / stats.totalProjects) * 100) 
        : 0;
        
    const taskCompletionRate = stats.totalTasks > 0 
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
        : 0;

    return (
        <div className="analytics-container">
            <div className="row">
                {/* Stats Summary Cards */}
                <div className="col-md-3">
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <h3>{stats.totalProjects}</h3>
                            <p>Total Projects</p>
                        </div>
                        <div className="stat-card-icon projects-icon">
                            <i className="fas fa-project-diagram"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <h3>{stats.totalTasks}</h3>
                            <p>Total Tasks</p>
                        </div>
                        <div className="stat-card-icon tasks-icon">
                            <i className="fas fa-tasks"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <h3>{projectCompletionRate}%</h3>
                            <p>Project Completion Rate</p>
                        </div>
                        <div className="stat-card-icon completion-icon">
                            <i className="fas fa-chart-line"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <h3>{taskCompletionRate}%</h3>
                            <p>Task Completion Rate</p>
                        </div>
                        <div className="stat-card-icon completion-icon">
                            <i className="fas fa-chart-pie"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mt-4">
                {/* Task Status Distribution */}
                <div className="col-md-6">
                    <div className="chart-card">
                        <div className="chart-header">
                            <h4>Task Status Distribution</h4>
                        </div>
                        <div className="chart-content">
                            <div className="progress-container">
                                <label>To Do</label>
                                <div className="progress">
                                    <div 
                                        className="progress-bar bg-info" 
                                        role="progressbar" 
                                        style={{ 
                                            width: `${stats.totalTasks > 0 ? (stats.tasksDistribution.todo / stats.totalTasks) * 100 : 0}%` 
                                        }}
                                        aria-valuenow={stats.tasksDistribution.todo}
                                        aria-valuemin="0" 
                                        aria-valuemax={stats.totalTasks}
                                    >
                                        {stats.tasksDistribution.todo}
                                    </div>
                                </div>
                            </div>
                            <div className="progress-container">
                                <label>In Progress</label>
                                <div className="progress">
                                    <div 
                                        className="progress-bar bg-warning" 
                                        role="progressbar" 
                                        style={{ 
                                            width: `${stats.totalTasks > 0 ? (stats.tasksDistribution.inProgress / stats.totalTasks) * 100 : 0}%` 
                                        }}
                                        aria-valuenow={stats.tasksDistribution.inProgress}
                                        aria-valuemin="0" 
                                        aria-valuemax={stats.totalTasks}
                                    >
                                        {stats.tasksDistribution.inProgress}
                                    </div>
                                </div>
                            </div>
                            <div className="progress-container">
                                <label>Completed</label>
                                <div className="progress">
                                    <div 
                                        className="progress-bar bg-success" 
                                        role="progressbar" 
                                        style={{ 
                                            width: `${stats.totalTasks > 0 ? (stats.tasksDistribution.completed / stats.totalTasks) * 100 : 0}%` 
                                        }}
                                        aria-valuenow={stats.tasksDistribution.completed}
                                        aria-valuemin="0" 
                                        aria-valuemax={stats.totalTasks}
                                    >
                                        {stats.tasksDistribution.completed}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Priority Distribution */}
                <div className="col-md-6">
                    <div className="chart-card">
                        <div className="chart-header">
                            <h4>Task Priority Distribution</h4>
                        </div>
                        <div className="chart-content">
                            <div className="progress-container">
                                <label>Low Priority</label>
                                <div className="progress">
                                    <div 
                                        className="progress-bar bg-info" 
                                        role="progressbar" 
                                        style={{ 
                                            width: `${stats.totalTasks > 0 ? (stats.priorityDistribution.low / stats.totalTasks) * 100 : 0}%` 
                                        }}
                                        aria-valuenow={stats.priorityDistribution.low}
                                        aria-valuemin="0" 
                                        aria-valuemax={stats.totalTasks}
                                    >
                                        {stats.priorityDistribution.low}
                                    </div>
                                </div>
                            </div>
                            <div className="progress-container">
                                <label>Medium Priority</label>
                                <div className="progress">
                                    <div 
                                        className="progress-bar bg-warning" 
                                        role="progressbar" 
                                        style={{ 
                                            width: `${stats.totalTasks > 0 ? (stats.priorityDistribution.medium / stats.totalTasks) * 100 : 0}%` 
                                        }}
                                        aria-valuenow={stats.priorityDistribution.medium}
                                        aria-valuemin="0" 
                                        aria-valuemax={stats.totalTasks}
                                    >
                                        {stats.priorityDistribution.medium}
                                    </div>
                                </div>
                            </div>
                            <div className="progress-container">
                                <label>High Priority</label>
                                <div className="progress">
                                    <div 
                                        className="progress-bar bg-danger" 
                                        role="progressbar" 
                                        style={{ 
                                            width: `${stats.totalTasks > 0 ? (stats.priorityDistribution.high / stats.totalTasks) * 100 : 0}%` 
                                        }}
                                        aria-valuenow={stats.priorityDistribution.high}
                                        aria-valuemin="0" 
                                        aria-valuemax={stats.totalTasks}
                                    >
                                        {stats.priorityDistribution.high}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mt-4">
                {/* List of Projects */}
                <div className="col-12">
                    <div className="table-card">
                        <div className="table-header">
                            <h4>Project Overview</h4>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Tasks</th>
                                        <th>Completion</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(project => {
                                        const projectTasks = tasks.filter(t => t.project === project.id);
                                        const completedTasks = projectTasks.filter(t => t.is_completed).length;
                                        const taskCount = projectTasks.length;
                                        const completion = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
                                        
                                        return (
                                            <tr key={project.id}>
                                                <td>{project.name}</td>
                                                <td>{new Date(project.start_date).toLocaleDateString()}</td>
                                                <td>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}</td>
                                                <td>{`${completedTasks}/${taskCount}`}</td>
                                                <td>
                                                    <div className="progress">
                                                        <div 
                                                            className={`progress-bar ${completion < 100 ? 'bg-primary' : 'bg-success'}`}
                                                            role="progressbar" 
                                                            style={{ width: `${completion}%` }}
                                                            aria-valuenow={completion} 
                                                            aria-valuemin="0" 
                                                            aria-valuemax="100"
                                                        >
                                                            {completion}%
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${project.is_completed ? 'completed' : 'active'}`}>
                                                        {project.is_completed ? 'Completed' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {projects.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center">No projects found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
