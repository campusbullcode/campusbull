import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { predictorAccess } from '../constants/predictorLimits'
import campusBullLogo from '../campus-bull-logo.png'
import './Layout.css'

const navItems = [
  { to: '/dashboard',                      icon: 'dashboard',       label: 'Home'                  },
  { to: '/dashboard/rank-predictor',       icon: 'insights',        label: 'Rank Predictor', tool: 'rank'    },
  { to: '/dashboard/mock-tests',           icon: 'quiz',            label: 'Mock Test'             },
  { to: '/dashboard/college-predictor',    icon: 'account_balance', label: 'College Predictor', tool: 'college' },
  { to: '/dashboard/personalized-guide',   icon: 'workspace_premium', label: 'Personalized Guide', premium: true },
  { to: '/dashboard/profile',              icon: 'manage_accounts', label: 'My Profile'            },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I\'m your Campus Bull assistant 🐂. Ask me anything about NEET, colleges, or counselling!' }
  ])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const userMsg = { from: 'user', text: chatInput }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    // Simulate bot reply
    setTimeout(() => {
      const replies = [
        'Great question! Based on your rank, you can explore AIIMS, MAMC, and MMC.',
        'NEET counselling typically starts 4–6 weeks after results. Stay updated on the NTA portal.',
        'For MBBS seats, check the College Predictor for personalized recommendations!',
        'Try the Rank Predictor to get a detailed college match analysis.',
      ]
      const reply = replies[Math.floor(Math.random() * replies.length)]
      setMessages(prev => [...prev, { from: 'bot', text: reply }])
    }, 800)
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return 'U'
    return parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : parts[0][0].toUpperCase()
  }

  return (
    <div className="app-layout">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setNavOpen(true)} aria-label="Open menu">
        <span className="material-icons">menu</span>
      </button>

      {/* Mobile overlay */}
      {navOpen && <div className="sidebar-overlay" onClick={() => setNavOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" onClick={() => setNavOpen(false)} aria-label="Close menu">
          <span className="material-icons">close</span>
        </button>
        <div className="sidebar-logo">
          <img src={campusBullLogo} alt="Campus Bull" className="logo-img" />
        </div>

        <div className="sidebar-profile">
          <div className="avatar-ring">
            <div className="avatar" style={{ textTransform: 'uppercase' }}>
              {getInitials(user?.name)}
            </div>
          </div>
          <div>
            <div className="profile-name">{user?.name || 'Student'}</div>
            <div className="profile-sub">{user?.role === 'ADMIN' ? 'Administrator' : 'NEET Aspirant'}</div>
          </div>
          {user?.isPro && <span className="badge badge-gold" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>PRO</span>}
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const locked = item.tool ? predictorAccess(user, item.tool).locked : false
            const showLock = locked || item.premium
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={() => setNavOpen(false)}
                title={item.premium ? 'Premium service — view plans' : (locked ? 'You have used all your runs — upgrade or contact admin' : undefined)}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}
              >
                <span className="material-icons">{item.icon}</span>
                <span>{item.label}</span>
                {showLock && <span className="material-icons nav-lock">lock</span>}
              </NavLink>
            )
          })}
          
          {user?.role === 'ADMIN' && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', paddingLeft: '1rem' }}>Admin Tools</div>
              <NavLink to="/admin" onClick={() => setNavOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="material-icons">admin_panel_settings</span>
                <span>Admin Console</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-bottom">
          {user ? (
            <button className="nav-item logout-btn" onClick={handleLogout}>
              <span className="material-icons">logout</span>
              <span>Logout</span>
            </button>
          ) : (
            <button className="nav-item logout-btn" onClick={() => navigate('/')} style={{ color: 'var(--primary)' }}>
              <span className="material-icons">login</span>
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Floating Chat Button */}
      <button
        className={`chat-fab ${chatOpen ? 'open' : ''}`}
        onClick={() => setChatOpen(o => !o)}
        title="Open Chat Assistant"
      >
        <span className="material-icons">{chatOpen ? 'close' : 'chat'}</span>
        {!chatOpen && <span className="chat-fab-label">Ask AI</span>}
      </button>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <img src={campusBullLogo} alt="CB" className="chat-logo" />
            <div>
              <div className="chat-panel-title">Campus Bull AI</div>
              <div className="chat-panel-sub">NEET Counselling Assistant</div>
            </div>
            <button className="chat-close-btn" onClick={() => setChatOpen(false)}>
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from}`}>{m.text}</div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about NEET, colleges..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button className="chat-send-btn" onClick={sendMessage}>
              <span className="material-icons">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

