// Predictor tool access + per-account run counts.
//
// Tier (Admin / Pro / Free) comes from the existing user.role & user.isPro fields.
// The run COUNTS ("Pro: rank x2 / college x1", "Free: rank x1 / college locked")
// are kept in the browser (localStorage) so NO database column is needed.
// The server independently enforces feature access by tier. UG college searches
// are free; PG college searches remain PRO/ADMIN only.

export const PREDICTOR_LIMITS = {
  rank:    { ADMIN: Infinity, PRO: 4, FREE: 2 },
  college: { ADMIN: Infinity, PRO: 1, FREE: 0 },
}

export const tierOf = (user) =>
  user?.role === 'ADMIN' ? 'ADMIN' : (user?.isPro ? 'PRO' : 'FREE')

const usageKey = (user, tool) => `cb_pred_${user?.id || 'anon'}_${tool}`

export function getUsed(user, tool) {
  try { return Number(localStorage.getItem(usageKey(user, tool))) || 0 }
  catch { return 0 }
}

// Increment and persist the run count; returns the new value.
export function bumpUsed(user, tool) {
  const next = getUsed(user, tool) + 1
  try { localStorage.setItem(usageKey(user, tool), String(next)) } catch { /* ignore */ }
  return next
}

// { tier, limit, used, left, unlimited, locked } for a tool ('rank' | 'college').
export function predictorAccess(user, tool) {
  const tier = tierOf(user)
  const limit = PREDICTOR_LIMITS[tool][tier]
  const used = getUsed(user, tool)
  const unlimited = limit === Infinity
  const left = unlimited ? Infinity : Math.max(0, limit - used)
  return { tier, limit, used, left, unlimited, locked: !unlimited && left <= 0 }
}
