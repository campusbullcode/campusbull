import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import './MockTestInterface.css'
import './PaperTest.css'

const STYLES = { ABCD: ['A', 'B', 'C', 'D'], '1234': ['1', '2', '3', '4'] }

// Canonical NEET subject order; anything else (e.g. "Other") is appended after these.
const SUBJECT_ORDER = ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Biology']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Group questions by subject (canonical order) and shuffle WITHIN each subject.
// Returns the flat working order + section descriptors for the palette.
function arrange(questions) {
  const bySubject = new Map()
  for (const q of questions) {
    const key = q.subject || 'Other'
    if (!bySubject.has(key)) bySubject.set(key, [])
    bySubject.get(key).push(q)
  }
  const keys = [
    ...SUBJECT_ORDER.filter(s => bySubject.has(s)),
    ...[...bySubject.keys()].filter(s => !SUBJECT_ORDER.includes(s)),
  ]
  const ordered = []
  const sections = []
  for (const k of keys) {
    const items = shuffle(bySubject.get(k))
    sections.push({ subject: k, start: ordered.length, count: items.length })
    for (const q of items) ordered.push(q)
  }
  return { ordered, sections }
}

export default function PaperTest() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [paper, setPaper] = useState(null)
  const [questions, setQuestions] = useState([])   // working order (segregated + shuffled)
  const [sections, setSections] = useState([])     // [{ subject, start, count }]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [started, setStarted] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})   // { number: optIdx }
  const [marked, setMarked] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)  // mobile drawer
  const doneRef = useRef(false)

  useEffect(() => {
    // Static manifest (images + answer key baked in), served from /public.
    fetch(`/questions/${slug}/manifest.json`)
      .then(r => { if (!r.ok) throw new Error('Paper not found'); return r.json() })
      .then(m => {
        setPaper(m)
        const { ordered, sections } = arrange(m.questions || [])
        setQuestions(ordered)
        setSections(sections)
        setTimeLeft((m.durationMin || 180) * 60)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  const LETTERS = STYLES[paper?.optionStyle] || STYLES.ABCD

  // Subject breakdown for the start screen
  const breakdown = useMemo(
    () => sections.map(s => ({ subject: s.subject, count: s.count })),
    [sections]
  )

  const grade = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    let correct = 0, wrong = 0, attempted = 0, gradedCount = 0
    const results = questions.map((q, i) => {
      const your = answers[q.number]
      const isGraded = q.correctOption !== null && q.correctOption !== undefined
      if (isGraded) gradedCount++
      if (your !== undefined && your !== null) {
        attempted++
        if (isGraded) { if (your === q.correctOption) correct++; else wrong++ }
      }
      return { seq: i + 1, number: q.number, subject: q.subject, image: q.image,
               question: q.question, options: q.options, your: your ?? null,
               correct: isGraded ? q.correctOption : null, isGraded }
    })
    const score = correct * 4 - wrong
    const maxScore = gradedCount * 4
    setResult({
      title: paper.title, totalQuestions: questions.length,
      gradedCount, attempted, correct, wrong, score, maxScore, results,
    })
    // Record into the user's running stats. Every completion counts toward "Tests Taken";
    // a score is only recorded when the paper has an answer key (graded). Ignored if logged out.
    const graded = gradedCount > 0
    const scorePercent = graded && maxScore > 0 ? Math.max(0, (score / maxScore) * 100) : null
    apiFetch('/user/record-test', {
      method: 'POST',
      body: JSON.stringify({ slug, graded, scorePercent }),
    }).catch(() => {})
  }, [questions, answers, paper, slug])

  useEffect(() => {
    if (!started || result) return
    if (timeLeft <= 0) { grade(); return }
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [started, result, timeLeft, grade])

  const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const confirmSubmit = () => { if (window.confirm('Submit the test? You cannot change answers afterwards.')) grade() }

  if (loading) return <div className="page-container"><div className="qp-empty">Loading test…</div></div>
  if (error && !result) return <div className="page-container"><div className="qp-empty">Error: {error}</div></div>

  // ── Start screen ──
  if (!started && !result) {
    return (
      <div className="page-container">
        <div className="test-begin-card card animate-in">
          <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--primary)' }}>quiz</span>
          <h1 className="page-title" style={{ textAlign: 'center' }}>{paper.title}</h1>
          <div className="test-begin-meta">
            <div className="test-begin-stat"><span className="material-icons">quiz</span> {questions.length} Questions</div>
            <div className="test-begin-stat"><span className="material-icons">schedule</span> {paper.durationMin} Minutes</div>
            <div className="test-begin-stat"><span className="material-icons">stars</span> +4 / −1 Marking</div>
          </div>
          {breakdown.length > 0 && (
            <div className="test-begin-subjects">
              {breakdown.map(b => (
                <span key={b.subject} className="chip" style={{ fontSize: '0.75rem' }}>
                  {b.subject}: {b.count}
                </span>
              ))}
            </div>
          )}
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', textAlign: 'center', maxWidth: 460, lineHeight: 1.6 }}>
            Questions are grouped by subject and shuffled for this attempt. Pick one option ({LETTERS.join(', ')}) per question; figures are shown where needed.
            {paper.gradedCount > 0
              ? ' Your score is calculated against the official answer key.'
              : ' This paper runs in practice mode (no answer key set), so you can review your choices but no score is shown.'}
          </p>
          <button className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }}
            onClick={() => setStarted(true)}>
            <span className="material-icons">play_arrow</span> Begin Test
          </button>
          <button className="btn-ghost" onClick={() => navigate('/dashboard/mock-tests')}>← Back to Tests</button>
        </div>
      </div>
    )
  }

  // ── Result screen ──
  if (result) {
    return (
      <div className="page-container">
        <div className="result-screen animate-in">
          <div className="result-hero card">
            <div className="result-emoji">{result.gradedCount ? (result.score >= 0 ? '🎉' : '📚') : '✅'}</div>
            <h2 className="page-title">Test Completed!</h2>
            {result.gradedCount > 0 ? (
              <>
                <div className="result-score gradient-text">{result.score} / {result.maxScore}</div>
                <div className="result-grid">
                  <div className="result-item"><div className="result-val" style={{ color: '#4ade80' }}>{result.correct}</div><div className="result-label">Correct</div></div>
                  <div className="result-item"><div className="result-val" style={{ color: 'var(--primary)' }}>{result.wrong}</div><div className="result-label">Wrong</div></div>
                  <div className="result-item"><div className="result-val">{result.attempted}</div><div className="result-label">Attempted</div></div>
                  <div className="result-item"><div className="result-val" style={{ color: 'var(--secondary)' }}>{result.gradedCount}</div><div className="result-label">Graded Qs</div></div>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--on-surface-variant)', textAlign: 'center', maxWidth: 460 }}>
                You attempted <b>{result.attempted}</b> of {result.totalQuestions} questions. This paper has no
                answer key set, so it ran in practice mode (no score). It still counts toward your tests taken.
              </p>
            )}
          </div>

          <div className="result-questions">
            {result.results.map(r => {
              const status = !r.isGraded ? 'ungraded' : (r.your === r.correct ? 'correct' : (r.your != null ? 'wrong' : 'skipped'))
              return (
                <div key={r.number} className={`result-q card ${status === 'correct' ? 'card-correct' : status === 'wrong' ? 'card-wrong' : ''}`}>
                  <div className="pt-result-head">
                    <span>Q{r.seq}{r.subject ? ` · ${r.subject}` : ''}</span>
                    <span className={`pt-tag pt-${status}`}>
                      {status === 'correct' ? 'Correct' : status === 'wrong' ? 'Wrong' : status === 'skipped' ? 'Skipped' : 'Practice'}
                    </span>
                  </div>
                  {r.question && <p className="pt-q-text">{r.question}</p>}
                  {r.image && <img className="pt-q-image" src={r.image} alt={`Question ${r.seq} figure`} loading="lazy" />}
                  {r.options && (
                    <ul className="pt-result-options">
                      {r.options.map((opt, oi) => (
                        <li key={oi} className={oi === r.correct ? 'opt-correct' : (oi === r.your ? 'opt-wrong' : '')}>
                          <b>{LETTERS[oi]}.</b> {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="pt-answer-row">
                    <span>Your answer: <b>{r.your != null ? LETTERS[r.your] : '—'}</b></span>
                    {r.isGraded && <span>Correct: <b style={{ color: '#4ade80' }}>{LETTERS[r.correct]}</b></span>}
                  </div>
                </div>
              )
            })}
          </div>
          <button className="btn-primary" onClick={() => navigate('/dashboard/mock-tests')}>
            <span className="material-icons">arrow_back</span> Back to Tests
          </button>
        </div>
      </div>
    )
  }

  // ── Test interface ──
  const q = questions[currentQ]
  const qStatus = (i) => {
    const num = questions[i].number
    if (marked[num]) return 'marked'
    if (answers[num] !== undefined) return 'answered'
    if (i === currentQ) return 'current'
    return 'unattempted'
  }
  const answeredCount = Object.keys(answers).length

  return (
    <div className="test-interface pt-interface">
      <div className="test-topbar glass">
        <div className="test-top-left">
          <span className="material-icons" style={{ color: 'var(--primary)' }}>quiz</span>
          <span className="test-name">{paper.title}</span>
        </div>
        <div className="timer-wrap">
          <div className={`timer-display ${timeLeft < 300 ? 'urgent' : ''}`}>
            <span className="material-icons" style={{ fontSize: '1rem' }}>schedule</span>
            {fmt(timeLeft)}
          </div>
        </div>
        <button className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }} onClick={confirmSubmit}>
          Submit
        </button>
      </div>

      {/* Mobile-only bar to open the question palette */}
      <button className="palette-toggle" onClick={() => setPaletteOpen(true)}>
        <span className="material-icons" style={{ fontSize: '1.1rem' }}>grid_view</span>
        Questions · {answeredCount}/{questions.length} answered
      </button>

      <div className="test-body">
        <aside className={`test-sidebar glass ${paletteOpen ? 'open' : ''}`}>
          <div className="palette-head">
            <p className="section-label" style={{ margin: 0 }}>Questions ({questions.length})</p>
            <button className="palette-close" onClick={() => setPaletteOpen(false)} aria-label="Close">
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="palette-scroll">
            {sections.map(sec => (
              <div key={sec.subject} className="q-section">
                <div className="q-section-title">{sec.subject} <span>({sec.count})</span></div>
                <div className="q-grid">
                  {questions.slice(sec.start, sec.start + sec.count).map((qq, idx) => {
                    const i = sec.start + idx
                    return (
                      <button key={qq.number} className={`q-btn q-${qStatus(i)}`}
                        onClick={() => { setCurrentQ(i); setPaletteOpen(false) }}>
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="q-legend">
            {[['q-answered', 'Answered'], ['q-marked', 'Marked'], ['q-unattempted', 'Not Visited']].map(([cls, lbl]) => (
              <div key={cls} className="q-legend-item"><span className={`q-legend-dot ${cls}`} /><span>{lbl}</span></div>
            ))}
          </div>
        </aside>
        {paletteOpen && <div className="palette-backdrop" onClick={() => setPaletteOpen(false)} />}

        <div className="test-main">
          <div className="question-card card animate-in">
            <div className="q-meta">
              <span className="chip">{q.subject || 'Question'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Q {currentQ + 1} / {questions.length}</span>
              <button className={`btn-ghost mark-btn ${marked[q.number] ? 'marked' : ''}`}
                onClick={() => setMarked(m => ({ ...m, [q.number]: !m[q.number] }))}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', marginLeft: 'auto' }}>
                <span className="material-icons" style={{ fontSize: '0.9rem' }}>bookmark</span>
                {marked[q.number] ? 'Marked' : 'Mark'}
              </button>
            </div>

            {q.question && <p className="pt-q-text">{q.question}</p>}
            {q.image && <img className="pt-q-image" src={q.image} alt={`Question ${currentQ + 1} figure`} />}

            <div className={`pt-options ${q.options ? 'text-mode' : ''}`}>
              {LETTERS.map((L, oi) => (
                <button key={oi}
                  className={`q-option pt-option ${answers[q.number] === oi ? 'selected' : ''}`}
                  onClick={() => setAnswers(a => ({ ...a, [q.number]: oi }))}>
                  <span className="option-letter">{L}</span>
                  {q.options && <span className="option-text">{q.options[oi]}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="q-nav-row">
            <button className="btn-secondary" disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)}>
              <span className="material-icons">chevron_left</span> Previous
            </button>
            <button className="btn-ghost" onClick={() => setAnswers(a => { const n = { ...a }; delete n[q.number]; return n })}>
              Clear
            </button>
            <button className="btn-secondary" disabled={currentQ === questions.length - 1} onClick={() => setCurrentQ(c => c + 1)}>
              Next <span className="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
