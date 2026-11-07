
import { useNavigate } from 'react-router-dom';
import './BloodBankReports.css';

function BloodBankReports() {
  const navigate = useNavigate();

  const stock = [
    { group: 'A+', units: 85 },
    { group: 'A-', units: 25 },
    { group: 'B+', units: 70 },
    { group: 'B-', units: 30 },
    { group: 'O+', units: 110 },
    { group: 'O-', units: 20 },
    { group: 'AB+', units: 45 },
    { group: 'AB-', units: 12 }
  ];

  const totalUnits = stock.reduce((sum, item) => sum + item.units, 0);

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
        <div className="bb-menu bb-logout" onClick={() => navigate('/')}>Logout</div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Reports & Analytics</h1>
            <p>Overview of blood bank operations</p>
          </div>
          <span className="bb-admin">Blood Bank Admin</span>
        </header>

        <section className="bb-stats">
          <div className="bb-stat-box">
            <h2>{totalUnits}</h2>
            <p>Total Blood Units</p>
          </div>
          <div className="bb-stat-box">
            <h2>32</h2>
            <p>Donations This Month</p>
          </div>
          <div className="bb-stat-box">
            <h2>18</h2>
            <p>Requests Received</p>
          </div>
          <div className="bb-stat-box">
            <h2>5</h2>
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
                          style={{ width: `${(item.units / 120) * 100}%` }}
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
