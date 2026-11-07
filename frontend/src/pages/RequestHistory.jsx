
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RequestHistory.css';

function RequestHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  // Sample data for demonstration
  const requests = [
    {
      id: 'R001',
      date: '2026-11-01',
      blood: 'O+',
      component: 'Packed Red Blood Cells',
      units: 2,
      priority: 'Emergency',
      status: 'Pending'
    },
    {
      id: 'R002',
      date: '2026-10-30',
      blood: 'B+',
      component: 'Whole Blood',
      units: 3,
      priority: 'Normal',
      status: 'Approved'
    },
    {
      id: 'R003',
      date: '2026-10-28',
      blood: 'AB-',
      component: 'Platelets',
      units: 1,
      priority: 'Rare Blood Group',
      status: 'Fulfilled'
    },
    {
      id: 'R004',
      date: '2026-10-25',
      blood: 'A+',
      component: 'Plasma',
      units: 2,
      priority: 'Accident Zone',
      status: 'Rejected'
    },
    {
      id: 'R005',
      date: '2026-10-22',
      blood: 'O-',
      component: 'Packed Red Blood Cells',
      units: 1,
      priority: 'Emergency',
      status: 'Pending'
    }
  ];

  const filteredRequests = filter === 'All'
    ? requests
    : requests.filter(request => request.status === filter);

  const getStatusClass = (status) => {
    return status.toLowerCase().replace(' ', '-');
  };

  return (
    <div className="rh-layout">

      <aside className="rh-sidebar">
        <h2>RedThread</h2>
        <p className="rh-label">HOSPITAL PANEL</p>

        <nav>
          <div
            className="rh-menu"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </div>

          <div
            className="rh-menu"
            onClick={() => navigate('/hospital-inventory')}
          >
            Blood Inventory
          </div>

          <div
            className="rh-menu"
            onClick={() => navigate('/requests')}
          >
            Request Blood
          </div>

          <div className="rh-menu active">
            Request History
          </div>

          <div className={`menu-item ${window.location.pathname === '/hospital-settings' ? 'active' : ''}`} onClick={() => navigate('/hospital-settings')}>
          Settings
          </div>
        </nav>

        <div
          className="rh-menu rh-logout"
          onClick={() => navigate('/')}
        >
          Logout
        </div>
      </aside>

      <main className="rh-main">

        <header className="rh-header">
          <div>
            <h1>Request History</h1>
            <p>Track and monitor your hospital's blood requests.</p>
          </div>

          <span className="rh-admin">Hospital Panel</span>
        </header>

        <section className="rh-summary">

          <div className="rh-summary-card">
            <h2>{requests.length}</h2>
            <p>Total Requests</p>
          </div>

          <div className="rh-summary-card">
            <h2>{requests.filter(r => r.status === 'Pending').length}</h2>
            <p>Pending</p>
          </div>

          <div className="rh-summary-card">
            <h2>{requests.filter(r => r.status === 'Approved').length}</h2>
            <p>Approved</p>
          </div>

          <div className="rh-summary-card">
            <h2>{requests.filter(r => r.status === 'Fulfilled').length}</h2>
            <p>Fulfilled</p>
          </div>

        </section>

        <section className="rh-history-section">

          <div className="rh-section-heading">
            <div>
              <h2>All Blood Requests</h2>
              <p>View the status of previously submitted requests.</p>
            </div>

            <button
              onClick={() => navigate('/requests')}
              className="rh-new-request"
            >
              + New Request
            </button>
          </div>

          <div className="rh-filter">
            <label htmlFor="status-filter">Filter by Status:</label>

            <select
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Requests</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Fulfilled">Fulfilled</option>
            </select>
          </div>

          <div className="rh-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Date</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Units</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td><strong>{request.id}</strong></td>
                      <td>{request.date}</td>
                      <td>{request.blood}</td>
                      <td>{request.component}</td>
                      <td>{request.units}</td>
                      <td>{request.priority}</td>
                      <td>
                        <span className={`rh-status ${getStatusClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="rh-empty">
                      No requests found for this status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="rh-record-count">
            Showing {filteredRequests.length} of {requests.length} requests
          </p>

        </section>

      </main>
    </div>
  );
}

export default RequestHistory;
