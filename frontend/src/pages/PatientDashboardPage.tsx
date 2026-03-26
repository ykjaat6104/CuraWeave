import React, { useEffect, useState } from 'react'
import {
  Calendar, Clock, AlertCircle, FileText, ChevronRight, Activity, Plus, Filter, MessageSquare
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { appointmentsApi, messagesApi } from '../services/api'
import { toast } from 'react-hot-toast'

export default function PatientDashboardPage() {
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const { data } = await appointmentsApi.list({ limit: 5 })
        if (Array.isArray(data)) {
            setAppointments(data)
        } else if (data && data.items) {
             setAppointments(data.items)
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHealthData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hello, {user?.full_name?.split(' ')[0] || 'Patient'}</h1>
          <p className="text-slate-400">Here's your health overview for today.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20">
          <Plus size={18} />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar size={64} className="text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
              <Calendar size={20} className="text-amber-500" />
            </div>
            <p className="text-slate-400 text-sm">Next Appointment</p>
            <h3 className="text-xl font-bold text-white mt-1">None Scheduled</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <MessageSquare size={64} className="text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-amber-500" />
            </div>
            <p className="text-slate-400 text-sm">New Messages</p>
            <h3 className="text-xl font-bold text-white mt-1">2 Unread</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText size={64} className="text-purple-500" />
           </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
               <FileText size={20} className="text-purple-500" />
            </div>
            <p className="text-slate-400 text-sm">Last Visit</p>
            <h3 className="text-xl font-bold text-white mt-1">Oct 24, 2024</h3>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            Recent Appointments
          </h2>
          <button className="text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors">
            View All
          </button>
        </div>
        
        <div className="divide-y divide-slate-800">
          {loading ? (
             <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : appointments.length > 0 ? (
             appointments.map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                         {new Date(apt.start_time).getDate()}
                      </div>
                      <div>
                         <h4 className="font-medium text-slate-200">Consultation</h4>
                         <p className="text-xs text-slate-500">{new Date(apt.start_time).toLocaleTimeString()} • Dr. Smith</p>
                      </div>
                   </div>
                   <span className={`px-2 py-1 rounded text-xs font-medium ${
                       apt.status === 'confirmed' ? 'bg-amber-500/10 text-amber-400' : 
                      apt.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-700 text-slate-300'
                   }`}>
                      {apt.status}
                   </span>
                </div>
             ))
          ) : (
             <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                   <Calendar size={20} />
                </div>
                <p className="text-slate-400 text-sm mb-2">No appointments found</p>
                <p className="text-xs text-slate-500">Book your first appointment to get started.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
