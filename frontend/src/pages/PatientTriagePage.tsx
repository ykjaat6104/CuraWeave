import { useEffect, useRef, useState } from 'react'
import {
  Brain, Loader2, AlertTriangle, CheckCircle, AlertCircle,
  Send, Clock, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import MedicalDisclaimer from '../components/MedicalDisclaimer'
import { patientAuthApi } from '../services/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  urgency?: string
  symptoms?: string[]
}

interface TriageHistoryItem {
  id: string
  symptoms: string
  urgency_level: string
  ai_response: string
  created_at: string
}

const urgencyBadge: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  low: { icon: CheckCircle, label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  medium: { icon: AlertCircle, label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  high: { icon: AlertTriangle, label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' },
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return <br key={i} />
    if (trimmed.startsWith('•')) {
      return <li key={i} className="text-slate-300 text-sm ml-4 list-disc">{renderInlineBold(trimmed.slice(1).trim())}</li>
    }
    if (trimmed.startsWith('⚠')) {
      return <p key={i} className="text-xs text-amber-400 mt-3 italic">{trimmed}</p>
    }
    if (trimmed.startsWith('🔴') || trimmed.startsWith('🟡') || trimmed.startsWith('🟢')) {
      return <p key={i} className="font-semibold text-white mt-2">{renderInlineBold(trimmed)}</p>
    }
    if (trimmed.startsWith('**')) {
      return <p key={i} className="font-semibold text-white mt-3 mb-1">{renderInlineBold(trimmed)}</p>
    }
    return <p key={i} className="text-slate-300 text-sm">{renderInlineBold(trimmed)}</p>
  })
}

export default function PatientTriagePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<TriageHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const { data } = await patientAuthApi.getTriageHistory()
      setHistory(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load triage history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || loading) return

    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: msg }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const convHistory = messages.map((m) => ({ role: m.role, content: m.content }))

    try {
      const { data } = await patientAuthApi.triage(msg, convHistory)
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.recommendation || '',
        urgency: data.urgency,
        symptoms: data.symptoms,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: typeof detail === 'string' ? detail : 'Triage failed. Please try again.',
      }
      setMessages((prev) => [...prev, errorMsg])
      toast.error(typeof detail === 'string' ? detail : 'Triage failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain size={24} className="text-amber-300" />
            AI Symptom Triage
          </h1>
          <p className="text-slate-400 text-sm mt-1">Describe your symptoms for AI-guided advice. You can ask follow-ups freely.</p>
        </div>
        <button
          onClick={() => { setShowHistory(!showHistory); if (!showHistory && history.length === 0) loadHistory() }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-sm transition-colors"
        >
          <Clock size={15} />
          History
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="mb-4 rounded-xl border border-slate-800 bg-black/30 p-4 max-h-60 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MessageSquare size={14} className="text-slate-400" />
            Past Triage Sessions
          </h3>
          {historyLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500">No past triage sessions.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const badge = urgencyBadge[item.urgency_level] || urgencyBadge.low
                const BadgeIcon = badge.icon
                return (
                  <div key={item.id} className="rounded-lg bg-zinc-900/70 border border-zinc-800 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.color}`}>
                        <BadgeIcon size={10} />
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Symptoms: {item.symptoms || 'N/A'}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.ai_response.slice(0, 150)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Brain size={32} className="text-amber-400" />
            </div>
            <h3 className="text-white font-medium mb-2">How are you feeling today?</h3>
            <p className="text-slate-500 text-sm max-w-md">
              Describe your symptoms below. I'll assess the urgency, suggest possible causes,
              and recommend what to do next. You can keep asking follow-up questions.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-4 ${
                msg.role === 'user'
                  ? 'bg-amber-600/20 border border-amber-600/30'
                  : 'bg-slate-900 border border-slate-800'
              }`}>
                {msg.role === 'assistant' && msg.urgency && (
                  <div className="flex items-center gap-2 mb-3">
                    {(() => {
                      const badge = urgencyBadge[msg.urgency] || urgencyBadge.medium
                      const BadgeIcon = badge.icon
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>
                          <BadgeIcon size={12} />
                          {badge.label}
                        </span>
                      )
                    })()}
                    {msg.symptoms && msg.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {msg.symptoms.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs text-slate-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-sm leading-relaxed">
                  {renderContent(msg.content)}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Analyzing...
              </div>
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      <div className="mt-4 border-t border-slate-800 pt-4">
        <div className="flex items-end gap-3">
          <textarea
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-slate-200 outline-none focus:border-amber-500 resize-none text-sm"
            rows={2}
            placeholder="Describe your symptoms or ask a follow-up question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition-colors"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <MedicalDisclaimer />
      </div>
    </div>
  )
}
