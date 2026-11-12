
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BloodTransfers.css';

function BloodTransfers() {
  const navigate = useNavigate();

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = () => {
    fetch('/api/transfers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTransfers(data.map(t => ({
            id: t.transferId,
            unit: t.componentId,
            group: t.bloodType || 'O+',
            component: t.componentType || 'RBC',
            from: t.fromFacility,
            to: t.toFacility,
            date: t.initiatedAt ? t.initiatedAt.split(' ')[0] : '2026-11-10',
            status: t.status
          })));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching transfers:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const [filter, setFilter] = useState('All');

  const updateStatus = async (id, newStatus) => {
    if (newStatus === 'Completed') {
      try {
        await fetch(`/api/transfers/complete?id=${id}`, { method: 'POST' });
        fetchTransfers();
      } catch (err) {
        console.error('Error completing transfer:', err);
      }
    } else {
      setTransfers(prev =>
        prev.map(t => t.id === id ? { ...t, status: newStatus } : t)
      );
    }
  };

  const filteredTransfers = transfers.filter(
    t => filter === 'All' || t.status === filter
  );

  const pending = transfers.filter(t => t.status === 'Pending').length;
  const inTransit = transfers.filter(t => t.status === 'In Transit').length;
  const completed = transfers.filter(t => t.status === 'Completed').length;

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
          <div className="bb-menu active">Blood Transfers</div>
          <div className="bb-menu" onClick={() => navigate('/blood-bank-reports')}>Reports</div>
          <div className="bb-menu" onClick={() => navigate('/blood-bank-settings')}>Settings</div>
        </nav>
        <div className="bb-menu bb-logout" onClick={() => navigate('/')}>Logout</div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Blood Transfers</h1>
            <p>Track blood units transferred between facilities</p>
          </div>
          <span className="bb-admin">Blood Bank Admin</span>
        </header>

        <section className="bb-stats">
          <div className="bb-stat-box"><h2>{transfers.length}</h2><p>Total Transfers</p></div>
          <div className="bb-stat-box"><h2>{pending}</h2><p>Pending</p></div>
          <div className="bb-stat-box"><h2>{inTransit}</h2><p>In Transit</p></div>
          <div className="bb-stat-box"><h2>{completed}</h2><p>Completed</p></div>
        </section>

        <section className="bb-transfer-section">
          <div className="bb-transfer-heading">
            <h2>Transfer Records</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="All">All Transfers</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="bb-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>Unit ID</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.length ? filteredTransfers.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.unit}</td>
                    <td>{t.group}</td>
                    <td>{t.component}</td>
                    <td>{t.from}</td>
                    <td>{t.to}</td>
                    <td>{t.date}</td>
                    <td>{t.status}</td>
                    <td>
                      {t.status === 'Pending' && (
                        <button className="bb-transfer-button" onClick={() => updateStatus(t.id, 'In Transit')}>
                          Dispatch
                        </button>
                      )}
                      {t.status === 'In Transit' && (
                        <button className="bb-transfer-button" onClick={() => updateStatus(t.id, 'Completed')}>
                          Mark Received
                        </button>
                      )}
                      {t.status === 'Completed' && '—'}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="9">No transfers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BloodTransfers;
