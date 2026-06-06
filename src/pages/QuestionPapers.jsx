import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './QuestionPapers.css'

export default function QuestionPapers() {
  const navigate = useNavigate()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Static papers index (served from /public, no backend/DB).
    fetch('/papers/index.json')
      .then(r => { if (!r.ok) throw new Error('Could not load papers'); return r.json() })
      .then(setPapers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <div className="qp-header">
        <h1 className="page-title">Question Papers</h1>
        <p className="qp-sub">Previous-year NEET papers — read the full PDF or attempt it as an image-based test.</p>
      </div>

      {loading && <div className="qp-empty">Loading papers…</div>}
      {error && <div className="qp-empty">Could not load papers: {error}</div>}
      {!loading && !error && papers.length === 0 && <div className="qp-empty">No papers available yet.</div>}

      <div className="qp-grid">
        {papers.map(p => (
          <div key={p.id} className="qp-card card">
            <div className="qp-card-top">
              <span className="material-icons qp-icon">description</span>
              {p.year && <span className="chip">{p.year}</span>}
            </div>
            <h3 className="qp-title">{p.title}</h3>
            <div className="qp-meta">
              {p.questionCount > 0
                ? <span><span className="material-icons">quiz</span>{p.questionCount} questions</span>
                : <span><span className="material-icons">picture_as_pdf</span>PDF only</span>}
              {p.gradedCount > 0 && (
                <span className="qp-graded"><span className="material-icons">verified</span>{p.gradedCount} graded</span>
              )}
            </div>

            <div className="qp-actions">
              {p.pdfUrl && (
                <a className="btn-secondary" href={p.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <span className="material-icons">open_in_new</span> View PDF
                </a>
              )}
              {p.questionCount > 0 && (
                <button className="btn-primary" onClick={() => navigate(`/dashboard/paper-test/${p.slug}`)}>
                  <span className="material-icons">play_arrow</span> Take Test
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
