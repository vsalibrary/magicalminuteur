import { useState } from 'react'

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-HK', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ScoreHistory({ games }) {
  const [expanded, setExpanded] = useState(false)

  if (!games) return null

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="btn btn-ghost text-sm flex items-center gap-2 w-full justify-center"
      >
        Past Games {expanded ? '▴' : '▾'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
          {games.length === 0 ? (
            <p className="text-center text-white/40 text-sm italic py-4">No saved games yet.</p>
          ) : (
            games.map((game) => (
              <div key={game.id} className="card p-3 flex items-center justify-between text-sm gap-3">
                <span className="text-white/40 text-xs shrink-0">{formatDate(game.date)}</span>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="truncate text-white/80">{game.teamA || 'Team A'}</span>
                  <span className="text-white/40 font-mono shrink-0">
                    {game.scoreA} – {game.scoreB}
                  </span>
                  <span className="truncate text-white/80">{game.teamB || 'Team B'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
