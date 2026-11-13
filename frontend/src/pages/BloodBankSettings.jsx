import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../utils/auth';
import './BloodBankSettings.css';

function BloodBankSettings() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [bankName, setBankName] = useState('RedThread Central Blood Bank');
  const [email, setEmail] = useState('central@redthread.com');
  const [phone, setPhone] = useState('9876543210');
  const [address, setAddress] = useState('Dehradun, Uttarakhand');

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [requestAlerts, setRequestAlerts] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [transferAlerts, setTransferAlerts] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.bb_name) setBankName(data.bb_name);
        if (data.bb_email) setEmail(data.bb_email);
        if (data.bb_phone) setPhone(data.bb_phone);
        if (data.bb_address) setAddress(data.bb_address);
        if (data.bb_email_alerts !== undefined) setEmailAlerts(data.bb_email_alerts === 'true');
        if (data.bb_request_alerts !== undefined) setRequestAlerts(data.bb_request_alerts === 'true');
        if (data.bb_expiry_alerts !== undefined) setExpiryAlerts(data.bb_expiry_alerts === 'true');
        if (data.bb_transfer_alerts !== undefined) setTransferAlerts(data.bb_transfer_alerts === 'true');
      })
      .catch(() => {});
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bb_name: bankName,
        bb_email: email,
        bb_phone: phone,
        bb_address: address,
        bb_email_alerts: emailAlerts ? 'true' : 'false',
        bb_request_alerts: requestAlerts ? 'true' : 'false',
        bb_expiry_alerts: expiryAlerts ? 'true' : 'false',
        bb_transfer_alerts: transferAlerts ? 'true' : 'false'
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert('Settings saved successfully to database!');
        } else {
          alert('Failed to save settings: ' + (res.error || ''));
        }
      })
      .catch(err => alert('Network error: ' + err.message));
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
        <div className="bb-menu bb-logout" onClick={() => {
          clearUser();
          navigate('/');
        }}>Logout</div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Blood Bank Settings</h1>
            <p>Manage your blood bank information and preferences</p>
          </div>
          <span className="bb-admin">Logged in as: {currentUser?.username || 'Blood Bank'}</span>
        </header>

        <form className="bb-settings-form" onSubmit={handleSave}>
          <section className="bb-settings-section">
            <h2>Blood Bank Information</h2>

            <div className="bb-settings-grid">
              <div className="bb-settings-field">
                <label>Blood Bank ID</label>
                <input value={currentUser?.entityId || "F005"} readOnly />
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
