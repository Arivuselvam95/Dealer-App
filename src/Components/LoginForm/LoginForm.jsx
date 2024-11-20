import React, { useState } from 'react';
import titan_logo from '../../assets/image.png';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

const LoginForm = ({ onLogin, helpButton }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const notify = (msg, type = 'info') => {
    toast[type](msg, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };
  
  const handleLoginClick = (e) => {
    if (username && password) {
      e.preventDefault();
      onLogin(username, password);
    } else {
      
      notify('Username and password are required', 'warning');
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      notify('Please enter your username first', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        notify('Password reset link has been sent to your email', 'success');
      } else {
        notify(data.message || 'Failed to process request', 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      notify('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div className="page-container login-page">
        <img className="titan-logo" src={titan_logo} alt="Titan Logo" />
        <div className="scrolling-text">
          <span>
            <pre>Dealer App         Dealer App         Dealer App         Dealer App         Dealer App         </pre>
          </span>
        </div>
        <div className="login-container">
          <div className="login-form">
            <div className="form-group">
              <label htmlFor="username">USERNAME</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">PASSWORD</label>
              <div className="password-input-container" style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                  }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            <div
              className="forgot-password-link"
              onClick={!isLoading ? handleForgotPassword : undefined}
              style={{
                zIndex: "10",
                fontSize: ".9rem",
                position: "relative",
                marginLeft: "70%",
                color: "lightblue",
                cursor: isLoading ? "wait" : "pointer",
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? "Processing..." : "Forget password?"}
            </div>
            <div className="button-group">
              <button
                onClick={handleLoginClick}
                className="btn-login"
                disabled={isLoading}
              >
                Sign In
              </button>
              {helpButton && 
                <button
                onClick={() => navigate('/help')}
                  className="btn-help"
                  disabled={isLoading}
                >
                  Help
                </button>
              }
            </div>
          </div>
        </div>
      </div>
      <div className="area">
        <ul className="circles">
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
      </div>
    </>
  );
};

export default LoginForm;
