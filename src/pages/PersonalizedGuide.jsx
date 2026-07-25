import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PaymentScanner from '../components/PaymentScanner'
import './PersonalizedGuide.css'

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

// Replace with the business WhatsApp number (country code + number, no + or spaces)
const WHATSAPP_NUMBER = '919341888827'

const PLANS = [
  {
    key: 'pro',
    name: 'Pro Subscription',
    price: '₹25,000',
    gst: '+ GST',
    tagline: 'Comprehensive guidance & support for students seeking admission through merit-based counseling.',
    accent: '#f8bd2a',
    badge: 'Most Popular',
    highlights: [
      'Instant exam, result & counseling alerts — Email, WhatsApp, SMS & Calls',
      'Mock tests for NEET, JEE, COMEDK, KCET, MAT & CAT',
      '1-on-1 student & parent counseling sessions',
      'College research, cut-offs, seat matrix & predictor tools',
      'Choice-filling support across all rounds (R1, R2, Mop-Up, Stray)',
    ],
    sections: [
      { title: 'Exam & Admission Updates', items: ['Exam date notifications', 'Result announcements and updates', 'Counseling schedule updates', 'Instant alerts via Email, WhatsApp, SMS, and Calls'] },
      { title: 'Mock Test Access', items: ['NEET', 'JEE', 'COMEDK', 'KCET', 'MAT', 'CAT'] },
      { title: 'Personalized Counseling', items: ['One-on-one student counseling', 'Parent counseling sessions', 'Career and college guidance'] },
      { title: 'College Research & Analysis', items: ['Detailed college profiles', 'Cut-off analysis', 'Seat matrix information', 'College predictor and rank predictor tools'] },
      { title: 'Admission Support', items: ['Admission procedure guidance', 'Application filling support (My Guide)', 'Document verification and submission support (My Guide)', 'Minority category admission support'] },
      { title: 'Counseling Round Assistance', items: ['Choice filling support for Round 1', 'Choice filling support for Round 2', 'Mop-Up Round guidance', 'Stray Vacancy Round updates and guidance'] },
      { title: 'Premium Resources', items: ['NRI admission process guidance', 'Management quota admission process guidance', 'List of available Management Quota seats', 'List of available NRI seats'] },
      { title: 'Student Assistance', items: ['Dedicated chat support', 'Personalized admission guidance throughout the counseling process'] },
    ],
  },
  {
    key: 'elite',
    name: 'Elite Subscription',
    price: '₹2,00,000',
    gst: '+ GST',
    tagline: 'Premium end-to-end admission management for students seeking admission through Management Quota or NRI Quota.',
    accent: '#d32f2f',
    badge: 'White-Glove',
    highlights: [
      'Everything in Pro, plus full end-to-end admission management',
      'Real-time Management & NRI seat tracking',
      'Direct coordination with authorized college admission teams',
      'A dedicated personal admission consultant',
      'Strategic seat-securing assistance for your preferred colleges',
    ],
    sections: [
      { note: 'Everything included in the Pro Subscription, plus:' },
      { title: 'End-to-End Admission Execution', items: ['Complete admission management from counseling to final seat confirmation', 'Personalized admission strategy based on student profile and preferences', 'Continuous monitoring of seat availability across target colleges'] },
      { title: 'Management & NRI Seat Acquisition Support', items: ['Real-time tracking of Management Quota seat availability', 'Real-time tracking of NRI Quota seat availability', 'Stray Vacancy and Extended Mop-Up Round monitoring', 'Priority support during critical admission rounds'] },
      { title: 'Direct College Coordination', items: ['Direct connection with authorized college admission teams', 'Assistance in communication and follow-ups with colleges', 'Guidance on fee structures, documentation, and admission timelines'] },
      { title: 'Dedicated Admission Consultant', items: ['Personal admission advisor throughout the admission cycle', 'Fast-track support via call, WhatsApp, and email', 'Priority response and counseling sessions'] },
      { title: 'College Seat Securing Assistance', items: ['Strategic guidance to maximize chances of securing admission in preferred colleges', 'Personalized recommendations based on rank, budget, category, and seat availability'] },
      { title: 'Ideal For — students seeking admission through', items: ['Management Quota', 'NRI Quota', 'Stray Vacancy Rounds', 'Extended Mop-Up Rounds'] },
    ],
  },
]

