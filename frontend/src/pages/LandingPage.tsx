import React from 'react';
import { Link } from 'react-router-dom';
import { User, Briefcase, Stethoscope } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen theme-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-lg shadow-black/50">
              <Stethoscope className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Welcome to <span className="text-purple-400">CuraWeave</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Select User Type to Continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto w-full">
          {/* Doctor / Staff Portal */}
          <Link to="/doctor/login" className="group relative block w-full">
            <div className="absolute -inset-4 rounded-2xl opacity-60 group-hover:opacity-80 transition duration-300 blur-2xl bg-white/30"></div>
            <div className="absolute -inset-0.5 rounded-2xl opacity-80 group-hover:opacity-100 transition duration-300 blur-md doctor-gradient"></div>
            <div className="relative doctor-gradient rounded-xl p-10 flex flex-col items-center text-center space-y-6 transition border border-purple-600/40 h-full justify-center">
              <div className="w-20 h-20 bg-zinc-800/70 rounded-full flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-lg shadow-purple-900/30">
                <Briefcase className="w-10 h-10 text-purple-300" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">Admin Portal</h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  For doctors, administrators, and staff
                </p>
              </div>
              <div className="mt-4 px-4 py-2 bg-purple-500/10 text-purple-300 text-sm font-medium rounded-full border border-purple-500/30 group-hover:bg-purple-500 group-hover:text-white transition-all">
                Click to Enter
              </div>
            </div>
          </Link>

          {/* Patient Portal */}
          <Link to="/patient/login" className="group relative block w-full">
            <div className="absolute -inset-4 rounded-2xl opacity-60 group-hover:opacity-80 transition duration-300 blur-2xl bg-white/30"></div>
            <div className="absolute -inset-0.5 rounded-2xl opacity-80 group-hover:opacity-100 transition duration-300 blur-md patient-gradient"></div>
            <div className="relative patient-gradient rounded-xl p-10 flex flex-col items-center text-center space-y-6 transition border border-amber-600/40 h-full justify-center">
              <div className="w-20 h-20 bg-zinc-800/70 rounded-full flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-lg shadow-amber-900/20">
                <User className="w-10 h-10 text-yellow-200" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-yellow-50 mb-3 group-hover:text-yellow-100 transition-colors">Patient Portal</h2>
                <p className="text-yellow-100/80 text-base leading-relaxed">
                  For patients and family members
                </p>
              </div>
              <div className="mt-4 px-4 py-2 bg-yellow-500/20 text-yellow-100 text-sm font-medium rounded-full border border-yellow-600/40 group-hover:bg-yellow-500/30 group-hover:text-yellow-50 transition-all">
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
