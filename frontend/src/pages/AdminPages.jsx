
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../utils/auth';
import './AdminPages.css';

function AdminLayout({ title, active, children }) {
  const navigate = useNavigate();
  const currentUser = getUser();

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

        <div
          className="ad-menu ad-logout"
          onClick={() => {
            clearUser();
            navigate('/');
          }}
        >
          Logout
        </div>
      </aside>

      <main className="ad-main">
        <div className="ad-header">
          <h1>{title}</h1>
          <span>Welcome, {currentUser?.username || 'Admin'}</span>
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

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

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
  const [stats, setStats] = useState([
    ['Total Blood Banks', '...'],
    ['Registered Hospitals', '...'],
    ['Registered Donors', '...'],
    ['Pending Requests', '...']
  ]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/facilities').then(r => r.json()).catch(() => []),
      fetch('/api/donors').then(r => r.json()).catch(() => []),
      fetch('/api/requests').then(r => r.json()).catch(() => [])
    ]).then(([facilities, donors, reqs]) => {
      const bloodBanks = Array.isArray(facilities) ? facilities.filter(f => f.type === 'Blood Bank').length : 0;
      const hospitals = Array.isArray(facilities) ? facilities.filter(f => f.type === 'Hospital').length : 0;
      const donorCount = Array.isArray(donors) ? donors.length : 0;
      const pendingCount = Array.isArray(reqs) ? reqs.filter(r => r.status === 'Pending').length : 0;

      setStats([
        ['Total Blood Banks', String(bloodBanks)],
        ['Registered Hospitals', String(hospitals)],
        ['Registered Donors', String(donorCount)],
        ['Pending Requests', String(pendingCount)]
      ]);

      if (Array.isArray(reqs)) {
        setRequests(reqs.slice(0, 5).map(r => [
          r.requestId,
          r.facilityId || 'District Facility',
          r.bloodType,
          r.priority,
          r.status
        ]));
      }
    });
  }, []);

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
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch('/api/facilities?type=Blood+Bank')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRows(data.map(f => [
            f.facilityId,
            f.facilityName,
            f.location,
            '98765' + f.facilityId.replace(/\D/g, '').padStart(5, '0'),
            'Active'
          ]));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ManagementPage
      title="Blood Bank Management"
      active="Blood Bank Management"
      columns={['Bank ID', 'Blood Bank Name', 'Location', 'Contact', 'Status', 'Action']}
      initialRows={rows}
    />
  );
}

// 3. HOSPITAL MANAGEMENT

export function AdminHospitals() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch('/api/facilities?type=Hospital')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRows(data.map(f => [
            f.facilityId,
            f.facilityName,
            f.location,
            '98765' + f.facilityId.replace(/\D/g, '').padStart(5, '0'),
            'Active'
          ]));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ManagementPage
      title="Hospital Management"
      active="Hospital Management"
      columns={['Hospital ID', 'Hospital Name', 'Location', 'Contact', 'Status', 'Action']}
      initialRows={rows}
    />
  );
}

// 4. DONOR MANAGEMENT

export function AdminDonors() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch('/api/donors')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRows(data.map(d => [
            d.id,
            d.name || 'Anonymous Donor',
            d.bloodType,
            String(d.karmaPoints || 0),
            d.eligibility || 'Active'
          ]));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ManagementPage
      title="Donor Management"
      active="Donor Management"
      columns={['Donor ID', 'Donor Name', 'Blood Group', 'Karma Points', 'Status', 'Action']}
      initialRows={rows}
    />
  );
}

// 5. BLOOD INVENTORY OVERVIEW

export function AdminInventory() {
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInventory(data.map(item => [
            `${item.bloodType} (${item.component})`,
            String(item.availableUnits),
            item.availableUnits > 5 ? 'Available' : 'Low Stock'
          ]));
        }
      })
      .catch(() => {});
  }, []);

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
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch('/api/requests')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRequests(data.map(r => [
            r.requestId,
            r.facilityId || 'District Facility',
            r.bloodType,
            r.priority,
            r.status
          ]));
        }
      })
      .catch(() => {});
  }, []);

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
