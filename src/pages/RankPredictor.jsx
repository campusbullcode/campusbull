import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { predictorAccess, bumpUsed } from '../constants/predictorLimits'
import './RankPredictor.css'

// College mock data removed; we now use real data from the PostgreSQL predictions table.

const tierColor = { S: '#d32f2f', A: '#f8bd2a', B: '#4ade80' }

// Estimate rank from score (simplified model)
function predictRank(score) {
  if (score >= 700) return Math.round(1 + (720 - score) * 3)
  if (score >= 650) return Math.round(50 + (700 - score) * 30)
  if (score >= 600) return Math.round(1550 + (650 - score) * 60)
  if (score >= 550) return Math.round(4550 + (600 - score) * 120)
  if (score >= 500) return Math.round(10550 + (550 - score) * 250)
  return Math.round(23050 + (500 - score) * 500)
}

// Graph data: score vs rank at breakpoints
const GRAPH_POINTS = [
  { score: 400, rank: 80000 },
  { score: 450, rank: 55000 },
  { score: 500, rank: 35000 },
  { score: 550, rank: 18000 },
  { score: 600, rank: 8000  },
  { score: 620, rank: 5200  },
  { score: 640, rank: 3000  },
  { score: 660, rank: 1600  },
  { score: 680, rank: 650   },
  { score: 700, rank: 180   },
  { score: 715, rank: 50    },
  { score: 720, rank: 1     },
]

// SVG dimensions
const W = 420, H = 180, PX = 40, PY = 20

function scaleX(score) {
  return PX + ((score - 400) / (720 - 400)) * (W - PX - 20)
}
function scaleY(rank) {
  const logRank = Math.log10(Math.max(rank, 1))
  const logMax = Math.log10(80000)
  return PY + (logRank / logMax) * (H - PY - 20)
}

