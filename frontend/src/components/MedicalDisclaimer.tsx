import { AlertTriangle } from 'lucide-react'

export default function MedicalDisclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div>
        <p className="font-medium text-amber-100">Medical Disclaimer</p>
        <p className="mt-1 text-amber-300/80">
          The AI triage and recommendations provided through CuraWeave are for informational and routing purposes only.
          They do not constitute a medical diagnosis, treatment plan, or professional medical advice.
          Always consult a qualified healthcare provider for medical concerns, diagnoses, or treatment decisions.
          If you are experiencing a medical emergency, call emergency services immediately.
        </p>
      </div>
    </div>
  )
}
