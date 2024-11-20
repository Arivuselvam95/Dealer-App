import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate  } from 'react-router-dom';
import './App.css';
import LoginForm from './Components/LoginForm/LoginForm';
import WelcomePage from './Components/WelcomePage/WelcomePage';
import HelpPage from './Components/HelpPage/HelpPage';
import Admin from './Components/AdminPage/Admin';
import ResetPassword from './Components/ResetPassword/ResetPassword';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [incorrect, setIncorrect] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [help, setHelp] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
      
        toast.success("Login successful!");
        setIncorrect(false);
        localStorage.setItem('token', data.token);
        navigate(username === 'admin' ? '/admin' : '/welcome');
      } else {
        setHelp(true);
        toast.error(data.message || "Invalid username or password!");
        setLoginAttempts((prev) => {
          const newAttempts = prev + 1;
          if (newAttempts >= 3) {
            toast.info("Redirected to Help Page due to multiple failed login attempts.");
            navigate('/help');
          }
          return newAttempts;
        });
        setIncorrect(true);
      }
    } catch (error) {
      toast.error("An error occurred during login!");
    }
  };

  const handleHelpSubmit = async (formData) => {
    const newIncident = {
      dealerCode: formData.dealerCode,
      location: formData.location,
      region: formData.region,
      issue: formData.issue,
      email: formData.email,
      contactNo: formData.contactNo,
      screenshot: formData.screenshot || 'No Image',
      reportedAt: new Date().toISOString(), // Optional timestamp
      checked: false
    };
  
    try {
      const response = await fetch('http://localhost:5000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident),
        credentials: 'include',
      });
  
      if (response.ok) {
        const data = await response.json();
        toast.success('Incident submitted successfully!');
        console.log('Incident saved with ID:', data.incidentId);
  
        // Reset state after success
        setIncidents((prevIncidents) => [...prevIncidents, newIncident]);
        navigate('/login');
        setLoginAttempts(0);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit incident.');
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast.error('An error occurred while submitting the incident.');
    }
  };
  

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info("Logged out successfully!");
    navigate('/login');
  };

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <div className="app">
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginForm onLogin={handleLogin}  helpButton={help} />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomePage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <HelpPage
              onSubmit={handleHelpSubmit}
              back={() => navigate('/login')}
              setIncorrect={setIncorrect}
            />
          }
        />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </div>
  );
};

const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;
