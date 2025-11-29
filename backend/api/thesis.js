// Custom hook for D3 force simulation
const useForceSimulation = (nodes, links, width, height) => {
  const simulation = useRef(null);
  
  useEffect(() => {
    if (!nodes.length) return;
    
    // Initialize the simulation
    simulation.current = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));
    
    // Stop simulation initially to prevent layout thrashing
    simulation.current.stop();
    
    return () => {
      if (simulation.current) simulation.current.stop();
    };
  }, [nodes, links, width, height]);
  
  return simulation;
};