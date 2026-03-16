import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import {
  User, Lock, Mail, ChevronRight, Activity, ArrowRight, Sun, Moon
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await authApi.login(formData.email, formData.password)
      const { user, access_token } = response.data
      setAuth(user, access_token)
      toast.success('Welcome back, Dr. ' + user.full_name)
      navigate('/doctor/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {/* Left: Branding */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 opacity-90 z-10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 z-0" />
        
        {/* Animated Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[100px] opacity-[0.05] animate-spin-slow" />

        <div className="relative z-20 max-w-lg text-center">
          <div className="mx-auto w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
            <Activity className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Streamline Your Practice.
          </h1>
          <p className="text-lg text-indigo-100/80 mb-8 leading-relaxed">
            Manage appointments, automate patient outreach, and deliver exceptional care with our AI-powered platform.
          </p>
          
          <div className="flex gap-4 justify-center">
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 w-32">
                <span className="block text-2xl font-bold text-white mb-1">98%</span>
                <span className="text-xs text-indigo-200">Patient Satisfaction</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 w-32">
                <span className="block text-2xl font-bold text-white mb-1">24/7</span>
                <span className="text-xs text-indigo-200">Automated Triage</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 w-32">
                <span className="block text-2xl font-bold text-white mb-1">3x</span>
                <span className="text-xs text-indigo-200">Faster Booking</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">Please verify your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@clinic.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-200 placeholder-slate-500 transition-all outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-200 placeholder-slate-500 transition-all outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 focus:ring-offset-0" />
                Remember me
              </label>
              <a href="#" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
             <p className="text-slate-500 text-sm">
                Don't have an account?{' '}
                <Link to="/doctor/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
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
