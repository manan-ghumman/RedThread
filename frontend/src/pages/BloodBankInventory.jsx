import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BloodBankInventory.css';

function BloodBankInventory() {
  const navigate = useNavigate();

  const inventory = [
    { id: 'BC001', group: 'A+', component: 'Packed RBC', expiry: '2026-11-12', facility: 'Central Bank', status: 'Available' },
    { id: 'BC002', group: 'O+', component: 'Platelets', expiry: '2026-11-08', facility: 'Central Bank', status: 'Available' },
    { id: 'BC003', group: 'B+', component: 'Plasma', expiry: '2026-11-20', facility: 'City Branch', status: 'Reserved' },
    { id: 'BC004', group: 'AB-', component: 'Packed RBC', expiry: '2026-11-25', facility: 'City Branch', status: 'Available' },
    { id: 'BC005', group: 'O-', component: 'Whole Blood', expiry: '2026-11-06', facility: 'Central Bank', status: 'In Transit' },
    { id: 'BC006', group: 'A-', component: 'Platelets', expiry: '2026-11-09', facility: 'City Branch', status: 'Available' }
  ];

  const [group, setGroup] = useState('All');
  const [component, setComponent] = useState('All');
  const [status, setStatus] = useState('All');

  const filteredInventory = inventory
    .filter(item => group === 'All' || item.group === group)
    .filter(item => component === 'All' || item.component === component)
    .filter(item => status === 'All' || item.status === status)
    .sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

  const available = inventory.filter(item => item.status === 'Available').length;
  const reserved = inventory.filter(item => item.status === 'Reserved').length;
  const expiring = inventory.filter(item =>
    item.status === 'Available' &&
    new Date(item.expiry) <= new Date('2026-11-13')
  ).length;

  return (
    <div className="bb-layout">
      <aside className="bb-sidebar">
        <h2>RedThread</h2>
        <p className="bb-label">BLOOD BANK PANEL</p>

        <nav>
          <div className="bb-menu" onClick={() => navigate('/blood-bank')}>Dashboard</div>
          <div className="bb-menu active" onClick={() => navigate('/blood-bank-inventory')}>Blood Inventory</div>
          <div className="bb-menu" onClick={() => navigate('/donor-management')}>Donor Management</div>
          <div className="bb-menu" onClick={() => navigate('/record-donation')}>Blood Donations</div>
          <div className="bb-menu" onClick={() => navigate('/hospital-requests')}>Hospital Requests</div>
          <div className="bb-menu">Blood Transfers</div>
          <div className="bb-menu">Reports</div>
          <div className="bb-menu">Settings</div>
        </nav>

        <div className="bb-menu bb-logout" onClick={() => navigate('/')}>Logout</div>
      </aside>

      <main className="bb-main">
        <header className="bb-header">
          <div>
            <h1>Blood Inventory</h1>
            <p>Manage and monitor blood stock across facilities</p>
          </div>
          <span className="bb-admin">Blood Bank Admin</span>
        </header>

        <section className="bb-stats">
          <div className="bb-stat-box">
            <h2>{inventory.length}</h2>
            <p>Total Units</p>
          </div>
          <div className="bb-stat-box">
            <h2>{available}</h2>
            <p>Available Units</p>
          </div>
          <div className="bb-stat-box">
            <h2>{reserved}</h2>
            <p>Reserved Units</p>
          </div>
          <div className="bb-stat-box">
            <h2>{expiring}</h2>
            <p>Expiring Soon</p>
          </div>
        </section>

        <section className="bb-inventory-section">
          <h2>Inventory Details</h2>

          <div className="bb-filters">
            <select value={group} onChange={e => setGroup(e.target.value)}>
              <option value="All">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g =>
                <option key={g} value={g}>{g}</option>
              )}
            </select>

            <select value={component} onChange={e => setComponent(e.target.value)}>
              <option value="All">All Components</option>
              {['Whole Blood', 'Packed RBC', 'Platelets', 'Plasma'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>

            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              {['Available', 'Reserved', 'In Transit'].map(s =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
          </div>

          <div className="bb-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Expiry Date</th>
                  <th>Facility</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.group}</td>
                      <td>{item.component}</td>
                      <td>{item.expiry}</td>
                      <td>{item.facility}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No matching inventory found.</td>
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

export default BloodBankInventory;