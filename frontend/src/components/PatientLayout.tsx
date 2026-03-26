import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Calendar, MessageSquare, LogOut, User, Activity
} from 'lucide-react'

const navItems = [
  { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/patient/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/patient/messages', icon: MessageSquare, label: 'Messages' },
]

export default function PatientLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/patient/login')
  }

  return (
    <div className="flex h-screen theme-surface patient-gradient overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-amber-700/35 bg-black/55 backdrop-blur-md">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-amber-700/35">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <User size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">CuraWeave</h1>
              <p className="text-slate-500 text-xs mt-0.5">Patient Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Icon size={20} className="transition-colors" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-amber-700/35">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-zinc-900/70 border border-amber-700/35">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 font-medium">
              {user?.name?.[0] || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-black/40 relative">
        {/* Header pattern */}
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-amber-700/35 to-transparent pointer-events-none" />
        <div className="relative px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
