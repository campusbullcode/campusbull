import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'
import './Profile.css'

import { STATES_LIST } from '../constants/states'


const BRANCHES = ['NEET MBBS', 'NEET BDS', 'NEET AYUSH', 'Engineering', 'Other']
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS']
const TARGET_YEARS = ['2025','2026','2027','2028']

export default function Profile() {
  const { user, refetchUser } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({
    name: '', phone: '', branch: '', category: '', domicile: '', targetYear: '',
    ugOrPg: '', address: '', bestRank: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(location.state?.message || '')
  const [attempts, setAttempts] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [dynamicCategories, setDynamicCategories] = useState(CATEGORIES)

  useEffect(() => {
    if (!form.domicile || !form.ugOrPg) {
      setDynamicCategories(CATEGORIES)
      return
    }
    const stateVal = STATES_LIST.find(s => s.label === form.domicile)?.value
    if (!stateVal) return
    apiFetch(`/predict/categories?state=${stateVal}&course=${form.ugOrPg}`)
      .then(data => {
        if (data.categories?.length > 0) {
          setDynamicCategories(data.categories)
        } else {
          setDynamicCategories(CATEGORIES)
        }
      })
      .catch(() => setDynamicCategories(CATEGORIES))
  }, [form.domicile, form.ugOrPg])

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        branch: user.branch || '',
        category: user.category || '',
        domicile: user.domicile || '',
        targetYear: user.targetYear?.toString() || '',
        ugOrPg: user.ugOrPg || '',
        address: user.address || '',
        bestRank: user.bestRank?.toString() || ''
      })
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    apiFetch('/user/attempts')
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setLoadingHistory(false))
  }, [user])

  if (!user) return <Navigate to="/login" replace />

  const handleSave = async (e) => {
    e.preventDefault()
    // Changing the saved NEET rank spends one of the (max 2) rank-update tokens.
    const rankChanged = String(form.bestRank || '') !== String(user?.bestRank ?? '')
    if (rankChanged && user?.role !== 'ADMIN') {
      const left = Math.max(0, 2 - (user?.rankUpdates || 0))
      const ok = window.confirm(
        left > 0
          ? `Heads up — saving a new NEET rank will use 1 of your ${left} remaining rank update${left !== 1 ? 's' : ''} (max 2). Continue?`
          : 'You have no rank updates left (max 2). Your other details will save, but the rank won\'t change. Continue?'
      )
      if (!ok) return
    }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await apiFetch('/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ ...form, targetYear: form.targetYear ? Number(form.targetYear) : undefined })
      })
      await refetchUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]
  }

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <div>
          <p className="section-label">Account</p>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and track your performance history.</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left: Avatar + Stats */}
        <div className="profile-sidebar animate-in">
          <div className="profile-avatar-card card">
            <div className="profile-avatar-ring">
              <div className="profile-avatar-big">{getInitials(user.name)}</div>
            </div>
            <div className="profile-avatar-name">{user.name}</div>
            <div className="profile-avatar-email">{user.email}</div>
            <div className="profile-role-badge">
              <span className="chip" style={{ background: user.role === 'ADMIN' ? 'rgba(211,47,47,0.2)' : 'rgba(255,255,255,0.05)', color: user.role === 'ADMIN' ? '#ef4444' : 'var(--on-surface-variant)' }}>
                {user.role}
              </span>
              {user.isPro && <span className="badge badge-gold" style={{ marginLeft: '0.5rem' }}>PRO</span>}
            </div>

            <div className="profile-mini-stats">
              <div className="profile-mini-stat">
                <div className="profile-mini-val">{user.testsTaken ?? 0}</div>
                <div className="profile-mini-label">Tests Taken</div>
              </div>
              <div className="profile-mini-stat">
                <div className="profile-mini-val" style={{ color: '#f8bd2a' }}>{Math.round(user.avgScore ?? 0)}%</div>
                <div className="profile-mini-label">Avg Score</div>
              </div>
              <div className="profile-mini-stat">
                <div className="profile-mini-val" style={{ color: '#4ade80' }}>{user.streak ?? 0}</div>
                <div className="profile-mini-label">Day Streak</div>
              </div>
            </div>

            {user.branch && (
              <div style={{ marginTop: '1rem', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.83rem', color: 'var(--on-surface-variant)' }}>
                <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '0.3rem' }}>school</span>
                {user.branch}
                {user.targetYear && ` • Target ${user.targetYear}`}
              </div>
            )}

            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
              Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        {/* Right: Edit Form + History */}
        <div className="profile-main">
          {/* Edit Form */}
          <div className="card animate-in" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ color: 'var(--primary)' }}>edit</span>
              Edit Profile
            </h2>

            {saved && (
              <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid #4ade8099', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#4ade80', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-icons" style={{ fontSize: '1rem' }}>check_circle</span>
                Profile updated successfully!
              </div>
            )}
            {error && (
              <div style={{ background: 'rgba(211,47,47,0.1)', border: '1px solid rgba(211,47,47,0.4)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--primary)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input className="field-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                </div>
                <div className="field-group">
                  <label className="field-label">Phone Number</label>
                  <div className="input-icon-wrap">
                    <span className="material-icons input-icon">phone</span>
                    <input className="field-input with-icon" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" required />
                  </div>
                </div>
                <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">Address</label>
                  <input className="field-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Your full residential address" required />
                </div>
                <div className="field-group">
                  <label className="field-label">Level (UG/PG)</label>
                  <select className="field-select" value={form.ugOrPg} onChange={e => setForm({ ...form, ugOrPg: e.target.value })} required>
                    <option value="">Select level</option>
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">
                    Best Rank
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--on-surface-variant)', marginLeft: '0.5rem' }}>
                      {user.role === 'ADMIN'
                        ? '(unlimited updates)'
                        : `(Updates left: ${Math.max(0, 2 - (user.rankUpdates || 0))})`}
                    </span>
                  </label>
                  <input
                    className="field-input"
                    type="number"
                    value={form.bestRank}
                    onChange={e => setForm({ ...form, bestRank: e.target.value })}
                    placeholder="e.g. 12500"
                    disabled={user.role !== 'ADMIN' && user.rankUpdates >= 2}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem', display: 'block' }}>
                    Your best NEET All-India Rank (a lower number is better).
                    {user.role !== 'ADMIN' && user.rankUpdates >= 2 && ' Limit reached — contact admin to request more changes.'}
                  </span>
                </div>
                <div className="field-group">
                  <label className="field-label">Stream / Branch</label>
                  <select className="field-select" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                    <option value="">Select branch</option>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Category</label>
                  <select className="field-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category</option>
                    {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Domicile State</label>
                  <select className="field-select" value={form.domicile} onChange={e => setForm({ ...form, domicile: e.target.value })}>
                    <option value="">Select state</option>
                    {STATES_LIST.filter(s => s.value !== 'All' && s.value !== 'all_indias' && s.value !== 'afms' && s.value !== 'dnbs' && s.value !== 'neigrihms' && s.value !== 'open_states').map(s => <option key={s.label}>{s.label}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Target Year</label>
                  <select className="field-select" value={form.targetYear} onChange={e => setForm({ ...form, targetYear: e.target.value })}>
                    <option value="">Select year</option>
                    {TARGET_YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem' }} disabled={saving}>
                {saving ? (
                  <><span className="material-icons" style={{ fontSize: '1rem' }}>hourglass_empty</span> Saving...</>
                ) : (
                  <><span className="material-icons">save</span> Save Changes</>
                )}
              </button>
            </form>
          </div>

          {/* Test History */}
          <div className="card animate-in" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ color: '#f8bd2a' }}>history</span>
              Test History
            </h2>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)' }}>Loading history...</div>
            ) : attempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)' }}>
                <span className="material-icons" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>quiz</span>
                No tests taken yet. <br />
                <a href="/mock-tests" style={{ color: 'var(--primary)' }}>Start your first test →</a>
              </div>
            ) : (
              <div>
                {attempts.map((a, i) => {
                  const pct = Math.round((a.score / a.totalMarks) * 100)
                  const color = pct >= 80 ? '#4ade80' : pct >= 60 ? '#f8bd2a' : '#d32f2f'
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.9rem 0', borderBottom: i < attempts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{a.test?.title}</div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.73rem', color: 'var(--on-surface-variant)' }}>
                          <span><span className="material-icons" style={{ fontSize: '0.75rem', verticalAlign: 'middle' }}>schedule</span> {Math.floor(a.timeTaken / 60)}m {a.timeTaken % 60}s</span>
                          <span><span className="material-icons" style={{ fontSize: '0.75rem', verticalAlign: 'middle' }}>calendar_today</span> {new Date(a.createdAt).toLocaleDateString()}</span>
                          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{a.test?.difficulty}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{pct}%</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{a.score}/{a.totalMarks} marks</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
