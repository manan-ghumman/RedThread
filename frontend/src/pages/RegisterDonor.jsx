
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterDonor.css';

function RegisterDonor() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          bloodType: bloodType
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Donor registered successfully!');
        setName('');
        setPhone('');
        setEmail('');
        setBloodType('');
        navigate('/donor-management');
      } else {
        alert('Error: ' + (data.error || 'Failed to register donor'));
      }
    } catch (err) {
      alert('Network error connecting to API: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="donor-page">

      <header className="donor-header">
        <h1>RedThread</h1>
        <span>Every Drop Counts.</span>
      </header>

      <main className="donor-container">

        <h2>Register a New Donor</h2>
        <p>Join us in saving lives, one donation at a time.</p>

        <form onSubmit={handleSubmit} className="donor-form">

          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="Enter 10-digit phone number"
            pattern="[0-9]{10}"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Gender</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            required
          >
            <option value="" disabled>Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>

          <label>Blood Group</label>
          <select
            value={bloodType}
            onChange={e => setBloodType(e.target.value)}
            required
          >
            <option value="" disabled>Select blood group</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>O+</option>
            <option>O-</option>
            <option>AB+</option>
            <option>AB-</option>
          </select>

          <label>Fitness Report</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register Donor'}
          </button>

        </form>

        <button
          className="donor-back"
          onClick={() => navigate('/')}
        >
          Back to Login
        </button>

      </main>
    </div>
  );
}

export default RegisterDonor;
