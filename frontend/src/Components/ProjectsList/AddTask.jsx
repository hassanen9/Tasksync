// src/Components/ProjectsList/Task.js
import React, { useState, useEffect } from "react";
import { getProjects } from "../../ApiService"; // Function to fetch projects
import { addTask } from "../../ApiService"; // Function to add a task

const AddTask = ({ onTaskAdded }) => {
  const [projects, setProjects] = useState([]);
  const [task, setTask] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: 1,
    project: "", // To hold the selected project ID
    assignedUserId: null, // Default to null if not assigned
    isCompleted: false,
    taskDependencies: [], // Ensure this is included as an empty array
  });
  // Fetch the projects when the component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getProjects();
        
        // Handle Django REST Framework responses
        if (response.data && response.data.results) {
          // Paginated response
          setProjects(response.data.results);
        } else if (Array.isArray(response.data)) {
          // Direct array response
          setProjects(response.data);
        } else {
          console.error("Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Adapt the task format to what Django expects
      const taskData = {
        name: task.name,
        description: task.description,
        start_date: task.startDate,
        end_date: task.endDate,
        priority: Number(task.priority),
        project: Number(task.project), // Django expects 'project', not 'projectId'
        assigned_user: task.assignedUserId,
        is_completed: task.isCompleted
        // Django doesn't need the taskDependencies in the initial creation
      };
      
      await addTask(taskData);
      onTaskAdded(); // Call parent function to refresh tasks
      setTask({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        priority: 1,
        project: "", // Updated to match Django field name
        assignedUserId: null,
        isCompleted: false,
        taskDependencies: [], // Reset to empty array
      });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Select Project</label>
        <select
          className="form-select"
          value={task.projectId}
          onChange={(e) => setTask({ ...task, projectId: e.target.value })}
          required
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Task Name</label>
        <input
          type="text"
          className="form-control"
          value={task.name}
          onChange={(e) => setTask({ ...task, name: e.target.value })}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Description</label>
        <input
          type="text"
          className="form-control"
          value={task.description}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Start Date</label>
        <input
          type="date"
          className="form-control"
          value={task.startDate}
          onChange={(e) => setTask({ ...task, startDate: e.target.value })}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">End Date</label>
        <input
          type="date"
          className="form-control"
          value={task.endDate}
          onChange={(e) => setTask({ ...task, endDate: e.target.value })}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Priority</label>
        <input
          type="number"
          className="form-control"
          value={task.priority}
          onChange={(e) => setTask({ ...task, priority: e.target.value })}
          min="1"
          max="5"
          required
        />
      </div>
      {/* Optional: Include assigned user selection if needed */}
      <div className="mb-3">
        <label className="form-label">Assigned User ID (Optional)</label>
        <input
          type="number"
          className="form-control"
          value={task.assignedUserId || ""}
          onChange={(e) => setTask({ ...task, assignedUserId: e.target.value })}
        />
      </div>
      <button type="submit" className="btn btn-primary">Add Task</button>
    </form>
  );
};

export default AddTask;
