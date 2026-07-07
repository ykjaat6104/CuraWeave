import { useState, useEffect, useRef } from 'react'
import { patientAuthApi } from '../services/api'
import api from '../services/api'
import {
  MessageSquare, Send, Loader2, Search, Check, CheckCheck,
  User, Shield, Stethoscope, ChevronLeft, Phone, Mail
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Contact {
  id: string
  name: string
  type: string
  email?: string
}

interface Message {
  id: string
  message_text: string
  sender_name: string
  recipient_name: string
  sender_is_me: boolean
  direction: string
  status: string
  created_at: string
  channel: string
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  admin: { icon: Shield, color: 'text-indigo-400 bg-indigo-500/20' },
  doctor: { icon: Stethoscope, color: 'text-purple-400 bg-purple-500/20' },
  staff: { icon: User, color: 'text-teal-400 bg-teal-500/20' },
}

export default function PatientMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [showMobileList, setShowMobileList] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/auth/patient/messages/contacts')
        setContacts(res.data)
      } catch {
        toast.error('Failed to load contacts')
      } finally {
        setLoadingContacts(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedContact) {
      setLoadingMessages(true)
      setShowMobileList(false)
      api.get(`/auth/patient/messages/conversation/${selectedContact.id}`)
        .then(res => setMessages(res.data))
        .catch(() => toast.error('Failed to load messages'))
        .finally(() => setLoadingMessages(false))
    }
  }, [selectedContact])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedContact || !content.trim()) return
    setSending(true)
    try {
      await api.post('/auth/patient/messages/send', {
        recipient_id: selectedContact.id,
        content,
      })
      setContent('')
      const res = await api.get(`/auth/patient/messages/conversation/${selectedContact.id}`)
      setMessages(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  const chatPartnerName = selectedContact?.name || ''

  return (
    <div className="h-[calc(100vh-6rem)] flex -m-8">
      {/* Contact List */}
      <div className={`${
        showMobileList ? 'flex' : 'hidden'
      } md:flex w-full md:w-80 lg:w-96 flex-shrink-0 flex-col border-r border-zinc-800 bg-black/30`}>
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-amber-400" />
            Inbox
          </h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/40 transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-500" size={20} /></div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No contacts found</div>
          ) : (
            filteredContacts.map(contact => {
              const cfg = TYPE_CONFIG[contact.type] || { icon: User, color: 'text-slate-400 bg-zinc-800' }
              const Icon = cfg.icon
              const isActive = selectedContact?.id === contact.id
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/60 ${
                    isActive ? 'bg-zinc-900 border-l-2 border-amber-500' : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{contact.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] uppercase tracking-wider ${
                        contact.type === 'admin' ? 'text-indigo-400' :
                        contact.type === 'doctor' ? 'text-purple-400' :
                        contact.type === 'staff' ? 'text-teal-400' :
                        'text-amber-400'
                      }`}>{contact.type}</span>
                      {contact.email && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-500 truncate">{contact.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className={`${
        !showMobileList ? 'flex' : 'hidden'
      } md:flex flex-1 flex-col bg-black/20`}>
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-slate-600" />
              </div>
              <p className="text-slate-400">Select a contact to start chatting</p>
              <p className="text-slate-600 text-sm mt-1">Message your clinic team directly.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-black/40">
              <button
                onClick={() => { setSelectedContact(null); setShowMobileList(true) }}
                className="md:hidden p-1 text-slate-400 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                TYPE_CONFIG[selectedContact.type]?.color || 'bg-zinc-800'
              }`}>
                {(() => {
                  const Icon = TYPE_CONFIG[selectedContact.type]?.icon || User
                  return <Icon size={16} />
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{selectedContact.name}</p>
                <p className={`text-xs capitalize ${
                  selectedContact.type === 'admin' ? 'text-indigo-400' :
                  selectedContact.type === 'doctor' ? 'text-purple-400' :
                  selectedContact.type === 'staff' ? 'text-teal-400' :
                  'text-amber-400'
                }`}>{selectedContact.type}</p>
              </div>
              {selectedContact.email && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                  <Mail size={12} />
                  {selectedContact.email}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-500" size={20} /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-sm">No messages yet</p>
                  <p className="text-slate-600 text-xs mt-1">Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_is_me ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${msg.sender_is_me ? 'items-end' : 'items-start'} flex flex-col`}>
                      <span className={`text-[10px] mb-0.5 px-1 font-medium ${
                        msg.sender_is_me ? 'text-amber-300' : 'text-slate-400'
                      }`}>
                        {msg.sender_name}
                      </span>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.sender_is_me
                          ? 'bg-amber-600 text-white rounded-br-sm'
                          : 'bg-zinc-800 text-slate-200 rounded-bl-sm'
                      }`}>
                        {msg.message_text}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 text-[10px] text-slate-600 ${msg.sender_is_me ? 'flex-row-reverse' : ''}`}>
                        <span>
                          {new Date(msg.created_at).toLocaleString(undefined, {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        {msg.sender_is_me && (
                          <>
                            <span>·</span>
                            {msg.status === 'sent'
                              ? <Check size={11} />
                              : <CheckCheck size={11} className="text-amber-400" />
                            }
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-end gap-2 p-4 border-t border-zinc-800 bg-black/30">
              <textarea
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none resize-none focus:border-amber-500/40 transition-colors"
                rows={2}
                placeholder={`Message ${chatPartnerName}...`}
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
