
import { useNavigate } from 'react-router-dom';
import './RecordDonation.css';

function RecordDonation() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Donation recorded successfully!');
  };

  return (
    <div className="donation-page">

      <header className="donation-header">
        <h1>RedThread</h1>
        <span>Blood Bank Management System</span>
      </header>

      <main className="donation-container">

        <h2>Record a Donation</h2>
        <p>Enter the details of the blood donation received.</p>

        <form className="donation-form" onSubmit={handleSubmit}>

          <label>Donor ID</label>
          <input
            type="text"
            placeholder="Enter registered Donor ID"
            required
          />

          <label>Donor Name</label>
          <input
            type="text"
            placeholder="Enter donor name"
            required
          />

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

          <label>Donation Date</label>
          <input type="date" required />

          <label>Blood Volume (mL)</label>
          <input
            type="number"
            placeholder="Enter volume in mL"
            min="1"
            max="500"
            required
          />

          <label>Donation Facility</label>
          <input
            type="text"
            placeholder="Enter facility ID"
            required
          />

          <label>Donation Status</label>
          <select required defaultValue="">
            <option value="" disabled>Select status</option>
            <option value="Collected">Collected</option>
            <option value="Under Testing">Under Testing</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button type="submit">Record Donation</button>

        </form>

        <button
          className="donation-back"
          onClick={() => navigate('/blood-bank')}
        >
          Back to Dashboard
        </button>

      </main>
    </div>
  );
}

export default RecordDonation;
