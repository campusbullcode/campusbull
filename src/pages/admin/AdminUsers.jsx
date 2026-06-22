import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');   // 'All' | 'UG' | 'PG'

  useEffect(() => {
    fetchUsers();
  }, []);

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
      await apiFetch(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPro: !currentProStatus })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiFetch(`/admin/users/${id}`, {
        method: 'DELETE'
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const resetRankUpdates = async (id) => {
    if (!window.confirm('Reset this user\'s rank-update count to 0? They will be able to change their rank twice again.')) return;
    try {
      await apiFetch(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rankUpdates: 0 })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const premiumCount = users.filter(u => u.isPro).length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;

  const q = search.trim().toLowerCase();
  const filteredUsers = users.filter(u => {
    const matchesCourse = courseFilter === 'All' || u.ugOrPg === courseFilter;
    const matchesSearch = !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q);
    return matchesCourse && matchesSearch;
  });

  return (
    <>
      <header className="sticky top-0 right-0 w-full h-20 bg-[#131314]/80 backdrop-blur-md z-40 flex justify-between items-center px-10 font-['Space_Grotesk'] font-medium">
        <div className="flex items-center gap-6 flex-1">
          <div className="relative w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/40 text-zinc-200 placeholder-zinc-600 transition-all" placeholder="Search by name, email or phone..." type="text"/>
          </div>
        </div>
      </header>

      <section className="flex-1 p-8 overflow-y-auto h-[calc(100vh-80px)]">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-headline font-bold text-white tracking-tight">User Management</h2>
            <p className="text-zinc-500 mt-2 font-body">Manage, monitor, and support student performance across the platform.</p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
            <span className="material-symbols-outlined text-sm text-zinc-500 ml-2">filter_list</span>
            {['All', 'UG', 'PG'].map(opt => (
              <button
                key={opt}
                onClick={() => setCourseFilter(opt)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${courseFilter === opt ? 'bg-primary/15 text-primary' : 'text-zinc-400 hover:text-white'}`}
              >
                {opt === 'All' ? 'All' : opt}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="bg-surface-container-low p-6 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Users</p>
            <h3 className="text-3xl font-headline font-bold text-white">{users.length}</h3>
          </div>
          <div className="bg-surface-container-low p-6 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Students</p>
            <h3 className="text-3xl font-headline font-bold text-white">{users.length - adminCount}</h3>
          </div>
          <div className="bg-surface-container-low p-6 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Premium Users</p>
            <h3 className="text-3xl font-headline font-bold text-white">{premiumCount}</h3>
          </div>
          <div className="bg-surface-container-low p-6 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Admins</p>
            <h3 className="text-3xl font-headline font-bold text-white">{adminCount}</h3>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/30">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Role / Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Best Rank / Updates</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Joined At</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-zinc-500">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-zinc-500">No users match your filter.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-surface-container-high/40 transition-colors cursor-pointer group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-bold text-sm">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{u.name}</p>
                          <p className="text-xs text-zinc-500">ID: {u.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-zinc-300">{u.email}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">call</span>
                        {u.phone || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-zinc-400'}`}>
                          {u.role}
                        </span>
                        {u.isPro && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">PRO</span>}
                        {u.ugOrPg && <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">{u.ugOrPg}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-zinc-300">{u.bestRank != null ? `#${u.bestRank.toLocaleString()}` : '—'}</span>
                      <span className="block text-xs text-zinc-500">{u.role === 'ADMIN' ? 'unlimited' : `${u.rankUpdates ?? 0}/2 used`}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-zinc-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <button onClick={() => resetRankUpdates(u.id)} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30" title="Reset rank-update count" disabled={u.role === 'ADMIN' || (u.rankUpdates ?? 0) === 0}>
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                      </button>
                      <button onClick={() => togglePro(u.id, u.isPro)} className="p-2 text-zinc-400 hover:text-white" title="Toggle PRO Status">
                        <span className="material-symbols-outlined text-sm">workspace_premium</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
