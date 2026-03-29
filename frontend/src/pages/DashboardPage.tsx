import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { Users, Calendar, MessageSquare, Brain, TrendingUp, Activity, AlertTriangle, CheckCircle } from 'lucide-react'

interface Stats {
  total_patients: number
  appointments_today: number
  appointments_this_month: number
  no_show_rate: number
  messages_sent_this_month: number
  active_campaigns: number
  triage_sessions: number
}

const URGENCY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = (user?.name || user?.full_name || 'Doctor').split(' ')[0]
  const [stats, setStats] = useState<Stats | null>(null)
  const [apptTrend, setApptTrend] = useState([])
  const [triageDist, setTriageDist] = useState([])
  const [msgVolume, setMsgVolume] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, trendRes, triageRes, msgRes] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getAppointmentTrend(30),
          analyticsApi.getTriageDistribution(),
          analyticsApi.getMessageVolume(30),
        ])
        setStats(statsRes.data)
        setApptTrend(trendRes.data)
        setTriageDist(triageRes.data)
        setMsgVolume(msgRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = stats
    ? [
        { icon: Users, label: 'Total Patients', value: stats.total_patients.toLocaleString(), color: 'brand' },
        { icon: Calendar, label: "Today's Appointments", value: stats.appointments_today, color: 'purple' },
        { icon: Activity, label: 'No-Show Rate', value: `${stats.no_show_rate}%`, color: 'amber' },
        { icon: Brain, label: 'AI Triage Sessions', value: stats.triage_sessions, color: 'purple' },
        { icon: MessageSquare, label: 'Messages This Month', value: stats.messages_sent_this_month.toLocaleString(), color: 'green' },
        { icon: TrendingUp, label: 'Active Campaigns', value: stats.active_campaigns, color: 'pink' },
      ]
    : []

  const colorMap: Record<string, string> = {
    brand: 'text-brand-400 bg-brand-500/20',
    blue: 'text-purple-300 bg-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    green: 'text-emerald-400 bg-emerald-500/20',
    pink: 'text-pink-400 bg-pink-500/20',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good morning, {firstName} 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's what's happening at your clinic today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">{label}</p>
                <p className="text-3xl font-bold text-white mt-1">{value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointment Trend */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-white mb-4">Appointment Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={apptTrend}>
              <defs>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2e9664" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2e9664" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#2e9664' }}
              />
              <Area type="monotone" dataKey="count" stroke="#2e9664" fill="url(#apptGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Triage Distribution */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Triage Urgency</h3>
          {triageDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={triageDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="count"
                    nameKey="urgency"
                  >
                    {triageDist.map((entry: any, i) => (
                      <Cell key={`cell-${i}`} fill={URGENCY_COLORS[entry.urgency as keyof typeof URGENCY_COLORS] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {triageDist.map((entry: any, i) => (
                  <div key={`legend-${entry.urgency || i}`} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: URGENCY_COLORS[entry.urgency as keyof typeof URGENCY_COLORS] }}
                      />
                      <span className="capitalize text-slate-400">{entry.urgency}</span>
                    </div>
                    <span className="text-white font-medium">{entry.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
              No triage data yet
            </div>
          )}
        </div>
      </div>

      {/* Message Volume */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Message Volume (30 days)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={msgVolume}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
              itemStyle={{ color: '#2e9664' }}
            />
            <Bar dataKey="count" fill="#2e9664" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
