import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PatientLoginPage from './pages/PatientLoginPage'
import PatientRegisterPage from './pages/PatientRegisterPage'
import PatientLayout from './components/PatientLayout'
import PatientDashboardPage from './pages/PatientDashboardPage'
import PatientAppointmentsPage from './pages/PatientAppointmentsPage'
import PatientDoctorsPage from './pages/PatientDoctorsPage'
import PatientTriagePage from './pages/PatientTriagePage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import CampaignsPage from './pages/CampaignsPage'
import AiTriagePage from './pages/AiTriagePage'
import MessagesPage from './pages/MessagesPage'
import BillingPage from './pages/BillingPage'

function ProtectedRoute({ children, redirectPath = "/doctor/login" }: { children: React.ReactNode, redirectPath?: string }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated() ? <>{children}</> : <Navigate to={redirectPath} />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Doctor Portal Routes */}
        <Route path="/doctor/login" element={<LoginPage />} />
        <Route path="/doctor/register" element={<RegisterPage />} />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute redirectPath="/doctor/login">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/doctor/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="triage" element={<AiTriagePage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>
        
        {/* Patient Portal Routes */}
        <Route path="/patient/login" element={<PatientLoginPage />} />
        <Route path="/patient/register" element={<PatientRegisterPage />} />
        <Route
          path="/patient"
          element={
            <ProtectedRoute redirectPath="/patient/login">
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/patient/dashboard" />} />
          <Route path="dashboard" element={<PatientDashboardPage />} />
          <Route path="appointments" element={<PatientAppointmentsPage />} />
          <Route path="doctors" element={<PatientDoctorsPage />} />
          <Route path="triage" element={<PatientTriagePage />} />
          <Route path="messages" element={<div className="text-white p-6">Messages Feature Coming Soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
