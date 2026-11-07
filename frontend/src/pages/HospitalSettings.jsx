
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HospitalSettings.css';

function HospitalSettings() {
  const navigate = useNavigate();

  const [hospitalName, setHospitalName] = useState('City Hospital');
  const [hospitalEmail, setHospitalEmail] = useState('cityhospital@example.com');
  const [phone, setPhone] = useState('9876543210');
  const [address, setAddress] = useState('Dehradun, Uttarakhand');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [requestUpdates, setRequestUpdates] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  return (
    <div className="hs-layout">

      <aside className="hs-sidebar">
        <h2>RedThread</h2>
        <p className="hs-label">HOSPITAL PANEL</p>

        <nav>
          <div className="hs-menu" onClick={() => navigate('/dashboard')}>
            Dashboard
          </div>

          <div className="hs-menu" onClick={() => navigate('/hospital-inventory')}>
            Blood Inventory
          </div>

          <div className="hs-menu" onClick={() => navigate('/requests')}>
            Request Blood
          </div>

          <div className="hs-menu" onClick={() => navigate('/request-history')}>
            Request History
          </div>

          <div className="hs-menu active">
            Settings
          </div>
        </nav>

        <div className="hs-menu hs-logout" onClick={() => navigate('/')}>
          Logout
        </div>
      </aside>

      <main className="hs-main">

        <header className="hs-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your hospital account and preferences.</p>
          </div>
          <span className="hs-admin">Hospital Panel</span>
        </header>

        <form onSubmit={handleSave}>

          <section className="hs-section">
            <h2>Hospital Information</h2>
            <p className="hs-description">
              Update your hospital's basic information.
            </p>

            <div className="hs-form-grid">

              <div className="hs-field">
                <label>Hospital Name</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                />
              </div>

              <div className="hs-field">
                <label>Hospital ID</label>
                <input type="text" value="H001" disabled />
              </div>

              <div className="hs-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={hospitalEmail}
                  onChange={(e) => setHospitalEmail(e.target.value)}
                  required
                />
              </div>

              <div className="hs-field">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
              </div>

              <div className="hs-field hs-full">
                <label>Hospital Address</label>
                <textarea
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

            </div>
          </section>

          <section className="hs-section">
            <h2>Notification Preferences</h2>
            <p className="hs-description">
              Choose which updates you want to receive.
            </p>

            <div className="hs-toggle-row">
              <div>
                <strong>Email Notifications</strong>
                <p>Receive important updates through email.</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            </div>

            <div className="hs-toggle-row">
              <div>
                <strong>Request Status Updates</strong>
                <p>Get notified when a blood request changes status.</p>
              </div>
              <input
                type="checkbox"
                checked={requestUpdates}
                onChange={(e) => setRequestUpdates(e.target.checked)}
              />
            </div>

            <div className="hs-toggle-row">
              <div>
                <strong>Low Stock Alerts</strong>
                <p>Receive alerts about low blood availability.</p>
              </div>
              <input
                type="checkbox"
                checked={lowStockAlerts}
                onChange={(e) => setLowStockAlerts(e.target.checked)}
              />
            </div>
          </section>

          <div className="hs-actions">
            <button type="submit" className="hs-save">
              Save Changes
            </button>

            <button
              type="button"
              className="hs-cancel"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}

export default HospitalSettings;
