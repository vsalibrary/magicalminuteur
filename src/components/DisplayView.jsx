import { useAuth } from '../hooks/useAuth'
import { useSession } from '../hooks/useSession'
import { ROUNDS, totalScores } from '../utils/scores'

const R = 130
const CIRC = 2 * Math.PI * R

function getRingColor(progress) {
  const remaining = 100 - (progress || 0)
  if (remaining > 30) return '#5b4fe8'
  if (remaining > 15) return '#fbbf24'
  return '#f87171'
}

export function DisplayView() {
  const { user, signIn } = useAuth()
  const { timer, scores } = useSession(user?.uid || null)

  if (!user) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6" style={{ backgroundColor: '#0a0a0f' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.25rem' }}>Sign in to mirror your live session</p>
        <button onClick={signIn} className="btn btn-primary text-lg px-8 py-3">Sign in with Google</button>
      </div>
    )
  }

  const { scoreA, scoreB } = totalScores(scores.cells)

  const activeRoundIdx = ROUNDS.findIndex(r => {
    const { primary, passover } = scores.cells[r.id]
    return primary === null || (primary === 'wrong' && passover === null)
  })
  const activeRound = activeRoundIdx >= 0 ? ROUNDS[activeRoundIdx] : null
  const roundLabel = activeRound ? activeRound.label : 'Game Complete'

  const { seconds, progress, isRunning, isPaused } = timer
  const ringColor = getRingColor(progress)
  const offset = CIRC * (1 - (progress || 0) / 100)
  const statusLabel = isPaused ? 'paused' : isRunning ? 'seconds' : 'ready'

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-between select-none"
      style={{ backgroundColor: '#0a0a0f', padding: '6vh 6vw' }}
    >
      {/* Team scores */}
      <div className="w-full flex items-start justify-between gap-8">
        <div className="flex flex-col items-center gap-3 flex-1">
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(1rem, 2.5vw, 2rem)' }}
          >
            {scores.teamA}
          </span>
          <span
            className="font-bold tabular-nums"
            style={{ color: '#ffffff', fontSize: 'clamp(4rem, 12vw, 9rem)', lineHeight: 1 }}
          >
            {scoreA}
          </span>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 'clamp(2rem, 5vw, 4rem)', paddingTop: '0.5em' }}>vs</span>

        <div className="flex flex-col items-center gap-3 flex-1">
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(1rem, 2.5vw, 2rem)' }}
          >
            {scores.teamB}
          </span>
          <span
            className="font-bold tabular-nums"
            style={{ color: '#ffffff', fontSize: 'clamp(4rem, 12vw, 9rem)', lineHeight: 1 }}
          >
            {scoreB}
          </span>
        </div>
      </div>

      {/* Timer ring */}
      <div className="flex flex-col items-center">
        <svg
          style={{ width: 'clamp(220px, 35vw, 420px)', height: 'clamp(220px, 35vw, 420px)' }}
          viewBox="0 0 320 320"
        >
          <circle
            cx="160" cy="160" r={R}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="12"
          />
          <circle
            cx="160" cy="160" r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            transform="rotate(-90 160 160)"
            style={{ transition: 'stroke-dashoffset 0.08s linear, stroke 0.4s ease' }}
          />
          <text
            x="160" y="148"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '96px',
              fontWeight: 'bold',
              fill: ringColor,
              transition: 'fill 0.4s ease',
            }}
          >
            {seconds}
          </text>
          <text
            x="160" y="210"
            textAnchor="middle"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fill: 'rgba(255,255,255,0.25)',
            }}
          >
            {statusLabel}
          </text>
        </svg>
      </div>

      {/* Round label */}
      <div
        className="font-semibold tracking-widest uppercase"
        style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}
      >
        {roundLabel}
      </div>
    </div>
  )
}
