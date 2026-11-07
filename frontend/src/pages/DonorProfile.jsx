
import { useNavigate } from 'react-router-dom';
import './DonorProfile.css';

function DonorProfile() {
  const navigate = useNavigate();

  const donor = {
    id: 'D001',
    name: 'Mansi',
    email: 'mansi@example.com',
    phone: '9876543210',
    bloodGroup: 'O+',
    age: 21,
    gender: 'Female',
    address: 'Dehradun, Uttarakhand'
  };

  return (
    <div className="dp-layout">
      <aside className="dp-sidebar">
        <h2>RedThread</h2>
        <p className="dp-label">DONOR PANEL</p>

        <div className="dp-menu" onClick={() => navigate('/donor-dashboard')}>Dashboard</div>
        <div className="dp-menu active">My Profile</div>
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
          <h1>My Profile</h1>
          <span>Donor ID: {donor.id}</span>
        </div>

        <section className="profile-section">
          <h2>Personal Information</h2>

          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <p>{donor.name}</p>
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <p>{donor.email}</p>
            </div>

            <div className="profile-field">
              <label>Phone Number</label>
              <p>{donor.phone}</p>
            </div>

            <div className="profile-field">
              <label>Blood Group</label>
              <p>{donor.bloodGroup}</p>
            </div>

            <div className="profile-field">
              <label>Age</label>
              <p>{donor.age} years</p>
            </div>

            <div className="profile-field">
              <label>Gender</label>
              <p>{donor.gender}</p>
            </div>

            <div className="profile-field">
              <label>Address</label>
              <p>{donor.address}</p>
            </div>
          </div>

          <button
            className="profile-edit-button"
            onClick={() => alert('Profile editing will be connected later.')}
          >
            Edit Profile
          </button>
        </section>
      </main>
    </div>
  );
}

export default DonorProfile;
