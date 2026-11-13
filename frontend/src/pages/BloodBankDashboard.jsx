import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../utils/auth';
import './BloodBankDashboard.css';

function BloodBankDashboard() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [bloodStock, setBloodStock] = useState([
    { group: 'A+', units: 0 },
    { group: 'A-', units: 0 },
    { group: 'B+', units: 0 },
    { group: 'B-', units: 0 },
    { group: 'O+', units: 0 },
    { group: 'O-', units: 0 },
    { group: 'AB+', units: 0 },
    { group: 'AB-', units: 0 }
  ]);
  const [requests, setRequests] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAlerts(data);
          setAlertsCount(data.length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/inventory').then(r => r.json()).catch(() => []),
      fetch('/api/requests').then(r => r.json()).catch(() => []),
      fetch('/api/alerts').then(r => r.json()).catch(() => [])
    ]).then(([invData, reqData, alertData]) => {
      if (Array.isArray(invData)) {
        const counts = { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0 };
        invData.forEach(item => {
          if (counts[item.bloodType] !== undefined) {
            counts[item.bloodType] += item.availableUnits || 0;
          }
        });
        setBloodStock(Object.keys(counts).map(g => ({ group: g, units: counts[g] })));
      }

      if (Array.isArray(reqData)) {
        setRequests(reqData.slice(0, 5).map(r => ({
          id: r.requestId,
          hospital: r.facilityId || 'District Facility',
          group: r.bloodType,
          units: r.quantity
        })));
      }

      if (Array.isArray(alertData)) {
        setAlerts(alertData);
        setAlertsCount(alertData.length);
      }

      setLoading(false);
    }).catch(err => {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    });
  }, []);

  const dismissAlert = (alertId) => {
    fetch(`/api/alerts?id=${alertId}`, { method: 'PUT' })
      .then(r => r.json())
      .then(() => {
        setAlerts(prev => prev.filter(a => a.alertId !== String(alertId)));
        setAlertsCount(prev => Math.max(0, prev - 1));
      })
      .catch(err => console.error('Error dismissing alert:', err));
  };

  const totalUnits = bloodStock.reduce((acc, curr) => acc + curr.units, 0);
  const pendingRequests = requests.length;

  const stats = [
    { title: 'Total Blood Units', value: loading ? '...' : String(totalUnits) },
    { title: "Today's Donations", value: 'Active' },
    { title: 'Pending Requests', value: loading ? '...' : String(pendingRequests) },
    { title: 'System Alerts', value: loading ? '...' : String(alertsCount) }
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

        <div
          className="bb-menu bb-logout"
          onClick={() => {
            clearUser();
            navigate('/');
          }}
        >
          Logout
        </div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Blood Bank Dashboard</h1>
            <p>Welcome back, {currentUser?.username || 'Blood Bank Admin'}</p>
          </div>
          <span className="bb-admin">{currentUser?.role || 'Blood Bank Admin'}</span>
        </header>

        <section className="bb-stats">
          {stats.map((stat) => (
            <div className="bb-stat-box" key={stat.title}>
              <h2>{stat.value}</h2>
              <p>{stat.title}</p>
            </div>
          ))}
        </section>

        {alerts.length > 0 && (
          <section className="bb-stock-section" style={{ marginTop: '24px' }}>
            <div className="bb-section-heading">
              <h2>Active System Alerts ({alerts.length})</h2>
              <button onClick={() => {
                fetch('/api/alerts?id=all', { method: 'PUT' })
                  .then(() => { setAlerts([]); setAlertsCount(0); });
              }}>Dismiss All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map(a => (
                <div key={a.alertId} style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: '#b91c1c' }}>[{a.alertType}]</strong>{' '}
                    <span style={{ color: '#374151' }}>{a.message}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '12px' }}>{a.createdAt}</span>
                  </div>
                  <button
                    onClick={() => dismissAlert(a.alertId)}
                    style={{
                      background: 'none',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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