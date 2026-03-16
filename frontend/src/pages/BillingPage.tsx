import { useEffect, useState } from 'react'
import { billingApi } from '../services/api'
import toast from 'react-hot-toast'
import { CreditCard, Check, Zap, Loader2, Star } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  features: Record<string, any>
  description: string
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <div className="text-slate-400">🏥</div>,
  basic: <div className="text-brand-400">⚕️</div>,
  pro: <Star size={18} className="text-amber-400" />,
  enterprise: <Zap size={18} className="text-purple-400" />,
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<any>(null)
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

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return
    setSubscribing(planId)
    try {
      const { data } = await billingApi.createCheckout(planId)
      window.open(data.checkout_url, '_blank')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create checkout')
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
          Billing & Plans
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Current plan: <span className="text-brand-400 font-medium capitalize">{currentPlan?.plan}</span>
        </p>
      </div>

      {/* Current Plan Features */}
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

      {/* Plans Grid */}
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

              <div className="mb-4">
                <span className="text-3xl font-bold text-white">${plan.price}</span>
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
                    Redirecting...
                  </div>
                ) : isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Free Forever' : 'Upgrade Now'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="text-center text-slate-600 text-xs">
        Powered by Stripe. Secure payments. Cancel anytime.
      </div>
    </div>
  )
}
