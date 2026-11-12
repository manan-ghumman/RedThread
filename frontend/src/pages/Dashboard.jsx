
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../utils/auth';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [availableUnits, setAvailableUnits] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/inventory').then(r => r.json()).catch(() => []),
      fetch('/api/requests').then(r => r.json()).catch(() => [])
    ]).then(([invData, reqData]) => {
      if (Array.isArray(invData)) {
        const total = invData.reduce((sum, item) => sum + (item.availableUnits || 0), 0);
        setAvailableUnits(total);
      }
      if (Array.isArray(reqData)) {
        setRequests(reqData.slice(0, 5).map(r => ({
          id: r.requestId,
          blood: r.bloodType,
          units: r.quantity,
          status: r.status
        })));
      }
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    });
  }, []);

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Allocated' || r.status === 'Approved').length;
  const urgentCount = requests.filter(r => r.status === 'Pending').length;

  const stats = [
    { title: 'Available Units', value: loading ? '...' : String(availableUnits) },
    { title: 'Pending Requests', value: loading ? '...' : String(pendingCount) },
    { title: 'Approved Requests', value: loading ? '...' : String(approvedCount) },
    { title: 'Urgent Requests', value: loading ? '...' : String(urgentCount) }
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
          onClick={() => {
            clearUser();
            navigate('/');
          }}
        >
          Logout
        </div>
      </aside>

      <main className="dashboard-main">

        <header className="dashboard-header">
          <div>
            <h1>Hospital Dashboard</h1>
            <p>Welcome back, {currentUser?.username || 'Hospital Admin'}</p>
          </div>
          <div className="admin-label">{currentUser?.role || 'Hospital Admin'}</div>
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
