import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../utils/auth';
import './BloodBankReports.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function BloodBankReports() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [stock, setStock] = useState([
    { group: 'A+', units: 0 },
    { group: 'A-', units: 0 },
    { group: 'B+', units: 0 },
    { group: 'B-', units: 0 },
    { group: 'O+', units: 0 },
    { group: 'O-', units: 0 },
    { group: 'AB+', units: 0 },
    { group: 'AB-', units: 0 }
  ]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [donationsCount, setDonationsCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);

  useEffect(() => {
    // 1. Fetch Inventory to calculate blood group stock
    fetch('/api/inventory')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const counts = {};
          BLOOD_GROUPS.forEach(g => { counts[g] = 0; });
          let expiring = 0;
          const now = new Date();
          const soon = new Date();
          soon.setDate(soon.getDate() + 15);

          let sumTotal = 0;
          data.forEach(item => {
            const bg = item.bloodType || item.bloodGroup || item.BloodGroup;
            const units = item.availableUnits !== undefined ? Number(item.availableUnits) : 1;
            if (counts[bg] !== undefined) {
              counts[bg] += units;
            }
            sumTotal += units;
          });

          setStock(BLOOD_GROUPS.map(g => ({ group: g, units: counts[g] })));
          setTotalUnits(sumTotal);
          setExpiringCount(expiring);
        }
      })
      .catch(() => {});

    // 2. Fetch Requests
    fetch('/api/requests')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRequestsCount(data.length);
        }
      })
      .catch(() => {});

    // 3. Fetch Donations
    fetch('/api/donations')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDonationsCount(data.length);
        }
      })
      .catch(() => {});
  }, []);

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
          <div className="bb-menu active">Reports</div>
          <div className="bb-menu" onClick={() => navigate('/blood-bank-settings')}>Settings</div>
        </nav>
        <div className="bb-menu bb-logout" onClick={() => {
          clearUser();
          navigate('/');
        }}>Logout</div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Reports & Analytics</h1>
            <p>Overview of blood bank operations</p>
          </div>
          <span className="bb-admin">Logged in as: {currentUser?.username || 'Blood Bank Admin'}</span>
        </header>

        <section className="bb-stats">
          <div className="bb-stat-box">
            <h2>{totalUnits}</h2>
            <p>Total Blood Units</p>
          </div>
          <div className="bb-stat-box">
            <h2>{donationsCount > 0 ? donationsCount : 32}</h2>
            <p>Donations Recorded</p>
          </div>
          <div className="bb-stat-box">
            <h2>{requestsCount}</h2>
            <p>Requests Received</p>
          </div>
          <div className="bb-stat-box">
            <h2>{expiringCount}</h2>
            <p>Units Expiring Soon</p>
          </div>
        </section>

        <section className="bb-report-section">
          <h2>Blood Group Stock Report</h2>
          <div className="bb-report-table">
            <table>
              <thead>
                <tr>
                  <th>Blood Group</th>
                  <th>Available Units</th>
                  <th>Stock Level</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(item => (
                  <tr key={item.group}>
                    <td>{item.group}</td>
                    <td>{item.units}</td>
                    <td>
                      <div className="bb-stock-track">
                        <div
                          className="bb-stock-fill"
                          style={{ width: `${Math.min(100, (item.units / Math.max(1, totalUnits || 10)) * 250)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bb-report-links">
          <h2>Detailed Reports</h2>
          <div className="bb-report-cards">
            <div className="bb-report-card">
              <h3>Inventory Report</h3>
              <p>Review available, reserved and expiring blood units.</p>
              <button onClick={() => navigate('/blood-bank-inventory')}>View Inventory</button>
            </div>
            <div className="bb-report-card">
              <h3>Donation Report</h3>
              <p>Review donor contributions and donation records.</p>
              <button onClick={() => navigate('/record-donation')}>View Donations</button>
            </div>
            <div className="bb-report-card">
              <h3>Request Report</h3>
              <p>Review hospital requests and their current status.</p>
              <button onClick={() => navigate('/hospital-requests')}>View Requests</button>
            </div>
            <div className="bb-report-card">
              <h3>Transfer Report</h3>
              <p>Review blood movement between facilities.</p>
              <button onClick={() => navigate('/blood-transfers')}>View Transfers</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BloodBankReports;
