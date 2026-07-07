import { useEffect, useState } from 'react'
import { Shield, Plus, Mail, User, Search, X, Check, Loader2 } from 'lucide-react'
import { usersApi } from '../services/api'
import toast from 'react-hot-toast'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
}

const roleColors: Record<string, string> = {
  admin: 'bg-indigo-500/20 text-indigo-300',
  doctor: 'bg-purple-500/20 text-purple-300',

}

export default function AdminStaffPage() {
  const [members, setMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'doctor', password: '' })
  const [inviting, setInviting] = useState(false)

  const fetchMembers = async () => {
    try {
      const { data } = await usersApi.list()
      setMembers(data)
    } catch {
      toast.error('Failed to load team')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    try {
      await usersApi.invite(inviteForm)
      toast.success(`${inviteForm.role} account created for ${inviteForm.name}`)
      setShowInvite(false)
      setInviteForm({ name: '', email: '', role: 'staff', password: '' })
      await fetchMembers()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create account')
    } finally {
      setInviting(false)
    }
  }

  const filtered = members.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={24} className="text-indigo-400" />
            Team Management
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage doctors and admin accounts</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="btn-primary bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-500/25"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowInvite(false)}>
          <div className="card max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Add Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field w-full mt-1"
                  placeholder="Jane Doe"
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  className="input-field w-full mt-1"
                  placeholder="jane@clinic.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="input-field w-full mt-1"
                  placeholder="Min 8 characters"
                  value={inviteForm.password}
                  onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Role</label>
                <select
                  className="input-field w-full mt-1"
                  value={inviteForm.role}
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={inviting} className="btn-primary flex-1 bg-indigo-600 hover:bg-indigo-500">
                  {inviting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-field w-full pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No team members found</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span className="font-medium text-slate-300">{member.name?.[0] || '?'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[member.role] || 'bg-slate-500/20 text-slate-400'}`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-slate-500">{member.email}</span>
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${member.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {member.is_active ? <Check size={12} /> : <X size={12} />}
                  {member.is_active ? 'active' : 'inactive'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
