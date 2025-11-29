import React, { useState, useEffect } from 'react';
import { addTask, getTasks, getProjects, updateTask, deleteTask } from '../../ApiService'; // Removed addDependency
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Table, Form, Badge } from 'react-bootstrap';
import { useStore } from '../../store';

const TaskComponent = ({ showToast }) => {
    const store = useStore();
    const [task, setTask] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        priority: 2,
        projectId: '',
        assignedUserId: null,
        isCompleted: false
    });

    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTask, setEditTask] = useState(null);

    useEffect(() => {
        // Initial data fetch is now handled by the store
        if (store.tasks.list.length === 0) {
            store.tasks.refresh();
        }
        if (store.projects.list.length === 0) {
            store.projects.refresh();
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setTask((prevTask) => ({
            ...prevTask,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditTask((prevTask) => ({
            ...prevTask,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!task.name || !task.startDate || !task.projectId) {
            showToast("Please fill in all required fields (Name, Start Date, and Project)", "error");
            return;
        }
        
        // Format data to match Django model field names
        const formData = {
            name: task.name,
            description: task.description || "",
            start_date: task.startDate,
            end_date: task.endDate || null,
            priority: Number(task.priority) || 2,
            project: Number(task.projectId),
            assigned_user: task.assignedUserId ? Number(task.assignedUserId) : null,
            is_completed: task.isCompleted
        };

        try {
            await addTask(formData);
            
            // Refresh the task list using the store
            store.tasks.refresh();
            
            setShowModal(false);
            
            // Reset the form
            setTask({
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                priority: 2,
                projectId: '',
                assignedUserId: null,
                isCompleted: false
            });
            
            showToast("Task added successfully!", "success");
        } catch (error) {
            console.error("Error adding task:", error);
            showToast("Failed to add task", "error");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        if (!editTask) return;
        
        // Format data to match Django model field names
        const formData = {
            name: editTask.name,
            description: editTask.description || "",
            start_date: editTask.startDate,
            end_date: editTask.endDate || null,
            priority: Number(editTask.priority),
            project: Number(editTask.projectId),
            assigned_user: editTask.assignedUserId ? Number(editTask.assignedUserId) : null,
            is_completed: editTask.isCompleted
        };

        try {
            await updateTask(editTask.id, formData);
            
            // Refresh the task list using the store
            store.tasks.refresh();
            
            setShowEditModal(false);
            setEditTask(null);
            
            showToast("Task updated successfully!", "success");
        } catch (error) {
            console.error("Error updating task:", error);
            showToast("Failed to update task", "error");
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteTask(taskId);
                
                // Refresh the task list AND dependencies
                store.tasks.refresh();
                store.dependencies.refresh();
                
                showToast("Task deleted successfully!", "success");
            } catch (error) {
                console.error("Error deleting task:", error);
                showToast("Failed to delete task", "error");
            }
        }
    };

    const handleEditClick = (task) => {
        const taskToEdit = {
            id: task.id,
            name: task.name,
            description: task.description || "",
            startDate: task.start_date || "",
            endDate: task.end_date || "",
            priority: task.priority,
            projectId: typeof task.project === 'object' ? task.project.id : task.project,
            assignedUserId: task.assigned_user || "",
            isCompleted: task.is_completed
        };
        
        setEditTask(taskToEdit);
        setShowEditModal(true);
    };

    const toggleTaskCompletion = async (task) => {
        try {
            const updatedTask = {
                ...task,
                is_completed: !task.is_completed
            };
            
            await updateTask(task.id, updatedTask);
            
            // Refresh the task list
            store.tasks.refresh();
            
            showToast(`Task marked as ${task.is_completed ? 'incomplete' : 'complete'}`, "success");
        } catch (error) {
            console.error("Error toggling task completion:", error);
            showToast("Failed to update task status", "error");
        }
    };

    return (
        <div className="container mt-4">
            <h2>Task Management</h2>

            <div className="mb-4 d-flex justify-content-between">
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus me-2"></i>Add Task
                </Button>
                
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => store.tasks.refresh()}
                    >
                        <i className="fas fa-sync me-2"></i>Refresh
                    </Button>
                </div>
            </div>

            {store.tasks.loading ? (
                <div className="d-flex justify-content-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="table-responsive">
                    <Table bordered hover className="table">
                        <thead>
                            <tr className="bg-white text-white">
                                <th className="fw-bold py-3">Task Name</th>
                                <th className="fw-bold py-3">Description</th>
                                <th className="fw-bold py-3">Dates</th>
                                <th className="fw-bold py-3">Priority</th>
                                <th className="fw-bold py-3">Project</th>
                                <th className="fw-bold py-3">Status</th>
                                <th className="fw-bold py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {store.tasks.list.length > 0 ? (
                                store.tasks.list.map((task) => (
                                    <tr key={task.id} className="align-middle">
                                        <td className="fw-medium">{task.name}</td>
                                        <td>{task.description}</td>
                                        <td>
                                            <div><small>Start: {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A'}</small></div>
                                            <div><small>End: {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'N/A'}</small></div>
                                        </td>
                                        <td>
                                            <Badge bg={
                                                task.priority === 3 ? 'danger' : 
                                                task.priority === 2 ? 'warning' : 'info'
                                            }>
                                                {task.priority === 3 ? 'High' : 
                                                 task.priority === 2 ? 'Medium' : 'Low'}
                                            </Badge>
                                        </td>
                                        <td>
                                            {typeof task.project === 'object' ? task.project.name : 
                                            store.projects.list.find(p => p.id === task.project)?.name || task.project}
                                        </td>
                                        <td>
                                            <Badge bg={task.is_completed ? 'success' : 'secondary'}>
                                                {task.is_completed ? 'Completed' : 'In Progress'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => handleEditClick(task)}
                                                    title="Edit Task"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </Button>
                                                
                                                <Button 
                                                    variant="outline-success" 
                                                    size="sm"
                                                    onClick={() => toggleTaskCompletion(task)}
                                                    title={task.is_completed ? "Mark as Incomplete" : "Mark as Complete"}
                                                >
                                                    <i className={`fas ${task.is_completed ? 'fa-times' : 'fa-check'}`}></i>
                                                </Button>
                                                
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    title="Delete Task"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">No tasks available</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* Add Task Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add Task</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Task Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={task.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="description"
                                        value={task.description}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Priority</Form.Label>
                                    <Form.Select
                                        name="priority"
                                        value={task.priority}
                                        onChange={handleChange}
                                    >
                                        <option value="1">Low</option>
                                        <option value="2">Medium</option>
                                        <option value="3">High</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Project</Form.Label>
                                    <Form.Select
                                        name="projectId"
                                        value={task.projectId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select a Project</option>
                                        {store.projects.list.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={task.startDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={task.endDate}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Check 
                                        type="checkbox"
                                        name="isCompleted"
                                        label="Mark as Completed"
                                        checked={task.isCompleted}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Add Task
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit Task Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Task</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editTask && (
                        <Form onSubmit={handleEditSubmit}>
                            <div className="row">
                                <div className="col-md-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>Task Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={editTask.name}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="description"
                                            value={editTask.description}
                                            onChange={handleEditChange}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Priority</Form.Label>
                                        <Form.Select
                                            name="priority"
                                            value={editTask.priority}
                                            onChange={handleEditChange}
                                        >
                                            <option value="1">Low</option>
                                            <option value="2">Medium</option>
                                            <option value="3">High</option>
                                        </Form.Select>
                                    </Form.Group>
                                </div>
                                
                                <div className="col-md-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>Project</Form.Label>
                                        <Form.Select
                                            name="projectId"
                                            value={editTask.projectId}
                                            onChange={handleEditChange}
                                            required
                                        >
                                            <option value="">Select a Project</option>
                                            {store.projects.list.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="startDate"
                                            value={editTask.startDate}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>End Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="endDate"
                                            value={editTask.endDate}
                                            onChange={handleEditChange}
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Check 
                                            type="checkbox"
                                            name="isCompleted"
                                            label="Mark as Completed"
                                            checked={editTask.isCompleted}
                                            onChange={handleEditChange}
                                        />
                                    </Form.Group>
                                </div>
                            </div>
                            
                            <div className="d-flex justify-content-between mt-3">
                                <div>
                                    <p className="text-muted mb-0">
                                        <small><i className="fas fa-info-circle me-1"></i>Dependencies can be managed from the Dependencies tab.</small>
                                    </p>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default TaskComponent;
