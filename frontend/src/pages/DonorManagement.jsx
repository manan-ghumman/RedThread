
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonorManagement.css';

function DonorManagement() {
  const navigate = useNavigate();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/donors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDonors(data.map(d => ({
            id: d.id,
            name: d.name || 'Anonymous Donor',
            group: d.bloodType,
            phone: 'Active Record',
            lastDonation: 'Recorded',
            status: d.eligibility || 'Eligible',
            karmaPoints: d.karmaPoints || 0
          })));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching donors:', err);
        setLoading(false);
      });
  }, []);

  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('All');
  const [eligibility, setEligibility] = useState('All');

  const filteredDonors = donors.filter(donor => {
    const matchesSearch =
      donor.id.toLowerCase().includes(search.toLowerCase()) ||
      donor.name.toLowerCase().includes(search.toLowerCase());

    const matchesGroup =
      bloodGroup === 'All' || donor.group === bloodGroup;

    const matchesEligibility =
      eligibility === 'All' || donor.status === eligibility;

    return matchesSearch && matchesGroup && matchesEligibility;
  });

  const eligibleCount = donors.filter(d => d.status === 'Eligible').length;
  const deferredCount = donors.filter(d => d.status === 'Deferred').length;

  return (
    <div className="bb-layout">
      <aside className="bb-sidebar">
        <h2>RedThread</h2>
        <p className="bb-label">BLOOD BANK PANEL</p>

        <nav>
          <div className="bb-menu" onClick={() => navigate('/blood-bank')}>Dashboard</div>
          <div className="bb-menu" onClick={() => navigate('/blood-bank-inventory')}>Blood Inventory</div>
          <div className="bb-menu active">Donor Management</div>
          <div className="bb-menu" onClick={() => navigate('/record-donation')}>Blood Donations</div>
          <div className="bb-menu" onClick={() => navigate('/hospital-requests')}>Hospital Requests</div>
          <div className="bb-menu">Blood Transfers</div>
          <div className="bb-menu">Reports</div>
          <div className="bb-menu">Settings</div>
        </nav>

        <div className="bb-menu bb-logout" onClick={() => navigate('/')}>Logout</div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Donor Management</h1>
            <p>View and manage registered blood donors</p>
          </div>
          <span className="bb-admin">Blood Bank Admin</span>
        </header>

        <section className="bb-stats">
          <div className="bb-stat-box">
            <h2>{donors.length}</h2>
            <p>Total Registered Donors</p>
          </div>
          <div className="bb-stat-box">
            <h2>{eligibleCount}</h2>
            <p>Eligible Donors</p>
          </div>
          <div className="bb-stat-box">
            <h2>{deferredCount}</h2>
            <p>Temporarily Deferred</p>
          </div>
          <div className="bb-stat-box">
            <h2>12</h2>
            <p>Donations This Month</p>
          </div>
        </section>

        <section className="bb-donor-section">
          <h2>Registered Donors</h2>

          <div className="bb-donor-filters">
            <input
              type="text"
              placeholder="Search by Donor ID or Name"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
              <option value="All">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>

            <select value={eligibility} onChange={e => setEligibility(e.target.value)}>
              <option value="All">All Eligibility Statuses</option>
              <option value="Eligible">Eligible</option>
              <option value="Deferred">Deferred</option>
            </select>
          </div>

          <div className="bb-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Donor ID</th>
                  <th>Name</th>
                  <th>Blood Group</th>
                  <th>Phone</th>
                  <th>Last Donation</th>
                  <th>Eligibility</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredDonors.length > 0 ? (
                  filteredDonors.map(donor => (
                    <tr key={donor.id}>
                      <td>{donor.id}</td>
                      <td>{donor.name}</td>
                      <td>{donor.group}</td>
                      <td>{donor.phone}</td>
                      <td>{donor.lastDonation}</td>
                      <td>{donor.status}</td>
                      <td>
                        <button
                          className="bb-view-button"
                          onClick={() => alert(`Donor: ${donor.name}\nID: ${donor.id}\nBlood Group: ${donor.group}\nEligibility: ${donor.status}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No donors found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DonorManagement;
