// Theme configuration for the application
const theme = {
  colors: {
    primary: '#4361ee',
    secondary: '#3f37c9',
    success: '#4cc9f0',
    danger: '#f72585',
    warning: '#f8961e',
    info: '#4895ef',
    light: '#f8f9fa',
    dark: '#212529',
    background: '#ffffff',
    text: '#212529',
    muted: '#6c757d',
    border: '#dee2e6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    hover: '#f5f9ff',
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    heading: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    monospace: "'Source Code Pro', monospace"
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    pill: '50px',
    circle: '50%',
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    lg: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.1)',
    xl: '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
  },
  transitions: {
    fast: 'all 0.2s ease',
    medium: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
  taskStatus: {
    todo: { color: '#4361ee', bgColor: '#eef1ff' },
    in_progress: { color: '#f8961e', bgColor: '#fff4e6' },
    review: { color: '#7209b7', bgColor: '#f3e8fd' },
    completed: { color: '#06d6a0', bgColor: '#e6fff9' },
    blocked: { color: '#f72585', bgColor: '#ffe6ee' },
  },
  priority: {
    low: { color: '#4895ef', bgColor: '#e6f4ff' },
    medium: { color: '#f8961e', bgColor: '#fff4e6' },
    high: { color: '#f72585', bgColor: '#ffe6ee' },
  }
};

export default theme;
