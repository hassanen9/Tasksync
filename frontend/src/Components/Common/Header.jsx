import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ showToast }) => {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    // Helper function to get page title based on the current route
    const getPageTitle = () => {
        const path = location.pathname;
        
        if (path === '/') return 'Projects';
        if (path === '/tasks') return 'Tasks';
        if (path === '/dependency') return 'Dependencies';
        if (path === '/analytics') return 'Analytics';
        
        return 'TaskSync';
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Handle search functionality
        if (searchQuery.trim()) {
            showToast(`Searching for "${searchQuery}"...`, 'info');
            // Implement actual search logic here
        }
    };

    return (
        <header className="app-header">
            <div className="header-title">
                <h1>{getPageTitle()}</h1>
            </div>
            <div className="header-actions">
                <form className="search-form" onSubmit={handleSearch}>
                    <div className="input-group">
                        <input 
                            type="text" 
                            className="form-control search-input" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="btn btn-outline-primary" type="submit">
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                </form>
                <div className="notification-icon">
                    <i className="fas fa-bell"></i>
                    <span className="notification-badge">3</span>
                </div>
                <div className="user-profile">
                    <div className="user-avatar">
                        <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="User" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
