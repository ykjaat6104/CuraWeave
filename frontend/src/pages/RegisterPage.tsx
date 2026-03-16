import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Stethoscope, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    owner_name: '',
    owner_password: '',
    timezone: 'UTC',
  })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.register(form)
      // Auto-login
      const { data } = await authApi.login(form.email, form.owner_password)
      setAuth(data.user, data.access_token, true)
      toast.success('Welcome to CuraWeave!')
      navigate('/doctor/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 right-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      <div className={`w-full max-w-lg relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/30 mb-4 transform transition-transform hover:scale-105 duration-300">
            <Stethoscope size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Register Your Clinic</h1>
          <p className="text-slate-400 mt-1 text-sm">Start your 14-day free trial</p>
        </div>

        <div className="card backdrop-blur-sm border border-slate-800/50 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-brand-400 transition-colors">Clinic Name *</label>
                <input
                  className="input-field w-full transition-all duration-300 focus:ring-brand-500/50 focus:border-brand-500"
                  placeholder="City Health Clinic"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-brand-400 transition-colors">Clinic Phone</label>
                <input
                  className="input-field w-full transition-all duration-300 focus:ring-brand-500/50 focus:border-brand-500"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-brand-400 transition-colors">Clinic Email *</label>
              <input
                type="email"
                className="input-field w-full transition-all duration-300 focus:ring-brand-500/50 focus:border-brand-500"
                placeholder="contact@clinic.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>

            <hr className="border-slate-800" />

            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Owner Account</p>

            <div className="group">
              <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-brand-400 transition-colors">Your Full Name *</label>
              <input
                className="input-field w-full transition-all duration-300 focus:ring-brand-500/50 focus:border-brand-500"
                placeholder="Dr. Priya Sharma"
                value={form.owner_name}
                onChange={e => update('owner_name', e.target.value)}
                required
              />
            </div>

            <div className="group">
              <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-brand-400 transition-colors">Password *</label>
              <input
                type="password"
                className="input-field w-full transition-all duration-300 focus:ring-brand-500/50 focus:border-brand-500"
                placeholder="Minimum 8 characters"
                value={form.owner_password}
                onChange={e => update('owner_password', e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full flex items-center justify-center gap-2 py-3 transition-all duration-300 ${loading ? 'opacity-80 scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Creating clinic...' : 'Create Clinic Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-4">
            Already registered?{' '}
            <Link to="/doctor/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
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

