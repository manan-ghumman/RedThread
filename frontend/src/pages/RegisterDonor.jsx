
import { useNavigate } from 'react-router-dom';
import './RegisterDonor.css';

function RegisterDonor() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Donor registration submitted successfully!');
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
          <input type="text" placeholder="Enter full name" required />

          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="Enter 10-digit phone number"
            pattern="[0-9]{10}"
            required
          />

          <label>Email Address</label>
          <input type="email" placeholder="Enter email address" required />

          <label>Gender</label>
          <select required defaultValue="">
            <option value="" disabled>Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>

          <label>Blood Group</label>
          <select required defaultValue="">
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

          <button type="submit">Register Donor</button>

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
