import { useEffect, useState } from 'react'
import { billingApi, patientInvoiceApi, patientInsuranceApi } from '../services/api'
import toast from 'react-hot-toast'
import { CreditCard, Check, Zap, Loader2, Star, IndianRupee, Receipt, ShieldCheck, Clock, FileText, User } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  features: Record<string, any>
  description: string
}

interface Invoice {
  id: string
  patient_name: string | null
  patient_phone: string | null
  amount: string
  description: string | null
  status: string
  due_date: string | null
  paid_at: string | null
  created_at: string
}

interface Insurance {
  id: string
  patient_name: string | null
  provider: string
  policy_number: string
  status: string
  expiry_date: string | null
}

declare global {
  interface Window {
    Razorpay: any
  }
}

type Tab = 'plans' | 'invoices' | 'insurance'

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <div className="text-slate-400">🏥</div>,
  basic: <div className="text-brand-400">⚕️</div>,
  pro: <Star size={18} className="text-amber-400" />,
  enterprise: <Zap size={18} className="text-purple-400" />,
}

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'plans', label: 'Plans', icon: CreditCard },
  { key: 'invoices', label: 'Invoices', icon: Receipt },
  { key: 'insurance', label: 'Insurance', icon: ShieldCheck },
]

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-500/20 text-emerald-300',
  pending: 'bg-amber-500/20 text-amber-300',
  failed: 'bg-red-500/20 text-red-300',
  cancelled: 'bg-slate-500/20 text-slate-400',
  active: 'bg-emerald-500/20 text-emerald-300',
  expired: 'bg-red-500/20 text-red-300',
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('plans')
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [insurance, setInsurance] = useState<Insurance[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, currentRes] = await Promise.all([
          billingApi.getPlans(),
          billingApi.getCurrentPlan(),
        ])
        setPlans(plansRes.data.plans)
        setCurrentPlan(currentRes.data)
      } catch {
        toast.error('Failed to load billing')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (activeTab === 'invoices') {
      patientInvoiceApi.list().then(({ data }) => setInvoices(data)).catch(() => {})
    } else if (activeTab === 'insurance') {
      patientInsuranceApi.list().then(({ data }) => setInsurance(data)).catch(() => {})
    }
  }, [activeTab])

  const loadRazorpayScript = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Razorpay) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return
    setSubscribing(planId)
    try {
      const { data } = await billingApi.createOrder(planId)

      if (data.demo) {
        await billingApi.verifyPayment({ demo: true, plan: data.plan })
        toast.success('Plan activated! (Demo mode — no payment processed)')
        const currentRes = await billingApi.getCurrentPlan()
        setCurrentPlan(currentRes.data)
        setSubscribing(null)
        return
      }

      await loadRazorpayScript()

      const { order_id, amount, key_id, plan } = data

      const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        name: 'CuraWeave',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        order_id: order_id,
        handler: async function (response: any) {
          try {
            await billingApi.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan,
            })
            toast.success('Payment verified! Plan activated.')
            const currentRes = await billingApi.getCurrentPlan()
            setCurrentPlan(currentRes.data)
          } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Payment verification failed')
          }
        },
        modal: {
          ondismiss: function () {
            setSubscribing(null)
          },
        },
        theme: {
          color: '#6366f1',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        toast.error(response.error?.description || 'Payment failed')
        setSubscribing(null)
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to initiate payment')
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={24} className="text-brand-400" />
          Billing & Insurance
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Manage plans, patient invoices, and insurance records
        </p>
      </div>

      {/* Tab chiplets */}
      <div className="flex gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              activeTab === key
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                : 'bg-zinc-900/60 border-zinc-800 text-slate-500 hover:text-slate-300 hover:border-zinc-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
          {currentPlan && (
            <div className="card border border-brand-500/20 bg-brand-500/5">
              <h2 className="font-semibold text-white mb-3">Your Current Plan Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Patients', value: currentPlan.features.patients === -1 ? 'Unlimited' : currentPlan.features.patients.toLocaleString() },
                  { label: 'Messages/month', value: currentPlan.features.messages === -1 ? 'Unlimited' : currentPlan.features.messages.toLocaleString() },
                  { label: 'Campaigns', value: currentPlan.features.campaigns === -1 ? 'Unlimited' : currentPlan.features.campaigns },
                  { label: 'AI Triage', value: currentPlan.features.ai_triage ? 'Enabled' : 'Disabled' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-slate-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(plan => {
              const isCurrent = currentPlan?.plan === plan.id
              const isPopular = plan.id === 'pro'
              return (
                <div
                  key={plan.id}
                  className={`card relative flex flex-col ${
                    isPopular ? 'border border-amber-500/40 bg-amber-500/5' : ''
                  } ${isCurrent ? 'border border-brand-500/40' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      CURRENT
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {PLAN_ICONS[plan.id]}
                      <h3 className="font-bold text-white">{plan.name}</h3>
                    </div>
                    <p className="text-slate-400 text-xs">{plan.description}</p>
                  </div>

                  <div className="mb-4 flex items-baseline gap-1">
                    <IndianRupee size={20} className="text-slate-400" />
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.price > 0 && <span className="text-slate-400 text-sm">/{plan.interval}</span>}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {[
                      `${plan.features.patients === -1 ? 'Unlimited' : plan.features.patients} patients`,
                      `${plan.features.messages === -1 ? 'Unlimited' : plan.features.messages.toLocaleString()} messages/mo`,
                      `${plan.features.campaigns === -1 ? 'Unlimited' : plan.features.campaigns} campaigns`,
                      plan.features.ai_triage ? 'AI Triage ✓' : 'No AI Triage',
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check size={14} className={plan.features.ai_triage || !f.includes('Triage') ? 'text-brand-400' : 'text-slate-600'} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || plan.id === 'free' || subscribing === plan.id}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isCurrent
                        ? 'bg-brand-500/20 text-brand-400 cursor-default'
                        : plan.id === 'free'
                        ? 'bg-slate-800/50 text-slate-500 cursor-default'
                        : isPopular
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                        : 'btn-primary'
                    }`}
                  >
                    {subscribing === plan.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Opening...
                      </div>
                    ) : isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Free Forever' : 'Upgrade Now'}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="text-center text-slate-600 text-xs">
            Powered by Razorpay. Secure payments. Cancel anytime.
          </div>
        </>
      )}

      {/* Patient Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="card">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Receipt size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-400">No patient invoices yet</p>
              <p className="text-slate-600 text-sm mt-1">Invoices will appear here once created from patient billing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-3 px-2">Patient</th>
                    <th className="text-left py-3 px-2">Description</th>
                    <th className="text-right py-3 px-2">Amount</th>
                    <th className="text-center py-3 px-2">Status</th>
                    <th className="text-center py-3 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-500" />
                          <span className="text-white">{inv.patient_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{inv.description || '—'}</td>
                      <td className="py-3 px-2 text-right text-white font-medium">₹{parseFloat(inv.amount).toLocaleString()}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[inv.status] || 'bg-slate-500/20 text-slate-400'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400">
                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Patient Insurance Tab */}
      {activeTab === 'insurance' && (
        <div className="card">
          {insurance.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <ShieldCheck size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-400">No insurance records yet</p>
              <p className="text-slate-600 text-sm mt-1">Patient insurance details will appear here once added.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-3 px-2">Patient</th>
                    <th className="text-left py-3 px-2">Provider</th>
                    <th className="text-left py-3 px-2">Policy No.</th>
                    <th className="text-center py-3 px-2">Status</th>
                    <th className="text-center py-3 px-2">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {insurance.map(ins => (
                    <tr key={ins.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-500" />
                          <span className="text-white">{ins.patient_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-white">{ins.provider}</td>
                      <td className="py-3 px-2 text-slate-400 font-mono">{ins.policy_number}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[ins.status] || 'bg-slate-500/20 text-slate-400'}`}>
                          {ins.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400">
                        {ins.expiry_date ? new Date(ins.expiry_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
