import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function AdminPapers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);      // open paper (with questions)
  const [answers, setAnswers] = useState({});       // { number: optIdx | null }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchPapers(); }, []);

  const fetchPapers = async () => {
    try { setPapers(await apiFetch('/admin/papers')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openPaper = async (slug) => {
    setSaved(false);
    const p = await apiFetch(`/admin/papers/${slug}`);
    setActive(p);
    setAnswers(Object.fromEntries(p.questions.map(q => [q.number, q.correctOption])));
  };

  const setAns = (number, opt) =>
    setAnswers(a => ({ ...a, [number]: a[number] === opt ? null : opt }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await apiFetch(`/admin/papers/${active.id}/answers`, {
        method: 'PATCH',
        body: JSON.stringify({ answers }),
      });
      setSaved(true);
      fetchPapers();
    } catch (e) { console.error(e); alert('Failed to save: ' + e.message); }
    finally { setSaving(false); }
  };

  const gradedCount = Object.values(answers).filter(v => v !== null && v !== undefined).length;

  // ── Answer-key editor ──
  if (active) {
    return (
      <div className="h-screen flex flex-col">
        <header className="sticky top-0 w-full h-20 bg-[#131314]/80 backdrop-blur-md z-40 flex justify-between items-center px-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setActive(null)} className="text-zinc-400 hover:text-white">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{active.title} — Answer Key</h2>
              <p className="text-xs text-zinc-500">{gradedCount}/{active.questions.length} answers set</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-green-400 text-sm">Saved ✓</span>}
            <button onClick={save} disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-bold text-sm">
              {saving ? 'Saving…' : 'Save Answer Key'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 py-6 space-y-6">
          {active.questions.map(q => (
            <div key={q.id} className="bg-[#1C1B1C] rounded-xl p-4 flex gap-4 items-start">
              <div className="text-zinc-500 font-bold text-sm w-10 shrink-0 pt-1">Q{q.number}</div>
              <img src={q.imageUrl} alt={`Q${q.number}`} loading="lazy"
                className="w-[420px] max-w-[55%] bg-white rounded-lg p-2 shrink-0" />
              <div className="flex flex-col gap-2">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Correct answer</span>
                <div className="flex gap-2">
                  {LETTERS.map((L, oi) => (
                    <button key={oi} onClick={() => setAns(q.number, oi)}
                      className={`w-11 h-11 rounded-lg font-bold transition ${
                        answers[q.number] === oi
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}>{L}</button>
                  ))}
                </div>
                {(answers[q.number] === null || answers[q.number] === undefined) &&
                  <span className="text-[11px] text-zinc-600">Not set — practice only</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Paper list ──
  return (
    <>
      <header className="sticky top-0 w-full h-20 bg-[#131314]/80 backdrop-blur-md z-40 flex items-center px-10">
        <h2 className="text-xl font-bold text-white tracking-tight">Question Papers</h2>
      </header>
      <div className="px-10 py-6">
        {loading ? <p className="text-zinc-500">Loading…</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {papers.map(p => (
              <div key={p.id} className="bg-[#1C1B1C] rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-red-400">description</span>
                  {p.year && <span className="text-xs text-zinc-500">{p.year}</span>}
                </div>
                <h3 className="text-white font-bold">{p.title}</h3>
                <p className="text-xs text-zinc-500">
                  {p.questionCount} questions · {p.gradedCount} with answer key
                </p>
                {p.questionCount > 0 ? (
                  <button onClick={() => openPaper(p.slug)}
                    className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    Set Answer Key
                  </button>
                ) : (
                  <span className="mt-2 text-xs text-zinc-600">PDF only — no extracted questions</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
