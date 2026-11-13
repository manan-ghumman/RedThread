
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveUser } from '../utils/auth';
import './Login.css';

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState('Hospital');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [donorCount, setDonorCount] = useState('100+');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/stats')
      .then(r => r.json())
      .then(data => {
        if (data && data.donorCount) {
          setDonorCount(String(data.donorCount));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      alert('Please enter your username and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          role: role
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        saveUser({
          userId: data.userId,
          username: data.username,
          role: data.role || role,
          associatedId: data.associatedId
        });

        const effectiveRole = data.role || role;
        if (effectiveRole === 'Hospital') {
          navigate('/dashboard');
        } else if (effectiveRole === 'Blood Bank') {
          navigate('/blood-bank');
        } else if (effectiveRole === 'Donor') {
          navigate('/donor-dashboard');
        } else if (effectiveRole === 'Admin') {
          navigate('/admin-dashboard');
        }
      } else {
        alert(data.error || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      alert('Failed to connect to authentication server: ' + err.message);
    } finally {
      setSubmitting(false);
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

            <button type="submit" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log In'}
            </button>

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
          <div className="donor-number">{donorCount}</div>
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
