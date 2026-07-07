import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import {
  User, Lock, Mail, ArrowRight, Activity, Shield, Stethoscope, HeartPulse
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

type Role = 'admin' | 'doctor'

interface RoleConfig {
  label: string
  icon: any
  gradient: string
  chipActive: string
  chipInactive: string
  inputClass: string
  btnClass: string
  linkClass: string
  description: string
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  admin: {
    label: 'Admin',
    icon: Shield,
    gradient: 'admin-gradient',
    chipActive: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    chipInactive: 'bg-zinc-900/60 border-zinc-800 text-slate-500 hover:text-slate-300 hover:border-zinc-700',
    inputClass: 'focus:ring-indigo-500/20 focus:border-indigo-500',
    btnClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25',
    linkClass: 'text-indigo-300 hover:text-indigo-200',
    description: 'Manage clinic, staff, and settings',
  },
  doctor: {
    label: 'Doctor',
    icon: Stethoscope,
    gradient: 'doctor-gradient',
    chipActive: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    chipInactive: 'bg-zinc-900/60 border-zinc-800 text-slate-500 hover:text-slate-300 hover:border-zinc-700',
    inputClass: 'focus:ring-purple-500/20 focus:border-purple-500',
    btnClass: 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/25',
    linkClass: 'text-purple-300 hover:text-purple-200',
    description: 'Patient care, triage, and campaigns',
  },
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('doctor')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const cfg = ROLE_CONFIG[selectedRole]

  const getErrorMessage = (err: any, fallback: string) => {
    const detail = err?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const first = detail[0]
      if (typeof first === 'string') return first
      if (first?.msg) return String(first.msg)
    }
    return fallback
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await authApi.login(formData.email, formData.password)
      const { user, access_token } = response.data
      setAuth(user, access_token)

      const role = user.role as string
      if (role === 'admin') {
        toast.success('Welcome back, Admin ' + (user.name || user.email))
        navigate('/admin/dashboard')
      } else {
        toast.success('Welcome back, Dr. ' + (user.name || user.email))
        navigate('/doctor/dashboard')
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen theme-surface text-slate-200">
      {/* Left: Branding */}
      <div className={`hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-12 ${cfg.gradient}`}>
        <div className="absolute inset-0 bg-black/10 z-10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 z-0" />

        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[100px] opacity-[0.04] animate-spin-slow" />

        <div className="relative z-20 max-w-lg text-center">
          <div className="mx-auto w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
            <HeartPulse className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Streamline Your Practice.
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            {cfg.description}
          </p>

          <div className="flex gap-4 justify-center">
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 w-32">
                <span className="block text-2xl font-bold text-white mb-1">98%</span>
                <span className="text-xs text-white/70">Satisfaction</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 w-32">
                <span className="block text-2xl font-bold text-white mb-1">24/7</span>
                <span className="text-xs text-white/70">AI Triage</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 w-32">
                <span className="block text-2xl font-bold text-white mb-1">3x</span>
                <span className="text-xs text-white/70">Faster Booking</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative"
        style={{ backgroundColor: 'var(--common-bg)' }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">Select your role to continue.</p>
          </div>

          {/* Role Chiplets */}
          <div className="flex gap-2">
            {(Object.entries(ROLE_CONFIG) as [Role, RoleConfig][]).map(([key, config]) => {
              const Icon = config.icon
              const isActive = selectedRole === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedRole(key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all duration-200 ${
                    isActive ? config.chipActive : config.chipInactive
                  }`}
                >
                  <Icon size={20} className={isActive ? '' : 'text-slate-600'} />
                  <span className="text-xs font-medium">{config.label}</span>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-slate-300 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@clinic.com"
                  className={`w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl ${cfg.inputClass} text-slate-200 placeholder-slate-500 transition-all outline-none`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-slate-300 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl ${cfg.inputClass} text-slate-200 placeholder-slate-500 transition-all outline-none`}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-purple-500 focus:ring-purple-500/20 focus:ring-offset-0" />
                Remember me
              </label>
              <Link to="/doctor/forgot-password" className={`${cfg.linkClass} font-medium transition-colors`}>Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-medium py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group ${cfg.btnClass}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to {cfg.label} Portal
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
             <p className="text-slate-500 text-sm">
                Don't have an account?{' '}
                <Link to="/doctor/register" className={`${cfg.linkClass} font-medium transition-colors`}>
                   Create Clinic Account
                </Link>
             </p>
          </div>

          <div className="border-t border-slate-800 pt-6 mt-8">
             <p className="text-center text-xs text-slate-600">
                Are you a patient? <Link to="/patient/login" className="text-slate-400 hover:text-slate-200 underline">Go to Patient Portal</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
