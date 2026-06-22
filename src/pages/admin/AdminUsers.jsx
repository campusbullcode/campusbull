import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePro = async (id, currentProStatus) => {
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ isPro: !currentProStatus }) });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const resetRankUpdates = async (id) => {
    if (!window.confirm("Reset this user's rank-update count to 0?")) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ rankUpdates: 0 }) });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const premiumCount = users.filter(u => u.isPro).length;
  const adminCount   = users.filter(u => u.role === 'ADMIN').length;

  const q = search.trim().toLowerCase();
  const filteredUsers = users.filter(u => {
    const matchesCourse  = courseFilter === 'All' || u.ugOrPg === courseFilter;
    const matchesSearch  = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
    return matchesCourse && matchesSearch;
  });

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 w-full h-16 bg-[#131314]/80 backdrop-blur-md z-40 flex items-center gap-3 px-4 md:px-8 font-['Space_Grotesk'] border-b border-white/5">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-primary/40 outline-none"
            placeholder="Search users…"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
          {['All', 'UG', 'PG'].map(opt => (
            <button
              key={opt}
              onClick={() => setCourseFilter(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${courseFilter === opt ? 'bg-primary/15 text-primary' : 'text-zinc-400 hover:text-white'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </header>

      <section className="flex-1 px-4 md:px-8 py-6 overflow-y-auto h-[calc(100vh-64px)]">
        <div className="mb-6">
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight font-['Space_Grotesk']">User Management</h2>
          <p className="text-zinc-500 text-sm mt-1">Manage and monitor all registered users.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Users',    value: users.length },
            { label: 'Students',       value: users.length - adminCount },
            { label: 'Premium Users',  value: premiumCount },
            { label: 'Admins',         value: adminCount },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-low p-4 rounded-2xl">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</p>
              <h3 className="text-2xl font-bold text-white">{s.value}</h3>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-surface-container-low rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest/30">
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role / Plan</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Best Rank</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Joined</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {loading ? (
                  <tr><td colSpan="6" className="px-5 py-8 text-center text-zinc-500">Loading…</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-8 text-center text-zinc-500">No users match your filter.</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{u.name[0]}</div>
                        <div>
                          <p className="text-sm font-bold text-white">{u.name}</p>
                          <p className="text-xs text-zinc-500">ID: {u.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-zinc-300">{u.email}</p>
                      <p className="text-xs text-zinc-500">{u.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'ADMIN' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-zinc-400'}`}>{u.role}</span>
                        {u.isPro && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase">PRO</span>}
                        {u.ugOrPg && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase">{u.ugOrPg}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-zinc-300">{u.bestRank != null ? `#${u.bestRank.toLocaleString()}` : '—'}</span>
                      <span className="block text-xs text-zinc-500">{u.role === 'ADMIN' ? 'unlimited' : `${u.rankUpdates ?? 0}/2 used`}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button onClick={() => resetRankUpdates(u.id)} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30" title="Reset rank updates" disabled={u.role === 'ADMIN' || (u.rankUpdates ?? 0) === 0}>
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                      </button>
                      <button onClick={() => togglePro(u.id, u.isPro)} className="p-1.5 text-zinc-400 hover:text-white" title="Toggle PRO">
                        <span className="material-symbols-outlined text-sm">workspace_premium</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden flex flex-col gap-3">
          {loading ? (
            <p className="text-zinc-500 text-sm text-center py-8">Loading…</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No users match your filter.</p>
          ) : filteredUsers.map(u => (
            <div key={u.id} className="bg-surface-container-low rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white font-bold flex-shrink-0">{u.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{u.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  {u.phone && <p className="text-xs text-zinc-600">{u.phone}</p>}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'ADMIN' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-zinc-400'}`}>{u.role}</span>
                  {u.isPro && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase">PRO</span>}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-white/5">
                <span>Rank: {u.bestRank != null ? `#${u.bestRank.toLocaleString()}` : '—'} · {u.role === 'ADMIN' ? 'unlimited' : `${u.rankUpdates ?? 0}/2 used`}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => resetRankUpdates(u.id)} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30" disabled={u.role === 'ADMIN' || (u.rankUpdates ?? 0) === 0}>
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                  </button>
                  <button onClick={() => togglePro(u.id, u.isPro)} className="p-1.5 text-zinc-400 hover:text-white">
                    <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