export default function PersonalizedGuide() {
  const { user } = useAuth()
  const [detailPlan, setDetailPlan] = useState(null)

  const openWhatsApp = (planKey) => {
    const name  = user?.name  || 'Not provided'
    const email = user?.email || 'Not provided'
    const course = user?.ugOrPg
      ? `${user.ugOrPg} (${user.ugOrPg === 'UG' ? 'MBBS/BDS' : 'MD/MS'})`
      : 'Not provided'

    const messages = {
      pro: `Hello,\n\nI am interested in the *Pro Subscription*. I would like guidance regarding admissions, counseling, college selection, cut-off analysis, seat matrix, and the complete counseling process.\n\n*My Details:*\nName: ${name}\nEmail: ${email}\nCourse: ${course}\n\nPlease share the next steps, pricing details, and how I can get started.\n\nThank you.`,
      elite: `Hello,\n\nI am interested in the *Elite Subscription*. I would like complete end-to-end assistance for securing admission through Management Quota/NRI Quota, including seat availability, college coordination, and admission support.\n\n*My Details:*\nName: ${name}\nEmail: ${email}\nCourse: ${course}\n\nPlease share the process, eligibility requirements, and how I can proceed.\n\nThank you.`,
    }

    const text = encodeURIComponent(messages[planKey] || messages.pro)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <div>
          <p className="section-label">Premium</p>
          <h1 className="page-title">
            <span className="material-icons" style={{ verticalAlign: '-4px', color: 'var(--secondary)', marginRight: '0.4rem' }}>workspace_premium</span>
            Personalized Guide
          </h1>
          <p className="page-subtitle">
            A dedicated team that walks with you from exam updates to final seat confirmation —
            counseling, college research, choice-filling and admission support, end to end.
          </p>
        </div>
      </div>

      {/* Paywall notice */}
      <div className="pg-locked-banner card animate-in">
        <span className="material-icons">lock</span>
        <div>
          <p className="pg-locked-title">This is a premium service</p>
          <p className="pg-locked-sub">Choose a plan below to unlock personalized, one-on-one admission guidance.</p>
        </div>
      </div>

      {/* Plans side by side */}
      <div className="pg-plans animate-in">
        {PLANS.map(plan => (
          <div key={plan.key} className={`pg-plan card ${plan.key === 'elite' ? 'pg-plan-elite' : ''}`} style={{ '--accent': plan.accent }}>
            <div className="pg-plan-head">
              <span className="pg-plan-badge">{plan.badge}</span>
              <h3 className="pg-plan-name">{plan.name}</h3>
              <div className="pg-plan-price">
                {plan.price} <span className="pg-plan-gst">{plan.gst}</span>
              </div>
              <p className="pg-plan-tagline">{plan.tagline}</p>
            </div>

            <ul className="pg-highlights">
              {plan.highlights.map((h, i) => (
                <li key={i}>
                  <span className="material-icons">check_circle</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <div className="pg-plan-actions">
              <button className="btn-primary" onClick={() => openWhatsApp(plan.key)}>
                <WhatsAppIcon />
                Get {plan.key === 'pro' ? 'Pro' : 'Elite'}
              </button>
              <button className="btn-secondary" onClick={() => setDetailPlan(plan)}>
                See full details
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pg-payment-section animate-in">
        <PaymentScanner service="Premium Plan" note="Campus Bull premium plan payment" />
      </div>

      <p className="pg-foot-note">
        Prices are exclusive of GST. After payment, share the screenshot with our team on WhatsApp to confirm enrollment and next steps.
      </p>

      {/* Full details modal */}
      {detailPlan && (
        <div className="pg-modal-backdrop" onClick={() => setDetailPlan(null)}>
          <div className="pg-modal" onClick={e => e.stopPropagation()}>
            <button className="pg-modal-close" onClick={() => setDetailPlan(null)} aria-label="Close">
              <span className="material-icons">close</span>
            </button>
            <div className="pg-modal-head" style={{ '--accent': detailPlan.accent }}>
              <span className="pg-plan-badge">{detailPlan.badge}</span>
              <h3 className="pg-plan-name">{detailPlan.name}</h3>
              <div className="pg-plan-price">{detailPlan.price} <span className="pg-plan-gst">{detailPlan.gst}</span></div>
              <p className="pg-plan-tagline">{detailPlan.tagline}</p>
            </div>

            <div className="pg-modal-body">
              {detailPlan.sections.map((sec, i) => (
                sec.note ? (
                  <p key={i} className="pg-section-note">{sec.note}</p>
                ) : (
                  <div key={i} className="pg-section">
                    <h4 className="pg-section-title">{sec.title}</h4>
                    <ul className="pg-section-list">
                      {sec.items.map((it, j) => (
                        <li key={j}><span className="material-icons">check</span>{it}</li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>

            <div className="pg-modal-foot">
              <button className="btn-primary" onClick={() => openWhatsApp(detailPlan.key)}>
                <WhatsAppIcon />
                Talk to our team on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
