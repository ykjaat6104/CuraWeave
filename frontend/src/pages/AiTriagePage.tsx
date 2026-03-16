import { useState, useEffect } from 'react'
import { aiApi } from '../services/api'
import toast from 'react-hot-toast'
import { Brain, Send, AlertTriangle, CheckCircle, AlertCircle, Zap, Loader2, Activity } from 'lucide-react'

interface TriageResult {
  urgency: string
  symptoms: string[]
  recommendation: string
  action: string
  disclaimer: string
}

interface TriageLog {
  id: number
  patient_message: string
  symptoms: string[]
  urgency: string
  recommendation: string
  action: string
  created_at: string
}

const URGENCY_CONFIG = {
  low: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', badge: 'badge-low', label: 'Low' },
  medium: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', badge: 'badge-medium', label: 'Medium' },
  high: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', badge: 'badge-high', label: 'High' },
  critical: { icon: Zap, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', badge: 'badge-critical', label: 'Critical' },
}

export default function AiTriagePage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TriageResult | null>(null)
  const [logs, setLogs] = useState<TriageLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  const loadLogs = async () => {
    try {
      const { data } = await aiApi.getTriageLogs()
      setLogs(data)
    } catch {
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => { loadLogs() }, [])

  const handleTriage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await aiApi.triage({ message })
      setResult(data)
      loadLogs()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Triage failed')
    } finally {
      setLoading(false)
    }
  }

  const urgencyConfig = result ? URGENCY_CONFIG[result.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.medium : null

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain size={26} className="text-brand-400" />
          AI Symptom Triage
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          LangGraph-powered AI analyzes symptoms and routes patients appropriately
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-white mb-4">Submit Patient Symptoms</h2>
            <form onSubmit={handleTriage} className="space-y-4">
              <textarea
                className="input-field w-full resize-none"
                rows={5}
                placeholder="Enter patient's symptoms or message...
e.g. 'I have been having chest pain and shortness of breath for the past 2 hours'"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                {loading ? 'Analyzing with Gemini AI...' : 'Run AI Triage'}
              </button>
            </form>
          </div>

          {/* Flow Steps */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">LangGraph Pipeline</h3>
            <div className="space-y-2">
              {[
                { step: '1', label: 'Symptom Extraction', desc: 'Gemini extracts symptoms from message' },
                { step: '2', label: 'Urgency Assessment', desc: 'Scores urgency: low / medium / high / critical' },
                { step: '3', label: 'Routing Decision', desc: 'Determines appropriate action & response' },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30">
                  <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {result && urgencyConfig && (
            <div className={`card border ${urgencyConfig.bg}`}>
              <div className="flex items-center gap-3 mb-4">
                <urgencyConfig.icon size={24} className={urgencyConfig.color} />
                <div>
                  <h2 className="font-bold text-white text-lg">Triage Result</h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${urgencyConfig.badge}`}>
                    {urgencyConfig.label.toUpperCase()} URGENCY
                  </span>
                </div>
              </div>

              {/* Symptoms */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Detected Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {result.symptoms.map(s => (
                    <span key={s} className="bg-slate-800/60 text-slate-300 text-xs px-2.5 py-1 rounded-full border border-slate-700/50">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">AI Recommendation</p>
                <p className="text-slate-200 text-sm leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Action */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Routing Action</p>
                <span className="bg-brand-500/20 text-brand-400 text-xs px-3 py-1 rounded-full border border-brand-500/30 font-mono">
                  {result.action}
                </span>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-500 italic">{result.disclaimer}</p>
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Brain size={48} className="text-slate-700 mb-3" />
              <p className="text-slate-400">Submit patient symptoms to see AI triage results</p>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="relative">
                <Brain size={48} className="text-brand-500 mb-3" />
                <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping" />
              </div>
              <p className="text-slate-300 font-medium mt-4">Gemini AI is analyzing...</p>
              <p className="text-slate-500 text-sm mt-1">LangGraph pipeline running</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Triage Logs */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-brand-400" />
          <h2 className="font-semibold text-white">Recent Triage Sessions</h2>
        </div>
        {logsLoading ? (
          <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-brand-500" size={24} /></div>
        ) : logs.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No triage sessions yet</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => {
              const cfg = URGENCY_CONFIG[log.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.medium
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
                  <cfg.icon size={18} className={`${cfg.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{log.patient_message}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(log.symptoms || []).slice(0, 3).map(s => (
                        <span key={s} className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.badge} capitalize`}>
                      {log.urgency}
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
