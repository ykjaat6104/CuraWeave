import { Settings, Hospital, MapPin, Mail, Phone, Clock, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Settings saved')
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={24} className="text-indigo-400" />
          Clinic Settings
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your clinic information and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Hospital size={18} className="text-indigo-400" />
            General Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Clinic Name</label>
              <input type="text" className="input-field w-full" defaultValue="Healthy Life Medical Center" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Specialization</label>
              <input type="text" className="input-field w-full" defaultValue="General Practice" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <MapPin size={14} className="text-slate-500" />
                Address
              </label>
              <input type="text" className="input-field w-full" defaultValue="123 Healthcare Blvd, Medical District" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-indigo-400" />
            Contact & Hours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <Mail size={14} className="text-slate-500" />
                Email
              </label>
              <input type="email" className="input-field w-full" defaultValue="contact@healthylife.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <Phone size={14} className="text-slate-500" />
                Phone
              </label>
              <input type="tel" className="input-field w-full" defaultValue="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Opening Time</label>
              <input type="time" className="input-field w-full" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Closing Time</label>
              <input type="time" className="input-field w-full" defaultValue="18:00" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-500/25">
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
