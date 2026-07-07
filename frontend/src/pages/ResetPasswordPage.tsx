import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { Lock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
      toast.success('Password reset successfully')
      setTimeout(() => navigate('/doctor/login'), 2000)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (detail?.code === 'WEAK_PASSWORD') {
        setError('Password does not meet requirements')
      } else {
        setError('Failed to reset password. The link may have expired.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen theme-surface text-slate-200 items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Password reset!</h2>
          <p className="text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex min-h-screen theme-surface text-slate-200 items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Invalid reset link</h2>
          <p className="text-slate-400">This link is missing or invalid. Please request a new one.</p>
          <Link to="/doctor/forgot-password" className="text-purple-300 hover:text-purple-200 font-medium">
            Request new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen theme-surface text-slate-200 items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Set new password</h2>
          <p className="text-slate-400">Must be at least 8 characters with uppercase, lowercase, digit, and special character.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-300 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="New password"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-500 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-300 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="Confirm new password"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-500 transition-all outline-none"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
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
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
