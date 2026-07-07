import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../services/api'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen theme-surface text-slate-200 items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Check your inbox</h2>
          <p className="text-slate-400">
            If an account exists for <strong className="text-slate-200">{email}</strong>,
            we've sent a password reset link.
          </p>
          <Link
            to="/doctor/login"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 font-medium"
          >
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen theme-surface text-slate-200 items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Forgot password?</h2>
          <p className="text-slate-400">Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-300 transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              placeholder="name@clinic.com"
              className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-500 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="text-center">
          <Link to="/doctor/login" className="text-purple-300 hover:text-purple-200 font-medium inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
