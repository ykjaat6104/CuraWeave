import { useState, useRef, useEffect } from 'react'
import { Phone, ChevronDown } from 'lucide-react'

const COUNTRIES = [
  { code: 'US', dial: '+1', name: 'United States', flag: '🇺🇸', length: 10 },
  { code: 'GB', dial: '+44', name: 'United Kingdom', flag: '🇬🇧', length: 10 },
  { code: 'CA', dial: '+1', name: 'Canada', flag: '🇨🇦', length: 10 },
  { code: 'AU', dial: '+61', name: 'Australia', flag: '🇦🇺', length: 9 },
  { code: 'IN', dial: '+91', name: 'India', flag: '🇮🇳', length: 10 },
  { code: 'DE', dial: '+49', name: 'Germany', flag: '🇩🇪', length: 10 },
  { code: 'FR', dial: '+33', name: 'France', flag: '🇫🇷', length: 9 },
  { code: 'IT', dial: '+39', name: 'Italy', flag: '🇮🇹', length: 10 },
  { code: 'ES', dial: '+34', name: 'Spain', flag: '🇪🇸', length: 9 },
  { code: 'BR', dial: '+55', name: 'Brazil', flag: '🇧🇷', length: 10 },
  { code: 'MX', dial: '+52', name: 'Mexico', flag: '🇲🇽', length: 10 },
  { code: 'JP', dial: '+81', name: 'Japan', flag: '🇯🇵', length: 10 },
  { code: 'CN', dial: '+86', name: 'China', flag: '🇨🇳', length: 11 },
  { code: 'KR', dial: '+82', name: 'South Korea', flag: '🇰🇷', length: 9 },
  { code: 'SG', dial: '+65', name: 'Singapore', flag: '🇸🇬', length: 8 },
  { code: 'AE', dial: '+971', name: 'UAE', flag: '🇦🇪', length: 9 },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia', flag: '🇸🇦', length: 9 },
  { code: 'NG', dial: '+234', name: 'Nigeria', flag: '🇳🇬', length: 10 },
  { code: 'ZA', dial: '+27', name: 'South Africa', flag: '🇿🇦', length: 9 },
  { code: 'KE', dial: '+254', name: 'Kenya', flag: '🇰🇪', length: 9 },
  { code: 'PK', dial: '+92', name: 'Pakistan', flag: '🇵🇰', length: 10 },
  { code: 'BD', dial: '+880', name: 'Bangladesh', flag: '🇧🇩', length: 10 },
  { code: 'PH', dial: '+63', name: 'Philippines', flag: '🇵🇭', length: 10 },
  { code: 'VN', dial: '+84', name: 'Vietnam', flag: '🇻🇳', length: 9 },
  { code: 'TH', dial: '+66', name: 'Thailand', flag: '🇹🇭', length: 9 },
  { code: 'MY', dial: '+60', name: 'Malaysia', flag: '🇲🇾', length: 9 },
  { code: 'ID', dial: '+62', name: 'Indonesia', flag: '🇮🇩', length: 10 },
  { code: 'TR', dial: '+90', name: 'Turkey', flag: '🇹🇷', length: 10 },
  { code: 'RU', dial: '+7', name: 'Russia', flag: '🇷🇺', length: 10 },
  { code: 'EG', dial: '+20', name: 'Egypt', flag: '🇪🇬', length: 10 },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  accentColor?: string
}

export default function PhoneInput({ value, onChange, required, accentColor = 'amber' }: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const detected = COUNTRIES.find((c) => value.startsWith(c.dial))
  const selected = detected || COUNTRIES[0]
  const localNumber = detected ? value.slice(selected.dial.length).trim() : value

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectCountry = (country: typeof COUNTRIES[0]) => {
    setOpen(false)
    const cleaned = localNumber.replace(/\D/g, '').slice(0, country.length)
    onChange(`${country.dial} ${cleaned}`)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    const max = selected.length
    onChange(`${selected.dial} ${digits.slice(0, max)}`)
  }

  const focusRing = accentColor === 'purple'
    ? 'focus:ring-purple-500/20 focus:border-purple-500'
    : 'focus:ring-amber-500/20 focus:border-amber-500'

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">Phone Number</label>
      <div className="relative" ref={ref}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Phone size={18} />
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 pl-10 pr-2 py-2.5 bg-zinc-900 border border-zinc-700 rounded-l-lg text-slate-300 hover:text-white transition-colors outline-none shrink-0"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-sm font-medium">{selected.dial}</span>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          <input
            type="tel"
            required={required}
            className={`flex-1 pl-2 pr-4 py-2.5 bg-zinc-900 border border-l-0 border-zinc-700 rounded-r-lg focus:ring-2 ${focusRing} text-slate-200 placeholder-slate-600 transition-all outline-none`}
            placeholder="Enter phone number"
            value={localNumber}
            onChange={handleNumberChange}
          />
        </div>

        {open && (
          <div className="absolute z-50 top-full mt-1 left-0 w-72 max-h-56 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-zinc-800 transition-colors ${
                  selected.code === c.code ? 'bg-zinc-800 text-white' : 'text-slate-300'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="font-medium">{c.dial}</span>
                <span className="text-slate-500 text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
