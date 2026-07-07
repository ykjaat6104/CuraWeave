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

// Deduplicate in-flight GET requests (e.g. React StrictMode double-fetch)
const inflightGet = new Map<string, Promise<any>>()
const _get = api.get.bind(api) as typeof api.get
api.get = ((url: string, config?: any) => {
  const key = `GET:${url}:${JSON.stringify(config?.params || {})}`
  const existing = inflightGet.get(key)
  if (existing) return existing
  const promise = _get(url, config).finally(() => inflightGet.delete(key))
  inflightGet.set(key, promise)
  return promise
}) as typeof api.get

export default api

// ─── Public (Unauthenticated) ──────────────────────────────────────────────
export const publicApi = {
  getClinics: () => api.get('/public/clinics'),
  getClinic: (id: string) => api.get(`/public/clinics/${id}`),
  getSlots: (id: string, date: string) => 
    api.get(`/public/clinics/${id}/slots`, { params: { target_date: date } }),
  book: (data: { clinic_id: string; appointment_time: string; reason?: string }) =>
    api.post('/public/book', data),
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
  getProfile: () =>
    api.get('/auth/profile'),
  updateProfile: (data: { name?: string }) =>
    api.patch('/auth/profile', data),
  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/change-password', { old_password, new_password }),
}

export const patientAuthApi = {
  login: (email: string, password: string) =>
    api.post('/auth/patient/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/patient/register', data),
  connectViaCode: (code: string) =>
    api.post('/auth/patient/connect-via-code', { code }),
  getConnectedDoctors: () =>
    api.get('/auth/patient/connected-doctors'),
  triage: (message: string, conversation_history?: { role: string; content: string }[]) =>
    api.post('/auth/patient/triage', { message, conversation_history: conversation_history || [] }),
  getAppointments: () =>
    api.get('/auth/patient/appointments'),
  bookAppointment: (data: { doctor_id: string; appointment_time: string; reason?: string }) =>
    api.post('/auth/patient/book-appointment', data),
  getAvailability: (date: string) =>
    api.get('/auth/patient/availability', { params: { target_date: date } }),
  getTriageHistory: () =>
    api.get('/auth/patient/triage-history'),
  forgotPassword: (email: string) =>
    api.post('/auth/patient/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/patient/reset-password', { token, new_password }),
  getMessages: () =>
    api.get('/auth/patient/messages'),
  getProfile: () =>
    api.get('/auth/patient/profile'),
  updateProfile: (data: { name?: string; phone?: string; gender?: string; date_of_birth?: string | null }) =>
    api.patch('/auth/patient/profile', data),
  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/patient/change-password', { old_password, new_password }),
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
  generateConnectionCode: (id: string, params?: { send_email_flag?: boolean; send_sms_flag?: boolean }) =>
    api.post(`/patients/${id}/generate-connection-code`, null, { params }),
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
  send: (data: { patient_id?: string; recipient_id?: string; content: string; channel?: string }) =>
    api.post('/messages/send', data),
  getConversation: (contactId: string) => api.get(`/messages/conversation/${contactId}`),
  getContacts: () => api.get('/messages/contacts'),
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
  triage: (data: { message: string; patient_id?: string }) =>
    api.post('/ai/triage', data),
  chat: (messages: any[], patient_id?: string) =>
    api.post('/ai/chat', { messages, patient_id }),
  generateMessage: (data: { template: string; patient_name: string; clinic_name: string }) =>
    api.post('/ai/generate-message', data),
  getTriageLogs: () => api.get('/ai/triage-logs'),
  triageStream: (
    message: string,
    patientId: string | null,
    onToken: (token: string) => void,
    onNodeComplete: (data: any) => void,
    onDone: (data: any) => void,
    onError: (error: string) => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const token = localStorage.getItem('curaweave_token')
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ message, patient_id: patientId || null })
      fetch('/api/v1/ai/triage/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body,
        signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const err = await response.text()
            onError(err)
            reject(new Error(err))
            return
          }
          const reader = response.body!.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            let currentEvent = ''
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim()
              } else if (line.startsWith('data: ')) {
                const raw = line.slice(6)
                try {
                  const data = JSON.parse(raw)
                  if (data.type === 'token') {
                    onToken(data.token)
                  } else if (data.type === 'node_complete') {
                    onNodeComplete(data)
                  } else if (data.type === 'done') {
                    onDone(data)
                    resolve()
                  } else if (data.type === 'error') {
                    onError(data.detail || 'Unknown error')
                    reject(new Error(data.detail))
                  }
                } catch {
                  // skip unparseable lines
                }
              }
            }
          }
          resolve()
        })
        .catch((err) => {
          if (err.name === 'AbortError') {
            resolve()
          } else {
            onError(err.message)
            reject(err)
          }
        })
    })
  },
}

// ─── Billing ───────────────────────────────────────────────────────────────
export const billingApi = {
  getPlans: () => api.get('/billing/plans'),
  getCurrentPlan: () => api.get('/billing/current-plan'),
  createOrder: (plan: string) => api.post('/billing/create-order', { plan }),
  verifyPayment: (data: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string; plan?: string; demo?: boolean }) =>
    api.post('/billing/verify-payment', data),
}

// ─── Users (Staff Management) ──────────────────────────────────────────────
export const usersApi = {
  list: (role?: string) => api.get('/users/', { params: role ? { role } : {} }),
  invite: (data: { name: string; email: string; role: string; password: string }) =>
    api.post('/users/invite', data),
}

// ─── Medical Records ────────────────────────────────────────────────────────
export const medicalRecordsApi = {
  list: (patientId?: string) => api.get('/medical-records/', { params: { patient_id: patientId } }),
  getByPatient: (patientId: string) => api.get(`/medical-records/patient/${patientId}`),
  create: (data: any) => api.post('/medical-records/', data),
}

// ─── Patient Queue ─────────────────────────────────────────────────────────
export const patientQueueApi = {
  getQueue: () => api.get('/patient-queue/'),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/patient-queue/${id}/status`, { status, notes }),
  create: (data: any) => api.post('/patient-queue/', data),
}

// ─── Patient Invoices (Staff) ──────────────────────────────────────────────
export const patientInvoiceApi = {
  list: (patientId?: string) => api.get('/patient-invoices/', { params: { patient_id: patientId } }),
  create: (data: any) => api.post('/patient-invoices/', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/patient-invoices/${id}/status`, { status }),
}

// ─── Patient Insurance ─────────────────────────────────────────────────────
export const patientInsuranceApi = {
  list: () => api.get('/patient-insurance/'),
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: { action?: string; limit?: number; offset?: number }) =>
    api.get('/audit-logs/', { params }),
}
