// src/store/index.js
import { createContext, useContext, useState, useEffect } from 'react';
import { getProjects, getTasks, getDependencies } from '../ApiService';

// Create a context for our global store
const StoreContext = createContext();

// Task status options
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
};

// Store provider component
export const StoreProvider = ({ children }) => {
  // Projects state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  
  // Dependencies state
  const [dependencies, setDependencies] = useState([]);
  const [dependenciesLoading, setDependenciesLoading] = useState(false);
  
  // User interface state
  const [filters, setFilters] = useState({
    projectFilter: null,
    statusFilter: null,
    priorityFilter: null
  });
  // Load initial data
  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchDependencies();
  }, []);
  
  // Functions to fetch and update data
  const fetchProjects = () => {
    setProjectsLoading(true);
    getProjects()
      .then(response => {
        const data = response.data?.results || 
                   (Array.isArray(response.data) ? response.data : []);
        setProjects(data);
      })
      .catch(error => console.error("Error fetching projects:", error))
      .finally(() => setProjectsLoading(false));
  };
  
  const fetchTasks = () => {
    setTasksLoading(true);
    getTasks()
      .then(response => {
        const data = response.data?.results || 
                   (Array.isArray(response.data) ? response.data : []);
        setTasks(data);
      })
      .catch(error => console.error("Error fetching tasks:", error))
      .finally(() => setTasksLoading(false));
  };
  
  const fetchDependencies = () => {
    setDependenciesLoading(true);
    getDependencies()
      .then(response => {
        const data = response.data?.results || 
                   (Array.isArray(response.data) ? response.data : []);
        setDependencies(data);
      })
      .catch(error => console.error("Error fetching dependencies:", error))
      .finally(() => setDependenciesLoading(false));
  };
  
  // Get filtered tasks
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // Apply project filter
      if (filters.projectFilter && task.project !== filters.projectFilter) {
        return false;
      }
      
      // Apply status filter
      if (filters.statusFilter === 'completed' && !task.is_completed) {
        return false;
      } else if (filters.statusFilter === 'in-progress' && task.is_completed) {
        return false;
      }
      
      // Apply priority filter
      if (filters.priorityFilter && task.priority !== filters.priorityFilter) {
        return false;
      }
      
      return true;
    });
  };

  // Provide the store to the app
  const store = {
    projects: {
      list: projects,
      setProjects,
      selected: selectedProject,
      setSelectedProject,
      loading: projectsLoading,
      refresh: fetchProjects
    },
    tasks: {
      list: tasks,
      filteredList: getFilteredTasks(),
      setTasks,
      selected: selectedTask,
      setSelectedTask,
      loading: tasksLoading,
      refresh: fetchTasks
    },
    dependencies: {
      list: dependencies,
      setDependencies,
      loading: dependenciesLoading,
      refresh: fetchDependencies
    },
    filters: {
      current: filters,
      setFilters
    }
  };

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom hook to use the store
export const useStore = () => useContext(StoreContext);
