import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import './MockTests.css'

const FILTERS = ['All', 'Full Syllabus', 'Chapter', 'PYQ', 'Grand Test']
const diffColor = { Hard: 'badge-red', Medium: 'badge-gold', Real: 'badge-green', Live: 'badge-gold' }

const subjectColor = { Physics: '#60a5fa', Chemistry: '#f8bd2a', Biology: '#4ade80' }

export default function MockTests() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState(null)

  useEffect(() => {
    // Load demo/curated tests AND real question papers, merged into one grid.
    Promise.all([
      apiFetch('/tests').catch(() => []),
      apiFetch('/papers').catch(() => []),
    ])
      .then(([demoTests, papers]) => {
        const paperTests = papers
          .filter(p => p.questionCount > 0)            // only papers with extracted questions
          .map(p => ({
            id: `paper-${p.slug}`,
            isPaper: true,
            slug: p.slug,
            type: 'PYQ',
            title: `${p.title} — Full Paper`,
            subjects: ['Physics', 'Chemistry', 'Biology'],
            questions: p.questionCount,
            duration: p.durationMin,
            attempts: 0,
            avgScore: 0,
            difficulty: 'Real',
            tag: p.gradedCount > 0 ? 'New' : null,
          }))
        setTests([...paperTests, ...demoTests])         // full papers first
      })
      .finally(() => setLoading(false))

    if (user) {
      apiFetch('/user/stats').then(setUserStats).catch(() => {})
    }
  }, [user])

  const filtered = tests.filter(t =>
    (filter === 'All' || t.type === filter) &&
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <div>
          <p className="section-label">Assessment Center</p>
          <h1 className="page-title">NEET Mock Tests</h1>
          <p className="page-subtitle">500+ curated tests aligned with NTA NEET exam pattern</p>
        </div>
        <div className="tests-meta">
          <div className="stat-card" style={{ minWidth: 120 }}>
            <div className="stat-number">{userStats?.testsTaken ?? user?.testsTaken ?? 0}</div>
            <div className="stat-card-label">Tests Completed</div>
          </div>
          <div className="stat-card" style={{ minWidth: 120 }}>
            <div className="stat-number" style={{ color: 'var(--secondary)' }}>
              {userStats?.avgScore ? `${Math.round(userStats.avgScore)}%` : '—'}
            </div>
            <div className="stat-card-label">Avg Score</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="test-filters animate-in">
        <div className="filter-chips">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="input-icon-wrap" style={{ maxWidth: 280 }}>
          <span className="material-icons input-icon">search</span>
          <input
            className="field-input with-icon"
            placeholder="Search tests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Test Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-icons" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>hourglass_empty</span>
          Loading tests...
        </div>
      ) : (
        <div className="tests-grid">
          {filtered.map(t => (
            <div key={t.id} className="test-card card animate-in">
              <div className="test-top">
                <div className="test-tags">
                  <span className="chip">{t.type}</span>
                  {t.tag && <span className={`badge ${t.tag === 'Live' ? 'badge-red' : t.tag === 'New' ? 'badge-green' : 'badge-gold'}`}>{t.tag}</span>}
                </div>
                <span className={`badge ${diffColor[t.difficulty] || 'badge-gold'}`}>{t.difficulty}</span>
              </div>

              <h3 className="test-title">{t.title}</h3>

              <div className="test-subjects">
                {t.subjects.map(s => (
                  <span key={s} className="chip" style={{ fontSize: '0.7rem', color: subjectColor[s] }}>{s}</span>
                ))}
              </div>

              <div className="test-stats">
                <div className="test-stat">
                  <span className="material-icons test-stat-icon">quiz</span>
                  <span>{t.questions} Qs</span>
                </div>
                <div className="test-stat">
                  <span className="material-icons test-stat-icon">schedule</span>
                  <span>{Math.floor(t.duration / 60)}h {t.duration % 60 > 0 ? `${t.duration % 60}m` : ''}</span>
                </div>
                <div className="test-stat">
                  <span className="material-icons test-stat-icon">group</span>
                  <span>{t.attempts > 1000 ? `${(t.attempts / 1000).toFixed(1)}k` : t.attempts} attempts</span>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginBottom: '0.4rem' }}>
                  <span>Avg Score</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{Math.round(t.avgScore)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${t.avgScore}%`, background: 'linear-gradient(90deg, #f8bd2a88, #f8bd2a)' }} />
                </div>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem' }}
                onClick={() => {
                  if (!user) navigate('/')
                  else if (t.isPaper) navigate(`/dashboard/paper-test/${t.slug}`)
                  else navigate(`/dashboard/mock-test/${t.id}`)
                }}
              >
                <span className="material-icons">play_arrow</span>
                {user ? 'Start Test' : 'Login to Start'}
              </button>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>
              No tests found matching your filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
