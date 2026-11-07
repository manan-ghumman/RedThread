
import { useNavigate } from 'react-router-dom';
import './DonorDashboard.css';

function DonorDashboard() {
  const navigate = useNavigate();

  const donor = {
    name: 'Mansi',
    karmaPoints: 250,
    donations: 2,
    eligibility: 'Eligible',
    nextDonation: 'You can donate now'
  };

  const activities = [
    { date: '20 Oct 2026', activity: 'Blood Donation', points: '+100' },
    { date: '10 Sep 2026', activity: 'Blood Donation', points: '+100' },
    { date: '05 Sep 2026', activity: 'Profile Completed', points: '+10' }
  ];

  return (
    <div className="dp-layout">
      <aside className="dp-sidebar">
        <h2>RedThread</h2>
        <p className="dp-label">DONOR PANEL</p>

        <div className="dp-menu active" onClick={() => navigate('/donor-dashboard')}>Dashboard</div>
        <div className="dp-menu" onClick={() => navigate('/donor-profile')}>My Profile</div>
        <div className="dp-menu" onClick={() => navigate('/karma-points')}>Karma Points</div>
        <div className="dp-menu" onClick={() => navigate('/donation-history')}>Donation History</div>
        <div className="dp-menu" onClick={() => navigate('/eligibility-status')}>Eligibility Status</div>
        <div className="dp-menu" onClick={() => navigate('/nearby-blood-banks')}>Nearby Blood Banks</div>
        <div className="dp-menu" onClick={() => navigate('/donor-appointments')}>Donation Appointments</div>
        <div className="dp-menu" onClick={() => navigate('/donor-notifications')}>Notifications</div>
        <div className="dp-menu" onClick={() => navigate('/donor-settings')}>Settings</div>

        <div className="dp-menu dp-logout" onClick={() => navigate('/')}>Logout</div>
      </aside>

      <main className="dp-main">
        <div className="dp-header">
          <h1>Donor Dashboard</h1>
          <span>Welcome, {donor.name}</span>
        </div>

        <div className="dp-stats">
          <div className="dp-stat-box">
            <h3>Karma Points</h3>
            <h2>{donor.karmaPoints}</h2>
          </div>

          <div className="dp-stat-box">
            <h3>Total Donations</h3>
            <h2>{donor.donations}</h2>
          </div>

          <div className="dp-stat-box">
            <h3>Eligibility Status</h3>
            <h2>{donor.eligibility}</h2>
          </div>

          <div className="dp-stat-box">
            <h3>Next Donation</h3>
            <h2>{donor.nextDonation}</h2>
          </div>
        </div>

        <section className="dp-section">
          <h2>Recent Activity</h2>

          <div className="dp-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Karma Points</th>
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

        <section className="dp-section">
          <h2>Quick Actions</h2>

          <div className="dp-actions">
            <button onClick={() => navigate('/donor-appointments')}>
              Book Appointment
            </button>

            <button onClick={() => navigate('/donation-history')}>
              View Donation History
            </button>

            <button onClick={() => navigate('/nearby-blood-banks')}>
              Find Blood Banks
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DonorDashboard;
