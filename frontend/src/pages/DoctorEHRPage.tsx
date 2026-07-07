import { useState, useEffect, useRef } from 'react'
import { patientsApi, medicalRecordsApi } from '../services/api'
import api from '../services/api'
import {
  Search, FileText, Clock, Stethoscope, Pill, Activity,
  Upload, X, File, Image, Plus, Download, Eye
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Patient {
  id: string
  name: string
  phone: string
}

interface MedicalRecord {
  id: string
  record_type: string
  title: string
  description: string | null
  value: any
  file_url: string | null
  recorded_at: string
}

const RECORD_TYPES = [
  { value: 'vital', label: 'Vitals', icon: Activity },
  { value: 'lab', label: 'Lab Report', icon: Pill },
  { value: 'diagnosis', label: 'Diagnosis', icon: Stethoscope },
  { value: 'note', label: 'Clinical Note', icon: FileText },
  { value: 'imaging', label: 'Imaging', icon: Image },
  { value: 'prescription', label: 'Prescription', icon: FileText },
  { value: 'vaccination', label: 'Vaccination', icon: FileText },
  { value: 'procedure', label: 'Procedure', icon: FileText },
  { value: 'other', label: 'Other', icon: File },
]

const TYPE_COLORS: Record<string, string> = {
  vital: 'text-green-400 bg-green-500/10 border-green-900/30',
  lab: 'text-blue-400 bg-blue-500/10 border-blue-900/30',
  diagnosis: 'text-purple-400 bg-purple-500/10 border-purple-900/30',
  note: 'text-slate-400 bg-slate-500/10 border-slate-800',
  imaging: 'text-cyan-400 bg-cyan-500/10 border-cyan-900/30',
  prescription: 'text-rose-400 bg-rose-500/10 border-rose-900/30',
  vaccination: 'text-lime-400 bg-lime-500/10 border-lime-900/30',
  procedure: 'text-orange-400 bg-orange-500/10 border-orange-900/30',
  other: 'text-slate-400 bg-slate-500/10 border-slate-800',
}

const typeIcon: Record<string, any> = {
  vital: Activity, lab: Pill, diagnosis: Stethoscope,
  note: FileText, imaging: Image, prescription: FileText,
  vaccination: FileText, procedure: FileText, other: File,
}

export default function DoctorEHRPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<MedicalRecord[]>([])

  const [showModal, setShowModal] = useState(false)
  const [uploadType, setUploadType] = useState('vital')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await patientsApi.list({ limit: 100 })
        setPatients(res.data.patients || res.data || [])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!selectedPatient) return
    const fetch = async () => {
      try {
        const res = await medicalRecordsApi.getByPatient(selectedPatient.id)
        setRecords(res.data || [])
      } catch {
        setRecords([])
      }
    }
    fetch()
  }, [selectedPatient])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !selectedPatient) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('patient_id', selectedPatient.id)
      formData.append('record_type', uploadType)
      formData.append('title', uploadTitle || uploadFile.name)
      if (uploadDesc) formData.append('description', uploadDesc)
      formData.append('file', uploadFile)

      await api.post('/medical-records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Record uploaded')
      setShowModal(false)
      setUploadFile(null)
      setUploadTitle('')
      setUploadDesc('')
      setUploadType('vital')

      const res = await medicalRecordsApi.getByPatient(selectedPatient.id)
      setRecords(res.data || [])
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const authFileUrl = (url: string | null) => {
  if (!url) return null
  const token = localStorage.getItem('curaweave_token')
  return token ? `${url}?token=${encodeURIComponent(token)}` : url
}

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImageType = (r: MedicalRecord) =>
    r.value?.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(r.value?.original_name || '')

  const isPdfType = (r: MedicalRecord) =>
    r.value?.file_type === 'application/pdf' || /\.pdf$/i.test(r.value?.original_name || '')

  const FileIcon = ({ r, size = 16 }: { r: MedicalRecord; size?: number }) => {
    if (isImageType(r)) return <Image size={size} />
    if (isPdfType(r)) return <FileText size={size} />
    return <File size={size} />
  }

  return (
    <>
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        <div className="w-72 flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shrink-0">
          <div className="p-3 border-b border-zinc-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-sm text-slate-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">No patients found</div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-zinc-800/50 ${
                    selectedPatient?.id === p.id ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.phone}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-y-auto p-6">
          {!selectedPatient ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <FileText size={48} className="mb-3 opacity-30" />
              <p>Select a patient to view their EHR</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Stethoscope size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
                    <p className="text-sm text-slate-400">EHR Room · Medical Records</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  <Plus size={16} />
                  Add Record
                </button>
              </div>

              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock size={36} className="mx-auto mb-3 opacity-40" />
                  <p>No medical records yet</p>
                  <p className="text-sm mt-2">Click "Add Record" to upload the first one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map(r => {
                    const Icon = typeIcon[r.record_type] || FileText
                    const color = TYPE_COLORS[r.record_type] || 'text-slate-400 bg-slate-500/10'
                    const hasFile = r.file_url
                    const showThumbnail = isImageType(r) && hasFile
                    return (
                      <div
                        key={r.id}
                        onClick={() => setPreviewRecord(r)}
                        className="flex gap-4 p-4 bg-zinc-800/30 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-200">{r.title}</h4>
                            <span className="text-xs text-slate-500">
                              {new Date(r.recorded_at).toLocaleDateString()}
                            </span>
                          </div>
                          {r.description && (
                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {showThumbnail && (
                              <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-zinc-700 shrink-0">
                                <img
                                  src={authFileUrl(r.file_url)!}
                                  alt={r.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="text-[10px] uppercase tracking-wider text-slate-600">{r.record_type}</span>
                              {hasFile && (
                                <>
                                  <span>·</span>
                                  <FileIcon r={r} size={12} />
                                  <span className="text-slate-500">{r.value.original_name}</span>
                                  {r.value.file_size && <span>({formatFileSize(r.value.file_size)})</span>}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewRecord(r) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Medical Record</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {RECORD_TYPES.map(rt => {
                    const Icon = rt.icon
                    const isActive = uploadType === rt.value
                    return (
                      <button
                        key={rt.value}
                        type="button"
                        onClick={() => setUploadType(rt.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                          isActive
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-zinc-800/50 border-zinc-700 text-slate-400 hover:border-zinc-600'
                        }`}
                      >
                        <Icon size={18} />
                        {rt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500/40 transition-colors"
                >
                  {uploadFile ? (
                    <div className="text-sm text-slate-300">
                      <p className="font-medium">{uploadFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} className="mx-auto text-slate-500 mb-1" />
                      <p className="text-sm text-slate-400">Click to upload a file</p>
                      <p className="text-xs text-slate-600 mt-1">PDF, Images, Documents</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={uploadFile ? uploadFile.name : 'Record title'}
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Notes</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-zinc-700 text-slate-300 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={!uploadFile || uploading} className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all">
                  {uploading ? 'Uploading...' : 'Upload Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewRecord(null)}>
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[previewRecord.record_type] || 'text-slate-400 bg-slate-500/10'}`}>
                  {(() => { const Icon = typeIcon[previewRecord.record_type] || FileText; return <Icon size={20} /> })()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{previewRecord.title}</h3>
                  <p className="text-xs text-slate-400">
                    {previewRecord.record_type} · {new Date(previewRecord.recorded_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button onClick={() => setPreviewRecord(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {previewRecord.description && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Notes</h4>
                  <p className="text-sm text-slate-200">{previewRecord.description}</p>
                </div>
              )}

              {previewRecord.file_url ? (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">File</h4>
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden">
                    {isImageType(previewRecord) && (
                      <div className="flex items-center justify-center bg-black/40 p-2 max-h-[60vh] overflow-auto">
                        <img
                          src={authFileUrl(previewRecord.file_url)!}
                          alt={previewRecord.title}
                          className="max-w-full max-h-[55vh] object-contain rounded-lg"
                        />
                      </div>
                    )}
                    {isPdfType(previewRecord) && (
                      <div className="h-[60vh]">
                        <iframe
                          src={authFileUrl(previewRecord.file_url)!}
                          className="w-full h-full"
                          title={previewRecord.title}
                        />
                      </div>
                    )}
                    {!isImageType(previewRecord) && !isPdfType(previewRecord) && (
                      <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
                        <File size={40} className="opacity-40" />
                        <p className="text-sm">{previewRecord.value?.original_name}</p>
                        {previewRecord.value?.file_size && (
                          <p className="text-xs text-slate-500">{formatFileSize(previewRecord.value.file_size)}</p>
                        )}
                        <a
                          href={authFileUrl(previewRecord.file_url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Download size={16} />
                          Download File
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-right">
                    <a
                      href={authFileUrl(previewRecord.file_url)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Download size={12} />
                      Download {previewRecord.value?.original_name || 'file'}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <FileText size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No file attached to this record</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
