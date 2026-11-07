
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonorDashboard.css';
import './DonorPages.css';

function DonorLayout({ title, active, children }) {
  const navigate = useNavigate();

  const menu = [
    ['Dashboard', '/donor-dashboard'],
    ['My Profile', '/donor-profile'],
    ['Karma Points', '/karma-points'],
    ['Donation History', '/donation-history'],
    ['Eligibility Status', '/eligibility-status'],
    ['Nearby Blood Banks', '/nearby-blood-banks'],
    ['Donation Appointments', '/donor-appointments'],
    ['Notifications', '/donor-notifications'],
    ['Settings', '/donor-settings']
  ];

  return (
    <div className="dp-layout">
      <aside className="dp-sidebar">
        <h2>RedThread</h2>
        <p className="dp-label">DONOR PANEL</p>

        {menu.map(([name, path]) => (
          <div
            key={path}
            className={`dp-menu ${active === name ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            {name}
          </div>
        ))}

        <div className="dp-menu dp-logout" onClick={() => navigate('/')}>
          Logout
        </div>
      </aside>

      <main className="dp-main">
        <div className="dp-header">
          <h1>{title}</h1>
          <span>Welcome, Mansi</span>
        </div>
        {children}
      </main>
    </div>
  );
}

// 1. KARMA POINTS

export function KarmaPoints() {
  const activities = [
    { date: '20 Oct 2026', activity: 'Successful Blood Donation', points: '+100' },
    { date: '10 Sep 2026', activity: 'Successful Blood Donation', points: '+100' },
    { date: '05 Sep 2026', activity: 'Profile Completed', points: '+10' },
    { date: '01 Sep 2026', activity: 'Donor Registration', points: '+10' }
  ];

  return (
    <DonorLayout title="Karma Points" active="Karma Points">
      <div className="dp-page-card">
        <h3>Total Karma Points</h3>
        <h2 className="dp-highlight">220</h2>
        <p>Points earned through your contributions to RedThread.</p>
      </div>

      <section className="dp-page-section">
        <h2>Karma Points Activity</h2>
        <div className="dp-page-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Points Earned</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((item, index) => (
                <tr key={index}>
                  <td>{item.date}</td>
                  <td>{item.activity}</td>
                  <td>{item.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dp-page-section">
        <h2>How to Earn Karma Points</h2>
        <ul>
          <li>Successful blood donation – 100 points</li>
          <li>Completing donor profile – 10 points</li>
          <li>Referring a new donor – 20 points</li>
        </ul>
      </section>
    </DonorLayout>
  );
}

// 2. DONATION HISTORY

export function DonationHistory() {
  const donations = [
    { id: 'DN001', date: '20 Oct 2026', bank: 'RedThread Blood Bank', group: 'O+', volume: '450 mL', status: 'Completed' },
    { id: 'DN002', date: '10 Sep 2026', bank: 'City Blood Centre', group: 'O+', volume: '450 mL', status: 'Completed' }
  ];

  return (
    <DonorLayout title="Donation History" active="Donation History">
      <section className="dp-page-section">
        <h2>My Previous Donations</h2>
        <div className="dp-page-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Donation ID</th>
                <th>Date</th>
                <th>Blood Bank</th>
                <th>Blood Group</th>
                <th>Volume</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.date}</td>
                  <td>{item.bank}</td>
                  <td>{item.group}</td>
                  <td>{item.volume}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DonorLayout>
  );
}

// 3. ELIGIBILITY STATUS

export function EligibilityStatus() {
  return (
    <DonorLayout title="Eligibility Status" active="Eligibility Status">
      <div className="dp-page-card">
        <h3>Current Eligibility</h3>
        <h2 className="dp-highlight">Eligible</h2>
        <p>Your sample donor eligibility status is currently marked as eligible.</p>
      </div>

      <section className="dp-page-section">
        <h2>Donation Information</h2>
        <div className="dp-info-grid">
          <div>
            <label>Last Donation</label>
            <p>20 October 2026</p>
          </div>
          <div>
            <label>Next Possible Donation</label>
            <p>Subject to medical screening</p>
          </div>
          <div>
            <label>Blood Group</label>
            <p>O+</p>
          </div>
          <div>
            <label>Eligibility Verification</label>
            <p>Pending medical assessment</p>
          </div>
        </div>
      </section>

      <p className="dp-note">
        Final eligibility is determined by qualified medical personnel
        according to applicable donation guidelines.
      </p>
    </DonorLayout>
  );
}

// 4. NEARBY BLOOD BANKS

export function NearbyBloodBanks() {
  const banks = [
    { id: 1, name: 'RedThread Central Blood Bank', location: 'Dehradun', phone: '0135-0000001' },
    { id: 2, name: 'City Blood Centre', location: 'Dehradun', phone: '0135-0000002' },
    { id: 3, name: 'Regional Blood Bank', location: 'Dehradun', phone: '0135-0000003' }
  ];

  return (
    <DonorLayout title="Nearby Blood Banks" active="Nearby Blood Banks">
      <section className="dp-page-section">
        <h2>Available Blood Banks</h2>

        <div className="dp-bank-list">
          {banks.map(bank => (
            <div className="dp-bank-card" key={bank.id}>
              <h3>{bank.name}</h3>
              <p>Location: {bank.location}</p>
              <p>Contact: {bank.phone}</p>
            </div>
          ))}
        </div>
      </section>
    </DonorLayout>
  );
}

// 5. DONATION APPOINTMENTS

export function DonorAppointments() {
  const [date, setDate] = useState('');
  const [bank, setBank] = useState('');
  const [time, setTime] = useState('');
  const [appointments, setAppointments] = useState([
    { date: '15 Nov 2026', bank: 'RedThread Central Blood Bank', time: '10:00 AM', status: 'Pending' }
  ]);

  const bookAppointment = (e) => {
    e.preventDefault();

    if (!date || !bank || !time) {
      alert('Please fill in all appointment details.');
      return;
    }

    setAppointments([
      ...appointments,
      { date, bank, time, status: 'Pending' }
    ]);

    setDate('');
    setBank('');
    setTime('');
    alert('Demo appointment added successfully.');
  };

  return (
    <DonorLayout title="Donation Appointments" active="Donation Appointments">
      <section className="dp-page-section">
        <h2>Book an Appointment</h2>

        <form className="dp-page-form" onSubmit={bookAppointment}>
          <label>Select Blood Bank</label>
          <select value={bank} onChange={e => setBank(e.target.value)}>
            <option value="">Select a blood bank</option>
            <option>RedThread Central Blood Bank</option>
            <option>City Blood Centre</option>
            <option>Regional Blood Bank</option>
          </select>

          <label>Appointment Date</label>
          <input
            type="date"
            value={date}
            min="2026-11-06"
            onChange={e => setDate(e.target.value)}
          />

          <label>Preferred Time</label>
          <select value={time} onChange={e => setTime(e.target.value)}>
            <option value="">Select time</option>
            <option>10:00 AM</option>
            <option>11:00 AM</option>
            <option>12:00 PM</option>
            <option>02:00 PM</option>
            <option>03:00 PM</option>
          </select>

          <button type="submit">Book Appointment</button>
        </form>
      </section>

      <section className="dp-page-section">
        <h2>My Appointments</h2>
        <div className="dp-page-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Blood Bank</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item, index) => (
                <tr key={index}>
                  <td>{item.date}</td>
                  <td>{item.bank}</td>
                  <td>{item.time}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DonorLayout>
  );
}

// 6. NOTIFICATIONS

export function DonorNotifications() {
  const notifications = [
    { id: 1, message: 'Thank you for your previous blood donation!', date: '20 Oct 2026' },
    { id: 2, message: 'Your Karma Points have been updated.', date: '20 Oct 2026' },
    { id: 3, message: 'Remember to check your donation eligibility.', date: '01 Nov 2026' }
  ];

  return (
    <DonorLayout title="Notifications" active="Notifications">
      <section className="dp-page-section">
        <h2>Recent Notifications</h2>

        {notifications.map(item => (
          <div className="dp-notification" key={item.id}>
            <p>{item.message}</p>
            <span>{item.date}</span>
          </div>
        ))}
      </section>
    </DonorLayout>
  );
}

// 7. SETTINGS

export function DonorSettings() {
  const [email, setEmail] = useState('mansi@example.com');
  const [phone, setPhone] = useState('9876543210');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const saveSettings = (e) => {
    e.preventDefault();
    alert('Settings saved in this demo. Database connection will be added later.');
  };

  return (
    <DonorLayout title="Settings" active="Settings">
      <section className="dp-page-section">
        <h2>Account Settings</h2>

        <form className="dp-page-form" onSubmit={saveSettings}>
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />

          <h3>Notification Preferences</h3>

          <label className="dp-check">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={e => setEmailAlerts(e.target.checked)}
            />
            Email Notifications
          </label>

          <label className="dp-check">
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={e => setSmsAlerts(e.target.checked)}
            />
            SMS Notifications
          </label>

          <button type="submit">Save Changes</button>
        </form>
      </section>
    </DonorLayout>
  );
}
