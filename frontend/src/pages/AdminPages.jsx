
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
    ['Equal Distribution (OS)', '/admin-distribution'],
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

// 5b. EQUAL RESOURCE DISTRIBUTION (OS MIN-MAX FAIR SHARING BALANCER)

export function AdminDistribution() {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('Dehradun');
  const [districtData, setDistrictData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balancing, setBalancing] = useState(false);

  const fetchDistricts = () => {
    fetch('/api/admin/distribution')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDistricts(data);
          if (data.length > 0 && !selectedDistrict) {
            setSelectedDistrict(data[0].location);
          }
        }
      })
      .catch(() => {});
  };

  const fetchDetail = (loc) => {
    if (!loc) return;
    setLoading(true);
    fetch(`/api/admin/distribution?location=${encodeURIComponent(loc)}`)
      .then(r => r.json())
      .then(data => {
        setDistrictData(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      fetchDetail(selectedDistrict);
    }
  }, [selectedDistrict]);

  const handleBalance = (loc) => {
    const isAll = loc === 'all';
    const msg = isAll
      ? 'Execute Fair-Share Equal Distribution across ALL districts in the network? Inter-facility unit transfers will balance stock.'
      : `Execute Fair-Share Equal Distribution across all facilities in ${loc}? Surplus blood units will be distributed equally to deficit facilities.`;

    if (!window.confirm(msg)) return;

    setBalancing(true);
    fetch('/api/admin/distribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: loc })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert(res.message || 'Equal distribution completed successfully!');
          fetchDetail(selectedDistrict);
          fetchDistricts();
        } else {
          alert('Distribution error: ' + (res.error || 'Failed to balance'));
        }
      })
      .catch(err => alert('Network error: ' + err.message))
      .finally(() => setBalancing(false));
  };

  const facilities = districtData?.facilities ? JSON.parse(districtData.facilities) : [];

  return (
    <AdminLayout title="District Equal Blood Distribution (OS Fair-Share)" active="Equal Distribution (OS)">
      <section className="ad-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Operating System Fair-Share Resource Balancer</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
              Min-Max Fair Sharing algorithm: Balances blood components equally across all blood banks & hospitals in the same district.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleBalance(selectedDistrict)}
              disabled={balancing || !districtData || districtData.totalUnits === '0'}
              style={{
                backgroundColor: '#a91f32',
                color: 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: balancing ? 0.7 : 1
              }}
            >
              {balancing ? 'Balancing Stock...' : `⚖️ Balance ${selectedDistrict} Equally`}
            </button>
            <button
              onClick={() => handleBalance('all')}
              disabled={balancing}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🌐 Balance All Districts
            </button>
          </div>
        </div>

        {/* District Selector & Stats Cards */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <label style={{ fontWeight: '600', color: '#374151' }}>Select District / City:</label>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px', minWidth: '180px' }}
          >
            {districts.map(d => (
              <option key={d.location} value={d.location}>
                {d.location} ({d.totalUnits} units in {d.facilityCount} facilities)
              </option>
            ))}
          </select>
        </div>

        {districtData && (
          <div className="ad-stats" style={{ marginBottom: '24px' }}>
            <div className="ad-stat-box">
              <h3>Facilities in {selectedDistrict}</h3>
              <h2>{districtData.facilityCount}</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Total Available Units</h3>
              <h2>{districtData.totalUnits}</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Fair-Share Target per Facility</h3>
              <h2>{districtData.targetPerFacility} units</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Load Distribution Status</h3>
              <h2 style={{ fontSize: '18px', color: districtData.facilities && JSON.parse(districtData.facilities).every(f => f.disparity === '0') ? '#059669' : '#d97706' }}>
                {districtData.facilities && JSON.parse(districtData.facilities).every(f => f.disparity === '0') ? '✓ Perfectly Balanced' : '⚠️ Imbalanced (Action Needed)'}
              </h2>
            </div>
          </div>
        )}

        {/* Facility Distribution Breakdown */}
        <h3>Facility Stock Breakdown & Parity Table</h3>
        {loading ? (
          <p>Loading district distribution data...</p>
        ) : (
          <div className="ad-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Facility ID</th>
                  <th>Facility Name</th>
                  <th>Type / Level</th>
                  <th>Current Stock</th>
                  <th>Target Fair Share</th>
                  <th>Parity Delta</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {facilities.length > 0 ? (
                  facilities.map(f => {
                    const disp = Number(f.disparity);
                    return (
                      <tr key={f.facilityId}>
                        <td>{f.facilityId}</td>
                        <td><strong>{f.facilityName}</strong></td>
                        <td>{f.facilityLevel}</td>
                        <td><span style={{ fontWeight: '600', fontSize: '15px' }}>{f.currentUnits}</span> units</td>
                        <td>{f.targetUnits} units</td>
                        <td>
                          <span style={{
                            color: disp > 0 ? '#059669' : (disp < 0 ? '#dc2626' : '#6b7280'),
                            fontWeight: '600'
                          }}>
                            {disp > 0 ? `+${disp} (Surplus)` : (disp < 0 ? `${disp} (Deficit)` : '0 (Balanced)')}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: disp > 0 ? '#d1fae5' : (disp < 0 ? '#fee2e2' : '#f3f4f6'),
                            color: disp > 0 ? '#065f46' : (disp < 0 ? '#991b1b' : '#374151')
                          }}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      No facilities found in this district.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const reports = [
    { id: 'donations', name: 'Blood Donation Report', desc: 'Total donations recorded across collection camps and centers' },
    { id: 'inventory', name: 'Blood Inventory Report', desc: 'Current active component stock breakdown by blood type' },
    { id: 'requests', name: 'Blood Request Report', desc: 'Hospital requisition volume, urgency classification, and status' },
    { id: 'expiry', name: 'Expiry & Quality Audit Report', desc: 'Perishable component alerts, expiration risk, and quarantine logs' },
    { id: 'donors', name: 'Donor Activity & Karma Report', desc: 'Donor registration roster, eligibility, and Karma Points ledger' }
  ];

  const handleOpenReport = (report) => {
    setActiveReport(report);
    setLoading(true);

    if (report.id === 'donations') {
      fetch('/api/donations')
        .then(r => r.json())
        .then(data => setReportData(Array.isArray(data) ? data : []))
        .catch(() => setReportData([]))
        .finally(() => setLoading(false));
    } else if (report.id === 'inventory') {
      fetch('/api/inventory')
        .then(r => r.json())
        .then(data => setReportData(Array.isArray(data) ? data : []))
        .catch(() => setReportData([]))
        .finally(() => setLoading(false));
    } else if (report.id === 'requests') {
      fetch('/api/requests')
        .then(r => r.json())
        .then(data => setReportData(Array.isArray(data) ? data : []))
        .catch(() => setReportData([]))
        .finally(() => setLoading(false));
    } else if (report.id === 'expiry') {
      fetch('/api/alerts')
        .then(r => r.json())
        .then(data => setReportData(Array.isArray(data) ? data : []))
        .catch(() => setReportData([]))
        .finally(() => setLoading(false));
    } else if (report.id === 'donors') {
      fetch('/api/donors')
        .then(r => r.json())
        .then(data => setReportData(Array.isArray(data) ? data : []))
        .catch(() => setReportData([]))
        .finally(() => setLoading(false));
    }
  };

  const renderReportContent = () => {
    if (loading) {
      return <p style={{ padding: '20px', color: '#6b7280' }}>Generating real-time database report...</p>;
    }

    if (!activeReport) return null;

    if (activeReport.id === 'donations') {
      const totalVol = reportData.reduce((acc, d) => acc + Number(d.volume || 450), 0);
      return (
        <div>
          <div className="ad-stats" style={{ marginBottom: '20px' }}>
            <div className="ad-stat-box">
              <h3>Total Donations</h3>
              <h2>{reportData.length}</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Total Volume Collected</h3>
              <h2>{totalVol.toLocaleString()} mL</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Avg. Volume / Donor</h3>
              <h2>{reportData.length > 0 ? Math.round(totalVol / reportData.length) : 0} mL</h2>
            </div>
          </div>
          <div className="ad-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Donation ID</th>
                  <th>Donor ID</th>
                  <th>Blood Group</th>
                  <th>Facility</th>
                  <th>Date</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((d, i) => (
                  <tr key={d.donationId || i}>
                    <td><strong>{d.donationId}</strong></td>
                    <td>{d.redThreadId}</td>
                    <td><span style={{ fontWeight: 600, color: '#b91c1c' }}>{d.bloodGroup}</span></td>
                    <td>{d.facilityName || d.facilityId}</td>
                    <td>{d.donationDate}</td>
                    <td>{d.volume} mL</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeReport.id === 'inventory') {
      const totalUnits = reportData.reduce((acc, item) => acc + Number(item.availableUnits || 0), 0);
      return (
        <div>
          <div className="ad-stats" style={{ marginBottom: '20px' }}>
            <div className="ad-stat-box">
              <h3>Total Units in Stock</h3>
              <h2>{totalUnits}</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Blood Type Categories</h3>
              <h2>{reportData.length}</h2>
            </div>
          </div>
          <div className="ad-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Blood Group</th>
                  <th>Component Type</th>
                  <th>Available Units</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, i) => (
                  <tr key={i}>
                    <td><strong>{item.bloodType}</strong></td>
                    <td>{item.component}</td>
                    <td><span style={{ fontWeight: 600 }}>{item.availableUnits}</span> units</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: item.availableUnits > 5 ? '#d1fae5' : '#fee2e2',
                        color: item.availableUnits > 5 ? '#065f46' : '#991b1b'
                      }}>
                        {item.availableUnits > 5 ? 'Adequate' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeReport.id === 'requests') {
      const emergencyCount = reportData.filter(r => r.priority === 'Emergency' || r.priority === 'Critical').length;
      const allocatedCount = reportData.filter(r => r.status === 'Allocated').length;
      return (
        <div>
          <div className="ad-stats" style={{ marginBottom: '20px' }}>
            <div className="ad-stat-box">
              <h3>Total Requests Raised</h3>
              <h2>{reportData.length}</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Emergency / Critical</h3>
              <h2 style={{ color: '#dc2626' }}>{emergencyCount}</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Allocated & Fulfilled</h3>
              <h2 style={{ color: '#059669' }}>{allocatedCount}</h2>
            </div>
          </div>
          <div className="ad-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Facility</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((r, i) => (
                  <tr key={r.requestId || i}>
                    <td><strong>{r.requestId}</strong></td>
                    <td>{r.facilityId}</td>
                    <td>{r.bloodType}</td>
                    <td>{r.componentType}</td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: r.priority === 'Emergency' || r.priority === 'Critical' ? '#dc2626' : '#374151'
                      }}>
                        {r.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: r.status === 'Allocated' ? '#d1fae5' : '#fef3c7',
                        color: r.status === 'Allocated' ? '#065f46' : '#92400e'
                      }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeReport.id === 'expiry') {
      return (
        <div>
          <div className="ad-stats" style={{ marginBottom: '20px' }}>
            <div className="ad-stat-box">
              <h3>Active Expiry & Stock Alerts</h3>
              <h2>{reportData.length}</h2>
            </div>
          </div>
          <div className="ad-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Facility ID</th>
                  <th>Alert Type</th>
                  <th>System Message</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((a, i) => (
                  <tr key={a.alertId || i}>
                    <td>{a.alertId}</td>
                    <td>{a.facilityId}</td>
                    <td><strong style={{ color: '#dc2626' }}>{a.alertType}</strong></td>
                    <td>{a.message}</td>
                    <td>{a.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeReport.id === 'donors') {
      const eligibleCount = reportData.filter(d => d.eligibility === 'Eligible').length;
      return (
        <div>
          <div className="ad-stats" style={{ marginBottom: '20px' }}>
            <div className="ad-stat-box">
              <h3>Registered Donors</h3>
              <h2>{reportData.length}</h2>
            </div>
            <div className="ad-stat-box">
              <h3>Clinically Eligible</h3>
              <h2 style={{ color: '#059669' }}>{eligibleCount}</h2>
            </div>
          </div>
          <div className="ad-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Donor ID</th>
                  <th>Full Name</th>
                  <th>Blood Group</th>
                  <th>Karma Points</th>
                  <th>Eligibility</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((d, i) => (
                  <tr key={d.id || i}>
                    <td><strong>{d.id || d.donorId}</strong></td>
                    <td>{d.name}</td>
                    <td><span style={{ fontWeight: 600, color: '#b91c1c' }}>{d.bloodType || d.bloodGroup}</span></td>
                    <td><span style={{ fontWeight: 600, color: '#059669' }}>+{d.karmaPoints || 0}</span></td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: d.eligibility === 'Eligible' ? '#d1fae5' : '#fee2e2',
                        color: d.eligibility === 'Eligible' ? '#065f46' : '#991b1b'
                      }}>
                        {d.eligibility}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <AdminLayout title="Reports & Analytics" active="Reports & Analytics">
      <section className="ad-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2>Clinical & System Audit Reports</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
              Real-time operational reporting generated from transactional logs and inventory registries.
            </p>
          </div>
          {activeReport && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Report
              </button>
              <button
                onClick={() => setActiveReport(null)}
                style={{
                  background: '#a91f32',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✕ Close Report
              </button>
            </div>
          )}
        </div>

        {activeReport ? (
          <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
              <h2 style={{ color: '#a91f32', margin: 0 }}>{activeReport.name}</h2>
              <p style={{ color: '#4b5563', margin: '4px 0 0 0' }}>{activeReport.desc}</p>
            </div>
            {renderReportContent()}
          </div>
        ) : null}

        <h3>Available Report Catalog</h3>
        <DataTable
          columns={['Report Name', 'Description', 'Action']}
          rows={reports.map(r => [
            <strong>{r.name}</strong>,
            r.desc,
            <button
              className="ad-action-button"
              onClick={() => handleOpenReport(r)}
            >
              📊 Generate Live Report
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

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.admin_name) setName(data.admin_name);
        if (data.admin_email) setEmail(data.admin_email);
        if (data.admin_alerts !== undefined) setAlerts(data.admin_alerts === 'true');
      })
      .catch(() => {});
  }, []);

  const saveSettings = (e) => {
    e.preventDefault();
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_name: name,
        admin_email: email,
        admin_alerts: alerts ? 'true' : 'false'
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert('Settings saved successfully to database!');
        } else {
          alert('Failed to save settings: ' + (res.error || ''));
        }
      })
      .catch(err => alert('Network error: ' + err.message));
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
