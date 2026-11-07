import { useNavigate } from 'react-router-dom';
import './BloodBankDashboard.css';

function BloodBankDashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: 'Total Blood Units', value: '450' },
    { title: "Today's Donations", value: '32' },
    { title: 'Pending Requests', value: '18' },
    { title: 'Low Stock Alerts', value: '12' }
  ];

  const bloodStock = [
    { group: 'A+', units: 85 },
    { group: 'A-', units: 25 },
    { group: 'B+', units: 70 },
    { group: 'B-', units: 30 },
    { group: 'O+', units: 110 },
    { group: 'O-', units: 20 },
    { group: 'AB+', units: 45 },
    { group: 'AB-', units: 12 }
  ];

  const requests = [
    { id: 'R001', hospital: 'City Hospital', group: 'O+', units: 2 },
    { id: 'R002', hospital: 'Care Hospital', group: 'B+', units: 3 },
    { id: 'R003', hospital: 'Civil Hospital', group: 'AB-', units: 1 }
  ];

  return (
    <div className="bb-layout">
      <aside className="bb-sidebar">
        <h2>RedThread</h2>
        <p className="bb-label">BLOOD BANK PANEL</p>

        <nav>
          <div
            className="bb-menu active"
            onClick={() => navigate('/blood-bank')}
          >
            Dashboard
          </div>

          <div
            className="bb-menu"
            onClick={() => navigate('/blood-bank-inventory')}
          >
            Blood Inventory
          </div>

          <div className="bb-menu" onClick={() => navigate('/donor-management')}>Donor Management</div>

          <div
            className="bb-menu"
            onClick={() => navigate('/record-donation')}
          >
            Blood Donations
          </div>

          <div className="bb-menu" onClick={() => navigate('/hospital-requests')}>
            Hospital Requests
          </div>

          <div className="bb-menu" onClick={() => navigate('/blood-transfers')}>
           Blood Transfers
          </div>
          <div className="bb-menu" onClick={() => navigate('/blood-bank-reports')}>
            Reports
          </div>
          <div className="bb-menu" onClick={() => navigate('/blood-bank-settings')}>
            Settings
          </div>
        </nav>

        <div className="bb-menu bb-logout" onClick={() => navigate('/')}>
          Logout
        </div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Blood Bank Dashboard</h1>
            <p>Welcome back, Blood Bank Admin</p>
          </div>
          <span className="bb-admin">Blood Bank Admin</span>
        </header>

        <section className="bb-stats">
          {stats.map((stat) => (
            <div className="bb-stat-box" key={stat.title}>
              <h2>{stat.value}</h2>
              <p>{stat.title}</p>
            </div>
          ))}
        </section>

        <section className="bb-stock-section">
          <div className="bb-section-heading">
            <h2>Blood Stock Overview</h2>
            <button onClick={() => navigate('/blood-bank-inventory')}>
              View All
            </button>
          </div>

          <div className="bb-stock-grid">
            {bloodStock.map((blood) => (
              <div className="bb-stock-box" key={blood.group}>
                <h3>{blood.group}</h3>
                <p>{blood.units} Units</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bb-requests-section">
          <div className="bb-section-heading">
            <h2>Recent Hospital Requests</h2>
            <button onClick={() => navigate('/hospital-requests')}>
              View All
            </button>
          </div>

          <div className="bb-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.hospital}</td>
                    <td>{request.group}</td>
                    <td>{request.units}</td>
                    <td>
                      <button
                        className="bb-view-button"
                        onClick={() => navigate('/hospital-requests')}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BloodBankDashboard;