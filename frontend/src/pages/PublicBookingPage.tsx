import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { format, addDays, startOfToday } from 'date-fns'
import { Calendar as CalendarIcon, Clock, MapPin, Phone, Mail, ChevronRight, User, CheckCircle2, X } from 'lucide-react'
import { publicApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function PublicBookingPage() {
  const { clinicId } = useParams<{ clinicId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [clinic, setClinic] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingSlot, setBookingSlot] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success'>('idle')
  const [confirmedAppt, setConfirmedAppt] = useState<any>(null)

  useEffect(() => {
    if (clinicId) {
      fetchClinic()
    }
  }, [clinicId])

  useEffect(() => {
    if (clinicId && selectedDate) {
      fetchSlots()
    }
  }, [clinicId, selectedDate])

  const fetchClinic = async () => {
    try {
      const res = await publicApi.getClinic(clinicId!)
      setClinic(res.data)
    } catch (err) {
      toast.error("Clinic not found")
    }
  }

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const res = await publicApi.getSlots(clinicId!, dateStr)
      setSlots(res.data)
    } catch (err) {
      toast.error("Failed to load slots")
    } finally {
      setLoading(false)
    }
  }

  const handleSlotClick = (slot: any) => {
    if (!user) {
      // Not logged in: Redirect to patient login with return path
      toast.error("Please login or register to book an appointment")
      const returnPath = encodeURIComponent(window.location.pathname)
      navigate(`/patient/login?redirect=${returnPath}`)
      return
    }
    
    // User is logged in: Show confirmation UI
    setBookingSlot(slot)
  }

  const handleFinalizeBooking = async () => {
    if (!bookingSlot) return
    setBookingStatus('booking')
    try {
      const res = await publicApi.book({
        clinic_id: clinicId!,
        appointment_time: bookingSlot.start_time,
        reason: reason || undefined
      })
      setConfirmedAppt(res.data)
      setBookingStatus('success')
      toast.success("Appointment booked successfully!")
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Booking failed"
      toast.error(detail)
      setBookingStatus('idle')
    }
  }

  // Next 7 days for quick selection
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i))

  if (bookingStatus === 'success' && confirmedAppt) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Confirmed!</h2>
          <p className="text-slate-400 mb-8">
            Your appointment at <span className="text-white font-medium">{clinic?.name}</span> is scheduled.
          </p>
          
          <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 text-left space-y-4 border border-slate-700">
            <div className="flex items-center gap-3 text-slate-300">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              <span>{format(new Date(confirmedAppt.time), 'EEEE, MMMM do, yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>{format(new Date(confirmedAppt.time), 'HH:mm')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/patient/dashboard')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Clinic Header */}
        {clinic && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8 backdrop-blur-sm">
            <h1 className="text-4xl font-bold text-white mb-4">{clinic.name}</h1>
            <div className="flex flex-wrap gap-6 text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span>{clinic.address || 'Address not listed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-400" />
                <span>{clinic.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <span>{clinic.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Date Selector */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                Select Date
              </h2>
              <div className="space-y-3">
                {nextDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium">{format(day, 'EEEE')}</div>
                      <div className="text-sm opacity-70">{format(day, 'MMM d, yyyy')}</div>
                    </div>
                    {format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slots Selector */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[500px]">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Available Slots for {format(selectedDate, 'MMM d')}
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                  <p>Checking availability...</p>
                </div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {slots.map((slot) => (
                    <button
                      key={slot.start_time}
                      onClick={() => handleSlotClick(slot)}
                      className="group p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-indigo-500 transition-all text-center"
                    >
                      <div className="text-lg font-bold text-white group-hover:text-indigo-400">
                        {format(new Date(slot.start_time), 'HH:mm')}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                        Available
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No slots available</p>
                  <p className="text-sm">Try selecting a different date</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Side Panel / Modal for Finalizing */}
          {bookingSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white">Confirm Booking</h3>
                  <button onClick={() => setBookingSlot(null)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-8">
                  <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 space-y-4 border border-slate-700">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Appointment Details</p>
                    <div className="flex items-center gap-3 text-white text-lg font-medium">
                      <CalendarIcon className="w-5 h-5 text-indigo-400" />
                      {format(new Date(bookingSlot.start_time), 'EEEE, MMM do')}
                    </div>
                    <div className="flex items-center gap-3 text-white text-lg font-medium">
                      <Clock className="w-5 h-5 text-indigo-400" />
                      {format(new Date(bookingSlot.start_time), 'HH:mm')}
                    </div>
                    <div className="flex items-center gap-3 text-white text-lg font-medium">
                      <MapPin className="w-5 h-5 text-indigo-400" />
                      {clinic?.name}
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Appointment (optional)</label>
                    <textarea
                      placeholder="e.g. Regular checkup, follow-up, general inquiry..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleFinalizeBooking}
                    disabled={bookingStatus === 'booking'}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-5 rounded-xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 text-lg"
                  >
                    {bookingStatus === 'booking' ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Finalize Booking
                      </>
                    )}
                  </button>
                  <p className="text-center text-slate-500 text-xs mt-6">
                    By booking, you agree to the clinic's terms and privacy policies.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>© 2026 CuraWeave — AI-Powered Care Management</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="hover:text-indigo-400">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  )
}
