
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HospitalRequests.css';

function HospitalRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([
    { id: 'R001', hospital: 'City Hospital', group: 'O+', component: 'Packed RBC', units: 2, priority: 'Emergency', status: 'Pending' },
    { id: 'R002', hospital: 'Care Hospital', group: 'B+', component: 'Platelets', units: 3, priority: 'Normal', status: 'Pending' },
    { id: 'R003', hospital: 'Civil Hospital', group: 'AB-', component: 'Plasma', units: 1, priority: 'Rare Group', status: 'Approved' },
    { id: 'R004', hospital: 'Metro Hospital', group: 'O-', component: 'Whole Blood', units: 2, priority: 'Accident Zone', status: 'Pending' },
    { id: 'R005', hospital: 'City Hospital', group: 'A+', component: 'Packed RBC', units: 1, priority: 'Normal', status: 'Fulfilled' }
  ]);

  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');

  const updateStatus = (id, newStatus) => {
    setRequests(prev =>
      prev.map(request =>
        request.id === id
          ? { ...request, status: newStatus }
          : request
      )
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.id.toLowerCase().includes(search.toLowerCase()) ||
      request.hospital.toLowerCase().includes(search.toLowerCase());

    const matchesPriority =
      priority === 'All' || request.priority === priority;

    const matchesStatus =
      status === 'All' || request.status === status;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const pending = requests.filter(r => r.status === 'Pending').length;
  const approved = requests.filter(r => r.status === 'Approved').length;
  const emergency = requests.filter(r => r.priority === 'Emergency' && r.status === 'Pending').length;

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
          <div className="bb-menu active">Hospital Requests</div>
          <div className="bb-menu">Blood Transfers</div>
          <div className="bb-menu">Reports</div>
          <div className="bb-menu">Settings</div>
        </nav>

        <div className="bb-menu bb-logout" onClick={() => navigate('/')}>Logout</div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Hospital Requests</h1>
            <p>Review and manage incoming blood requests</p>
          </div>
          <span className="bb-admin">Blood Bank Admin</span>
        </header>

        <section className="bb-stats">
          <div className="bb-stat-box">
            <h2>{requests.length}</h2>
            <p>Total Requests</p>
          </div>
          <div className="bb-stat-box">
            <h2>{pending}</h2>
            <p>Pending Requests</p>
          </div>
          <div className="bb-stat-box">
            <h2>{approved}</h2>
            <p>Approved Requests</p>
          </div>
          <div className="bb-stat-box">
            <h2>{emergency}</h2>
            <p>Pending Emergency Requests</p>
          </div>
        </section>

        <section className="bb-requests-page">
          <h2>All Hospital Requests</h2>

          <div className="bb-request-filters">
            <input
              type="text"
              placeholder="Search Request ID or Hospital"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              {['Emergency', 'Accident Zone', 'Rare Group', 'Normal'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              {['Pending', 'Approved', 'Rejected', 'Fulfilled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="bb-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Units</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map(request => (
                    <tr key={request.id}>
                      <td>{request.id}</td>
                      <td>{request.hospital}</td>
                      <td>{request.group}</td>
                      <td>{request.component}</td>
                      <td>{request.units}</td>
                      <td>{request.priority}</td>
                      <td>{request.status}</td>
                      <td>
                        {request.status === 'Pending' ? (
                          <div className="bb-request-actions">
                            <button onClick={() => updateStatus(request.id, 'Approved')}>
                              Approve
                            </button>
                            <button onClick={() => updateStatus(request.id, 'Rejected')}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No matching requests found.</td>
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

export default HospitalRequests;