function buildPath(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.score).toFixed(1)},${scaleY(p.rank).toFixed(1)}`).join(' ')
}

export default function RankPredictor() {
  const { user, refetchUser } = useAuth()
  const [, forceTick] = useState(0)   // re-render after a run bumps the stored count
  const access = predictorAccess(user, 'rank')
  const lockMessage = access.tier === 'FREE'
    ? 'You have used your free Rank Predictor run. Upgrade to PRO for more.'
    : 'You have used all your Rank Predictor runs. Contact admin for more.'

  const [totalScoreInput, setTotalScoreInput] = useState(600)
  const [category, setCategory] = useState('General')
  const [state, setState] = useState('All India')
  const [predicted, setPredicted] = useState(false)
  const [aiiquo, setAiiquo] = useState(true)
  const [apiResult, setApiResult] = useState(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [limitError, setLimitError] = useState(null)

  const totalScore = Number(totalScoreInput) || 0
  const predictedRank = apiResult?.estimatedRank || predictRank(totalScore)
  const topPct = Math.max(0.01, (predictedRank / 1000000) * 100).toFixed(1)

  const handlePredict = async e => {
    e.preventDefault()
    if (access.locked) { setLimitError(lockMessage); return }
    // Warn before spending a usage token (admins are unlimited, so no warning).
    if (!access.unlimited) {
      const ok = window.confirm(
        `Heads up — this will use 1 token. You have ${access.left} of ${access.limit} Rank Predictor run${access.limit !== 1 ? 's' : ''} left. Continue?`
      )
      if (!ok) return
    }
    setLimitError(null)
    setApiLoading(true)
    try {
      const result = await apiFetch('/predict/rank', {
        method: 'POST',
        body: JSON.stringify({ score: totalScore, category })
      })
      setApiResult(result)
      setPredicted(true)
      bumpUsed(user, 'rank')          // count this run
      forceTick(t => t + 1)
      // Persist the predicted rank to the profile so it stays.
      if (result?.estimatedRank) {
        apiFetch('/user/predicted-rank', {
          method: 'POST',
          body: JSON.stringify({ rank: result.estimatedRank }),
        }).then(() => refetchUser()).catch(() => {})
      }
    } catch (err) {
      if (err.status === 403) {
        setLimitError(err.message)
      } else {
        // Network/server hiccup — fall back to the local estimate.
        setPredicted(true)
        console.warn('Prediction API unavailable, using local estimate')
      }
    } finally {
      setApiLoading(false)
    }
  }

  const matchingColleges = apiResult?.eligibleColleges || []

  // Probability based on dynamically predicted rank
  const getProbability = (college) => {
    // If the student's rank is much lower (better) than the college's cutoff (aiRank), high chance
    const cutoff = college.maxRank;
    if (!cutoff || !predictedRank) return 50;
    
    // Roughly if student is 5% better than cutoff, it's 99%
    const diff = cutoff - predictedRank;
    if (diff > cutoff * 0.1) return 98;
    if (diff > 0) return 85;
    if (diff > -500) return 60;
    return 20; // Unlikely but possible
  }

  // Graph marker X,Y for current score
  const markerX = scaleX(Math.min(720, Math.max(400, totalScore)))
  const markerY = scaleY(Math.max(1, predictedRank))

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <div>
          <p className="section-label">Analytics</p>
          <h1 className="page-title">NEET Rank Predictor</h1>
          <p className="page-subtitle">Precision-engineered engine to forecast your medical future based on 2023-24 counseling data.</p>
        </div>
      </div>

      <div className="predictor-grid">
        {/* Input Panel */}
        <div className="predictor-left">
          <form onSubmit={handlePredict} className="card animate-in">
            <h2 className="card-heading">Enter Your Scores</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
              Based on official 2024 NEET marking scheme
            </p>

            {/* Usage allowance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', marginBottom: '1rem', color: 'var(--on-surface-variant)' }}>
              <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--primary)' }}>bolt</span>
              {access.unlimited
                ? <span><strong>Unlimited</strong> predictions (Admin)</span>
                : <span><strong>{access.left}</strong> of {access.limit} prediction{access.limit !== 1 ? 's' : ''} left · each run costs 1 token{access.tier === 'FREE' ? ' · Upgrade to PRO for 2' : ''}</span>}
            </div>

            {limitError && (
              <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.8rem' }}>
                {limitError}
              </div>
            )}

            <div className="field-group" style={{ marginTop: '1rem' }}>
              <label className="field-label" style={{ color: 'var(--primary)' }}>
                <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>functions</span>
                {' '}Total Score <span style={{ color: 'var(--on-surface-variant)' }}>/ 720</span>
              </label>
              <div className="score-input-wrap">
                <input
                  className="field-input"
                  type="number"
                  placeholder="Enter total NEET score"
                  min="0"
                  max="720"
                  value={totalScoreInput}
                  onChange={e => setTotalScoreInput(e.target.value)}
                />
              </div>
            </div>

            <div className="field-group" style={{ marginTop: '1rem' }}>
              <label className="field-label">Category</label>
              <select className="field-select" value={category} onChange={e => setCategory(e.target.value)}>
                {['General', 'OBC', 'SC', 'ST', 'EWS'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">State Preference</label>
              <select className="field-select" value={state} onChange={e => setState(e.target.value)}>
                {['All India', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'UP'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="toggle-row">
              <span className="field-label" style={{ margin: 0 }}>AIQ Consideration (15%)</span>
              <label className="toggle">
                <input type="checkbox" checked={aiiquo} onChange={() => setAiiquo(p => !p)} />
                <span className="toggle-track"><span className="toggle-thumb" /></span>
              </label>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', opacity: (access.locked || apiLoading) ? 0.6 : 1, cursor: access.locked ? 'not-allowed' : 'pointer' }} disabled={access.locked || apiLoading}>
              <span className="material-icons">{access.locked ? 'lock' : 'auto_graph'}</span>
              {access.locked ? 'Limit Reached' : apiLoading ? 'Predicting…' : 'Predict My Rank'}
            </button>
          </form>

        </div>

        {/* Results Panel */}
        <div className="predictor-right">
          {/* Live Rank Graph — always visible */}
          <div className="card rank-graph-card animate-in">
            <div className="rank-graph-header">
              <span className="material-icons" style={{ color: 'var(--primary)' }}>show_chart</span>
              <span>Score → Rank Curve</span>
              <span className="badge badge-gold" style={{ marginLeft: 'auto' }}>Live</span>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="rank-svg">
              {/* Grid lines */}
              {[400, 500, 600, 700, 720].map(s => (
                <line key={s} x1={scaleX(s)} y1={PY} x2={scaleX(s)} y2={H - 20}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              {/* Gradient fill */}
              <defs>
                <linearGradient id="graphGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d32f2f" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#d32f2f" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={`${buildPath(GRAPH_POINTS)} L${scaleX(720)},${H - 20} L${scaleX(400)},${H - 20} Z`}
                fill="url(#graphGrad)"
              />
              {/* Line */}
              <path d={buildPath(GRAPH_POINTS)} fill="none" stroke="#d32f2f" strokeWidth="2.5" strokeLinecap="round" />

              {/* Current score marker */}
              <line x1={markerX} y1={PY} x2={markerX} y2={H - 20}
                stroke="var(--secondary)" strokeWidth="1.5" strokeDasharray="4,3" />
              <circle cx={markerX} cy={markerY} r="6" fill="var(--secondary)" stroke="#fff" strokeWidth="2" />

              {/* Axis labels */}
              {[400, 500, 600, 700].map(s => (
                <text key={s} x={scaleX(s)} y={H - 4} textAnchor="middle"
                  fontSize="8" fill="rgba(255,255,255,0.4)">{s}</text>
              ))}
              <text x={PX - 4} y={PY + 4} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.4)">Rank</text>
              <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">Score →</text>
            </svg>

            <div className="rank-graph-legend">
              <div className="rank-graph-score">
                <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.72rem' }}>Your Score</span>
                <span className="gradient-text" style={{ fontWeight: 700 }}>{totalScore} / 720</span>
              </div>
              <div className="rank-graph-score">
                <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.72rem' }}>Est. Rank</span>
                <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>#{predictedRank.toLocaleString()}</span>
              </div>
              <div className="rank-graph-score">
                <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.72rem' }}>Percentile</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>Top {topPct}%</span>
              </div>
            </div>
          </div>

          {predicted ? (
            <>
              {/* Rank hero */}
              <div className="rank-hero card animate-in">
                <p className="section-label" style={{ marginBottom: '0.5rem' }}>Predicted Rank</p>
                <div className="rank-number gradient-text">#{predictedRank.toLocaleString()}</div>
                <div className="rank-meta">
                  <span className="badge badge-gold">Top {topPct}%</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Based on 2023-24 data</span>
                </div>
                <div className="rank-range">
                  Expected range: <strong>#{Math.max(1, predictedRank - 500).toLocaleString()} – #{(predictedRank + 600).toLocaleString()}</strong>
                </div>
              </div>

              {/* Colleges */}
              <div className="animate-in">
                <p className="section-label">Recommended Institutions ({matchingColleges.length})</p>
                <div className="college-list">
                  {matchingColleges.length === 0 ? (
                    <div className="empty-state card">
                      <span className="material-icons empty-icon">sentiment_dissatisfied</span>
                      <h3>Score too low for current list</h3>
                      <p>Try improving Physics and Chemistry scores.</p>
                    </div>
                  ) : matchingColleges.map(c => {
                    const prob = getProbability(c)
                    return (
                      <div key={c.name} className="college-card card">
                        <div className="college-top">
                          <div>
                            <span className="tier-badge" style={{ background: `var(--surface-container-highest)`, color: 'var(--primary)' }}>
                              {c.type}
                            </span>
                            <div className="college-name">{c.name}</div>
                            <div className="college-cutoff">
                              State: {c.state} • Closing Rank: #{c.maxRank?.toLocaleString() || 'N/A'}
                            </div>
                          </div>
                          <div className="match-circle" style={{ '--mc': prob >= 80 ? '#4ade80' : prob >= 50 ? '#f8bd2a' : '#d32f2f' }}>
                            <span>{prob}%</span>
                          </div>
                        </div>
                        <div className="progress-bar" style={{ marginTop: '0.875rem' }}>
                          <div className="progress-fill" style={{
                            width: `${prob}%`,
                            background: `linear-gradient(90deg, transparent, ${prob >= 80 ? '#4ade80' : prob >= 50 ? '#f8bd2a' : '#d32f2f'})`,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <div className="college-foot">Match Probability</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="cta-card animate-in" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem' }}>Confused with Choice Filling?</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
                  Speak with our expert medical counselors to optimize your preference list for maximum success.
                </p>
                <button className="btn-primary">
                  <span className="material-icons">support_agent</span>
                  Talk to an Expert
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state card animate-in">
              <span className="material-icons empty-icon">auto_graph</span>
              <h3>Enter your scores to predict your NEET rank</h3>
              <p>We'll analyze 2023-24 counseling data and show you matching colleges.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
