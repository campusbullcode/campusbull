import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'
import './LandingPage.css'

/* ── Placeholder avatar initials component ── */
const Avatar = ({ letter, bg }) => (
  <div
    className="lp-avatar"
    style={{
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '0.75rem',
      color: '#fff',
      width: 38,
      height: 38,
      borderRadius: '50%',
      border: '2px solid #131314',
      marginLeft: -10,
      flexShrink: 0,
    }}
  >
    {letter}
  </div>
)

/* ── Dashboard preview card (pure CSS/SVG – no external image) ── */
const DashboardPreview = () => (
  <svg
    viewBox="0 0 480 300"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', borderRadius: 10, display: 'block' }}
  >
    {/* background */}
    <rect width="480" height="300" fill="#201f20" rx="10" />

    {/* top bar */}
    <rect x="0" y="0" width="480" height="40" fill="#1c1b1c" rx="10" />
    <rect x="10" y="14" width="60" height="12" fill="#353436" rx="4" />
    <circle cx="450" cy="20" r="10" fill="#353436" />
    <circle cx="425" cy="20" r="10" fill="#353436" />

    {/* sidebar */}
    <rect x="0" y="40" width="100" height="260" fill="#1c1b1c" />
    <rect x="12" y="60" width="76" height="8" fill="#353436" rx="3" />
    <rect x="12" y="80" width="60" height="8" fill="#2a2a2b" rx="3" />
    <rect x="12" y="100" width="70" height="8" fill="#2a2a2b" rx="3" />
    <rect x="12" y="120" width="55" height="8" fill="#2a2a2b" rx="3" />
    <rect x="12" y="140" width="65" height="8" fill="#2a2a2b" rx="3" />
    <rect x="12" y="160" width="58" height="8" fill="#d32f2f" rx="3" opacity="0.8" />
    <rect x="12" y="180" width="70" height="8" fill="#2a2a2b" rx="3" />

    {/* stat cards */}
    <rect x="116" y="54" width="80" height="56" fill="#353436" rx="8" />
    <rect x="122" y="62" width="40" height="6" fill="#5b403d" rx="2" />
    <rect x="122" y="74" width="55" height="10" fill="#ffb3ac" rx="2" opacity="0.85" />
    <rect x="122" y="90" width="30" height="6" fill="#f8bd2a" rx="2" opacity="0.6" />

    <rect x="208" y="54" width="80" height="56" fill="#353436" rx="8" />
    <rect x="214" y="62" width="40" height="6" fill="#5b403d" rx="2" />
    <rect x="214" y="74" width="55" height="10" fill="#f8bd2a" rx="2" opacity="0.85" />
    <rect x="214" y="90" width="30" height="6" fill="#f8bd2a" rx="2" opacity="0.4" />

    <rect x="300" y="54" width="80" height="56" fill="#353436" rx="8" />
    <rect x="306" y="62" width="40" height="6" fill="#5b403d" rx="2" />
    <rect x="306" y="74" width="55" height="10" fill="#ffb3ac" rx="2" opacity="0.7" />
    <rect x="306" y="90" width="30" height="6" fill="#ffb3ac" rx="2" opacity="0.4" />

    <rect x="392" y="54" width="76" height="56" fill="#353436" rx="8" />
    <rect x="398" y="62" width="40" height="6" fill="#5b403d" rx="2" />
    <rect x="398" y="74" width="50" height="10" fill="#4ade80" rx="2" opacity="0.75" />
    <rect x="398" y="90" width="28" height="6" fill="#4ade80" rx="2" opacity="0.4" />

    {/* chart area */}
    <rect x="116" y="124" width="240" height="130" fill="#353436" rx="8" />
    <polyline
      points="130,230 160,200 190,210 220,175 250,180 280,150 310,160 340,135"
      fill="none"
      stroke="#d32f2f"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="130,240 160,225 190,230 220,210 250,215 280,200 310,208 340,190"
      fill="none"
      stroke="#f8bd2a"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="4 3"
    />

    {/* mini list */}
    <rect x="368" y="124" width="100" height="130" fill="#353436" rx="8" />
    <rect x="376" y="135" width="60" height="7" fill="#5b403d" rx="2" />
    {[0,1,2,3,4].map(i => (
      <g key={i}>
        <rect x="376" y={152 + i*18} width="84" height="6" fill="#2a2a2b" rx="2" />
        <rect x="376" y={152 + i*18} width={30 + i * 8} height="6" fill="#ffb3ac" rx="2" opacity={0.5 + i * 0.08} />
      </g>
    ))}
  </svg>
)

