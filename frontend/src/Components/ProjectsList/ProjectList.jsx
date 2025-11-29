import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";
import { Modal, Button, Card, Badge, Row, Col } from "react-bootstrap";
import { getProjects, addProject, deleteProject, updateProject } from "../../ApiService";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./Project.css";

export default function ProjectList({ showToast }) {
  const store = useStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(null);
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    isCompleted: false,
  });
  
  const [editProject, setEditProject] = useState({
    id: null,
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    isCompleted: false,
  });

  const modalRef = useRef(null);

  useEffect(() => {
    // Fetch projects on component mount if they're not already loaded
    if (store.projects.list.length === 0) {
      store.projects.refresh();
    }
  }, []);

  // Handle project deletion
  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id)
        .then(() => {
          showToast(`Project "${projectToDelete.name}" was deleted successfully`, "success");
          // Refresh projects in store
          store.projects.refresh();
          setShowDeleteModal(false);
          setProjectToDelete(null);
        })
        .catch((error) => {
          console.error("Error deleting project:", error);
          showToast("Failed to delete project. Please try again.", "error");
        });
    }
  };
  
  // Handle project edit
  const handleEditClick = (project) => {
    setEditProject({
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.start_date,
      endDate: project.end_date,
      isCompleted: project.is_completed
    });
    setShowEditModal(true);
  };
  
  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    // Format data to match Django model field names
    const projectData = {
      name: editProject.name,
      description: editProject.description,
      start_date: editProject.startDate,
      end_date: editProject.endDate,
      is_completed: editProject.isCompleted
    };
    
    updateProject(editProject.id, projectData)
      .then(() => {
        showToast(`Project "${editProject.name}" updated successfully!`, "success");
        store.projects.refresh();
        setShowEditModal(false);
      })
      .catch((error) => {
        console.error("Error updating project:", error);
        showToast("Failed to update project", "error");
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format data to match Django model field names
    const projectData = {
      name: newProject.name,
      description: newProject.description,
      start_date: newProject.startDate,
      end_date: newProject.endDate,
      is_completed: newProject.isCompleted
    };
    
    addProject(projectData)
      .then(() => {
        showToast(`Project "${newProject.name}" created successfully!`, "success");
        store.projects.refresh(); // Refresh the projects list
        setNewProject({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          isCompleted: false
        });
        const modalElement = modalRef.current;
        const modal = new window.bootstrap.Modal(modalElement);
        modal.hide();
      })
      .catch((error) => {
        console.error("Error adding project:", error);
        showToast("Failed to create project", "error");
      });
  };

  // Handle showing project details
  const handleViewDetails = (projectId) => {
    setShowProjectDetails(projectId);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Projects</h2>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#addProjectModal"
          >
            <i className="fas fa-plus me-2"></i>Add Project
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary ms-2"
            onClick={() => store.projects.refresh()}
          >
            <i className="fas fa-sync me-2"></i>Refresh
          </button>
        </div>
      </div>

      {store.projects.loading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : store.projects.list.length === 0 ? (
        <div className="card p-5 text-center">
          <div className="mb-3">
            <i className="fas fa-folder-open fa-4x text-muted"></i>
          </div>
          <h4>No Projects Found</h4>
          <p>Create your first project to get started.</p>
          <button
            className="btn btn-primary mx-auto"
            style={{ maxWidth: "200px" }}
            data-bs-toggle="modal"
            data-bs-target="#addProjectModal"
          >
            <i className="fas fa-plus me-2"></i>Create Project
          </button>
        </div>
      ) : (
        <Row className="g-4">
          {store.projects.list.map((project) => (
            <Col md={6} lg={4} key={project.id}>
              <Card className="h-100 project-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Badge bg={project.is_completed ? "success" : "primary"}>
                    {project.is_completed ? "Completed" : "In Progress"}
                  </Badge>
                  <div>
                    <Button 
                      variant="light" 
                      size="sm"
                      onClick={() => handleEditClick(project)}
                      title="Edit Project"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm"
                      className="ms-1"
                      onClick={() => handleDeleteClick(project)}
                      title="Delete Project"
                    >
                      <i className="fas fa-trash text-danger"></i>
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Card.Title>{project.name}</Card.Title>
                  <Card.Text>
                    {project.description}
                  </Card.Text>
                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="far fa-calendar-alt me-1"></i>
                      {new Date(project.start_date).toLocaleDateString()} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                    </small>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => handleViewDetails(project.id)}
                  >
                    View Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add New Project Modal */}
      <div
        className="modal fade"
        id="addProjectModal"
        tabIndex="-1"
        aria-labelledby="addProjectModalLabel"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addProjectModalLabel">
                Add New Project
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Project Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newProject.startDate}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          startDate: e.target.value
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newProject.endDate}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          endDate: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={newProject.isCompleted}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        isCompleted: e.target.checked
                      })
                    }
                  />
                  <label className="form-check-label">Is Completed</label>
                </div>
                <button type="submit" className="btn btn-success">
                  Add Project
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Modal */}
      <Modal show={showProjectDetails !== null} onHide={() => setShowProjectDetails(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {store.projects.list.find(p => p.id === showProjectDetails)?.name || 'Project Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showProjectDetails && (
            <>
              {store.tasks.loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <Row className="mb-4">
                    <Col md={6} className="project-detail-section">
                      <h5>Project Information</h5>
                      <p><strong>Description:</strong> {store.projects.list.find(p => p.id === showProjectDetails)?.description}</p>
                      <p>
                        <strong>Timeline:</strong> {new Date(store.projects.list.find(p => p.id === showProjectDetails)?.start_date).toLocaleDateString()} 
                        - {store.projects.list.find(p => p.id === showProjectDetails)?.end_date ? 
                           new Date(store.projects.list.find(p => p.id === showProjectDetails)?.end_date).toLocaleDateString() : 'Ongoing'}
                      </p>
                      <p>
                        <strong>Status:</strong> <Badge bg={store.projects.list.find(p => p.id === showProjectDetails)?.is_completed ? "success" : "primary"}>
                          {store.projects.list.find(p => p.id === showProjectDetails)?.is_completed ? "Completed" : "In Progress"}
                        </Badge>
                      </p>
                    </Col>
                    <Col md={6} className="project-detail-section">
                      <h5>Tasks</h5>
                      {store.tasks.list.filter(task => 
                        (typeof task.project === 'object' ? task.project.id : task.project) === showProjectDetails
                      ).length > 0 ? (
                        <ul className="list-group project-tasks-list">
                          {store.tasks.list
                            .filter(task => (typeof task.project === 'object' ? task.project.id : task.project) === showProjectDetails)
                            .map(task => (
                              <li key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {task.name}
                                <Badge bg={task.is_completed ? "success" : "primary"} pill>
                                  {task.is_completed ? "Completed" : "In Progress"}
                                </Badge>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <div className="alert alert-info">
                          No tasks found for this project.
                        </div>
                      )}
                    </Col>
                  </Row>
                  <div className="mt-4 project-detail-section">
                    <h5>Project Analytics</h5>
                    <Row className="g-2">
                      <Col sm={4}>
                        <div className="card project-analytics-card">
                          <div className="card-body text-center">
                            <h3>
                              {store.tasks.list.filter(task => 
                                (typeof task.project === 'object' ? task.project.id : task.project) === showProjectDetails
                              ).length}
                            </h3>
                            <p className="mb-0">Total Tasks</p>
                          </div>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className="card project-analytics-card">
                          <div className="card-body text-center">
                            <h3>
                              {store.tasks.list.filter(task => 
                                (typeof task.project === 'object' ? task.project.id : task.project) === showProjectDetails &&
                                task.is_completed
                              ).length}
                            </h3>
                            <p className="mb-0">Completed</p>
                          </div>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className="card project-analytics-card">
                          <div className="card-body text-center">
                            <h3>
                              {Math.round(
                                (store.tasks.list.filter(task => 
                                  (typeof task.project === 'object' ? task.project.id : task.project) === showProjectDetails &&
                                  task.is_completed
                                ).length /
                                (store.tasks.list.filter(task => 
                                  (typeof task.project === 'object' ? task.project.id : task.project) === showProjectDetails
                                ).length || 1)) * 100
                              )}%
                            </h3>
                            <p className="mb-0">Completion</p>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProjectDetails(null)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              handleEditClick(store.projects.list.find(p => p.id === showProjectDetails));
              setShowProjectDetails(null);
            }}
          >
            Edit Project
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Project Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleEditSubmit}>
            <div className="mb-3">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                className="form-control"
                value={editProject.name}
                onChange={(e) =>
                  setEditProject({ ...editProject, name: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                value={editProject.description}
                onChange={(e) =>
                  setEditProject({
                    ...editProject,
                    description: e.target.value
                  })
                }
                required
              />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editProject.startDate}
                  onChange={(e) =>
                    setEditProject({
                      ...editProject,
                      startDate: e.target.value
                    })
                  }
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editProject.endDate}
                  onChange={(e) =>
                    setEditProject({
                      ...editProject,
                      endDate: e.target.value
                    })
                  }
                />
              </div>
            </div>
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={editProject.isCompleted}
                onChange={(e) =>
                  setEditProject({
                    ...editProject,
                    isCompleted: e.target.checked
                  })
                }
              />
              <label className="form-check-label">Is Completed</label>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the project "{projectToDelete?.name}"?</p>
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            This action cannot be undone and will delete all tasks associated with this project.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete Project
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
