// AuthContext now uses a REST API backend (MongoDB) instead of Firebase for authentication.
import React, { createContext, useContext, useState, useEffect} from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Define your backend base URL
// Make sure this matches the PORT your backend server is actually running on
const BACKEND_BASE_URL = 'https://stockup-l530.onrender.com';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sign up with email and password
  // MODIFIED: Added username parameter
  async function signup(email, password, username, role = 'staff') {
    try {
      setLoading(true); // Set loading true at the start of the operation
      const res = await fetch(`${BACKEND_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // MODIFIED: Include username in the request body
        body: JSON.stringify({ email, password, username, role })
      });
      const data = await res.json();
      if (!res.ok) {
        // Throw an error with the backend's message for better error display
        throw new Error(data.error || data.message || 'Signup failed');
      }
      localStorage.setItem('token', data.token); // Store JWT
      setCurrentUser(data.user);
      setError(''); // Clear any previous errors on success
      return data;
    } catch (err) {
      console.error("Error during signup:", err);
      setError(err.message || "Failed to sign up."); // Set error state for display
      throw err; // Re-throw the error so calling components can catch it
    } finally {
      setLoading(false); // Always set loading to false when done
    }
  }

  // Login with email and password
  async function login(email, password) {
    try {
      setLoading(true); // Set loading true
      // MODIFIED: Use absolute URL
      const res = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }
      localStorage.setItem('token', data.token); // Store JWT
      setCurrentUser(data.user);
      setError('');
      return data;
    } catch (err) {
      console.error("Error during login:", err);
      setError(err.message || "Failed to log in.");
      throw err;
    } finally {
      setLoading(false); // Always set loading to false
    }
  }

  // Google login (redirect to backend OAuth)
  function loginWithGoogle() {
    // MODIFIED: Use absolute URL
    window.location.href = `${BACKEND_BASE_URL}/api/auth/google`;
  }

  // Logout
  async function logout() {
    try {
      setLoading(true); // Set loading true
      // MODIFIED: Use absolute URL
      await fetch(`${BACKEND_BASE_URL}/api/auth/logout`, { method: 'POST' });
      localStorage.removeItem('token'); // Remove JWT
      setCurrentUser(null);
      setError('');
    } catch (err) {
      console.error("Error during logout:", err);
      setError(err.message || "Failed to log out.");
    } finally {
      setLoading(false); // Always set loading to false
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      setLoading(true); // Set loading true
      // MODIFIED: Use absolute URL
      const res = await fetch(`${BACKEND_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Password reset failed');
      }
      setError('');
      return data;
    } catch (err) {
      console.error("Error during password reset:", err);
      setError(err.message || "Failed to reset password.");
      throw err;
    } finally {
      setLoading(false); // Always set loading to false
    }
  }

  // Check auth state on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        // MODIFIED: Use absolute URL
        const res = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
        } else {
          // Token might be expired or invalid, clear it
          localStorage.removeItem('token');
          setCurrentUser(null);
          setError(data.error || data.message || 'Authentication failed.');
        }
      } catch (err) {
        console.error("Error checking auth state:", err);
        localStorage.removeItem('token'); // Ensure token is cleared on network errors too
        setCurrentUser(null);
        setError("Could not connect to authentication server.");
      } finally {
        setLoading(false); // Always set loading to false
      }
    }
    checkAuth();
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loginWithGoogle,
    resetPassword,
    loading,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
