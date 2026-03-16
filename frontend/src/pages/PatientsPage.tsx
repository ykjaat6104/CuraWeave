import { useEffect, useState } from 'react'
import { patientsApi } from '../services/api'
import toast from 'react-hot-toast'
import { Plus, Search, Phone, Mail, Tag, X, Loader2, ChevronDown, UserCheck } from 'lucide-react'

interface Patient {
  id: string
  name: string
  email?: string
  phone: string
  gender?: string
  tags?: string[]
  is_active: boolean
  created_at: string
}

interface PatientFormData {
  name: string
  email: string
  phone: string
  gender: string
  notes: string
  tags: string[]
}

const EMPTY_FORM: PatientFormData = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  notes: '',
  tags: [],
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<PatientFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const load = async (q = '') => {
    try {
      const { data } = await patientsApi.list({ search: q || undefined })
      setPatients(data)
    } catch {
      toast.error('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await patientsApi.create(form)
      toast.success('Patient added & welcome message sent!')
      setShowModal(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add patient')
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-slate-400 text-sm mt-0.5">{patients.length} total records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Patient
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input-field w-full pl-10"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">Patient</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">Tags</th>
                <th className="text-left px-5 py-3.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">Registered</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500">
                    <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No patients yet. Add your first patient!</p>
                  </td>
                </tr>
              ) : (
                patients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-sm">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium text-sm">{p.name}</p>
                          <p className="text-slate-500 text-xs capitalize">{p.gender || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Phone size={12} />
                          {p.phone}
                        </div>
                        {p.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <Mail size={12} />
                            {p.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || []).map(tag => (
                          <span key={tag} className="badge-low text-xs px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <button className="btn-ghost text-xs py-1.5 px-3">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Add New Patient</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                  <input
                    className="input-field w-full"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone *</label>
                  <input
                    className="input-field w-full"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    className="input-field w-full"
                    placeholder="patient@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Gender</label>
                  <select
                    className="input-field w-full"
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tags</label>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="diabetes, hypertension..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button type="button" onClick={addTag} className="btn-ghost px-3">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="badge-low text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Medical Notes</label>
                <textarea
                  className="input-field w-full resize-none"
                  rows={3}
                  placeholder="Allergies, conditions, notes..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
