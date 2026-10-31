import React, { useState } from 'react';
import './Login.css'; 
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); 
  const [secretKey, setSecretKey] = useState(''); 
  
  const navigate = useNavigate(); 
  
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    if (role === 'teacher' && !secretKey.trim()) {
      alert("Teacher Secret Code is required.");
      return;
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            name: name,          
            user_name: email,    
            password: password, 
            role: role,
            secretKey: secretKey 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Account created successfully! You can now log in.");
        navigate('/login'); 
      } else {
        alert(data.msg || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("API call error:", error);
      alert("Server error. Please try again later.");
    }
  }

  return (
    <div className="login-container">
      <div className="glass-panel">
        <div className="form-box">
          <h2>Create Account</h2>
          <p>Sign up to get started.</p>
          
          <form onSubmit={handleSignupSubmit}>
            
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%', padding: '10px', background: 'transparent', 
                  color: '#fff', border: '1px solid #fff', borderRadius: '5px', outline: 'none'
                }}
              >
                <option value="student" style={{ color: 'black' }}>Student</option>
                <option value="teacher" style={{ color: 'black' }}>Teacher</option>
              </select>
            </div>

            <div className="input-group">
              <input 
                type="text" required 
                value={name}
                onChange={(e) => setName(e.target.value)} 
              />
              <label>Full Name</label>
            </div>

            <div className="input-group">
              <input 
                type="text" required 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
              />
              <label>{role === 'teacher' ? 'Email Address' : 'Register Number'}</label>
            </div>
            
            <div className="input-group">
              <input 
                type="password" required 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
              />
              <label>Password</label>
            </div>

            {/* Teacher select panna mattum intha input box varum */}
            {role === 'teacher' && (
              <div className="input-group">
                <input 
                  type="password" required 
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)} 
                />
                <label>Teacher Secret Code</label>
              </div>
            )}
            
            <button type="submit" className="submit-btn">Sign Up</button>
          </form>

          <div className="toggle-text">
            Already have an account? 
            <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>
               Login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;