import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../../store';
import * as d3 from 'd3';
import { addDependency, removeDependency, getDependencies } from '../../ApiService';
import { Modal, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import './dependencies.css';

const TaskDependenciesGraph = ({ showToast }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const store = useStore();
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [sourceTask, setSourceTask] = useState('');
  const [targetTask, setTargetTask] = useState('');
  const [error, setError] = useState(null);
  const [selectedDependency, setSelectedDependency] = useState(null);
  const [showTaskInfoPanel, setShowTaskInfoPanel] = useState(false);

  // Function to render the dependency graph
  const renderGraph = useCallback(() => {
    if (!svgRef.current) return;
    
    const taskList = store.tasks.list;
    const dependencyList = store.dependencies.list;
    
    if (store.tasks.loading || store.dependencies.loading) {
      return;
    }

    if (!Array.isArray(taskList) || !Array.isArray(dependencyList)) {
      setError("Invalid data format for tasks or dependencies");
      return;
    }

    // Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = 800;
    const height = 600;
    
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("class", "dependency-svg");
    
    // Add zoom behavior with smooth transitions
    const zoomHandler = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoomHandler);
    
    // Create container for graph elements
    const g = svg.append("g");
      // Define improved arrow markers for link direction
    const defs = svg.append("defs");
    
    // Add a gradient for the arrow
    const gradient = defs.append("linearGradient")
      .attr("id", "arrow-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
      
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#adb5bd")
      .attr("stop-opacity", 0.7);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#495057")
      .attr("stop-opacity", 1);

    // Add a hover gradient with more visible colors
    const hoverGradient = defs.append("linearGradient")
      .attr("id", "arrow-hover-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
      
    hoverGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4361ee")
      .attr("stop-opacity", 0.7);
      
    hoverGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3046c5")
      .attr("stop-opacity", 1);
      // Standard arrow marker with improved shape
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22) // Adjusted to position closer to the target circle
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5L3,0Z") // Better arrow shape with filled center
      .attr("fill", "#495057");
    
    // Hover arrow marker (larger and different color)
    defs.append("marker")
      .attr("id", "arrowhead-hover")
      .attr("viewBox", "0 -6 12 12")
      .attr("refX", 22) // Adjusted to match the standard marker
      .attr("refY", 0)
      .attr("markerWidth", 12)
      .attr("markerHeight", 12)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-6L12,0L0,6L4,0Z") // More pronounced arrow when hovering
      .attr("fill", "#4361ee");

    // Add animated flow marker for extra visual cue
    defs.append("marker")
      .attr("id", "flow-dot")
      .attr("viewBox", "-2 -2 4 4")
      .attr("refX", 0)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("circle")
      .attr("r", 1)
      .attr("fill", "#6c757d");
      // Add a subtle grid pattern for better visualization
    const gridDefs = svg.append("defs");
    
    const gridPattern = gridDefs.append("pattern")
      .attr("id", "grid")
      .attr("width", 20)
      .attr("height", 20)
      .attr("patternUnits", "userSpaceOnUse");
    
    gridPattern.append("path")
      .attr("d", "M 20 0 L 0 0 0 20")
      .attr("fill", "none")
      .attr("stroke", "#f8f9fa")
      .attr("stroke-width", 1);

    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#grid)");

    // Prepare nodes and links
    const nodes = taskList.map(task => ({
      id: task.id,
      name: task.name,
      status: task.is_completed ? 'completed' : 'in-progress',
      priority: task.priority,
      start_date: task.start_date,
      end_date: task.end_date,
      description: task.description,
      project: typeof task.project === 'object' ? task.project.id : task.project
    }));
    
    // Create links from dependencies
    const links = dependencyList
      .filter(dep => {
        const taskId = dep.task || dep.taskId;
        const dependentOnTaskId = dep.dependent_on_task || dep.dependentOnTaskId;
        
        const taskExists = nodes.find(node => node.id === taskId);
        const depExists = nodes.find(node => node.id === dependentOnTaskId);
        
        return taskExists && depExists;
      })
      .map(dep => ({
        source: dep.task || dep.taskId,
        target: dep.dependent_on_task || dep.dependentOnTaskId,
        id: dep.id
      }));

    // No data to display
    if (nodes.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("class", "no-data-text")
        .text("No tasks available to create dependencies");
      return;
    }
    
    if (links.length === 0 && nodes.length > 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("class", "no-data-text")
        .text("No dependencies defined between tasks");
    }
    
    // Create force simulation with improved settings for better layout
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150).strength(0.7))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius(50));
      // Create links with better styling and interactive features
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "dependency-link")
      .attr("stroke", "url(#arrow-gradient)")
      .attr("marker-end", "url(#arrowhead)")
      .attr("fill", "none") // Ensure path is not filled
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", 2)
      .on("mouseover", function() {
        d3.select(this)
          .attr("stroke", "url(#arrow-hover-gradient)")
          .attr("marker-end", "url(#arrowhead-hover)")
          .attr("stroke-opacity", 1)
          .attr("stroke-width", 3);
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke", "url(#arrow-gradient)")
          .attr("marker-end", "url(#arrowhead)")
          .attr("stroke-opacity", 0.7)
          .attr("stroke-width", 2);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedDependency({
          source: nodes.find(node => node.id === d.source.id),
          target: nodes.find(node => node.id === d.target.id)
        });
        setShowRemoveModal(true);
      });
    
    // Create nodes with improved visuals
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node-group")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedTask(d);
        setShowTaskInfoPanel(true);
      });
    
    // Add node circles with styles based on status and priority
    node.append("circle")
      .attr("r", 22)
      .attr("class", d => `dependency-node status-${d.status} priority-${d.priority}`)
      .attr("title", d => d.name);
    
    // Add priority indicator
    node.append("circle")
      .attr("r", 18)
      .attr("fill", "none")
      .attr("stroke-width", d => d.priority === 3 ? 3 : d.priority === 2 ? 2 : 1)
      .attr("stroke", d => 
        d.priority === 3 ? "#dc3545" : 
        d.priority === 2 ? "#fd7e14" : "#6c757d")
      .attr("stroke-dasharray", d => d.priority === 1 ? "3,3" : "none")
      .attr("opacity", 0.7);
      
    // Add text to nodes with better positioning
    node.append("text")
      .attr("class", "node-label")
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .text(d => d.name.length > 15 ? d.name.substring(0, 12) + "..." : d.name);
    
    // Special hover effects for nodes
    node.on("mouseover", function() {
      d3.select(this).select("circle").attr("r", 25);
    })
    .on("mouseout", function() {
      d3.select(this).select("circle").attr("r", 22);
    });    // Update positions on simulation tick with curved links
    simulation.on("tick", () => {
      link.attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Get node radius (to adjust path endpoint)
        const nodeRadius = 22;
        
        // Calculate the angle of the line
        const angle = Math.atan2(dy, dx);
        
        // Calculate the adjusted target point so the arrow stops before hitting the node
        const targetX = d.target.x - (nodeRadius * Math.cos(angle));
        const targetY = d.target.y - (nodeRadius * Math.sin(angle));
        
        // Calculate the adjusted source point so it starts outside the node
        const sourceX = d.source.x + (nodeRadius * Math.cos(angle));
        const sourceY = d.source.y + (nodeRadius * Math.sin(angle));
        
        // Adjust curve based on distance between nodes
        const curveFactor = Math.min(1.5, Math.max(1.1, 2 - distance / 200));
        const dr = distance * curveFactor;
        
        // Create a curved path with better control
        return `M${sourceX},${sourceY} A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
      });
      
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep position fixed on drag end
      // Comment the next 2 lines to allow nodes to continue moving after drag
      // d.fx = null;
      // d.fy = null;
    }
    
    // Click on svg background to deselect task
    svg.on("click", () => {
      setSelectedTask(null);
      setShowTaskInfoPanel(false);
    });
    
  }, [store.tasks.list, store.dependencies.list, store.tasks.loading, store.dependencies.loading, showToast]);

  // Effect to render graph when data changes
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  // Effect to load dependencies and tasks if not already loaded
  useEffect(() => {
    if (store.tasks.list.length === 0) {
      store.tasks.refresh();
    }
    if (store.dependencies.list.length === 0) {
      store.dependencies.refresh();
    }
  }, []);
  
  // Handle adding a new dependency
  const handleAddDependency = (e) => {
    e.preventDefault();
    
    if (!sourceTask || !targetTask) {
      setError("Please select both source and dependent tasks");
      return;
    }
    
    if (sourceTask === targetTask) {
      setError("A task cannot depend on itself");
      return;
    }
    
    addDependency(sourceTask, targetTask)
      .then(() => {
        store.dependencies.refresh();
        setShowAddModal(false);
        setSourceTask('');
        setTargetTask('');
        setError(null);
        showToast("Dependency added successfully", "success");
      })
      .catch(err => {
        console.error("Error adding dependency:", err);
        setError("Failed to add dependency. It may already exist or there might be a circular dependency.");
      });
  };
    // Handle removing a dependency
  const handleRemoveDependency = () => {
    if (!selectedDependency) return;
    
    removeDependency(selectedDependency.source.id, selectedDependency.target.id)
      .then(() => {
        store.dependencies.refresh();
        store.tasks.refresh(); // Also refresh tasks in case any status changes
        setShowRemoveModal(false);
        setSelectedDependency(null);
        showToast("Dependency removed successfully", "success");
      })
      .catch(err => {
        console.error("Error removing dependency:", err);
        showToast("Failed to remove dependency", "error");
        setError("Failed to remove dependency. Please try again.");
      });
  };
  
  // Filter out tasks that would create circular dependencies
  const getValidTargetTasks = () => {
    if (!sourceTask) return store.tasks.list;
    
    // Get all dependencies where this task is already a target
    const existingDeps = store.dependencies.list.filter(
      dep => {
        const dependentOnTaskId = dep.dependent_on_task || dep.dependentOnTaskId;
        return dependentOnTaskId === parseInt(sourceTask) || 
               (typeof dependentOnTaskId === 'object' && dependentOnTaskId.id === parseInt(sourceTask));
      }
    );
    
    // Don't allow tasks that would create circular deps
    return store.tasks.list.filter(task => {
      // Can't depend on itself
      if (task.id === parseInt(sourceTask)) return false;
      
      // Check for circular dependencies
      const sourceTaskDeps = findAllDependents(parseInt(sourceTask));
      return !sourceTaskDeps.includes(task.id);
    });
  };
  
  // Helper to find all dependents of a task (recursive)
  const findAllDependents = (taskId) => {
    const directDependents = store.dependencies.list
      .filter(dep => {
        const dependentOnTaskId = dep.dependent_on_task || dep.dependentOnTaskId;
        return (typeof dependentOnTaskId === 'object' ? dependentOnTaskId.id : dependentOnTaskId) === taskId;
      })
      .map(dep => dep.task || dep.taskId);
    
    let allDependents = [...directDependents];
    
    directDependents.forEach(depId => {
      const nestedDeps = findAllDependents(depId);
      allDependents = [...allDependents, ...nestedDeps];
    });
    
    return allDependents;
  };

  // Find task by id helper
  const getTaskById = (id) => {
    return store.tasks.list.find(task => task.id === id);
  };

  // Reset zoom to default
  const resetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(750).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  };

  // Create a new function to export the graph as an image
  const exportGraphAsPNG = () => {
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    const img = new Image();
    img.onload = function() {
      canvas.width = svgElement.width.baseVal.value;
      canvas.height = svgElement.height.baseVal.value;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "task-dependencies.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="dependencies-container" ref={containerRef}>
      <div className="dependencies-header">
        <h2>Task Dependencies</h2>        <div className="dependency-controls">
          <Button 
            variant="primary" 
            onClick={() => setShowAddModal(true)}
            disabled={store.tasks.list.length < 2}
          >
            <i className="fas fa-plus"></i> Add Dependency
          </Button>
          <Button 
            variant="outline-danger" 
            onClick={() => setShowRemoveModal(true)}
            disabled={store.dependencies.list.length === 0}
          >
            <i className="fas fa-unlink"></i> Remove Dependency
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              store.tasks.refresh();
              store.dependencies.refresh();
              showToast("Refreshed dependencies", "info");
            }}
          >
            <i className="fas fa-sync"></i> Refresh
          </Button>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip id="export-tooltip">Export as PNG image</Tooltip>}
          >
            <Button 
              variant="outline-primary" 
              onClick={exportGraphAsPNG}
            >
              <i className="fas fa-download"></i>
            </Button>
          </OverlayTrigger>
        </div>
      </div>
      
      {(store.tasks.loading || store.dependencies.loading) ? (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <div className="zoom-controls">
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip id="zoom-in-tooltip">Zoom In</Tooltip>}
            >
              <Button 
                variant="light" 
                onClick={() => {
                  const svg = d3.select(svgRef.current);
                  const currentZoom = d3.zoomTransform(svg.node());
                  svg.transition().duration(300).call(
                    d3.zoom().transform, 
                    d3.zoomIdentity.translate(currentZoom.x, currentZoom.y).scale(currentZoom.k * 1.3)
                  );
                }}
              >
                <i className="fas fa-search-plus"></i>
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip id="zoom-out-tooltip">Zoom Out</Tooltip>}
            >
              <Button 
                variant="light" 
                onClick={() => {
                  const svg = d3.select(svgRef.current);
                  const currentZoom = d3.zoomTransform(svg.node());
                  svg.transition().duration(300).call(
                    d3.zoom().transform, 
                    d3.zoomIdentity.translate(currentZoom.x, currentZoom.y).scale(currentZoom.k / 1.3)
                  );
                }}
              >
                <i className="fas fa-search-minus"></i>
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip id="reset-tooltip">Reset View</Tooltip>}
            >
              <Button 
                variant="light" 
                onClick={resetZoom}
              >
                <i className="fas fa-expand"></i>
              </Button>
            </OverlayTrigger>
          </div>
          
          <div className="dependency-graph">
            <svg ref={svgRef}></svg>
          </div>
          
          {showTaskInfoPanel && selectedTask && (
            <div className="task-details-panel">
              <h4>{selectedTask.name}</h4>
              <p>
                <strong>Status:</strong> 
                <span className={`badge ${selectedTask.status === 'completed' ? 'bg-success' : 'bg-primary'}`}>
                  {selectedTask.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </p>
              <p>
                <strong>Priority:</strong> 
                <span className={`badge ${
                  selectedTask.priority === 3 ? 'bg-danger' : 
                  selectedTask.priority === 2 ? 'bg-warning' : 'bg-info'
                }`}>
                  {selectedTask.priority === 3 ? 'High' : 
                   selectedTask.priority === 2 ? 'Medium' : 'Low'}
                </span>
              </p>
              {selectedTask.description && (
                <p><strong>Description:</strong> <br/>{selectedTask.description}</p>
              )}
              {selectedTask.start_date && (
                <p>
                  <strong>Start Date:</strong> 
                  <span>{new Date(selectedTask.start_date).toLocaleDateString()}</span>
                </p>
              )}
              {selectedTask.end_date && (
                <p>
                  <strong>End Date:</strong> 
                  <span>{new Date(selectedTask.end_date).toLocaleDateString()}</span>
                </p>
              )}
              <p>
                <strong>Dependencies:</strong>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => {
                    setSourceTask(selectedTask.id.toString());
                    setShowAddModal(true);
                  }}
                >
                  Add Dependency
                </Button>
              </p>
              <Button variant="outline-secondary" size="sm" onClick={() => setShowTaskInfoPanel(false)}>
                Close
              </Button>
            </div>
          )}
          
          <div className="legend">
            <div className="legend-item">
              <div className="legend-color in-progress"></div>
              <span>In Progress</span>
            </div>
            <div className="legend-item">
              <div className="legend-color completed"></div>
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <div className="legend-color high-priority"></div>
              <span>High Priority</span>
            </div>
            <div className="legend-item">
              <div className="legend-color medium-priority"></div>
              <span>Medium Priority</span>
            </div>
            <div className="legend-item">
              <div className="legend-color low-priority"></div>
              <span>Low Priority</span>
            </div>
          </div>
        </>
      )}
      
      {/* Add Dependency Modal */}
      <Modal show={showAddModal} onHide={() => {
        setShowAddModal(false);
        setError(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add Task Dependency</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <Form onSubmit={handleAddDependency}>
            <Form.Group className="mb-3">
              <Form.Label>Task</Form.Label>
              <Form.Select 
                value={sourceTask} 
                onChange={(e) => setSourceTask(e.target.value)}
                required
              >
                <option value="">Select a task</option>
                {store.tasks.list.map(task => (
                  <option key={`source-${task.id}`} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                The task that depends on another task
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Depends On</Form.Label>
              <Form.Select 
                value={targetTask} 
                onChange={(e) => setTargetTask(e.target.value)}
                required
                disabled={!sourceTask}
              >
                <option value="">Select task it depends on</option>
                {getValidTargetTasks().map(task => (
                  <option key={`target-${task.id}`} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                The task that must be completed first
              </Form.Text>
            </Form.Group>
            
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              Task "{getTaskById(parseInt(sourceTask))?.name || ''}" will only start after 
              task "{getTaskById(parseInt(targetTask))?.name || ''}" is completed.
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowAddModal(false);
            setError(null);
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddDependency}>
            Add Dependency
          </Button>
        </Modal.Footer>
      </Modal>
        {/* Remove Dependency Modal */}
      <Modal show={showRemoveModal} onHide={() => setShowRemoveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Remove Task Dependency</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDependency ? (
            <div>
              <p>Are you sure you want to remove this dependency?</p>
              <div className="alert alert-info">
                <p className="mb-0">
                  <strong>{selectedDependency.source.name}</strong> will no longer depend on <strong>{selectedDependency.target.name}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Form.Group className="mb-3">
                <Form.Label>Select a dependency to remove:</Form.Label>
                {store.dependencies.list.length === 0 ? (
                  <div className="alert alert-info">No dependencies to remove</div>
                ) : (
                  <Form.Select 
                    onChange={(e) => {
                      if (e.target.value) {
                        const [sourceId, targetId] = e.target.value.split('-');
                        const source = store.tasks.list.find(task => task.id === parseInt(sourceId));
                        const target = store.tasks.list.find(task => task.id === parseInt(targetId));
                        if (source && target) {
                          setSelectedDependency({ source, target });
                        }
                      }
                    }}
                  >
                    <option value="">Select a dependency</option>
                    {store.dependencies.list.map(dep => {
                      const sourceId = dep.task || dep.taskId;
                      const targetId = dep.dependent_on_task || dep.dependentOnTaskId;
                      const source = store.tasks.list.find(task => task.id === sourceId);
                      const target = store.tasks.list.find(task => task.id === targetId);
                      
                      if (source && target) {
                        const optionValue = `${source.id}-${target.id}`;
                        return (
                          <option key={optionValue} value={optionValue}>
                            {source.name} → {target.name}
                          </option>
                        );
                      }
                      return null;
                    })}
                  </Form.Select>
                )}
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowRemoveModal(false);
            setSelectedDependency(null);
          }}>
            Cancel
          </Button>
          {selectedDependency && (
            <Button variant="danger" onClick={handleRemoveDependency}>
              Remove Dependency
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TaskDependenciesGraph;
