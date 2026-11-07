
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState('Hospital');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      alert('Please enter your username and password.');
      return;
    }

    if (role === 'Hospital') {
      navigate('/dashboard');
    } 
    else if (role === 'Blood Bank') {
      navigate('/blood-bank');
    } 
    else if (role === 'Donor') {
      navigate('/donor-dashboard');
    } 
    else if (role === 'Admin') {
      navigate('/admin-dashboard');
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="brand">
          <h1>RedThread</h1>
          <p>Every Drop Counts.</p>
        </div>
        <span className="header-tag">
          Blood Bank Management System
        </span>
      </header>

      <main className="login-content">
        <section className="login-section">
          <h2>Welcome to RedThread</h2>
          <p className="subtitle">
            Connecting lives, one donation at a time.
          </p>

          <form className="login-box" onSubmit={handleLogin}>
            <h3>Log In</h3>

            <label>Select your role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Hospital</option>
              <option>Blood Bank</option>
              <option>Admin</option>
              <option>Donor</option>
            </select>

            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Log In</button>

            <p className="login-note">
              Secure access to your RedThread account
            </p>

            <p className="register-link">
              New donor? <Link to="/register-donor">Register here</Link>
            </p>
          </form>
        </section>

        <aside className="donor-panel">
          <h3>Registered Donors</h3>
          <div className="donor-number">2,XXX</div>
          <p>People registered with RedThread</p>
          <div className="donor-divider"></div>
          <p className="donor-message">
            Every donor can make a difference.
          </p>
        </aside>
      </main>

      <footer className="login-footer">
        RedThread © 2026 | Every Drop Counts.
      </footer>
    </div>
  );
}

export default Login;
