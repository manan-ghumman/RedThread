
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecordDonation.css';

function RecordDonation() {
  const navigate = useNavigate();

  const [donorId, setDonorId] = useState('');
  const [donorName, setDonorName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [donationDate, setDonationDate] = useState('');
  const [volume, setVolume] = useState('450');
  const [facilityId, setFacilityId] = useState('F005');
  const [status, setStatus] = useState('Collected');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: donorId,
          date: donationDate,
          volume: volume,
          facilityId: facilityId
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Donation recorded successfully!');
        setDonorId('');
        setDonorName('');
        navigate('/blood-bank');
      } else {
        alert('Error: ' + (data.error || 'Failed to record donation'));
      }
    } catch (err) {
      alert('Network error connecting to API: ' + err.message);
    } finally {
      setSubmitting(false);
    }
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
            placeholder="Enter registered Donor ID (e.g. RT0001)"
            value={donorId}
            onChange={e => setDonorId(e.target.value)}
            required
          />

          <label>Donor Name</label>
          <input
            type="text"
            placeholder="Enter donor name"
            value={donorName}
            onChange={e => setDonorName(e.target.value)}
            required
          />

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

          <label>Donation Date</label>
          <input
            type="date"
            value={donationDate}
            onChange={e => setDonationDate(e.target.value)}
            required
          />

          <label>Blood Volume (mL)</label>
          <input
            type="number"
            placeholder="Enter volume in mL"
            min="200"
            max="600"
            value={volume}
            onChange={e => setVolume(e.target.value)}
            required
          />

          <label>Donation Facility</label>
          <input
            type="text"
            placeholder="Enter facility ID (e.g. F005)"
            value={facilityId}
            onChange={e => setFacilityId(e.target.value)}
            required
          />

          <label>Donation Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            required
          >
            <option value="Collected">Collected</option>
            <option value="Under Testing">Under Testing</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Recording...' : 'Record Donation'}
          </button>

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
