import React, { useState } from 'react';

export default function AdminAdmission() {
  const [sessions] = useState([]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 w-full h-16 bg-[#131314]/80 backdrop-blur-md z-40 flex items-center px-4 md:px-8 font-['Space_Grotesk'] border-b border-white/5">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-primary/40 outline-none"
            placeholder="Search sessions…"
          />
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 space-y-8 overflow-y-auto h-[calc(100vh-64px)]">

        {/* Page title + actions */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-secondary text-xs font-bold tracking-[0.2em] uppercase">Academic Operations</h3>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white font-['Space_Grotesk']">Admission Counselling</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="bg-surface-container-highest px-4 py-2 text-white rounded-lg text-sm font-medium hover:bg-surface-bright transition-colors">Export Report</button>
            <button className="bg-gradient-to-r from-primary-container to-primary px-5 py-2 rounded-lg text-sm font-bold text-white shadow-lg shadow-red-900/20 active:scale-95 transition-transform">Schedule Session</button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'event_available', color: 'text-primary',   label: 'Total Booked Today', value: 0 },
            { icon: 'pending_actions', color: 'text-secondary', label: 'Pending Approvals',  value: 0 },
            { icon: 'check_circle',    color: 'text-green-500', label: 'Completed',           value: 0 },
          ].map(s => (
            <div key={s.label} className="bg-surface-container p-5 rounded-xl flex items-center gap-4">
              <span className={`material-symbols-outlined text-3xl ${s.color}`}>{s.icon}</span>
              <div>
                <p className="text-zinc-500 text-sm">{s.label}</p>
                <p className="text-3xl font-bold text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Sessions table */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4">Upcoming Sessions</h3>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[480px]">
                <thead>
                  <tr className="bg-surface-container-highest/30">
                    <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Student Name</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Rank</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-zinc-500">No sessions scheduled yet.</td>
                    </tr>
                  ) : sessions.map(session => (
                    <tr key={session.id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-5 py-4 text-white font-medium">{session.student}</td>
                      <td className="px-5 py-4 text-zinc-400">{session.rank}</td>
                      <td className="px-5 py-4 text-zinc-400">{session.time}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${session.status === 'PENDING' ? 'bg-secondary/10 text-secondary' :
                            session.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                            'bg-primary/10 text-primary'}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {session.status === 'PENDING' && <button className="text-xs bg-primary text-on-primary px-3 py-1.5 rounded font-bold">Approve</button>}
                        {session.status === 'APPROVED' && <button className="text-xs bg-surface-container-highest text-white px-3 py-1.5 rounded font-bold">Join Call</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
