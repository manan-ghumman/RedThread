
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BloodBankSettings.css';

function BloodBankSettings() {
  const navigate = useNavigate();

  const [bankName, setBankName] = useState('RedThread Central Blood Bank');
  const [email, setEmail] = useState('central@redthread.com');
  const [phone, setPhone] = useState('9876543210');
  const [address, setAddress] = useState('Dehradun, Uttarakhand');

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [requestAlerts, setRequestAlerts] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [transferAlerts, setTransferAlerts] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Settings saved successfully! (Demo only — not saved to database.)');
  };

  return (
    <div className="bb-layout">
      <aside className="bb-sidebar">
        <h2>RedThread</h2>
        <p className="bb-label">BLOOD BANK PANEL</p>
        <nav>
          <div className="bb-menu" onClick={() => navigate('/blood-bank')}>Dashboard</div>
          <div className="bb-menu" onClick={() => navigate('/blood-bank-inventory')}>Blood Inventory</div>
          <div className="bb-menu" onClick={() => navigate('/donor-management')}>Donor Management</div>
          <div className="bb-menu" onClick={() => navigate('/record-donation')}>Blood Donations</div>
          <div className="bb-menu" onClick={() => navigate('/hospital-requests')}>Hospital Requests</div>
          <div className="bb-menu" onClick={() => navigate('/blood-transfers')}>Blood Transfers</div>
          <div className="bb-menu" onClick={() => navigate('/blood-bank-reports')}>Reports</div>
          <div className="bb-menu active">Settings</div>
        </nav>
        <div className="bb-menu bb-logout" onClick={() => navigate('/')}>Logout</div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Blood Bank Settings</h1>
            <p>Manage your blood bank information and preferences</p>
          </div>
          <span className="bb-admin">Blood Bank Admin</span>
        </header>

        <form className="bb-settings-form" onSubmit={handleSave}>
          <section className="bb-settings-section">
            <h2>Blood Bank Information</h2>

            <div className="bb-settings-grid">
              <div className="bb-settings-field">
                <label>Blood Bank ID</label>
                <input value="BB001" readOnly />
              </div>

              <div className="bb-settings-field">
                <label>Blood Bank Name</label>
                <input
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  required
                />
              </div>

              <div className="bb-settings-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="bb-settings-field">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  pattern="[0-9]{10}"
                  title="Enter a 10-digit phone number"
                  required
                />
              </div>

              <div className="bb-settings-field bb-full-width">
                <label>Address</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows="3"
                  required
                />
              </div>
            </div>
          </section>

          <section className="bb-settings-section">
            <h2>Notification Preferences</h2>

            <div className="bb-notification-options">
              <label>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={e => setEmailAlerts(e.target.checked)}
                />
                Email notifications
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={requestAlerts}
                  onChange={e => setRequestAlerts(e.target.checked)}
                />
                New hospital request alerts
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={expiryAlerts}
                  onChange={e => setExpiryAlerts(e.target.checked)}
                />
                Blood expiry alerts
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={transferAlerts}
                  onChange={e => setTransferAlerts(e.target.checked)}
                />
                Blood transfer updates
              </label>
            </div>
          </section>

          <button type="submit" className="bb-save-button">
            Save Changes
          </button>
        </form>
      </main>
    </div>
  );
}

export default BloodBankSettings;
