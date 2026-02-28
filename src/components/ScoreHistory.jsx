export function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-HK', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ScoreHistory({ games, onRestore }) {
  if (!games || games.length === 0) {
    return <p className="text-center text-muted text-sm italic py-4">No saved games yet.</p>
  }

  return (
    <div className="space-y-2">
      {games.map((game) => (
        <div key={game.id} className="flex items-center gap-3 py-2 border-b border-subtle last:border-0">
          <div className="flex-1 min-w-0">
            <div className="text-sm" style={{ color: 'var(--color-text)' }}>
              <span className="font-medium">{game.teamA || 'Team A'}</span>
              <span className="text-muted mx-2 font-mono">{game.scoreA} – {game.scoreB}</span>
              <span className="font-medium">{game.teamB || 'Team B'}</span>
            </div>
            <div className="text-xs text-muted">{formatDate(game.date)}</div>
          </div>
          {onRestore && (
            <button
              onClick={() => onRestore(game)}
              className="btn btn-ghost text-xs px-3 py-1.5 shrink-0"
            >
              Restore
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
