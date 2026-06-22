import { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/api'

export default function AdminRecommendations() {
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [state, setState] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const fetchColleges = async () => {
    try {
      const data = await apiFetch('/admin/recommendations')
      setColleges(data)
    } catch (err) {
      setError('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchColleges() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    setError('')
    try {
      const college = await apiFetch('/admin/recommendations', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), state: state.trim() }),
      })
      setColleges(prev => [...prev, college].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setState('')
    } catch (err) {
      setError(err.message || 'Failed to add college')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id) => {
    try {
      await apiFetch(`/admin/recommendations/${id}`, { method: 'DELETE' })
      setColleges(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to remove college')
    }
  }

  return (
    <div className="overflow-y-auto h-full p-6 md:p-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">Top Recommendations</h1>
        <p className="text-zinc-400 text-sm mt-1">
          These colleges appear on every student's dashboard under "Top Recommendations".
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-[#1C1B1C] rounded-xl p-5 mb-6 border border-white/5">
        <p className="text-sm font-semibold text-white mb-4">Add College</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="College name *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
          />
          <input
            type="text"
            placeholder="State (e.g. Karnataka)"
            value={state}
            onChange={e => setState(e.target.value)}
            className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-colors flex items-center gap-2 justify-center"
          >
            <span className="material-symbols-outlined text-base">add</span>
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      </form>

      {/* College list */}
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading…</p>
      ) : colleges.length === 0 ? (
        <div className="bg-[#1C1B1C] rounded-xl p-8 text-center border border-white/5">
          <span className="material-symbols-outlined text-4xl text-zinc-600 mb-2 block">school</span>
          <p className="text-zinc-400 text-sm">No recommendations yet. Add a college above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {colleges.map(c => (
            <div
              key={c.id}
              className="bg-[#1C1B1C] rounded-xl px-5 py-4 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors"
            >
              <div>
                <p className="text-white font-semibold text-sm">{c.name}</p>
                {c.state && (
                  <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {c.state}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRemove(c.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
