import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'
import AnnouncementBanner from '../components/AnnouncementBanner'
import './Dashboard.css'

// Removed static QA_LIST

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_NAME = 'April 2025'
const TOTAL_DAYS = 30
const START_DAY = 2
const TODAY = new Date().getDate()

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentAttempts, setRecentAttempts] = useState([])
  const [tooltip, setTooltip] = useState(null)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [qaPosts, setQaPosts] = useState([])
  const [newQuestion, setNewQuestion] = useState('')
  const [posting, setPosting] = useState(false)
  const [replyInputs, setReplyInputs] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [postingReply, setPostingReply] = useState(false)

  useEffect(() => {
    if (!user) { setLoadingStats(false); return }
    Promise.all([
      apiFetch('/user/stats').catch(() => null),
      apiFetch('/user/attempts').catch(() => []),
      apiFetch('/qa').catch(() => [])
    ]).then(([s, a, q]) => {
      setStats(s)
      setRecentAttempts(a || [])
      setQaPosts(q || [])
    }).finally(() => setLoadingStats(false))
  }, [user])

  const handlePostQuestion = async (e) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    setPosting(true)
    try {
      await apiFetch('/qa/question', {
        method: 'POST',
        body: JSON.stringify({ content: newQuestion })
      })
      setNewQuestion('')
      const q = await apiFetch('/qa').catch(() => [])
      setQaPosts(q || [])
    } catch (err) {
      alert(err.message || 'Failed to post question')
    } finally {
      setPosting(false)
    }
  }

  const handlePostReply = async (questionId) => {
    const content = replyInputs[questionId]?.trim()
    if (!content) return
    setPostingReply(true)
    try {
      await apiFetch(`/qa/question/${questionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ content })
      })
      setReplyInputs(prev => ({ ...prev, [questionId]: '' }))
      setReplyingTo(null)
      const q = await apiFetch('/qa').catch(() => [])
      setQaPosts(q || [])
    } catch (err) {
      alert(err.message || 'Failed to post reply')
    } finally {
      setPostingReply(false)
    }
  }

  const streakCount = stats?.streak ?? user?.streak ?? 0

  // Build streak days by highlighting consecutive days ending today
  const STREAK_DAYS = new Set()
  for (let i = 0; i < streakCount; i++) {
    const d = TODAY - i
    if (d > 0) STREAK_DAYS.add(d)
  }

  const STAT_CARDS = [
    {
      label: 'Mock Tests Taken',
      value: loadingStats ? '—' : (stats?.testsTaken ?? user?.testsTaken ?? 0).toString(),
      icon: 'quiz',
      delta: stats?.weeklyAttempts ? `+${stats.weeklyAttempts} this week` : 'Start testing!',
      color: '#d32f2f'
    },
    {
      label: 'Avg Score',
      value: loadingStats ? '—' : `${Math.round(stats?.avgScore ?? user?.avgScore ?? 0)}%`,
      icon: 'analytics',
      delta: stats?.avgScore > 70 ? '🔥 Above average!' : 'Keep improving',
      color: '#f8bd2a'
    },
    {
      label: 'Best Rank',
      value: loadingStats ? '—' : (stats?.bestRank ? `#${stats.bestRank.toLocaleString()}` : 'TBD'),
      icon: 'insights',
      delta: 'Use Rank Predictor',
      color: '#60a5fa'
    },
    {
      label: 'Study Streak',
      value: loadingStats ? '—' : `${stats?.streak ?? user?.streak ?? streakCount}d`,
      icon: 'local_fire_department',
      delta: streakCount > 5 ? 'Personal best! 🎉' : 'Build your streak!',
      color: '#4ade80'
    },
  ]

  const RECOMMENDATIONS = [
    { name: 'SDU University Kolar',     rank: '#3 Karnataka',     match: stats?.avgScore > 70 ? 74 : 58, color: '#d32f2f' },
    { name: 'Aakash Medical College',  rank: '#5 Rajasthan',     match: stats?.avgScore > 80 ? 81 : 60, color: '#f8bd2a' },
    { name: 'Saptagiri University',    rank: '#6 Karnataka',     match: stats?.avgScore > 65 ? 70 : 52, color: '#4ade80' },
  ]

  // Calendar
  const blanks = Array(START_DAY).fill(null)
  const dayCells = [...blanks, ...Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1)]

  const handleDayEnter = (e, day) => {
    if (!day) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ day, top: rect.top - 8, left: rect.left + rect.width / 2 })
    setHoveredDay(day)
  }
  const handleDayLeave = () => { setTooltip(null); setHoveredDay(null) }

  const firstName = user?.name?.split(' ')[0] || 'Student'

  return (
    <div className="page-container">

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Welcome header */}
      <div className="dash-header animate-in">
        <div>
          <p className="welcome-sub">{getGreeting()},</p>
          <h1 className="welcome-name">{firstName} <span className="wave">👋</span></h1>
          <p className="welcome-meta">
            {user?.branch || 'NEET Aspirant'}&nbsp;·&nbsp;
            {user?.targetYear ? `Target ${user.targetYear}` : 'Campus Bull'}&nbsp;·&nbsp;
            <span style={{ color: user?.isPro ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
              {user?.isPro ? '⭐ PRO Member' : user ? 'Free Plan' : 'Guest'}
            </span>
          </p>
        </div>
        <div className="dash-actions">
          <Link to="/dashboard/mock-tests" className="btn-primary">
            <span className="material-icons">play_arrow</span>
            Start Mock Test
          </Link>
          <Link to="/dashboard/rank-predictor" className="btn-secondary">
            <span className="material-icons">insights</span>
            Predict Rank
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {STAT_CARDS.map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ '--stat-color': s.color }}>
            <div className="stat-icon-row">
              <span className="material-icons stat-icon" style={{ color: s.color }}>{s.icon}</span>
              <span className="stat-delta">{s.delta}</span>
            </div>
            <div className="stat-number">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="dash-main-grid">
        {/* Left: News + Calendar */}
        <div className="dash-col-left">
          <section className="animate-in">
            <p className="section-label">Q/A Forum</p>

            {/* Inline ask box */}
            <form onSubmit={handlePostQuestion} style={{ marginBottom: '1.25rem' }}>
              <textarea
                style={{
                  width: '100%', minHeight: '72px', background: 'var(--surface-container-low)',
                  border: '1px solid var(--outline-variant)', borderRadius: '0.75rem',
                  padding: '0.75rem 1rem', color: 'var(--on-surface)', fontSize: '0.9rem',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box', display: 'block'
                }}
                placeholder="Ask a counselling question — e.g. With rank 45,000 OBC, which state counselling should I prefer?"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" disabled={posting || !newQuestion.trim()} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                  <span className="material-icons" style={{ fontSize: '1rem' }}>send</span>
                  {posting ? 'Posting...' : 'Submit Question'}
                </button>
              </div>
            </form>

            {/* Q/A threads */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {qaPosts.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', padding: '1rem 0' }}>No questions yet. Be the first to ask!</p>
              ) : qaPosts.map(qa => (
                <div key={qa.id} className="card animate-in" style={{ padding: '1rem', background: 'var(--surface-container-low)', borderRadius: '0.875rem' }}>
                  {/* Question */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--primary)' }}>help_outline</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>
                        {qa.user?.name || 'Student'} · {new Date(qa.createdAt).toLocaleDateString()}
                        {qa.status === 'PENDING' && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#f8bd2a', background: '#f8bd2a15', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>Pending</span>}
                      </div>
                      <p style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.45, color: 'var(--on-surface)' }}>{qa.content}</p>
                    </div>
                  </div>

                  {/* Answers chain */}
                  {qa.answers && qa.answers.length > 0 && (
                    <div style={{ marginTop: '0.75rem', marginLeft: '2.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {qa.answers.map(ans => (
                        <div key={ans.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: ans.user?.role === 'ADMIN' ? '#4ade8022' : 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-icons" style={{ fontSize: '0.85rem', color: ans.user?.role === 'ADMIN' ? '#4ade80' : 'var(--on-surface-variant)' }}>
                              {ans.user?.role === 'ADMIN' ? 'verified' : 'person'}
                            </span>
                          </div>
                          <div style={{ flex: 1, background: ans.user?.role === 'ADMIN' ? '#4ade8010' : 'var(--surface-container-highest)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', borderLeft: ans.user?.role === 'ADMIN' ? '3px solid #4ade80' : '3px solid var(--outline-variant)' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: ans.user?.role === 'ADMIN' ? '#4ade80' : 'var(--on-surface-variant)', marginBottom: '0.2rem' }}>
                              {ans.user?.name || 'User'}{ans.user?.role === 'ADMIN' ? ' · Expert' : ''}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface)', lineHeight: 1.5 }}>{ans.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply toggle */}
                  <div style={{ marginTop: '0.75rem', marginLeft: '2.75rem' }}>
                    {replyingTo === qa.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <textarea
                          style={{
                            flex: 1, minHeight: '56px', background: 'var(--surface-container-highest)',
                            border: '1px solid var(--outline-variant)', borderRadius: '0.5rem',
                            padding: '0.5rem 0.75rem', color: 'var(--on-surface)', fontSize: '0.85rem',
                            outline: 'none', resize: 'none', boxSizing: 'border-box'
                          }}
                          placeholder="Write your answer..."
                          value={replyInputs[qa.id] || ''}
                          onChange={e => setReplyInputs(prev => ({ ...prev, [qa.id]: e.target.value }))}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => handlePostReply(qa.id)}
                            disabled={postingReply || !replyInputs[qa.id]?.trim()}
                          >
                            {postingReply ? '...' : 'Post'}
                          </button>
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}
                            onClick={() => setReplyingTo(null)}
                          >Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}
                        onClick={() => setReplyingTo(qa.id)}
                      >
                        <span className="material-icons" style={{ fontSize: '0.9rem' }}>reply</span>
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Attempts */}
          {recentAttempts.length > 0 && (
            <section className="animate-in" style={{ marginTop: '1.75rem' }}>
              <p className="section-label">Recent Test Results</p>
              <div className="card" style={{ padding: '1rem' }}>
                {recentAttempts.slice(0, 4).map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a.test?.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: a.score / a.totalMarks >= 0.7 ? '#4ade80' : '#f8bd2a', fontSize: '1rem' }}>
                        {Math.round((a.score / a.totalMarks) * 100)}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{a.score}/{a.totalMarks}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right: Recommendations + CTA */}
        <div className="dash-col-right">
          <section className="animate-in">
            <p className="section-label">Top Recommendations</p>
            <div className="reco-list">
              {RECOMMENDATIONS.map(r => (
                <div key={r.name} className="reco-card card">
                  <div className="reco-top">
                    <div>
                      <div className="reco-name">{r.name}</div>
                      <div className="reco-rank">
                        <span className="material-icons" style={{ fontSize: '0.8rem', color: '#f8bd2a' }}>star</span>
                        {r.rank}
                      </div>
                    </div>
                    <div className="reco-match" style={{ color: r.color }}>{r.match}%</div>
                  </div>
                  <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                    <div className="progress-fill" style={{ width: `${r.match}%`, background: `linear-gradient(90deg, ${r.color}88, ${r.color})` }} />
                  </div>
                  <div className="reco-foot">Match Probability</div>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly Tracker */}
          <section className="animate-in">
            <p className="section-label">Monthly Tracker</p>
            <div className="card cal-card">
              <div className="cal-header">
                <div className="cal-month-row">
                  <span className="material-icons cal-icon">calendar_month</span>
                  <span className="cal-month">{MONTH_NAME}</span>
                </div>
                <span className="badge badge-red">
                  <span className="material-icons" style={{ fontSize: '0.75rem' }}>local_fire_department</span>
                  {streakCount} day streak
                </span>
              </div>
              <div className="cal-grid">
                {DAYS.map(d => (
                  <div key={d} className="cal-day-label">{d}</div>
                ))}
                {dayCells.map((day, idx) => {
                  if (!day) return <div key={`blank-${idx}`} className="cal-cell blank" />
                  const isActive = STREAK_DAYS.has(day)
                  const isToday = day === TODAY
                  const isFuture = day > TODAY
                  const isHovered = hoveredDay === day
                  return (
                    <div
                      key={day}
                      className={`cal-cell ${isActive ? 'active' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${isHovered ? 'hovered' : ''}`}
                      onMouseEnter={e => handleDayEnter(e, day)}
                      onMouseLeave={handleDayLeave}
                    >
                      <span className="cal-day-num">{day}</span>
                      {isActive && !isFuture && <span className="cal-pip" />}
                    </div>
                  )
                })}
              </div>
              <p className="cal-foot">
                <span className="material-icons" style={{ fontSize: '0.85rem' }}>check_circle</span>
                {STREAK_DAYS.size} days studied&nbsp;·&nbsp;{Math.round((STREAK_DAYS.size / TOTAL_DAYS) * 100)}% completion
              </p>
            </div>
          </section>

          {/* Quick Links */}
          <div className="quick-links animate-in">
            <p className="section-label" style={{ marginBottom: '0.75rem' }}>Quick Access</p>
            <div className="quick-grid">
              {[
                { to: '/dashboard/rank-predictor',    icon: 'insights',         label: 'Rank Predictor', color: '#d32f2f' },
                { to: '/dashboard/mock-tests',        icon: 'quiz',             label: 'Mock Tests',     color: '#f8bd2a' },
                { to: '/dashboard/college-predictor', icon: 'account_balance',  label: 'College Finder', color: '#4ade80' },
                { to: '/dashboard/profile',           icon: 'manage_accounts',  label: 'My Profile',     color: '#a78bfa' },
              ].map(q => (
                <Link key={q.to} to={q.to} className="quick-item">
                  <span className="material-icons" style={{ color: q.color, fontSize: '1.5rem' }}>{q.icon}</span>
                  <span>{q.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Tooltip */}
      {tooltip && (
        <div className="cal-tooltip" style={{ position: 'fixed', top: tooltip.top - 52, left: tooltip.left, transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'none' }}>
          <div className="cal-tooltip-title">April {tooltip.day}, 2025</div>
          {STREAK_DAYS.has(tooltip.day) && tooltip.day <= TODAY ? (
            <div className="cal-tooltip-streak">
              <span className="material-icons" style={{ fontSize: '0.85rem', color: '#f97316' }}>local_fire_department</span>
              Day {[...STREAK_DAYS].filter(d => d <= tooltip.day).length} of streak!
            </div>
          ) : tooltip.day > TODAY ? (
            <div className="cal-tooltip-future">Upcoming 📅</div>
          ) : (
            <div className="cal-tooltip-missed">Missed day</div>
          )}
        </div>
      )}
    </div>
  )
}
