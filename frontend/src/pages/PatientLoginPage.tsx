import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { patientAuthApi } from '../services/api'
import {
  User, Lock, Mail, ChevronRight, Activity, ArrowRight, Sun, Moon,
  HeartPulse
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function PatientLoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

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
      const response = await patientAuthApi.login(formData.email, formData.password)
      const { user, access_token } = response.data
      setAuth(user, access_token)
      toast.success('Welcome back, ' + (user.name || user.email))
      navigate('/patient/dashboard')
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen theme-surface text-slate-200">
      {/* Left: Branding */}
      <div className="hidden lg:flex w-1/2 patient-gradient relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-black/12 z-10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 z-0" />
        
        {/* Animated Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-300 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[100px] opacity-[0.05] animate-spin-slow" />

        <div className="relative z-20 max-w-lg text-center">
          <div className="mx-auto w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
            <HeartPulse className="text-white w-12 h-12" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Your Health, Simplified.
          </h1>
          <p className="text-lg text-amber-100/90 mb-8 leading-relaxed">
            Manage your appointments, message your doctor, and access your medical records from anywhere.
          </p>
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
            <h2 className="text-3xl font-bold text-white mb-2">Patient Portal</h2>
            <p className="text-slate-400">Please verify your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-amber-300 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-200 placeholder-slate-500 transition-all outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-amber-300 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-200 placeholder-slate-500 transition-all outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0" />
                Remember me
              </label>
              <a href="#" className="text-amber-300 hover:text-amber-200 font-medium transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-amber-600/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Patient Portal
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
             <p className="text-slate-500 text-sm">
                First time here?{' '}
                 <Link to="/patient/register" className="text-amber-300 hover:text-amber-200 font-medium transition-colors">
                   Register as Patient
                </Link>
             </p>
          </div>

          <div className="border-t border-slate-800 pt-6 mt-8">
             <p className="text-center text-xs text-slate-600">
                Are you a doctor? <Link to="/doctor/login" className="text-slate-400 hover:text-slate-200 underline">Go to Clinic Portal</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
