import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('curaweave_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
api.interceptors.response.use(
  (r) => r,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('curaweave_token')
      sessionStorage.removeItem('curaweave_token')
      
      const isPatientRoute = window.location.pathname.startsWith('/patient')
      window.location.href = isPatientRoute ? '/patient/login' : '/doctor/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
}

export const patientAuthApi = {
  login: (email: string, password: string) =>
    api.post('/auth/patient/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/patient/register', data),
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getAppointmentTrend: (days = 30) => api.get(`/analytics/appointments/trend?days=${days}`),
  getTriageDistribution: () => api.get('/analytics/triage/urgency-distribution'),
  getMessageVolume: (days = 30) => api.get(`/analytics/messages/volume?days=${days}`),
}

// ─── Patients ─────────────────────────────────────────────────────────────
export const patientsApi = {
  list: (params?: { skip?: number; limit?: number; search?: string }) =>
    api.get('/patients/', { params }),
  get: (id: string) => api.get(`/patients/${id}`),
  create: (data: any) => api.post('/patients/', data),
  update: (id: string, data: any) => api.patch(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
}

// ─── Appointments ─────────────────────────────────────────────────────────
export const appointmentsApi = {
  list: (params?: any) => api.get('/appointments/', { params }),
  get: (id: string) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments/', data),
  update: (id: string, data: any) => api.patch(`/appointments/${id}`, data),
  confirm: (id: string) => api.post(`/appointments/${id}/confirm`),
  complete: (id: string) => api.post(`/appointments/${id}/complete`),
}

// ─── Messages ─────────────────────────────────────────────────────────────
export const messagesApi = {
  list: (patientId?: string) => api.get('/messages/', { params: { patient_id: patientId } }),
  send: (data: { patient_id: string; content: string; channel?: string }) =>
    api.post('/messages/send', data),
}

// ─── Campaigns ─────────────────────────────────────────────────────────────
export const campaignsApi = {
  list: () => api.get('/campaigns/'),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns/', data),
  launch: (id: string) => api.post(`/campaigns/${id}/launch`),
}

// ─── AI ────────────────────────────────────────────────────────────────────
export const aiApi = {
  triage: (data: { message: string; patient_id?: number }) =>
    api.post('/ai/triage', data),
  chat: (messages: any[], patient_id?: number) =>
    api.post('/ai/chat', { messages, patient_id }),
  generateMessage: (data: { template: string; patient_name: string; clinic_name: string }) =>
    api.post('/ai/generate-message', data),
  getTriageLogs: () => api.get('/ai/triage-logs'),
}

// ─── Billing ───────────────────────────────────────────────────────────────
export const billingApi = {
  getPlans: () => api.get('/billing/plans'),
  getCurrentPlan: () => api.get('/billing/current-plan'),
  createCheckout: (plan: string) => api.post('/billing/create-checkout-session', { plan }),
}
