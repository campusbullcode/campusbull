import { useState } from 'react'
import PaymentScanner from '../components/PaymentScanner'
import './ExpertCounselling.css'

const EXPERTS = [
  {
    id: 1,
    name: 'Dr. Priya Sharma',
    role: 'Senior NEET Counsellor',
    experience: '12 years',
    speciality: 'MCC Counselling · Choice Filling · AIIMS',
    sessions: 3200,
    rating: 4.9,
    price: '₹799 / 45 min',
    available: true,
    avatar: 'PS',
    color: '#d32f2f',
  },
  {
    id: 2,
    name: 'Dr. Rajesh Kumar',
    role: 'Medical Admission Expert',
    experience: '9 years',
    speciality: 'State Counselling · Deemed Universities',
    sessions: 1800,
    rating: 4.8,
    price: '₹599 / 45 min',
    available: true,
    avatar: 'RK',
    color: '#f8bd2a',
  },
  {
    id: 3,
    name: 'Dr. Ananya Singh',
    role: 'NRI & Management Quota Expert',
    experience: '7 years',
    speciality: 'Management Quota · NRI Seat · MBBS Abroad',
    sessions: 1100,
    rating: 4.7,
    price: '₹699 / 45 min',
    available: false,
    avatar: 'AS',
    color: '#4ade80',
  },
]

const TIMES = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']

export default function ExpertCounselling() {
  const [selected, setSelected] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [booked, setBooked] = useState(false)

  const handleBook = () => {
    if (!selected || !selectedTime) return
    setBooked(true)
  }

  if (booked) {
    const exp = EXPERTS.find(e => e.id === selected)
    return (
      <div className="page-container">
        <div className="booking-success card animate-in">
          <div className="success-icon">✅</div>
          <h2 className="page-title">Session Booked!</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', textAlign: 'center', maxWidth: 360 }}>
            Your session with <strong>{exp.name}</strong> has been confirmed for <strong>{selectedTime}</strong>. You'll receive a meeting link on your registered email.
          </p>
          <div className="booking-details card" style={{ width: '100%', maxWidth: 400 }}>
            <div className="booking-row"><span>Expert</span><span style={{ fontWeight: 600 }}>{exp.name}</span></div>
            <div className="booking-row"><span>Time</span><span style={{ fontWeight: 600 }}>{selectedTime}</span></div>
            <div className="booking-row"><span>Duration</span><span style={{ fontWeight: 600 }}>45 minutes</span></div>
            <div className="booking-row"><span>Mode</span><span style={{ fontWeight: 600 }}>Video Call</span></div>
          </div>
          <button className="btn-ghost" onClick={() => { setBooked(false); setSelected(null); setSelectedTime(null) }}>
            Book Another Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <div>
          <p className="section-label">1:1 Mentorship</p>
          <h1 className="page-title">Expert Medical Counselling</h1>
          <p className="page-subtitle">Get personalized guidance from India's top NEET counsellors. Book a 1:1 session and maximize your admission chances.</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="expert-stats-row animate-in">
        {[
          { label: 'Expert Counsellors', value: '120+', icon: 'groups' },
          { label: 'Sessions Completed', value: '50,000+', icon: 'video_call' },
          { label: 'Student Satisfaction', value: '98.5%', icon: 'thumb_up' },
          { label: 'Avg Response Time', value: '< 2h', icon: 'schedule' },
        ].map(s => (
          <div key={s.label} className="expert-stat card">
            <span className="material-icons" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{s.icon}</span>
            <div className="expert-stat-val">{s.value}</div>
            <div className="expert-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="expert-layout">
        {/* Expert selection */}
        <div className="expert-list-col">
          <p className="section-label">Choose Your Expert</p>
          <div className="expert-list">
            {EXPERTS.map(e => (
              <div
                key={e.id}
                className={`expert-card card ${selected === e.id ? 'expert-selected' : ''} ${!e.available ? 'expert-unavailable' : ''}`}
                onClick={() => e.available && setSelected(e.id)}
              >
                <div className="expert-top">
                  <div className="expert-avatar" style={{ background: `${e.color}22`, color: e.color }}>{e.avatar}</div>
                  <div className="expert-info">
                    <div className="expert-name">{e.name}</div>
                    <div className="expert-role">{e.role}</div>
                    <div className="expert-speciality">{e.speciality}</div>
                  </div>
                  {!e.available && <span className="badge badge-red" style={{ height: 'fit-content', flexShrink: 0 }}>Busy</span>}
                  {e.available && <span className="badge badge-green" style={{ height: 'fit-content', flexShrink: 0 }}>Available</span>}
                </div>

                <div className="expert-metrics">
                  <div className="expert-metric">
                    <span className="material-icons" style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>star</span>
                    <span>{e.rating}</span>
                  </div>
                  <div className="expert-metric">
                    <span className="material-icons" style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>video_call</span>
                    <span>{e.sessions.toLocaleString()} sessions</span>
                  </div>
                  <div className="expert-metric">
                    <span className="material-icons" style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>work</span>
                    <span>{e.experience}</span>
                  </div>
                </div>

                <div className="expert-price-row">
                  <span className="expert-price">{e.price}</span>
                  {selected === e.id && (
                    <span className="badge badge-red">
                      <span className="material-icons" style={{ fontSize: '0.7rem' }}>check</span>
                      Selected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking column */}
        <div className="booking-col">
          <p className="section-label">Select Time Slot</p>
          <div className="card booking-card">
            <div className="time-grid">
              {TIMES.map(t => (
                <button
                  key={t}
                  className={`time-slot ${selectedTime === t ? 'slot-active' : ''}`}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="booking-summary">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.875rem' }}>Booking Summary</h3>
              <div className="booking-row">
                <span>Expert</span>
                <span>{selected ? EXPERTS.find(e => e.id === selected)?.name : '—'}</span>
              </div>
              <div className="booking-row">
                <span>Time</span>
                <span>{selectedTime || '—'}</span>
              </div>
              <div className="booking-row">
                <span>Duration</span>
                <span>45 minutes</span>
              </div>
              <div className="booking-row">
                <span>Amount</span>
                <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                  {selected ? EXPERTS.find(e => e.id === selected)?.price : '—'}
                </span>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={!selected || !selectedTime}
              onClick={handleBook}
            >
              <span className="material-icons">calendar_today</span>
              Confirm Booking
            </button>

            <p style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: '0.75rem' }}>
              Secure payment · Free cancellation up to 2h before
            </p>
          </div>

          <PaymentScanner service="Expert Counselling" note="Campus Bull expert counselling payment" />
        </div>
      </div>
    </div>
  )
}
