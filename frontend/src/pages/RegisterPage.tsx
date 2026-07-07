import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import {
  Mail, Lock, Hospital, Activity, ArrowRight, User,
  ShieldCheck, BrainCircuit, Calendar, MessageSquare, Shield, Stethoscope
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import PhoneInput from '../components/PhoneInput'

type Role = 'admin' | 'doctor'

const ROLE_CHIPS: { key: Role; label: string; icon: any; activeClass: string }[] = [
  { key: 'admin', label: 'Admin', icon: Shield, activeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  { key: 'doctor', label: 'Doctor', icon: Stethoscope, activeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
]

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('admin')
  const [formData, setFormData] = useState({
    clinicName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialization: 'GP',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

   const getErrorMessage = (err: any, fallback: string) => {
      const data = err?.response?.data
      const detail = data?.detail || data?.error?.message
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
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.register({
            name: formData.clinicName,
        email: formData.email,
            phone: formData.phone,
            owner_name: formData.fullName,
            owner_password: formData.password,
            role: selectedRole,
      })
         toast.success('Registration successful! Please sign in.')
      setTimeout(() => navigate('/doctor/login'), 2000)
    } catch (err: any) {
         setError(getErrorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
   <div className="flex theme-surface min-h-screen text-slate-200 antialiased overflow-hidden">
      {/* Left (Visual) */}
      <div className="hidden lg:flex w-5/12 doctor-gradient relative overflow-hidden items-center justify-center p-12">
         {/* Background Effect */}
         <div className="absolute inset-0 bg-black/10 z-10" />
         <div className="absolute inset-0 bg-[url('/dots.svg')] bg-[size:20px_20px] opacity-20 z-0 mask-radial-faded" />

         {/* Hero Content */}
         <div className="relative z-20 max-w-md">
            <div className="mb-10 w-24 h-24 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
               <Activity className="text-white w-12 h-12" />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">Start Your Digital Clinic.</h1>
            <p className="text-lg text-purple-100/90 mb-10 leading-relaxed">
               Join thousands of healthcare providers using CuraWeave to automate patient care and grow their practice.
            </p>

            <div className="space-y-6">
               <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                     <BrainCircuit className="text-white w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-semibold text-white">AI-Powered Triage</h3>
                     <p className="text-sm text-purple-200">Automatically prioritize urgent cases.</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                     <Calendar className="text-white w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-semibold text-white">Smart Scheduling</h3>
                     <p className="text-sm text-purple-200">Reduce no-shows with automated reminders.</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                     <MessageSquare className="text-white w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-semibold text-white">Secure Messaging</h3>
                     <p className="text-sm text-purple-200">HIPAA-compliant communication.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Right (Form) */}
         <div
            className="w-full lg:w-7/12 flex items-center justify-center p-8 overflow-y-auto"
            style={{ backgroundColor: 'var(--common-bg)' }}
         >
        <div className="w-full max-w-2xl space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
                <p className="text-slate-400">Choose your role and get started.</p>
             </div>

             {/* Role Chiplets */}
             <div className="flex gap-2">
               {ROLE_CHIPS.map(({ key, label, icon: Icon, activeClass }) => (
                 <button
                   key={key}
                   type="button"
                   onClick={() => setSelectedRole(key)}
                   className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all duration-200 ${
                     selectedRole === key
                       ? activeClass
                       : 'bg-zinc-900/60 border-zinc-800 text-slate-500 hover:text-slate-300 hover:border-zinc-700'
                   }`}
                 >
                   <Icon size={20} className={selectedRole === key ? '' : 'text-slate-600'} />
                   <span className="text-xs font-medium">{label}</span>
                 </button>
               ))}
             </div>

            {error && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Clinic Details */}
                  <div className="col-span-1 md:col-span-2 space-y-6 pt-2">
                     <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2">Clinic Information</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-slate-300">Clinic Name</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                 <Hospital size={18} />
                              </div>
                              <input
                                 name="clinicName"
                                 type="text"
                                 required
                                 className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                                 placeholder="Healthy Life Medical Center"
                                 value={formData.clinicName}
                                 onChange={handleInputChange}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-slate-300">Specialization</label>
                           <div className="relative">
                              <select
                                 name="specialization"
                                 className="w-full pl-3 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-600 transition-all outline-none appearance-none cursor-pointer"
                                 value={formData.specialization}
                                 onChange={handleInputChange}
                              >
                                 <option value="GP">General Practice</option>
                                 <option value="Dentistry">Dentistry</option>
                                 <option value="Dermatology">Dermatology</option>
                                 <option value="Cardiology">Cardiology</option>
                                 <option value="Pediatrics">Pediatrics</option>
                                 <option value="Mental Health">Mental Health</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                                 <ArrowRight size={14} className="rotate-90" />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Personal Details */}
                  <div className="col-span-1 md:col-span-2 space-y-6 pt-4">
                     <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2">Administrator Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-slate-300">Full Name</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                 <User size={18} />
                              </div>
                              <input
                                 name="fullName"
                                 type="text"
                                 required
                                 className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                                 placeholder="Dr. John Doe"
                                 value={formData.fullName}
                                 onChange={handleInputChange}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <PhoneInput
                             value={formData.phone}
                             onChange={(val) => setFormData({ ...formData, phone: val })}
                             required
                             accentColor="purple"
                           />
                        </div>
                        <div className="space-y-2 col-span-2">
                           <label className="text-sm font-medium text-slate-300">Email Address</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                 <Mail size={18} />
                              </div>
                              <input
                                 name="email"
                                 type="email"
                                 required
                                 className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                                 placeholder="doctor@clinic.com"
                                 value={formData.email}
                                 onChange={handleInputChange}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-slate-300">Password</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                 <Lock size={18} />
                              </div>
                               <input
                                  name="password"
                                  type="password"
                                  required
                                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                                  placeholder="Min. 8 characters"
                                  value={formData.password}
                                  onChange={handleInputChange}
                               />
                           </div>
                           <p className="text-xs text-slate-500">Requires: uppercase, lowercase, digit, and a special character (!&#64;#$%^&amp;*)</p>
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                 <Lock size={18} />
                              </div>
                              <input
                                 name="confirmPassword"
                                 type="password"
                                 required
                                 className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                                 placeholder="Re-enter password"
                                 value={formData.confirmPassword}
                                 onChange={handleInputChange}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-4">
                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {loading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <>
                         Create Clinic Account
                         <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                       </>
                     )}
                  </button>
               </div>
            </form>

            <div className="text-center pt-2">
               <p className="text-slate-500 text-sm">
                  Already have an account?{' '}
                  <Link to="/doctor/login" className="text-purple-300 hover:text-purple-200 font-medium transition-colors">
                     Sign in
                  </Link>
               </p>
            </div>
        </div>
      </div>
    </div>
  )
}
