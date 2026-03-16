import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, User, Briefcase, Stethoscope, BriefcaseMedical } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
              <Stethoscope className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Welcome to <span className="text-blue-500">CuraWeave</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Select User Type to Continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto w-full">
          {/* Doctor / Staff Portal */}
          <Link to="/doctor/login" className="group relative block w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-300 blur-md"></div>
            <div className="relative bg-slate-800 rounded-xl p-10 flex flex-col items-center text-center space-y-6 hover:bg-slate-750 transition border border-slate-700 h-full justify-center">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-lg shadow-blue-900/20">
                <Briefcase className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">Admin Portal</h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  For doctors, administrators, and staff
                </p>
              </div>
              <div className="mt-4 px-4 py-2 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-full border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                Click to Enter
              </div>
            </div>
          </Link>

          {/* Patient Portal */}
          <Link to="/patient/login" className="group relative block w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-300 blur-md"></div>
            <div className="relative bg-slate-800 rounded-xl p-10 flex flex-col items-center text-center space-y-6 hover:bg-slate-750 transition border border-slate-700 h-full justify-center">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-lg shadow-emerald-900/20">
                <User className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">Patient Portal</h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  For patients and family members
                </p>
              </div>
              <div className="mt-4 px-4 py-2 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-full border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                Click to Enter
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} CuraWeave Health Systems. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
