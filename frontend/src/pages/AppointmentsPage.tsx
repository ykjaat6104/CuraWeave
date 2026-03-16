import { useEffect, useState } from 'react'
import { appointmentsApi, patientsApi } from '../services/api'
import toast from 'react-hot-toast'
import { Plus, Calendar, Clock, X, Loader2, CheckCircle, Circle, XCircle } from 'lucide-react'

interface Appointment {
  id: string
  patient_id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  status: string
  doctor_name?: string
  reminder_sent: boolean
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  scheduled: { label: 'Scheduled', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  confirmed: { label: 'Confirmed', class: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
  completed: { label: 'Completed', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Cancelled', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  no_show: { label: 'No Show', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    patient_id: '',
    title: 'General Consultation',
    scheduled_at: '',
    duration_minutes: 30,
    doctor_name: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [aRes, pRes] = await Promise.all([
        appointmentsApi.list({ limit: 100 }),
        patientsApi.list({ limit: 200 }),
      ])
      setAppointments(aRes.data)
      setPatients(pRes.data)
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await appointmentsApi.create({
        ...form,
        patient_id: parseInt(form.patient_id),
        duration_minutes: Number(form.duration_minutes),
      })
      toast.success('Appointment created!')
      setShowModal(false)
      setForm({ patient_id: '', title: 'General Consultation', scheduled_at: '', duration_minutes: 30, doctor_name: '', notes: '' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, action: 'confirm' | 'complete') => {
    try {
      if (action === 'confirm') await appointmentsApi.confirm(id)
      else await appointmentsApi.complete(id)
      toast.success(`Appointment ${action}d!`)
      load()
    } catch {
      toast.error('Failed to update')
    }
  }

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || `Patient #${id}`

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-slate-400 text-sm mt-0.5">{appointments.length} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Schedule
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="card flex flex-col items-center py-20 text-center">
              <Calendar size={48} className="text-slate-700 mb-3" />
              <p className="text-slate-400">No appointments yet. Schedule one!</p>
            </div>
          ) : (
            appointments.map(appt => {
              const sc = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled
              const apptDate = new Date(appt.scheduled_at)
              return (
                <div key={appt.id} className="card flex items-center gap-4">
                  {/* Date */}
                  <div className="text-center min-w-[52px] bg-slate-800/50 rounded-xl p-2.5">
                    <p className="text-xs text-slate-500 font-medium">{apptDate.toLocaleDateString('en', { month: 'short' })}</p>
                    <p className="text-xl font-bold text-white">{apptDate.getDate()}</p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{appt.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{getPatientName(appt.patient_id)}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {apptDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-slate-600">({appt.duration_minutes}m)</span>
                      </span>
                      {appt.doctor_name && <span>Dr. {appt.doctor_name}</span>}
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2">
                    {appt.reminder_sent && (
                      <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                        Reminded
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${sc.class}`}>
                      {sc.label}
                    </span>
                    {appt.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(appt.id, 'confirm')}
                        className="btn-ghost text-xs py-1.5 px-3"
                      >
                        Confirm
                      </button>
                    )}
                    {appt.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange(appt.id, 'complete')}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Schedule Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Patient *</label>
                <select
                  className="input-field w-full"
                  value={form.patient_id}
                  onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                  required
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title</label>
                <input className="input-field w-full" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="input-field w-full"
                    value={form.scheduled_at}
                    onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    className="input-field w-full"
                    value={form.duration_minutes}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                    min={15} max={180}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Doctor Name</label>
                <input className="input-field w-full" placeholder="Dr. Smith" value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
