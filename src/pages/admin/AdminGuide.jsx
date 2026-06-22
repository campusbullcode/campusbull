import React, { useState } from 'react';

export default function AdminGuide() {
  const [guides] = useState([]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 w-full h-16 bg-[#131314]/80 backdrop-blur-md z-40 flex items-center px-4 md:px-8 font-['Space_Grotesk'] border-b border-white/5">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-primary/40 outline-none"
            placeholder="Search guides…"
          />
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 space-y-8 overflow-y-auto h-[calc(100vh-64px)]">

        {/* Page title + actions */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-secondary text-xs font-bold tracking-[0.2em] uppercase">Guidance & Mentorship</h3>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white font-['Space_Grotesk']">Guide Counselling</h2>
          </div>
          <button className="self-start sm:self-auto bg-gradient-to-r from-primary-container to-primary px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg shadow-red-900/20 active:scale-95 transition-transform">
            Add New Guide
          </button>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'groups',  color: 'text-primary',   label: 'Active Guides',          value: guides.length },
            { icon: 'star',    color: 'text-secondary', label: 'Average Rating',          value: guides.length > 0 ? '4.7' : '0.0' },
            { icon: 'school',  color: 'text-green-500', label: 'Total Students Mentored', value: 0 },
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

        {/* Directory */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4">Expert Guides Directory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guides.length === 0 ? (
              <div className="col-span-full bg-surface-container-low rounded-2xl p-8 text-center border border-white/5">
                <span className="material-symbols-outlined text-4xl text-zinc-600 mb-2 block">support_agent</span>
                <p className="text-zinc-500 text-sm">No expert guides have been added yet.</p>
              </div>
            ) : guides.map(guide => (
              <div key={guide.id} className="bg-surface-container p-5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">{guide.name[0]}</div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{guide.name}</h4>
                    <p className="text-xs text-primary font-bold">{guide.topic}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/10 text-xs text-zinc-400">
                  <span><span className="text-secondary font-bold">★</span> {guide.rating}</span>
                  <span><span className="text-white font-bold">{guide.students}</span> Students</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 py-2 bg-surface-container-low text-white text-xs rounded hover:bg-surface-container-highest transition-colors">View Profile</button>
                  <button className="flex-1 py-2 bg-primary/10 text-primary font-bold text-xs rounded hover:bg-primary/20 transition-colors">Assign Student</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