/* ── Analytics chart (for bento card) ── */
const MiniChart = () => (
  <svg viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', borderRadius: 8, opacity: 0.85 }}>
    <rect width="220" height="110" fill="#1c1b1c" rx="8" />
    <polyline
      points="10,90 40,65 70,72 100,48 130,54 160,30 190,38 210,22"
      fill="none" stroke="#d32f2f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    />
    <polyline
      points="10,100 40,88 70,92 100,78 130,82 160,68 190,74 210,60"
      fill="none" stroke="#f8bd2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3"
    />
    {[40,70,100,130,160].map((x, i) => (
      <circle key={i} cx={x} cy={[65,72,48,54,30][i]} r="3" fill="#ffb3ac" />
    ))}
  </svg>
)

/* ── FAQ accordion item ── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`lp-faq-item ${open ? 'open' : ''}`}>
      <button className="lp-faq-q" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{q}</span>
        <span className="material-symbols-outlined lp-faq-icon">{open ? 'remove' : 'add'}</span>
      </button>
      {open && <p className="lp-faq-a">{a}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate()

  const goLogin = () => navigate('/login')

  const [qa, setQa] = useState([])
  const [modalQ, setModalQ] = useState(null)   // question whose full thread is open
  const [visibleQa, setVisibleQa] = useState(5)
  useEffect(() => {
    apiFetch('/qa/public?limit=20').then(d => setQa(Array.isArray(d) ? d : [])).catch(() => setQa([]))
  }, [])

  // ── Inline hero auth card ──
  const { login, register } = useAuth()
  const [authMode, setAuthMode] = useState('login')   // 'login' | 'signup'
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '', ugOrPg: 'UG' })
  const [authErr, setAuthErr] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const isLogin = authMode === 'login'

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthErr('')
    setAuthLoading(true)
    try {
      if (isLogin) await login(authForm.email, authForm.password)
      else await register(authForm.name, authForm.email, authForm.password, authForm.phone, authForm.ugOrPg)
      // on success AuthContext sets the user → "/" auto-redirects to /dashboard
    } catch (err) {
      setAuthErr(err.message || 'Something went wrong. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }
  const setField = (k) => (e) => setAuthForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ background: '#131314', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">Campus <span>Bull</span></div>
          <ul className="lp-nav-links">
            <li><a href="#features" className="active">Features</a></li>
            <li><a href="#how">How it Works</a></li>
            <li><a href="#why">Why Us</a></li>
            <li><a href="#qa">Q/A</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <button className="lp-cta-btn lp-nav-cta" onClick={goLogin}>
            Login / Sign Up
          </button>
        </div>
      </nav>

      <main>

        {/* ── HERO ── */}
        <section className="lp-hero" id="hero">
          <div className="lp-hero-inner">

            {/* Left */}
            <div>
              <div className="lp-badge">
                <span className="lp-badge-dot" />
                <span className="lp-badge-text">Live for NEET 2025</span>
              </div>

              <h1 className="lp-h1">
                Master your NEET journey with{' '}
                <span className="lp-gradient-text">data-driven</span> insights
              </h1>

              <p className="lp-hero-sub">
                Precision rank prediction and admission guidance powered by millions of
                historical data points. Your medical future, engineered for success.
              </p>

              <div className="lp-hero-btns">
                <button className="lp-cta-btn lp-btn-login" onClick={goLogin}>
                  Login / Sign Up
                </button>
                <button className="lp-btn-secondary lp-btn-predictor" onClick={goLogin}>
                  Try Predictor
                </button>
                <a className="lp-btn-qa" href="#qa">
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>forum</span>
                  Q/A
                </a>
              </div>

              <div className="lp-social-proof">
                <div className="lp-avatars" style={{ display: 'flex' }}>
                  <Avatar letter="P" bg="#7c3aed" />
                  <Avatar letter="A" bg="#0284c7" />
                  <Avatar letter="S" bg="#059669" />
                </div>
                <p className="lp-proof-text">
                  Trusted by <strong>15,000+</strong> aspirants this year
                </p>
              </div>
            </div>

            {/* Right – inline auth card */}
            <div className="lp-hero-visual">
              <div className="lp-hero-glow" />
              <div className="lp-auth-card lp-glass">
                <div className="lp-auth-toggle">
                  <button type="button" className={isLogin ? 'active' : ''}
                    onClick={() => { setAuthMode('login'); setAuthErr('') }}>Login</button>
                  <button type="button" className={!isLogin ? 'active' : ''}
                    onClick={() => { setAuthMode('signup'); setAuthErr('') }}>Sign Up</button>
                </div>

                <h3 className="lp-auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h3>
                <p className="lp-auth-sub">
                  {isLogin ? 'Enter your credentials to access your dashboard' : 'Join 15,000+ NEET aspirants today'}
                </p>

                {authErr && <div className="lp-auth-error">{authErr}</div>}

                <form className="lp-auth-form" onSubmit={handleAuth}>
                  {!isLogin && (
                    <div className="lp-auth-field">
                      <span className="material-symbols-outlined">person</span>
                      <input type="text" placeholder="Full name" value={authForm.name} onChange={setField('name')} required />
                    </div>
                  )}
                  <div className="lp-auth-field">
                    <span className="material-symbols-outlined">mail</span>
                    <input type="email" placeholder="aspirant@campusbull.com" value={authForm.email} onChange={setField('email')} required />
                  </div>
                  {!isLogin && (
                    <div className="lp-auth-field">
                      <span className="material-symbols-outlined">phone</span>
                      <input type="tel" placeholder="+91 98765 43210" value={authForm.phone} onChange={setField('phone')} required />
                    </div>
                  )}
                  {!isLogin && (
                    <div className="lp-auth-course">
                      {['UG', 'PG'].map(opt => (
                        <button key={opt} type="button"
                          className={authForm.ugOrPg === opt ? 'active' : ''}
                          onClick={() => setAuthForm(f => ({ ...f, ugOrPg: opt }))}>
                          {opt === 'UG' ? 'UG (MBBS/BDS)' : 'PG (MD/MS)'}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="lp-auth-field">
                    <span className="material-symbols-outlined">lock</span>
                    <input type={showPw ? 'text' : 'password'} placeholder="Password" value={authForm.password} onChange={setField('password')} required />
                    <span className="material-symbols-outlined lp-auth-eye" onClick={() => setShowPw(v => !v)}>
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </div>

                  <button className="lp-cta-btn lp-auth-submit" type="submit" disabled={authLoading}>
                    {authLoading ? 'Please wait…' : (isLogin ? 'Login to Dashboard' : 'Create Account')}
                    {!authLoading && <span className="material-symbols-outlined">arrow_forward</span>}
                  </button>
                </form>

                <p className="lp-auth-switch">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button type="button" onClick={() => { setAuthMode(isLogin ? 'signup' : 'login'); setAuthErr('') }}>
                    {isLogin ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── FEATURES BENTO ── */}
        <section className="lp-features" id="features">
          <div className="lp-features-inner">
            <div className="lp-section-head">
              <h2>
                Precision Engineering for{' '}
                <span className="lp-gradient-text">NEET Success</span>
              </h2>
              <p>A suite of powerful tools designed to remove the guesswork from your medical journey.</p>
            </div>

            <div className="lp-bento">

              {/* Rank Predictor – col-4 */}
              <div className="lp-bento-card col-4">
                <div className="lp-feature-icon red">
                  <span className="material-symbols-outlined">query_stats</span>
                </div>
                <h3>Rank Predictor</h3>
                <p>AI-driven algorithms mapping your score against decades of historical cutoff data.</p>
              </div>

              {/* Analytics – col-8 */}
              <div className="lp-bento-card col-8 lp-bento-wide">
                <div className="lp-card-content">
                  <div className="lp-feature-icon gold">
                    <span className="material-symbols-outlined">insights</span>
                  </div>
                  <h3>Mock Tests &amp; Analytics</h3>
                  <p>Deep-dive performance metrics that pinpoint your strengths and uncover blind spots.</p>
                </div>
                <div className="lp-bento-wide-img">
                  <MiniChart />
                </div>
              </div>

              {/* College Predictor – col-4 */}
              <div className="lp-bento-card col-4">
                <div className="lp-feature-icon red">
                  <span className="material-symbols-outlined">domain</span>
                </div>
                <h3>College Predictor</h3>
                <p>Real-time matching with AIIMS, JIPMER, and top state medical colleges.</p>
              </div>

              {/* Study Planner – col-4 */}
              <div className="lp-bento-card col-4">
                <div className="lp-feature-icon gold">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <h3>Study Planner</h3>
                <p>Adaptive schedules that pivot based on your mock test performance.</p>
              </div>

              {/* Expert Counselling – col-4 */}
              <div className="lp-bento-card col-4">
                <div className="lp-feature-icon red">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <h3>Expert Counselling</h3>
                <p>1-on-1 strategic guidance for the MCC and state quota rounds.</p>
              </div>

            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-how" id="how">
          <div className="lp-how-inner">
            <div className="lp-how-title">
              <h2>The Kinetic Path to Admission</h2>
              <div className="lp-how-divider" />
            </div>

            <div className="lp-steps">
              <div className="lp-step">
                <div className="lp-step-num">01</div>
                <h3>Enter Marks</h3>
                <p>Input your score from mocks or the actual NEET paper for an instant analysis profile.</p>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">02</div>
                <h3>Get Insights</h3>
                <p>Our system processes cutoff variables across 600+ colleges instantly.</p>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">03</div>
                <h3>Plan Admissions</h3>
                <p>Receive a tailored choice-filling list optimized for your rank and category.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── VALUE PROP SPLIT ── */}
        <section className="lp-value" id="why">
          <div className="lp-value-inner">

            {/* Left */}
            <div>
              <span className="lp-value-tag">The Advantage</span>
              <h2>
                Why Campus Bull is the{' '}
                <span className="lp-gradient-text">Definitive Choice</span>
              </h2>

              <div className="lp-value-items">
                <div className="lp-value-item">
                  <div className="lp-value-item-icon">
                    <span className="material-symbols-outlined ms-fill">verified</span>
                  </div>
                  <div>
                    <h4>Real Cutoff-Based Predictions</h4>
                    <p>We don't use ranges. We use specific data from every counseling round of the last 5 years.</p>
                  </div>
                </div>

                <div className="lp-value-item">
                  <div className="lp-value-item-icon">
                    <span className="material-symbols-outlined ms-fill">smart_toy</span>
                  </div>
                  <div>
                    <h4>Smart Tracking</h4>
                    <p>Our dashboard tracks your percentile growth week-over-week automatically.</p>
                  </div>
                </div>

                <div className="lp-value-item">
                  <div className="lp-value-item-icon">
                    <span className="material-symbols-outlined ms-fill">auto_awesome</span>
                  </div>
                  <div>
                    <h4>Personalized Recommendations</h4>
                    <p>Receive daily AI-curated physics and chemistry problems based on your weak zones.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right – visual */}
            <div className="lp-value-visual">
              <div className="lp-value-img-wrap">
                {/* SVG illustration replacing external image */}
                <svg
                  viewBox="0 0 420 500"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '100%', borderRadius: 20, display: 'block' }}
                >
                  <defs>
                    <linearGradient id="vg1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1c1b1c" />
                      <stop offset="100%" stopColor="#0e0e0f" />
                    </linearGradient>
                    <linearGradient id="vg2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d32f2f" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ffb3ac" stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="vg3" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f8bd2a" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f8bd2a" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <rect width="420" height="500" fill="url(#vg1)" rx="20" />

                  {/* Decorative rings */}
                  <circle cx="210" cy="180" r="120" fill="none" stroke="#d32f2f" strokeWidth="1" opacity="0.08" />
                  <circle cx="210" cy="180" r="85"  fill="none" stroke="#d32f2f" strokeWidth="1" opacity="0.12" />
                  <circle cx="210" cy="180" r="50"  fill="#d32f2f" opacity="0.06" />

                  {/* Center icon */}
                  <rect x="186" y="156" width="48" height="48" rx="12" fill="#d32f2f" opacity="0.25" />
                  <text x="210" y="188" textAnchor="middle" fontFamily="sans-serif" fontSize="22" fill="#ffb3ac">⚕</text>

                  {/* Stat bars */}
                  {[
                    { y: 330, w: 280, label: "Rank Accuracy", pct: 0.98, color: "url(#vg2)" },
                    { y: 360, w: 280, label: "Colleges Covered", pct: 0.84, color: "url(#vg3)" },
                    { y: 390, w: 280, label: "Student Success", pct: 0.91, color: "url(#vg2)" },
                  ].map(({ y, w, label, pct, color }) => (
                    <g key={y}>
                      <text x="70" y={y - 6} fontFamily="Inter, sans-serif" fontSize="10" fill="rgba(229,226,227,0.4)">{label}</text>
                      <rect x="70" y={y} width={w} height="7" rx="4" fill="#353436" />
                      <rect x="70" y={y} width={w * pct} height="7" rx="4" fill={color} />
                    </g>
                  ))}

                  {/* Bottom label */}
                  <text x="210" y="450" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize="13" fontWeight="700" fill="rgba(229,226,227,0.25)" letterSpacing="3">CAMPUS BULL</text>
                </svg>
                <div className="lp-value-overlay" />
              </div>

              {/* Testimonial overlay */}
              <div className="lp-testimonial lp-glass">
                <div className="lp-test-head">
                  <div className="lp-test-icon">
                    <span className="material-symbols-outlined ms-fill">stars</span>
                  </div>
                  <span className="lp-test-accuracy">98% Accuracy Rate</span>
                </div>
                <p className="lp-test-quote">
                  "The college predictor was pinpoint accurate. It helped me secure a seat in
                  AIIMS Rishikesh when others said it was impossible."
                </p>
                <div className="lp-test-author">— Rahul S., 2024 Aspirant</div>
              </div>
            </div>

          </div>
        </section>

        {/* ── COMMUNITY Q/A ── */}
        <section className="lp-qa" id="qa">
          <div className="lp-qa-inner">
            <div className="lp-qa-head">
              <span className="lp-section-tag">Community</span>
              <h2 className="lp-qa-title">Latest <span className="lp-gradient-text">Questions &amp; Answers</span></h2>
              <p className="lp-qa-sub">
                Real questions from NEET aspirants — answered by the community and our experts.
                Join in to ask your own or help others.
              </p>
            </div>

            {/* Ask box — submitting takes you to sign in */}
            <form className="lp-qa-ask" onSubmit={(e) => { e.preventDefault(); goLogin() }}>
              <span className="material-symbols-outlined">help</span>
              <input type="text" placeholder="Ask your question about ranks, colleges, counselling…" />
              <button type="submit" className="lp-cta-btn">Post</button>
            </form>

            {qa.length === 0 ? (
              <p className="lp-qa-empty">No questions yet — be the first to ask after you sign in.</p>
            ) : (
              <div className="lp-qa-list">
                {qa.slice(0, visibleQa).map(q => {
                  const top = q.answers && q.answers[0]
                  const count = q.answers?.length || 0
                  return (
                    <div key={q.id} className="lp-qa-card">
                      <div className="lp-qa-q">
                        <span className="material-symbols-outlined ms-fill lp-qa-qicon">help</span>
                        <p className="lp-qa-qtext">{q.content}</p>
                      </div>
                      <div className="lp-qa-meta">
                        {q.user?.name || 'Student'} · {count} answer{count !== 1 ? 's' : ''}
                      </div>
                      {top ? (
                        <div className={`lp-qa-answer ${top.user?.role === 'ADMIN' ? 'is-expert' : ''}`}>
                          <div className="lp-qa-answer-by">
                            {top.user?.role === 'ADMIN'
                              ? <><span className="material-symbols-outlined lp-qa-verified">verified</span>{top.user?.name || 'Expert'} · Verified Answer</>
                              : (top.user?.name || 'User')}
                          </div>
                          <p className="lp-qa-answer-text">{top.content}</p>
                        </div>
                      ) : (
                        <div className="lp-qa-answer lp-qa-noanswer">No answers yet — be the first to help.</div>
                      )}
                      <button className="lp-qa-viewall" onClick={() => setModalQ(q)}>
                        View all replies
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {visibleQa < qa.length && (
              <div className="lp-qa-more">
                <button className="lp-btn-secondary" onClick={() => setVisibleQa(v => v + 5)}>
                  View more
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', marginLeft: '0.3rem', verticalAlign: 'middle' }}>expand_more</span>
                </button>
              </div>
            )}

          </div>
        </section>

        {/* ── Q/A thread modal ── */}
        {modalQ && (
          <div className="lp-qa-modal-backdrop" onClick={() => setModalQ(null)}>
            <div className="lp-qa-modal" onClick={e => e.stopPropagation()}>
              <button className="lp-qa-modal-close" onClick={() => setModalQ(null)} aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="lp-qa-modal-q">
                <span className="material-symbols-outlined ms-fill lp-qa-qicon">help</span>
                <div>
                  <p className="lp-qa-modal-qtext">{modalQ.content}</p>
                  <p className="lp-qa-modal-by">
                    Asked by {modalQ.user?.name || 'Student'} · {modalQ.answers?.length || 0} answer{(modalQ.answers?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="lp-qa-modal-answers">
                {(modalQ.answers || []).length === 0 ? (
                  <p className="lp-qa-empty" style={{ padding: '1rem 0' }}>No answers yet. Sign in to be the first to help.</p>
                ) : modalQ.answers.map(a => (
                  <div key={a.id} className={`lp-qa-answer ${a.user?.role === 'ADMIN' ? 'is-expert' : ''}`}>
                    <div className="lp-qa-answer-by">
                      {a.user?.name || 'User'}{a.user?.role === 'ADMIN' ? ' · Expert' : ''}
                    </div>
                    <p className="lp-qa-answer-text lp-qa-answer-full">{a.content}</p>
                  </div>
                ))}
              </div>
              <button className="lp-cta-btn lp-auth-submit" onClick={goLogin}>
                <span className="material-symbols-outlined">forum</span> Sign in to reply
              </button>
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        <section className="lp-faq" id="faq" aria-label="Frequently Asked Questions about NEET counselling and rank prediction">
          <div className="lp-faq-inner">
            <div className="lp-section-head">
              <h2>Frequently Asked Questions</h2>
              <p>Everything you need to know about NEET rank prediction, MCC counselling, and medical college admissions in India.</p>
            </div>
            <div className="lp-faq-grid">
              {[
                {
                  q: 'How is NEET rank calculated from marks?',
                  a: 'NEET rank is assigned based on your raw score out of 720 — higher scores get lower (better) rank numbers. Campus Bull\'s rank predictor uses 2023-24 counselling cut-off data to estimate your All India Rank instantly. Tie-breaking uses Biology score, then Chemistry score, then fewer incorrect answers.',
                },
                {
                  q: 'What NEET score is required for a government MBBS seat?',
                  a: 'For AIQ (All India Quota) government MBBS seats in 2024, General category candidates needed 650+ marks (AIR within ~15,000). State quota government seats are more accessible — typically 530–600+ marks depending on the state. SC/ST/OBC candidates have lower cut-offs due to reservation.',
                },
                {
                  q: 'What is the difference between AIQ and state quota?',
                  a: 'AIQ (15% of government seats) is managed by MCC and is open to candidates from any state. State quota (85% of seats) is managed by each state and is reserved for domicile candidates. AIQ seats generally have higher competition and require a better rank.',
                },
                {
                  q: 'How does MCC NEET UG counselling 2025 work?',
                  a: 'MCC counselling has 4 rounds: Round 1, Round 2, Mop-Up, and Stray Vacancy. Candidates register on mcc.nic.in, pay a deposit, fill college choices in preference order, and receive seat allotment by rank. Campus Bull\'s Personalized Guide provides end-to-end choice-filling support.',
                },
                {
                  q: 'What is management quota in MBBS admissions?',
                  a: 'Management quota is 15% of seats in private medical colleges filled directly by college management, not through government counselling. Fees are higher (₹15–25 lakh/year) but rank requirements are lower. A valid NEET score and minimum qualifying percentile are still mandatory.',
                },
                {
                  q: 'Can I get MBBS with 500 marks in NEET 2025?',
                  a: 'With 500 marks your expected AIR is ~35,000–45,000 (General). Government MBBS seats at this rank are limited, but you have good chances in private colleges under management/NRI quota and in some state quota seats in lower-competition states like Chhattisgarh, Assam, or NE states.',
                },
                {
                  q: 'How many MBBS seats are there in India for NEET 2025?',
                  a: 'India has approximately 1,12,000 MBBS seats — ~55,000 in government colleges and ~57,000 in private/deemed colleges — plus ~27,000 BDS seats. About 13-14 lakh candidates qualify NEET each year, making competition intense especially for government seats.',
                },
                {
                  q: 'What is the stray vacancy round in NEET counselling?',
                  a: 'The stray vacancy round is the final MCC round after Round 2, filling seats left vacant when candidates don\'t report or surrender seats. Only candidates who participated in earlier MCC rounds are eligible. It\'s the last chance before seats revert to state quota — critical for those just below earlier closing ranks.',
                },
              ].map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="lp-final-cta">
          <div className="lp-cta-glow" />
          <div className="lp-final-cta-inner">
            <h2>
              Start your NEET preparation{' '}
              <span className="lp-gradient-text">smarter</span> today
            </h2>
            <p>
              Join thousands of students who have traded anxiety for data-driven confidence.
              Your medical career begins here.
            </p>
            <div className="lp-final-btns">
              <button className="lp-cta-btn" onClick={goLogin}>
                Create Free Account
              </button>
              <button className="lp-btn-secondary" onClick={goLogin}>
                View Sample Report
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">Campus <span>Bull</span></div>
          <div className="lp-footer-copy">
            © 2025 Campus Bull. Precision-Engineered for NEET Aspirants.
          </div>
          <div className="lp-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
