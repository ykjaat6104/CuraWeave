import { useState } from 'react'
import { Plus, Link2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { patientAuthApi } from '../services/api'

export default function PatientAppointmentsPage() {
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [code, setCode] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      toast.error('Please enter your code')
      return
    }

    setConnecting(true)
    try {
      const { data } = await patientAuthApi.connectViaCode(code.trim())
      toast.success(data?.message || 'Doctor connected successfully')
      setCode('')
      setShowConnectModal(false)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Failed to connect doctor')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-slate-400">Manage your visits and connect with your doctor.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium flex items-center gap-2"
          >
            <Link2 size={16} />
            Add Doctor via Code
          </button>
          <button className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-sm font-medium flex items-center gap-2">
            <Plus size={16} />
            Book Appointment
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-black/30 p-8 text-center">
        <p className="text-slate-300">No appointments yet.</p>
        <p className="text-slate-500 text-sm mt-1">Use "Add Doctor via Code" to connect your doctor first.</p>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Connect Doctor</h2>
              <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Enter UUID code sent by your doctor</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-slate-200 outline-none focus:border-amber-500"
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Connect Doctor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
