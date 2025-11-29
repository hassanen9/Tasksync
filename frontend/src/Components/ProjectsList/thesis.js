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