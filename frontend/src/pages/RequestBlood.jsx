
import { useNavigate } from 'react-router-dom';
import './RequestBlood.css';

function RequestBlood() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Blood request submitted successfully!');
  };

  return (
    <div className="rb-layout">

      <aside className="rb-sidebar">
        <h2>RedThread</h2>
        <p className="rb-label">HOSPITAL PANEL</p>

        <nav>
          <div
            className="rb-menu"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </div>

          <div
            className="rb-menu"
            onClick={() => navigate('/hospital-inventory')}
          >
            Blood Inventory
          </div>

          <div className="rb-menu active">
            Request Blood
          </div>

          <div className="rb-menu" onClick={() => navigate('/request-history')}>Request History
          </div>

          <div className={`menu-item ${window.location.pathname === '/hospital-settings' ? 'active' : ''}`} onClick={() => navigate('/hospital-settings')}>
          Settings
          </div>
        </nav>

        <div
          className="rb-menu rb-logout"
          onClick={() => navigate('/')}
        >
          Logout
        </div>
      </aside>

      <main className="rb-main">

        <header className="rb-header">
          <div>
            <h1>Request Blood</h1>
            <p>Submit a blood requirement to the blood bank.</p>
          </div>
          <span className="rb-admin">Hospital Panel</span>
        </header>

        <section className="rb-form-container">

          <h2>Blood Request Form</h2>
          <p className="rb-description">
            Fill in the details below to request blood units.
          </p>

          <form className="rb-form" onSubmit={handleSubmit}>

            <div className="rb-field">
              <label>Patient ID</label>
              <input
                type="text"
                placeholder="Enter patient ID"
                required
              />
            </div>

            <div className="rb-field">
              <label>Patient Name</label>
              <input
                type="text"
                placeholder="Enter patient name"
                required
              />
            </div>

            <div className="rb-field">
              <label>Blood Group Required</label>
              <select required defaultValue="">
                <option value="" disabled>Select blood group</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>

            <div className="rb-field">
              <label>Blood Component</label>
              <select required defaultValue="">
                <option value="" disabled>Select component</option>
                <option value="Whole Blood">Whole Blood</option>
                <option value="Packed Red Blood Cells">Packed Red Blood Cells</option>
                <option value="Platelets">Platelets</option>
                <option value="Plasma">Plasma</option>
                <option value="Cryoprecipitate">Cryoprecipitate</option>
              </select>
            </div>

            <div className="rb-field">
              <label>Number of Units Required</label>
              <input
                type="number"
                placeholder="Enter number of units"
                min="1"
                required
              />
            </div>

            <div className="rb-field">
              <label>Request Priority</label>
              <select required defaultValue="">
                <option value="" disabled>Select priority</option>
                <option value="1">Emergency</option>
                <option value="2">Accident Zone</option>
                <option value="3">Rare Blood Group</option>
                <option value="4">Normal</option>
              </select>
            </div>

            <div className="rb-field">
              <label>Required By Date</label>
              <input
                type="date"
                required
              />
            </div>

            <div className="rb-field">
              <label>Reason for Request</label>
              <textarea
                placeholder="Enter reason or medical requirement"
                rows="4"
                required
              />
            </div>

            <div className="rb-form-actions">
              <button type="submit" className="rb-submit">
                Submit Blood Request
              </button>

              <button
                type="button"
                className="rb-cancel"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
            </div>

          </form>
        </section>

      </main>
    </div>
  );
}

export default RequestBlood;
