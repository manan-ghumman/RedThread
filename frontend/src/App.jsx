
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import RegisterDonor from './pages/RegisterDonor';
import RecordDonation from './pages/RecordDonation';
import HospitalInventory from './pages/HospitalInventory';
import RequestBlood from './pages/RequestBlood';
import RequestHistory from './pages/RequestHistory';
import HospitalSettings from './pages/HospitalSettings';
import BloodBankInventory from './pages/BloodBankInventory';
import DonorManagement from './pages/DonorManagement';
import HospitalRequests from './pages/HospitalRequests';
import BloodTransfers from './pages/BloodTransfers';
import BloodBankReports from './pages/BloodBankReports';
import BloodBankSettings from './pages/BloodBankSettings';
import DonorDashboard from './pages/DonorDashboard';
import DonorProfile from './pages/DonorProfile';
import {
  KarmaPoints,
  DonationHistory,
  EligibilityStatus,
  NearbyBloodBanks,
  DonorAppointments,
  DonorNotifications,
  DonorSettings
} from './pages/DonorPages';

import {
  AdminDashboard,
  AdminBloodBanks,
  AdminHospitals,
  AdminDonors,
  AdminInventory,
  AdminDistribution,
  AdminRequests,
  AdminReports,
  AdminSettings
} from './pages/AdminPages';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/blood-bank" element={<BloodBankDashboard />} />

        <Route path="/register-donor" element={<RegisterDonor />} />

        <Route path="/record-donation" element={<RecordDonation />} />

        <Route path="/hospital-inventory" element={<HospitalInventory />} />

        <Route path="/requests" element={<RequestBlood />} />

        <Route path="/request-history" element={<RequestHistory />} />

        <Route path="/hospital-settings" element={<HospitalSettings />} />

        <Route path="/blood-bank-inventory" element={<BloodBankInventory />} />

        <Route path="/donor-management" element={<DonorManagement />} />

        <Route path="/hospital-requests" element={<HospitalRequests />} />

        <Route path="/blood-transfers" element={<BloodTransfers />} />
        
        <Route path="/blood-bank-reports" element={<BloodBankReports />} />
        
        <Route path="/blood-bank-settings" element={<BloodBankSettings />} />

        <Route path="/donor-dashboard" element={<DonorDashboard />} />

        <Route path="/donor-profile" element={<DonorProfile />} />

        <Route path="/karma-points" element={<KarmaPoints />} />
        
        <Route path="/donation-history" element={<DonationHistory />} />
        
        <Route path="/eligibility-status" element={<EligibilityStatus />} />
        
        <Route path="/nearby-blood-banks" element={<NearbyBloodBanks />} />
        
        <Route path="/donor-appointments" element={<DonorAppointments />} />
        
        <Route path="/donor-notifications" element={<DonorNotifications />} />
        
        <Route path="/donor-settings" element={<DonorSettings />} />

        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/admin-blood-banks" element={<AdminBloodBanks />} />

        <Route path="/admin-hospitals" element={<AdminHospitals />} />

        <Route path="/admin-donors" element={<AdminDonors />} />
        
        <Route path="/admin-inventory" element={<AdminInventory />} />
        
        <Route path="/admin-distribution" element={<AdminDistribution />} />
        
        <Route path="/admin-requests" element={<AdminRequests />} />
        
        <Route path="/admin-reports" element={<AdminReports />} />
        
        <Route path="/admin-settings" element={<AdminSettings />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
