import { useState } from 'react'
import { Brain, Loader2, AlertTriangle, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { patientAuthApi } from '../services/api'

interface TriageResult {
  urgency: string
  symptoms: string[]
  recommendation: string
  action: string
  disclaimer: string
}

const urgencyStyle: Record<string, { icon: any; label: string; color: string }> = {
  low: { icon: CheckCircle, label: 'Low', color: 'text-emerald-400' },
  medium: { icon: AlertCircle, label: 'Medium', color: 'text-amber-400' },
  high: { icon: AlertTriangle, label: 'High', color: 'text-orange-400' },
  critical: { icon: Zap, label: 'Critical', color: 'text-red-400' },
}

export default function PatientTriagePage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TriageResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const { data } = await patientAuthApi.triage(message)
      setResult(data)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Triage failed')
    } finally {
      setLoading(false)
    }
  }

  const urgency = result ? urgencyStyle[(result.urgency || '').toLowerCase()] || urgencyStyle.medium : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain size={24} className="text-amber-300" />
          AI Symptom Triage
        </h1>
        <p className="text-slate-400 text-sm mt-1">Describe your symptoms for AI-guided urgency advice.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-black/30 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full min-h-32 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-slate-200 outline-none focus:border-amber-500"
            placeholder="Example: I have severe chest pain and dizziness since morning..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            {loading ? 'Analyzing...' : 'Run Triage'}
          </button>
        </form>
      </div>

      {result && urgency && (
        <div className="rounded-xl border border-slate-800 bg-black/30 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <urgency.icon size={18} className={urgency.color} />
            <p className="text-white font-semibold">Urgency: {urgency.label}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Detected Symptoms</p>
            <div className="flex flex-wrap gap-2">
              {result.symptoms.map((symptom) => (
                <span key={symptom} className="px-2 py-1 rounded-full bg-zinc-800 text-xs text-slate-300">
                  {symptom}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Recommendation</p>
            <p className="text-slate-200 text-sm">{result.recommendation}</p>
          </div>

          <div className="rounded-lg bg-zinc-900/70 border border-zinc-700 px-3 py-2 text-xs text-slate-400">
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  )
}
