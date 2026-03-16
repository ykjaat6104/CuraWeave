import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { patientAuthApi } from '../services/api'
import {
  User, Mail, Phone, Lock, Calendar, ClipboardList, Activity, Check, ArrowRight,
  ShieldCheck, HeartPulse
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

export default function PatientRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    gender: 'Other',
    clinic_id: 1, // Default clinic ID for now or from URL params
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await patientAuthApi.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone_number: formData.phone,
        date_of_birth: formData.dob || undefined,
        gender: formData.gender,
        clinic_id: Number(formData.clinic_id)
      })
      toast.success('Registration successful! Please login.')
      setTimeout(() => navigate('/patient/login'), 2000)
    } catch (err: any) {
      if (typeof err.response?.data?.detail === 'string') {
        setError(err.response?.data?.detail)
      } else {
         // Convert array of errors to string if possible, or generic message
         setError('Registration failed. Please check your inputs.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-200 antialiased overflow-hidden">
      {/* Left (Visual) */}
      <div className="hidden lg:flex w-5/12 bg-emerald-600 relative overflow-hidden items-center justify-center p-12">
         {/* Background Effect */}
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 to-teal-800 opacity-90 z-10" />
         <div className="absolute inset-0 bg-[url('/dots.svg')] bg-[size:20px_20px] opacity-20 z-0 mask-radial-faded" />

         {/* Hero Content */}
         <div className="relative z-20 max-w-md">
            <div className="mb-10 w-24 h-24 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
               <HeartPulse className="text-white w-12 h-12" />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">Welcome to CuraWeave.</h1>
            <p className="text-lg text-emerald-100/90 mb-10 leading-relaxed">
               Your personal health companion. Connect with your clinic, track your health, and stay informed.
            </p>
         </div>
      </div>

      {/* Right (Form) */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-xl space-y-8">
            <div className="text-center lg:text-left">
               <h2 className="text-3xl font-bold text-white mb-2">Create Patient Account</h2>
               <p className="text-slate-400">Join your clinic's digital network.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm">
                <ShieldCheck size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                             className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                             placeholder="John Doe"
                             value={formData.fullName}
                             onChange={handleInputChange}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-300">Phone Number</label>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                             <Phone size={18} />
                          </div>
                          <input
                             name="phone"
                             type="tel"
                             required
                             className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                             placeholder="+1 (555) 000-0000"
                             value={formData.phone}
                             onChange={handleInputChange}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Email Address</label>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <Mail size={18} />
                         </div>
                         <input
                            name="email"
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                         />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                              placeholder="Min. 8 characters"
                              value={formData.password}
                              onChange={handleInputChange}
                           />
                        </div>
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
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                              placeholder="Re-enter password"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Date of Birth</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                              <Calendar size={18} />
                           </div>
                           <input
                              name="dob"
                              type="date"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-200 placeholder-slate-600 transition-all outline-none"
                              value={formData.dob}
                              onChange={handleInputChange}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Gender</label>
                        <div className="relative">
                           <select
                              name="gender"
                              className="w-full pl-3 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-200 placeholder-slate-600 transition-all outline-none appearance-none cursor-pointer"
                              value={formData.gender}
                              onChange={handleInputChange}
                           >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                              <option value="Prefer not to say">Prefer not to say</option>
                           </select>
                           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                              <ArrowRight size={14} className="rotate-90" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Clinic ID (Auto-filled from Link)</label>
                      <input
                          name="clinic_id"
                          type="number"
                          readOnly
                          className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-800 rounded-lg text-slate-500 cursor-not-allowed"
                          value={formData.clinic_id}
                      />
                  </div>
                </div>

               <div className="pt-4">
                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {loading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <>
                         Register Account
                         <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                       </>
                     )}
                  </button>
               </div>
            </form>

            <div className="text-center pt-2">
               <p className="text-slate-500 text-sm">
                  Already have an account?{' '}
                  <Link to="/patient/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                     Sign in
                  </Link>
               </p>
            </div>
        </div>
      </div>
    </div>
  )
}

