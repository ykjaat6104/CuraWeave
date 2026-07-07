import { useState, useEffect } from 'react'
import { auditApi } from '../services/api'
import { ClipboardList, LogIn, User, Search, Filter, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AuditLog {
  id: string
  user_name: string | null
  user_role: string | null
  action: string
  resource: string
  resource_id: string | null
  details: string | null
  ip_address: string | null
  created_at: string | null
}

const roleColors: Record<string, string> = {
  admin: 'bg-indigo-500/20 text-indigo-300',
  doctor: 'bg-purple-500/20 text-purple-300',
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const fetchLogs = async () => {
    try {
      const { data } = await auditApi.list()
      setLogs(data)
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = logs.filter(log => {
    const matchesSearch = (log.user_name || '').toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || (log.user_role || '') === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList size={24} className="text-indigo-400" />
          Audit Logs
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track all user activity across the clinic</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name..."
              className="input-field w-full pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            {['all', 'admin', 'doctor'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                  roleFilter === r
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-300 bg-zinc-900 border border-zinc-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No audit logs found</p>
        ) : (
          <div className="space-y-1">
            {filtered.map(log => (
              <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900/60 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  log.action === 'login' ? 'bg-emerald-500/15' : 'bg-zinc-800'
                }`}>
                  {log.action === 'login'
                    ? <LogIn size={16} className="text-emerald-400" />
                    : <User size={16} className="text-slate-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{log.user_name || 'Unknown'}</span>
                    {log.user_role && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[log.user_role] || 'bg-slate-500/20 text-slate-400'}`}>
                        {log.user_role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="capitalize">{log.action}</span>
                    {log.resource && <span className="ml-1">on {log.resource}</span>}
                    {log.ip_address && <span className="ml-2">· {log.ip_address}</span>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {log.created_at && (
                    <>
                      <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-600">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
