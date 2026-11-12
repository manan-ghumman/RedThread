
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RequestBlood.css';

function RequestBlood() {
  const navigate = useNavigate();

  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [component, setComponent] = useState('Packed Red Blood Cells');
  const [units, setUnits] = useState('1');
  const [priority, setPriority] = useState('Emergency');
  const [requiredDate, setRequiredDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId,
          bloodType: bloodType,
          componentType: component,
          quantity: units,
          priority: priority,
          facilityId: 'F005'
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Blood request submitted successfully!');
        navigate('/request-history');
      } else {
        alert('Error: ' + (data.error || 'Failed to submit blood request'));
      }
    } catch (err) {
      alert('Network error connecting to API: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rb-layout">

      <aside className="rb-sidebar">
        <h2>RedThread</h2>
        <p className="rb-label">HOSPITAL PANEL</p>

        <nav>
          <div
            className="rb-menu"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </div>

          <div
            className="rb-menu"
            onClick={() => navigate('/hospital-inventory')}
          >
            Blood Inventory
          </div>

          <div className="rb-menu active">
            Request Blood
          </div>

          <div className="rb-menu" onClick={() => navigate('/request-history')}>Request History
          </div>

          <div className={`menu-item ${window.location.pathname === '/hospital-settings' ? 'active' : ''}`} onClick={() => navigate('/hospital-settings')}>
          Settings
          </div>
        </nav>

        <div
          className="rb-menu rb-logout"
          onClick={() => navigate('/')}
        >
          Logout
        </div>
      </aside>

      <main className="rb-main">

        <header className="rb-header">
          <div>
            <h1>Request Blood</h1>
            <p>Submit a blood requirement to the blood bank.</p>
          </div>
          <span className="rb-admin">Hospital Panel</span>
        </header>

        <section className="rb-form-container">

          <h2>Blood Request Form</h2>
          <p className="rb-description">
            Fill in the details below to request blood units.
          </p>

          <form className="rb-form" onSubmit={handleSubmit}>

            <div className="rb-field">
              <label>Patient ID</label>
              <input
                type="text"
                placeholder="Enter patient ID (e.g. RT0101)"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                required
              />
            </div>

            <div className="rb-field">
              <label>Patient Name</label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                required
              />
            </div>

            <div className="rb-field">
              <label>Blood Group Required</label>
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
            </div>

            <div className="rb-field">
              <label>Blood Component</label>
              <select
                value={component}
                onChange={e => setComponent(e.target.value)}
                required
              >
                <option value="Whole Blood">Whole Blood</option>
                <option value="Packed Red Blood Cells">Packed Red Blood Cells</option>
                <option value="Platelets">Platelets</option>
                <option value="Plasma">Plasma</option>
                <option value="Cryoprecipitate">Cryoprecipitate</option>
              </select>
            </div>

            <div className="rb-field">
              <label>Number of Units Required</label>
              <input
                type="number"
                placeholder="Enter number of units"
                min="1"
                value={units}
                onChange={e => setUnits(e.target.value)}
                required
              />
            </div>

            <div className="rb-field">
              <label>Request Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                required
              >
                <option value="Emergency">Emergency</option>
                <option value="Urgent">Urgent</option>
                <option value="Routine">Routine</option>
              </select>
            </div>

            <div className="rb-field">
              <label>Required By Date</label>
              <input
                type="date"
                value={requiredDate}
                onChange={e => setRequiredDate(e.target.value)}
                required
              />
            </div>

            <div className="rb-field">
              <label>Reason for Request</label>
              <textarea
                placeholder="Enter reason or medical requirement"
                rows="4"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
            </div>

            <div className="rb-form-actions">
              <button type="submit" className="rb-submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Blood Request'}
              </button>

              <button
                type="button"
                className="rb-cancel"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
            </div>

          </form>
        </section>

      </main>
    </div>
  );
}

export default RequestBlood;
