import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'
import './PaymentScanner.css'

const DEFAULT_PAYEE = 'Mansoor Ahmed'
const DEFAULT_UPI_ID = 'mansoor.291@okhdfcbank'
const CONFIRMATION_EMAIL = 'mansoor.291@gmail.com'

export default function PaymentScanner({
  amount,
  note = 'Campus Bull payment',
  service = 'Campus Bull payment',
  payeeName = DEFAULT_PAYEE,
  upiId = DEFAULT_UPI_ID,
}) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    service,
    amount: amount || '',
    utr: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)
  const [mailtoUrl, setMailtoUrl] = useState('')

  const upiUri = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      cu: 'INR',
      tn: note,
    })
    if (amount) params.set('am', String(amount))
    return `upi://pay?${params.toString()}`
  }, [amount, note, payeeName, upiId])

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=14&data=${encodeURIComponent(upiUri)}`

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const setField = (field) => (event) => {
    setForm(prev => ({ ...prev, [field]: event.target.value }))
  }

  const buildEmailUrl = () => {
    const subject = `Payment confirmation: ${form.service || service} - ${form.utr || 'UTR'}`
    const body = [
      'Payment confirmation submitted from Campus Bull.',
      '',
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Service: ${form.service}`,
      `Amount: ${form.amount || 'Not provided'}`,
      `UTR / Transaction ID: ${form.utr}`,
      `Notes: ${form.notes || 'None'}`,
    ].join('\n')

    return `mailto:${CONFIRMATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const submitConfirmation = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)
    setMailtoUrl('')
    try {
      await apiFetch('/payments/confirmation', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setStatus({ type: 'success', text: 'Payment confirmation sent. We have emailed your acknowledgement and will upgrade access after verification.' })
      setForm(prev => ({ ...prev, utr: '', notes: '' }))
    } catch (err) {
      const fallbackUrl = buildEmailUrl()
      setMailtoUrl(fallbackUrl)
      setStatus({
        type: 'error',
        text: err.status === 503
          ? 'Email is not configured on the server. Use the button below to send the confirmation email from your mail app.'
          : err.message || 'Failed to send payment confirmation. You can still email the details using the button below.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="payment-scanner card">
      <div className="payment-scanner-head">
        <span className="material-icons">qr_code_scanner</span>
        <div>
          <p className="payment-scanner-title">Scan to Pay</p>
          <p className="payment-scanner-sub">Use any UPI app to complete payment.</p>
        </div>
      </div>

      <div className="payment-qr-frame">
        <img src={qrUrl} alt={`UPI QR code for ${payeeName}`} className="payment-qr" />
      </div>

      <div className="payment-upi-details">
        <div>
          <span>Payee</span>
          <strong>{payeeName}</strong>
        </div>
        <div>
          <span>UPI ID</span>
          <strong>{upiId}</strong>
        </div>
      </div>

      <div className="payment-actions">
        <button type="button" className="btn-secondary" onClick={copyUpiId}>
          <span className="material-icons">{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Copied' : 'Copy UPI ID'}
        </button>
        <a className="btn-primary" href={upiUri}>
          <span className="material-icons">account_balance_wallet</span>
          Pay with UPI
        </a>
      </div>

      <form className="payment-confirm-form" onSubmit={submitConfirmation}>
        <div>
          <p className="payment-confirm-title">After payment, submit details</p>
          <p className="payment-confirm-sub">Enter the UTR / Transaction ID from your UPI app.</p>
        </div>

        <div className="payment-form-grid">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={setField('name')} required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={setField('email')} required />
          </label>
          <label>
            <span>Phone</span>
            <input type="tel" value={form.phone} onChange={setField('phone')} required />
          </label>
          <label>
            <span>Service</span>
            <input value={form.service} onChange={setField('service')} required />
          </label>
          <label>
            <span>Amount</span>
            <input value={form.amount} onChange={setField('amount')} placeholder="e.g. 25000" />
          </label>
          <label>
            <span>UTR / Transaction ID</span>
            <input value={form.utr} onChange={setField('utr')} placeholder="e.g. 412345678901" required />
          </label>
        </div>

        <label className="payment-notes-field">
          <span>Notes</span>
          <textarea value={form.notes} onChange={setField('notes')} placeholder="Plan name, screenshot note, or anything our team should know" rows={3} />
        </label>

        {status && (
          <div className={`payment-form-status ${status.type}`}>
            {status.text}
          </div>
        )}

        {mailtoUrl && (
          <a className="btn-secondary payment-submit" href={mailtoUrl}>
            <span className="material-icons">mail</span>
            Email Details to Mansoor
          </a>
        )}

        <button type="submit" className="btn-primary payment-submit" disabled={submitting}>
          <span className="material-icons">{submitting ? 'hourglass_empty' : 'send'}</span>
          {submitting ? 'Sending...' : 'Submit Payment Confirmation'}
        </button>
      </form>
    </div>
  )
}
