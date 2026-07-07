import React, { useState, useEffect } from 'react'
import { authApi } from '../services/api'
import { User, Mail, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Profile {
  id: string
  email: string
  name: string | null
  role: string
  clinic_id: string
  email_verified: boolean
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await authApi.getProfile()
        setProfile(res.data)
        setName(res.data.name || '')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authApi.updateProfile({ name })
      setProfile(res.data)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      await authApi.changePassword(oldPassword, newPassword)
      toast.success('Password changed')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-slate-500">Loading profile...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <User size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-slate-400 text-sm">Manage your account information</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-slate-400">
            <Mail size={16} className="text-slate-500" />
            {profile?.email || '—'}
            {profile?.email_verified ? (
              <span className="ml-auto text-xs text-green-400">Verified</span>
            ) : (
              <span className="ml-auto text-xs text-amber-400">Not verified</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Role</label>
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-slate-400 capitalize">
            {profile?.role || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <User size={16} />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Lock size={18} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <input
              type="password"
              required
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>
          <div>
            <input
              type="password"
              required
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>
          <div>
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>
          <p className="text-xs text-slate-500">Min 8 characters, uppercase, lowercase, digit, and special character required.</p>
          <button
            type="submit"
            disabled={changingPassword}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
