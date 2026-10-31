import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: email, password: password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.role === "teacher") {
          navigate("/Teacher");
        } else if (data.role === "student") {
          navigate("/Student");
        }
      } else {
        setError(data.msg || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.log(err.message);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel">
        <div className="form-box">
          <h2>Welcome Back</h2>
          <p>Login to continue your journey.</p>

          {error && (
            <div style={{ color: '#ff4d4f', marginBottom: '15px', fontWeight: 'bold', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <input
                type="text" required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email/Regno</label>
            </div>

            <div className="input-group">
              <input
                type="password" required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
            </div>

            <button type="submit" className="submit-btn">Login</button>
          </form>

          <div className="toggle-text">
            Don't have an account?
            <span onClick={() => navigate('/signup')} style={{ cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>
              Sign up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;