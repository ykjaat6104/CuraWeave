import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'

import LandingPage from './pages/LandingPage'
import PublicBookingPage from './pages/PublicBookingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PatientLoginPage from './pages/PatientLoginPage'
import PatientRegisterPage from './pages/PatientRegisterPage'
import PatientForgotPasswordPage from './pages/PatientForgotPasswordPage'
import PatientResetPasswordPage from './pages/PatientResetPasswordPage'
import PatientMessagesPage from './pages/PatientMessagesPage'
import PatientProfilePage from './pages/PatientProfilePage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DoctorProfilePage from './pages/DoctorProfilePage'
import AdminProfilePage from './pages/AdminProfilePage'
import PatientLayout from './components/PatientLayout'
import PatientDashboardPage from './pages/PatientDashboardPage'
import PatientAppointmentsPage from './pages/PatientAppointmentsPage'
import PatientDoctorsPage from './pages/PatientDoctorsPage'
import PatientTriagePage from './pages/PatientTriagePage'
import PatientHealthWalletPage from './pages/PatientHealthWalletPage'
import PatientBillingPage from './pages/PatientBillingPage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import CampaignsPage from './pages/CampaignsPage'
import AiTriagePage from './pages/AiTriagePage'
import MessagesPage from './pages/MessagesPage'
import BillingPage from './pages/BillingPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminStaffPage from './pages/AdminStaffPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminAuditPage from './pages/AdminAuditPage'
import DoctorEHRPage from './pages/DoctorEHRPage'


function ProtectedRoute({ children, redirectPath = "/doctor/login" }: { children: React.ReactNode, redirectPath?: string }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated() ? <>{children}</> : <Navigate to={redirectPath} />
}

function RoleGuard({ children, allowedRoles, fallbackPath }: { children: React.ReactNode, allowedRoles: string[], fallbackPath?: string }) {
  const { user } = useAuthStore()
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath || "/doctor/login"} replace />
  }
  return <>{children}</>
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
        <Route path="/book/:clinicId" element={<PublicBookingPage />} />
        
        {/* Doctor Portal Routes */}
        <Route path="/doctor/login" element={<LoginPage />} />
        <Route path="/doctor/register" element={<RegisterPage />} />
        <Route path="/doctor/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/doctor/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute redirectPath="/doctor/login">
              <RoleGuard allowedRoles={['admin', 'doctor']} fallbackPath="/admin/dashboard">
                <Layout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/doctor/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="triage" element={<AiTriagePage />} />
          <Route path="ehr" element={<DoctorEHRPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="profile" element={<DoctorProfilePage />} />
        </Route>
        
        {/* Admin Portal Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute redirectPath="/doctor/login">
              <RoleGuard allowedRoles={['admin']} fallbackPath="/doctor/dashboard">
                <AdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>
        
        
        {/* Patient Portal Routes */}
        <Route path="/patient/login" element={<PatientLoginPage />} />
        <Route path="/patient/register" element={<PatientRegisterPage />} />
        <Route path="/patient/forgot-password" element={<PatientForgotPasswordPage />} />
        <Route path="/patient/reset-password" element={<PatientResetPasswordPage />} />
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
          <Route path="messages" element={<PatientMessagesPage />} />
          <Route path="health" element={<PatientHealthWalletPage />} />
          <Route path="billing" element={<PatientBillingPage />} />
          <Route path="profile" element={<PatientProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
