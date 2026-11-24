import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../utils/auth';
import './DonorProfile.css';

function DonorProfile() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [donor, setDonor] = useState({
    id: currentUser?.entityId || 'RT0001',
    name: currentUser?.username || 'Ananya Pant',
    email: currentUser?.email || 'ananya.pant@redthread.org',
    phone: '9876543210',
    bloodGroup: 'O+',
    age: '24',
    gender: 'Female',
    address: 'Dehradun, Uttarakhand'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...donor });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/donors')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const match = data.find(d => 
            (currentUser?.entityId && d.id === currentUser.entityId) ||
            (currentUser?.entityId && d.donorId === currentUser.entityId) ||
            (currentUser?.username && d.name?.toLowerCase().includes(currentUser.username.toLowerCase()))
          ) || data[0];

          if (match) {
            const loaded = {
              id: match.donorId || match.id || currentUser?.entityId || 'RT0001',
              name: match.name || currentUser?.username || 'Donor',
              email: match.email || currentUser?.email || 'donor@redthread.org',
              phone: match.phone || '9876543210',
              bloodGroup: match.bloodGroup || match.bloodType || 'O+',
              age: '24',
              gender: 'Female',
              address: match.address || 'Dehradun, Uttarakhand'
            };
            setDonor(loaded);
            setFormData(loaded);
          }
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const handleEditClick = () => {
    setFormData({ ...donor });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ ...donor });
    setIsEditing(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);

    fetch('/api/donors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: donor.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setDonor({ ...formData });
          setIsEditing(false);
          alert('Profile updated successfully in database!');
        } else {
          alert('Failed to update profile: ' + (res.error || 'Unknown error'));
        }
      })
      .catch(err => alert('Network error: ' + err.message))
      .finally(() => setSaving(false));
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
        <div className="dp-menu dp-logout" onClick={() => {
          clearUser();
          navigate('/');
        }}>Logout</div>
      </aside>

      <main className="dp-main">
        <div className="dp-header">
          <h1>My Profile</h1>
          <span>Donor ID: {donor.id}</span>
        </div>

        <section className="profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Personal Information</h2>
            {!isEditing && (
              <button
                className="profile-edit-button"
                style={{ marginTop: 0 }}
                onClick={handleEditClick}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {!isEditing ? (
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

              <div className="profile-field" style={{ gridColumn: 'span 2' }}>
                <label>Address</label>
                <p>{donor.address}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="profile-grid">
                <div className="profile-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>

                <div className="profile-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>

                <div className="profile-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    pattern="[0-9]{10}"
                    title="10 digit phone number"
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>

                <div className="profile-field">
                  <label>Blood Group</label>
                  <input
                    type="text"
                    value={formData.bloodGroup}
                    disabled
                    title="Blood group cannot be altered directly"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e5e5', background: '#f5f5f5', borderRadius: '4px' }}
                  />
                </div>

                <div className="profile-field">
                  <label>Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>

                <div className="profile-field">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="profile-field" style={{ gridColumn: 'span 2' }}>
                  <label>Address</label>
                  <textarea
                    rows="3"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '25px', display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#a91f32',
                    color: 'white',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '4px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '10px 18px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default DonorProfile;
