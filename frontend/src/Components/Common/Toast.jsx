import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'success' }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    // Define the icon based on the type of toast
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <i className="fas fa-check-circle"></i>;
            case 'error':
                return <i className="fas fa-exclamation-circle"></i>;
            case 'warning':
                return <i className="fas fa-exclamation-triangle"></i>;
            case 'info':
                return <i className="fas fa-info-circle"></i>;
            default:
                return <i className="fas fa-bell"></i>;
        }
    };

    return (
        <div className={`toast-container ${isVisible ? 'show' : 'hide'} toast-${type}`}>
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-message">
                {message}
            </div>
            <button className="toast-close" onClick={() => setIsVisible(false)}>
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

export default Toast;
