import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Helper function to check if a link is active
    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    {!isCollapsed && <h3>TaskSync</h3>}
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        {isCollapsed ? (
                            <i className="fas fa-angle-right"></i>
                        ) : (
                            <i className="fas fa-angle-left"></i>
                        )}
                    </button>
                </div>
            </div>

            <div className="sidebar-menu">
                <ul>
                    <li className={isActive('/')}>
                        <Link to="/">
                            <i className="fas fa-project-diagram"></i>
                            {!isCollapsed && <span>Projects</span>}
                        </Link>
                    </li>
                    <li className={isActive('/tasks')}>
                        <Link to="/tasks">
                            <i className="fas fa-tasks"></i>
                            {!isCollapsed && <span>Tasks</span>}
                        </Link>
                    </li>
                    <li className={isActive('/dependency')}>
                        <Link to="/dependency">
                            <i className="fas fa-network-wired"></i>
                            {!isCollapsed && <span>Dependencies</span>}
                        </Link>
                    </li>
                    <li className={isActive('/analytics')}>
                        <Link to="/analytics">
                            <i className="fas fa-chart-bar"></i>
                            {!isCollapsed && <span>Analytics</span>}
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="sidebar-footer">
                {!isCollapsed && (
                    <div className="sidebar-footer-text">
                        <p>TaskSync v1.0</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
