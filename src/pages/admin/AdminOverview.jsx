import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

export default function AdminOverview({ onNavigate }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTestsTaken: 0,
    avgScore: 0,
    pendingQs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    apiFetch('/admin/overview-stats')
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const kpis = [
    { label: 'Total Students',   value: stats.totalUsers,      icon: 'group',       color: 'text-blue-400',   bg: 'from-blue-500/10 to-blue-500/5', tabId: 'users' },
    { label: 'Active (24 h)',     value: stats.activeUsers,     icon: 'bolt',        color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-500/5', tabId: 'users' },
    { label: 'Tests Taken',       value: stats.totalTestsTaken, icon: 'assignment',  color: 'text-violet-400',  bg: 'from-violet-500/10 to-violet-500/5', tabId: 'users' },
    { label: 'Avg Score',         value: `${stats.avgScore}%`,  icon: 'grade',       color: 'text-yellow-400',  bg: 'from-yellow-500/10 to-yellow-500/5', tabId: 'users' },
    { label: 'Pending Questions', value: stats.pendingQs,       icon: 'contact_support', color: 'text-red-400', bg: 'from-red-500/10 to-red-500/5',
      badge: stats.pendingQs > 0, tabId: 'qa' },
  ];

  const modules = [
    {
      id: 'users',
      icon: 'manage_accounts',
      label: 'User Management',
      desc: 'View, promote, and manage all registered students. Upgrade accounts to PRO or revoke access.',
      color: 'from-blue-600 to-blue-800',
      badge: null,
      accent: '#3b82f6',
    },
    {
      id: 'qa',
      icon: 'quiz',
      label: 'Q&A Management',
      desc: 'Review, approve or reject student questions. Answer queries and maintain the knowledge base.',
      color: 'from-violet-600 to-violet-800',
      badge: stats.pendingQs > 0 ? `${stats.pendingQs} pending` : null,
      accent: '#8b5cf6',
    },
    /*
    {
      id: 'announcements',
      icon: 'campaign',
      label: 'Announcements',
      desc: 'Broadcast notices to every student dashboard. Publish, pause, or delete platform-wide messages.',
      color: 'from-red-600 to-red-800',
      badge: null,
      accent: '#ef4444',
    },
    */
    {
      id: 'admission',
      icon: 'school',
      label: 'Admission Counselling',
      desc: 'Schedule and manage one-on-one admission counselling sessions for students.',
      color: 'from-emerald-600 to-emerald-800',
      badge: null,
      accent: '#10b981',
    },
    {
      id: 'guide',
      icon: 'support_agent',
      label: 'Guide Counselling',
      desc: 'Manage expert guides, assign mentors to students, and track mentorship progress.',
      color: 'from-orange-600 to-orange-800',
      badge: null,
      accent: '#f97316',
    },
  ];

  return (
    <>
      {/* TopNavBar */}
      <header className="sticky top-0 z-40 bg-[#131314]/80 backdrop-blur-md h-16 flex justify-between items-center px-4 md:px-8 w-full font-['Space_Grotesk'] font-medium border-b border-white/5">
        <div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Admin Console</p>
          <h1 className="text-white font-bold text-lg leading-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-white font-bold text-sm">{timeStr}</p>
            <p className="text-zinc-500 text-xs">{dateStr}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-emerald-400 text-xs font-bold">System Operational</span>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 overflow-y-auto h-[calc(100vh-64px)] space-y-8">

        {/* KPI Strip */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((k) => (
            <button
              key={k.label}
              onClick={() => k.tabId && onNavigate(k.tabId)}
              className={`bg-gradient-to-br ${k.bg} border border-white/5 p-5 rounded-2xl flex flex-col gap-3 relative text-left ${k.tabId ? 'cursor-pointer hover:shadow-xl hover:border-white/10 hover:-translate-y-1 transition-all' : ''}`}
            >
              {k.badge && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className={`material-symbols-outlined text-2xl ${k.color}`}>{k.icon}</span>
              <div>
                <p className="text-2xl font-bold text-white">{loading ? '—' : k.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">{k.label}</p>
              </div>
            </button>
          ))}
        </section>

        {/* Section label */}
        <div>
          <h2 className="text-xs text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Management Modules</h2>
          <p className="text-zinc-400 text-sm">Select a module to manage your platform.</p>
        </div>

        {/* Module Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className="group text-left bg-surface-container-low border border-white/5 hover:border-white/15 rounded-3xl p-7 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
              style={{ '--accent': mod.accent }}
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {mod.icon}
                  </span>
                </div>
                {mod.badge && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse">
                    {mod.badge}
                  </span>
                )}
              </div>

              {/* Label + desc */}
              <div>
                <h3 className="text-white font-bold text-lg leading-tight group-hover:text-white transition-colors">
                  {mod.label}
                </h3>
                <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">{mod.desc}</p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1.5 text-xs font-bold mt-auto" style={{ color: mod.accent }}>
                Open Module
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </button>
          ))}
        </section>

        {/* Quick tips footer */}
        <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6 flex items-center gap-5">
          <span className="material-symbols-outlined text-3xl text-zinc-600 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            tips_and_updates
          </span>
          <div>
            <p className="text-white font-bold text-sm">Admin Tip</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              Keep an eye on the Q&A section to resolve student queries promptly and maintain a high satisfaction rate.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
