import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Users, Calendar, Megaphone, BrainCircuit,
  MessageSquare, Receipt, LogOut, HeartPulse
} from 'lucide-react'

const navItems = [
  { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/doctor/patients', icon: Users, label: 'Patients' },
  { to: '/doctor/appointments', icon: Calendar, label: 'Schedule' },
  { to: '/doctor/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/doctor/ai-triage', icon: BrainCircuit, label: 'AI Triage' },
  { to: '/doctor/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/doctor/billing', icon: Receipt, label: 'Billing' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/doctor/login')
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-slate-800 bg-slate-900/50">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <HeartPulse className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-none">CuraWeave</h1>
            <p className="text-xs text-slate-500 mt-0.5">Clinic Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <span className="font-bold text-slate-300">{user?.full_name?.[0] || 'D'}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Dr. Smith'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'doctor@curaweave.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-950 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative z-10 p-8 min-h-full">
           <Outlet key={location.pathname} />
        </div>
      </main>
    </div>
  )
}
