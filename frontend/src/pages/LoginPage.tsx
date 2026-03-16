import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Stethoscope, ArrowRight, Loader2, Check } from 'lucide-react'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  
  // Login State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  
  // Register State
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    owner_name: '',
    owner_password: '',
    timezone: 'UTC',
  })

  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { setAuth, isAuthenticated, user } = useAuthStore()
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
  
  // If ?mode=register is in URL, switch to register
  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      setAuth(data.user, data.access_token, rememberMe)
      toast.success('Welcome back!')
      navigate('/doctor/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.register(regForm)
      // Auto-login after register
      const { data } = await authApi.login(regForm.email, regForm.owner_password)
      setAuth(data.user, data.access_token, true)
      toast.success('Welcome to CuraWeave!')
      navigate('/doctor/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const updateReg = (k: string, v: string) => setRegForm(f => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      <div className={`w-full max-w-md relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Floating Toggle Pill */}
        <div className="bg-slate-800/80 backdrop-blur-md p-1.5 rounded-full border border-slate-700/50 flex gap-1 mb-6 mx-auto w-fit shadow-xl relative z-20">
          <button
            onClick={() => setIsLogin(true)}
            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              isLogin 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              !isLogin 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            New Clinic
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 mb-4 transform transition-transform hover:scale-105 duration-300">
            <Stethoscope size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CuraWeave</h1>
          <p className="text-slate-400 mt-1">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="card backdrop-blur-sm border border-slate-800/50 shadow-2xl overflow-hidden p-6 relative z-10">
          {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="group">
                  <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-blue-400 transition-colors">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="admin@clinic.com"
                    required
                  />
                </div>
                <div className="group">
                  <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-blue-400 transition-colors">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                      {rememberMe && <Check size={12} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <span className={`text-sm transition-colors ${rememberMe ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-300'}`}>
                      Remember me
                    </span>
                  </label>
                  
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/20 ${loading ? 'opacity-80 scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="group">
                  <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-blue-400 transition-colors">Clinic Name *</label>
                  <input
                    className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="City Health Clinic"
                    value={regForm.name}
                    onChange={e => updateReg('name', e.target.value)}
                    required
                  />
                </div>
                <div className="group">
                  <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-blue-400 transition-colors">Clinic Phone</label>
                  <input
                    className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="+91 98765 43210"
                    value={regForm.phone}
                    onChange={e => updateReg('phone', e.target.value)}
                  />
                </div>
                <div className="group">
                  <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-blue-400 transition-colors">Clinic Email *</label>
                  <input
                    type="email"
                    className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="contact@clinic.com"
                    value={regForm.email}
                    onChange={e => updateReg('email', e.target.value)}
                    required
                  />
                </div>

                <hr className="border-slate-800" />
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Owner Account</p>

                <div className="group">
                  <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-blue-400 transition-colors">Your Full Name *</label>
                  <input
                    className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="Dr. Priya Sharma"
                    value={regForm.owner_name}
                    onChange={e => updateReg('owner_name', e.target.value)}
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-sm text-slate-400 mb-1.5 group-focus-within:text-blue-400 transition-colors">Password *</label>
                  <input
                    type="password"
                    className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="Minimum 8 characters"
                    value={regForm.owner_password}
                    onChange={e => updateReg('owner_password', e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/20 ${loading ? 'opacity-80 scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Creating clinic...' : 'Create Clinic Account'}
                </button>
              </form>
            )}
        </div>

        {/* Demo hint - Only show on Login tab or general footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-600">
            {isLogin ? "Demo: Register a new clinic to get started" : "Start your 14-day free trial"}
          </p>
        </div>
      </div>
    </div>
  )
}
