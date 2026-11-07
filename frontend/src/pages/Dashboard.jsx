
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: 'Available Units', value: '120' },
    { title: 'Pending Requests', value: '08' },
    { title: 'Approved Requests', value: '15' },
    { title: 'Urgent Requests', value: '03' }
  ];

  const requests = [
    { id: 'R001', blood: 'O+', units: 2, status: 'Pending' },
    { id: 'R002', blood: 'B+', units: 3, status: 'Approved' },
    { id: 'R003', blood: 'AB-', units: 1, status: 'Urgent' }
  ];

  return (
    <div className="dashboard-layout">

      <aside className="sidebar">
        <h2>RedThread</h2>
        <p className="sidebar-label">HOSPITAL PANEL</p>
        <nav>
        <div className={`menu-item ${window.location.pathname === '/dashboard' ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}>Dashboard</div>
        <div className={`menu-item ${window.location.pathname === '/hospital-inventory' ? 'active' : ''}`} onClick={() => navigate('/hospital-inventory')}>
        Blood Inventory</div>

        <div className={`menu-item ${window.location.pathname === '/requests' ? 'active' : ''}`} onClick={() => navigate('/requests')}>Request Blood</div>
        <div className={`menu-item ${window.location.pathname === '/request-history' ? 'active' : ''}`} onClick={() => navigate('/request-history')}>
         Request History
         </div>
        <div className={`menu-item ${window.location.pathname === '/hospital-settings' ? 'active' : ''}`} onClick={() => navigate('/hospital-settings')}>
        Settings
        </div>
        </nav>

        <div
          className="menu-item logout"
          onClick={() => navigate('/')}
        >
          Logout
        </div>
      </aside>

      <main className="dashboard-main">

        <header className="dashboard-header">
          <div>
            <h1>Hospital Dashboard</h1>
            <p>Welcome back, Hospital Admin</p>
          </div>
          <div className="admin-label">Hospital Admin</div>
        </header>

        <section className="stats-grid">
          {stats.map((stat, index) => (
            <div className="stat-box" key={index}>
              <h2>{stat.value}</h2>
              <p>{stat.title}</p>
            </div>
          ))}
        </section>

        <section className="quick-section">
          <h2>Quick Actions</h2>

          <button
            className="request-button"
            onClick={() => navigate('/requests')}
          >
            + Request Blood
          </button>
        </section>

        <section className="recent-section">
          <h2>Recent Blood Requests</h2>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.blood}</td>
                    <td>{request.units}</td>
                    <td>
                      <span className={`status ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
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

export default Dashboard;
