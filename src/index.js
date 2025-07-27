// src/index.js (or src/main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
 // Import BrowserRouter
import { AuthProvider } from './context/AuthContext'; // Your AuthProvider
import App from './App'; // Your main application component
import './index.css'; // Your Tailwind CSS import

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <--- THIS IS THE KEY: BrowserRouter wraps AuthProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    
  </React.StrictMode>
);