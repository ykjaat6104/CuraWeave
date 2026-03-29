import { useEffect, useState } from 'react'
import { Stethoscope, Mail, Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { patientAuthApi } from '../services/api'

interface ConnectedDoctor {
  doctor: {
    id: string | null
    name: string
    email: string | null
  }
  clinic: {
    id: string | null
    name: string | null
  }
  connected_at: string
  connection_code: string
}

export default function PatientDoctorsPage() {
  const [doctors, setDoctors] = useState<ConnectedDoctor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await patientAuthApi.getConnectedDoctors()
        setDoctors(Array.isArray(data) ? data : [])
      } catch (err) {
        toast.error('Failed to load doctors')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Doctors</h1>
        <p className="text-slate-400">Doctors connected to your account via secure UUID.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-black/30 p-8 text-center text-slate-400">Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-black/30 p-8 text-center">
          <p className="text-slate-300">No doctors connected yet.</p>
          <p className="text-slate-500 text-sm mt-1">Go to Appointments and use Add Doctor via Code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((item, index) => (
            <div key={`${item.connection_code}-${index}`} className="rounded-xl border border-slate-800 bg-black/30 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-300">
                  <Stethoscope size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{item.doctor?.name || 'Doctor'}</p>
                  <p className="text-xs text-slate-500 mt-1">Connected: {new Date(item.connected_at).toLocaleString()}</p>

                  <div className="mt-3 space-y-1">
                    <div className="text-sm text-slate-300 flex items-center gap-2">
                      <Building2 size={14} className="text-slate-500" />
                      <span>{item.clinic?.name || 'Clinic'}</span>
                    </div>
                    <div className="text-sm text-slate-300 flex items-center gap-2">
                      <Mail size={14} className="text-slate-500" />
                      <span className="truncate">{item.doctor?.email || 'No email'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
