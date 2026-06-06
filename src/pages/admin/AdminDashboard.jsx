import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import AdminOverview from './AdminOverview';
import AdminQA from './AdminQA';
import AdminUsers from './AdminUsers';
import AdminAdmission from './AdminAdmission';
import AdminGuide from './AdminGuide';
import AdminAnnouncements from './AdminAnnouncements';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', component: <AdminOverview onNavigate={setActiveTab} /> },
    { id: 'users', icon: 'group', label: 'User Management', component: <AdminUsers /> },
    { id: 'qa', icon: 'quiz', label: 'Q/A Management', component: <AdminQA /> },
    // { id: 'announcements', icon: 'campaign', label: 'Announcements', component: <AdminAnnouncements /> },
    { id: 'admission', icon: 'school', label: 'Admission Counselling', component: <AdminAdmission /> },
    { id: 'guide', icon: 'support_agent', label: 'Guide Counselling', component: <AdminGuide /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-[#131314] text-[#e5e2e3] font-['Inter'] min-h-screen overflow-hidden flex">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-64 z-50 bg-[#1C1B1C] shadow-2xl shadow-black flex flex-col p-6 font-['Space_Grotesk'] tracking-tight">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-container to-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-white">NEET Prep</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-red-600/20 to-transparent text-[#EF4444] font-bold scale-95'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
          <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
            >
              <span className="material-symbols-outlined">exit_to_app</span>
              <span>Exit Admin</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3 cursor-pointer" onClick={handleLogout}>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container/30 bg-surface-container-highest flex items-center justify-center font-bold text-white uppercase">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-zinc-500 truncate text-red-400 hover:text-red-300 transition-colors">Logout</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 h-screen flex flex-col overflow-hidden bg-[#131314]">
        {tabs.find((t) => t.id === activeTab)?.component}
      </main>
    </div>
  );
}
