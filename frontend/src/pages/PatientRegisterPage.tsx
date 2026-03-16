import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { patientAuthApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { User, Loader2, ArrowRight } from 'lucide-react'

export default function PatientRegisterPage() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    clinic_id: searchParams.get('clinic_id') || '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const clinicId = searchParams.get('clinic_id')

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated()) {
      if (user?.role === 'patient') {
        navigate('/patient/dashboard')
      } else {
        navigate('/doctor/dashboard')
      }
    }
  }, [isAuthenticated, user, navigate])

  if (!clinicId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Registration Link Required</h2>
          <p className="text-slate-400 mb-8">
            Please use the specific registration link provided by your clinic or doctor to create your account.
          </p>
          <Link 
            to="/" 
            className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-lg transition-colors border border-slate-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await patientAuthApi.register(form)
      
      // Auto-login
      const { data } = await patientAuthApi.login(form.email, form.password)
      setAuth(data.user, data.access_token, true)
      
      toast.success('Welcome back!')
      navigate('/patient/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      // Handle array of errors from Pydantic or string error
      let errorMessage = 'Registration failed'
      if (typeof detail === 'string') {
        errorMessage = detail
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((e: any) => e.msg).join(', ')
      }
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-600/5 rounded-full blur-3xl transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      <div className={`w-full max-w-lg relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 shadow-xl shadow-emerald-500/30 mb-4 transform transition-transform hover:scale-105 duration-300">
            <User size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Patient Account</h1>
          <p className="text-slate-400 mt-1">Join your clinic's digital platform</p>
        </div>

        <div className="card backdrop-blur-sm border border-slate-800/50 shadow-2xl bg-slate-900/50 p-6 rounded-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="group col-span-2 sm:col-span-1">
                <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                  required
                />
              </div>
              <div className="group col-span-2 sm:col-span-1">
                <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                required
              />
            </div>

            <div className="group">
              <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                required
              />
            </div>

            <div className="group">
              <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-emerald-400 transition-colors">Clinic Code (UUID)</label>
              <input
                type="text"
                value={form.clinic_id}
                onChange={e => update('clinic_id', e.target.value)}
                className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all duration-300"
                required
                placeholder="Ask your clinic for their ID"
              />
              <p className="text-xs text-slate-500 mt-1">This links your account to your healthcare provider.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 mt-6 ${loading ? 'opacity-80 scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/patient/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
function setAuth(user: any, access_token: any, arg2: boolean) {
  throw new Error('Function not implemented.')
}

