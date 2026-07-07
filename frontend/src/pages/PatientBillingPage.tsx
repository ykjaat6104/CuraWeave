import { useState, useEffect } from 'react'
import api from '../services/api'
import { Receipt, Clock, CheckCircle, XCircle, Download } from 'lucide-react'

interface Invoice {
  id: string
  amount: number
  description: string
  status: string
  due_date: string
  paid_at: string | null
  created_at: string
}

export default function PatientBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/auth/patient/invoices')
        setInvoices(res.data || [])
      } catch {
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const statusIcon: Record<string, any> = {
    paid: CheckCircle,
    pending: Clock,
    failed: XCircle,
    cancelled: XCircle,
  }

  const statusColors: Record<string, string> = {
    paid: 'text-green-400 bg-green-500/10',
    pending: 'text-amber-400 bg-amber-500/10',
    failed: 'text-red-400 bg-red-500/10',
    cancelled: 'text-slate-400 bg-slate-500/10',
  }

  const totalDue = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Receipt size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">My Subscriptions</h1>
          <p className="text-slate-400 text-sm">Payment history and billing details</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{invoices.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Transactions</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">${totalDue.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Total Due</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{invoices.filter(i => i.status === 'paid').length}</p>
          <p className="text-xs text-slate-500 mt-1">Paid Invoices</p>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Billing History</h2>
        </div>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Receipt size={36} className="mx-auto mb-3 opacity-40" />
            <p>No billing records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase border-b border-zinc-800">
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const StatusIcon = statusIcon[inv.status] || Clock
                  const color = statusColors[inv.status] || statusColors.pending
                  return (
                    <tr key={inv.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-200">{inv.description}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">${Number(inv.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(inv.due_date || inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          <StatusIcon size={12} />
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status === 'paid' && (
                          <button className="text-slate-400 hover:text-amber-400 transition-colors" title="Download receipt">
                            <Download size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
