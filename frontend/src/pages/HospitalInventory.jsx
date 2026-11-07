
import { useNavigate } from 'react-router-dom';
import './HospitalInventory.css';

function HospitalInventory() {
  const navigate = useNavigate();

  const bloodStock = [
    { group: 'A+', units: 85, status: 'Available' },
    { group: 'A-', units: 25, status: 'Available' },
    { group: 'B+', units: 70, status: 'Available' },
    { group: 'B-', units: 8, status: 'Low Stock' },
    { group: 'O+', units: 110, status: 'Available' },
    { group: 'O-', units: 5, status: 'Low Stock' },
    { group: 'AB+', units: 45, status: 'Available' },
    { group: 'AB-', units: 12, status: 'Low Stock' }
  ];

  return (
    <div className="dashboard-layout">

      <aside className="sidebar">
        <h2>RedThread</h2>
        <p className="sidebar-label">HOSPITAL PANEL</p>
        <nav>
    <div
    className="hi-menu"
    onClick={() => navigate('/dashboard')}>Dashboard</div>
    <div className="hi-menu active">Blood Inventory</div>
    <div className="hi-menu" onClick={() => navigate('/requests')}>Request Blood</div>

    <div className="hi-menu" onClick={() => navigate('/request-history')}>Request History</div>
    <div className={`menu-item ${window.location.pathname === '/hospital-settings' ? 'active' : ''}`} onClick={() => navigate('/hospital-settings')}>
    Settings
    </div>
    </nav>

        <div className="hi-menu hi-logout"
          onClick={() => navigate('/')}>
          Logout
        </div>
      </aside>

      <main className="hi-main">

        <header className="hi-header">
          <div>
            <h1>Blood Inventory</h1>
            <p>Check available blood stock across the blood bank.</p>
          </div>

          <span className="hi-admin">Hospital Panel</span>
        </header>

        <section className="hi-summary">
          <div className="hi-summary-card">
            <h2>360</h2>
            <p>Total Available Units</p>
          </div>

          <div className="hi-summary-card">
            <h2>8</h2>
            <p>Blood Groups</p>
          </div>

          <div className="hi-summary-card">
            <h2>3</h2>
            <p>Low Stock Groups</p>
          </div>
        </section>

        <section className="hi-inventory-section">
          <h2>Available Blood Stock</h2>
          <p className="hi-description">
            Current sample inventory of the blood bank.
          </p>

          <div className="hi-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Blood Group</th>
                  <th>Available Units</th>
                  <th>Availability Status</th>
                </tr>
              </thead>

              <tbody>
                {bloodStock.map((blood) => (
                  <tr key={blood.group}>
                    <td><strong>{blood.group}</strong></td>
                    <td>{blood.units}</td>
                    <td>
                      <span className={
                        blood.status === 'Available'
                          ? 'hi-status available'
                          : 'hi-status low'
                      }>
                        {blood.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <button
          className="hi-back-button"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>

      </main>
    </div>
  );
}

export default HospitalInventory;
