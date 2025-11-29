// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
import Sidebar from './Components/Sidebar/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './App.css'; // Custom styles for the main content
import ProjectList from './Components/ProjectsList/ProjectList';
import TaskList from './Components/ProjectsList/Task';
import TaskDependencyFlow from './Components/ProjectsList/dependencies';
import Analytics from './Components/Analytics/Analytics';
import NotFound from './Components/Common/NotFound';
import Header from './Components/Common/Header';
import Toast from './Components/Common/Toast';

const App = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Function to show toast notifications throughout the app
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ ...toast, show: false });
    }, 3000);
  };

  return (
    <StoreProvider>
      <Router>
        <div className="app-wrapper">
          <Sidebar />
          <div className="main-content">
            <Header showToast={showToast} />
            <Routes>
              <Route exact path="/" element={<ProjectList showToast={showToast} />} />
              <Route path="/tasks" element={<TaskList showToast={showToast} />} />
              <Route path="/dependency" element={<TaskDependencyFlow showToast={showToast} />} />
              <Route path="/analytics" element={<Analytics showToast={showToast} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            {toast.show && <Toast message={toast.message} type={toast.type} />}
          </div>
        </div>
      </Router>
    </StoreProvider>
  );
};

export default App;
