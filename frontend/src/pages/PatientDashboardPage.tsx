import React from 'react';

export default function PatientDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Patient Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
           <h3 className="text-lg font-medium text-white mb-2">Upcoming Appointments</h3>
           <p className="text-slate-400">No appointments scheduled.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
           <h3 className="text-lg font-medium text-white mb-2">Messages</h3>
           <p className="text-slate-400">No new messages.</p>
        </div>
      </div>
    </div>
  )
}
