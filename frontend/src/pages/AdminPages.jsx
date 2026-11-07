
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPages.css';

function AdminLayout({ title, active, children }) {
  const navigate = useNavigate();

  const menu = [
    ['Dashboard', '/admin-dashboard'],
    ['Blood Bank Management', '/admin-blood-banks'],
    ['Hospital Management', '/admin-hospitals'],
    ['Donor Management', '/admin-donors'],
    ['Blood Inventory Overview', '/admin-inventory'],
    ['Request Monitoring', '/admin-requests'],
    ['Reports & Analytics', '/admin-reports'],
    ['Settings', '/admin-settings']
  ];

  return (
    <div className="ad-layout">
      <aside className="ad-sidebar">
        <h2>RedThread</h2>
        <p className="ad-label">ADMIN PANEL</p>

        {menu.map(([name, path]) => (
          <div
            key={path}
            className={`ad-menu ${active === name ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            {name}
          </div>
        ))}

        <div className="ad-menu ad-logout" onClick={() => navigate('/')}>
          Logout
        </div>
      </aside>

      <main className="ad-main">
        <div className="ad-header">
          <h1>{title}</h1>
          <span>Welcome, Admin</span>
        </div>
        {children}
      </main>
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="ad-table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map(column => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, i) => <td key={i}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManagementPage({ title, active, columns, initialRows }) {
  const [rows, setRows] = useState(initialRows);

  const toggleStatus = (index) => {
    setRows(previous => previous.map((row, i) => {
      if (i !== index) return row;
      const updated = [...row];
      updated[updated.length - 1] =
        updated[updated.length - 1] === 'Active' ? 'Inactive' : 'Active';
      return updated;
    }));
  };

  return (
    <AdminLayout title={title} active={active}>
      <section className="ad-section">
        <h2>{title}</h2>
        <DataTable
          columns={columns}
          rows={rows.map((row, index) => [
            ...row,
            <button
              className="ad-action-button"
              onClick={() => toggleStatus(index)}
            >
              Change Status
            </button>
          ])}
        />
      </section>
    </AdminLayout>
  );
}

// 1. ADMIN DASHBOARD

export function AdminDashboard() {
  const stats = [
    ['Total Blood Banks', '12'],
    ['Registered Hospitals', '35'],
    ['Registered Donors', '2,XXX'],
    ['Pending Requests', '18']
  ];

  const requests = [
    ['R001', 'City Hospital', 'O+', 'Emergency', 'Pending'],
    ['R002', 'Metro Hospital', 'AB+', 'Normal', 'Approved'],
    ['R003', 'Central Hospital', 'B-', 'Accident Zone', 'Pending'],
    ['R004', 'Care Hospital', 'A+', 'Normal', 'Completed']
  ];

  return (
    <AdminLayout title="Admin Dashboard" active="Dashboard">
      <div className="ad-stats">
        {stats.map(([label, value]) => (
          <div className="ad-stat-box" key={label}>
            <h3>{label}</h3>
            <h2>{value}</h2>
          </div>
        ))}
      </div>

      <section className="ad-section">
        <h2>Recent Blood Requests</h2>
        <DataTable
          columns={['Request ID', 'Hospital', 'Blood Group', 'Priority', 'Status']}
          rows={requests}
        />
      </section>

      <section className="ad-section">
        <h2>System Overview</h2>
        <div className="ad-overview">
          <p>Blood Bank Network: <strong>Active</strong></p>
          <p>Hospital Network: <strong>Active</strong></p>
          <p>Request Monitoring: <strong>Enabled</strong></p>
          <p>Expiry Monitoring: <strong>Enabled</strong></p>
        </div>
      </section>
    </AdminLayout>
  );
}

// 2. BLOOD BANK MANAGEMENT

export function AdminBloodBanks() {
  return (
    <ManagementPage
      title="Blood Bank Management"
      active="Blood Bank Management"
      columns={['Bank ID', 'Blood Bank Name', 'Location', 'Contact', 'Status', 'Action']}
      initialRows={[
        ['BB001', 'RedThread Central Bank', 'Dehradun', '9876500001', 'Active'],
        ['BB002', 'City Blood Centre', 'Dehradun', '9876500002', 'Active'],
        ['BB003', 'Regional Blood Bank', 'Haridwar', '9876500003', 'Inactive']
      ]}
    />
  );
}

// 3. HOSPITAL MANAGEMENT

export function AdminHospitals() {
  return (
    <ManagementPage
      title="Hospital Management"
      active="Hospital Management"
      columns={['Hospital ID', 'Hospital Name', 'Location', 'Contact', 'Status', 'Action']}
      initialRows={[
        ['H001', 'City Hospital', 'Dehradun', '9876510001', 'Active'],
        ['H002', 'Metro Hospital', 'Haridwar', '9876510002', 'Active'],
        ['H003', 'Care Hospital', 'Rishikesh', '9876510003', 'Inactive']
      ]}
    />
  );
}

// 4. DONOR MANAGEMENT

export function AdminDonors() {
  return (
    <ManagementPage
      title="Donor Management"
      active="Donor Management"
      columns={['Donor ID', 'Donor Name', 'Blood Group', 'Karma Points', 'Status', 'Action']}
      initialRows={[
        ['D001', 'Mansi', 'O+', '250', 'Active'],
        ['D002', 'Rahul', 'B+', '180', 'Active'],
        ['D003', 'Priya', 'AB+', '320', 'Inactive'],
        ['D004', 'Aman', 'O-', '100', 'Active']
      ]}
    />
  );
}

// 5. BLOOD INVENTORY OVERVIEW

export function AdminInventory() {
  const inventory = [
    ['O+', '45', 'Available'],
    ['O-', '20', 'Available'],
    ['A+', '60', 'Available'],
    ['A-', '15', 'Low Stock'],
    ['B+', '55', 'Available'],
    ['B-', '18', 'Low Stock'],
    ['AB+', '25', 'Available'],
    ['AB-', '12', 'Low Stock']
  ];

  return (
    <AdminLayout title="Blood Inventory Overview" active="Blood Inventory Overview">
      <section className="ad-section">
        <h2>Blood Stock Across All Blood Banks</h2>
        <DataTable
          columns={['Blood Group', 'Total Units', 'Stock Status']}
          rows={inventory}
        />
      </section>
    </AdminLayout>
  );
}

// 6. REQUEST MONITORING

export function AdminRequests() {
  const requests = [
    ['R001', 'City Hospital', 'O+', 'Emergency', 'Pending'],
    ['R002', 'Metro Hospital', 'AB+', 'Normal', 'Approved'],
    ['R003', 'Central Hospital', 'B-', 'Accident Zone', 'Pending'],
    ['R004', 'Care Hospital', 'A+', 'Normal', 'Completed'],
    ['R005', 'District Hospital', 'O-', 'Rare Blood Group', 'Pending']
  ];

  return (
    <AdminLayout title="Request Monitoring" active="Request Monitoring">
      <section className="ad-section">
        <h2>All Blood Requests</h2>
        <DataTable
          columns={['Request ID', 'Hospital', 'Blood Group', 'Priority', 'Status']}
          rows={requests}
        />
      </section>
    </AdminLayout>
  );
}

// 7. REPORTS & ANALYTICS

export function AdminReports() {
  const reports = [
    ['Blood Donation Report', 'Total donations recorded'],
    ['Blood Inventory Report', 'Current stock across facilities'],
    ['Blood Request Report', 'Requests and their status'],
    ['Expiry Report', 'Expired and soon-to-expire units'],
    ['Donor Activity Report', 'Donations and Karma Points']
  ];

  return (
    <AdminLayout title="Reports & Analytics" active="Reports & Analytics">
      <section className="ad-section">
        <h2>System Reports</h2>
        <DataTable
          columns={['Report Name', 'Description', 'Action']}
          rows={reports.map(([name, description]) => [
            name,
            description,
            <button
              className="ad-action-button"
              onClick={() => alert('Report generation will be connected later.')}
            >
              View Report
            </button>
          ])}
        />
      </section>
    </AdminLayout>
  );
}

// 8. ADMIN SETTINGS

export function AdminSettings() {
  const [name, setName] = useState('System Administrator');
  const [email, setEmail] = useState('admin@redthread.com');
  const [alerts, setAlerts] = useState(true);

  const saveSettings = (e) => {
    e.preventDefault();
    alert('Settings saved in this demo. Database connection will be added later.');
  };

  return (
    <AdminLayout title="Settings" active="Settings">
      <section className="ad-section">
        <h2>Admin Account Settings</h2>

        <form className="ad-settings-form" onSubmit={saveSettings}>
          <label>Administrator Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label className="ad-check">
            <input
              type="checkbox"
              checked={alerts}
              onChange={e => setAlerts(e.target.checked)}
            />
            Receive system notifications
          </label>

          <button type="submit">Save Changes</button>
        </form>
      </section>
    </AdminLayout>
  );
}
