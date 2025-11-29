import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Page Not Found</h2>
                <p className="not-found-text">
                    Sorry, the page you are looking for does not exist or has been moved.
                </p>
                <Link to="/" className="btn btn-primary btn-lg not-found-btn">
                    <i className="fas fa-home mr-2"></i> Back to Home
                </Link>
            </div>
            <div className="not-found-animation">
                <div className="search-icon">
                    <i className="fas fa-search"></i>
                </div>
                <div className="dots-container">
                    <div className="dot dot1"></div>
                    <div className="dot dot2"></div>
                    <div className="dot dot3"></div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
