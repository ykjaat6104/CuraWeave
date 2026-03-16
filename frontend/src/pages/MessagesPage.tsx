import { useEffect, useState } from 'react'
import { messagesApi, patientsApi } from '../services/api'
import toast from 'react-hot-toast'
import { MessageSquare, Send, Loader2, Phone, Bot, User } from 'lucide-react'

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        messagesApi.list(selectedPatient || undefined),
        patientsApi.list({ limit: 200 }),
      ])
      setMessages(mRes.data)
      setPatients(pRes.data)
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [selectedPatient])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !content.trim()) {
      toast.error('Select a patient and enter a message')
      return
    }
    setSending(true)
    try {
      await messagesApi.send({ patient_id: selectedPatient, content })
      toast.success('Message sent via WhatsApp!')
      setContent('')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare size={24} className="text-brand-400" />
          Messages
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">WhatsApp & Email communication center</p>
      </div>

      {/* Send Message */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Send Direct Message</h2>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Patient</label>
              <select
                className="input-field w-full"
                value={selectedPatient}
                onChange={e => setSelectedPatient(e.target.value)}
              >
                <option value="">All messages / Select patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <textarea
              className="input-field flex-1 resize-none"
              rows={3}
              placeholder="Type your message here..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <button
              type="submit"
              disabled={sending || !selectedPatient || !content.trim()}
              className="btn-primary px-5 flex flex-col items-center justify-center gap-1"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              <span className="text-xs">{sending ? 'Sending' : 'Send'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Message List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">
            Message History {selectedPatient && `— ${patients.find(p => p.id === selectedPatient)?.name}`}
          </h2>
          <span className="text-xs text-slate-500">{messages.length} messages</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-500" size={24} /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <MessageSquare size={40} className="text-slate-700 mb-3" />
            <p className="text-slate-400">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.direction === 'outbound' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  msg.direction === 'outbound' ? 'bg-brand-500/20' : 'bg-slate-700'
                }`}>
                  {msg.direction === 'outbound'
                    ? <Bot size={14} className="text-brand-400" />
                    : <User size={14} className="text-slate-400" />
                  }
                </div>
                <div className={`max-w-[70%] ${msg.direction === 'outbound' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.direction === 'outbound'
                      ? 'bg-brand-500/20 text-brand-100 rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <span className="capitalize">{msg.channel}</span>
                    <span>·</span>
                    <span className="capitalize">{msg.status}</span>
                    <span>·</span>
                    <span>{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
