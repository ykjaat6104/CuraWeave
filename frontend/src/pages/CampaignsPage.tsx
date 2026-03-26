import { useEffect, useState } from 'react'
import { campaignsApi } from '../services/api'
import toast from 'react-hot-toast'
import { Plus, Megaphone, Play, Clock, CheckCircle, X, Loader2, Sparkles } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description?: string
  message_template: string
  target_tags: string[]
  channel: string
  status: string
  sent_count: number
  delivered_count: number
  reply_count: number
  created_at: string
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock size={14} className="text-slate-400" />,
  running: <Play size={14} className="text-brand-400" />,
  completed: <CheckCircle size={14} className="text-emerald-400" />,
  scheduled: <Clock size={14} className="text-purple-300" />,
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    message_template: '',
    target_tags: [] as string[],
    channel: 'whatsapp',
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [launching, setLaunching] = useState<string | null>(null)

  const load = async () => {
    try {
      const { data } = await campaignsApi.list()
      setCampaigns(data)
    } catch {
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await campaignsApi.create(form)
      toast.success('Campaign created!')
      setShowModal(false)
      setForm({ name: '', description: '', message_template: '', target_tags: [], channel: 'whatsapp' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleLaunch = async (id: string) => {
    setLaunching(id)
    try {
      await campaignsApi.launch(id)
      toast.success('Campaign launched! Messages are being sent.')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to launch')
    } finally {
      setLaunching(null)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone size={24} className="text-brand-400" />
            Campaigns
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-powered patient marketing & engagement</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-brand-500" size={32} /></div>
      ) : campaigns.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-center">
          <Megaphone size={48} className="text-slate-700 mb-3" />
          <p className="text-slate-300 font-medium">No campaigns yet</p>
          <p className="text-slate-500 text-sm mt-1">Create your first patient engagement campaign</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{c.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full capitalize">
                      {STATUS_ICONS[c.status]}
                      {c.status}
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-full uppercase">{c.channel}</span>
                  </div>
                  {c.description && <p className="text-slate-400 text-sm mb-2">{c.description}</p>}
                  <p className="text-slate-500 text-xs bg-slate-800/30 rounded-lg p-2 italic">
                    "{c.message_template.substring(0, 120)}{c.message_template.length > 120 ? '...' : ''}"
                  </p>

                  {c.target_tags?.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-xs text-slate-500">Target:</span>
                      {c.target_tags.map(t => (
                        <span key={t} className="badge-low text-xs px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  {c.sent_count > 0 && (
                    <div className="flex gap-4 mt-3 text-xs">
                      <div><span className="text-slate-500">Sent </span><span className="text-white font-medium">{c.sent_count}</span></div>
                      <div><span className="text-slate-500">Delivered </span><span className="text-white font-medium">{c.delivered_count}</span></div>
                      <div><span className="text-slate-500">Replies </span><span className="text-white font-medium">{c.reply_count}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {(c.status === 'draft' || c.status === 'scheduled') && (
                    <button
                      onClick={() => handleLaunch(c.id)}
                      disabled={launching === c.id}
                      className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
                    >
                      {launching === c.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      {launching === c.id ? 'Launching...' : 'Launch'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Create Campaign</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Campaign Name *</label>
                <input className="input-field w-full" placeholder="Summer Health Check Reminder" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <input className="input-field w-full" placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Sparkles size={12} className="text-brand-400" />
                  Message Template * (AI will personalize)
                </label>
                <textarea
                  className="input-field w-full resize-none"
                  rows={4}
                  placeholder="Hello! We'd like to remind you about your annual health checkup. Use {{patient_name}} for personalization."
                  value={form.message_template}
                  onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Channel</label>
                  <select className="input-field w-full" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Tag</label>
                  <div className="flex gap-2">
                    <input className="input-field flex-1" placeholder="diabetes" value={tagInput} onChange={e => setTagInput(e.target.value)} />
                    <button type="button" onClick={() => { if (tagInput.trim()) { setForm(f => ({ ...f, target_tags: [...f.target_tags, tagInput.trim()] })); setTagInput('') } }} className="btn-ghost px-2 text-xs">+</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
