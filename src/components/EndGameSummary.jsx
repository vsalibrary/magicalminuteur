import { useState, useRef } from 'react'
import { ROUNDS, totalScores } from '../utils/scores'

// Wheel segments: outcome determines which emoji rain fires
const SEGMENTS = [
  { emoji: '🍌', label: 'Banana!',      outcome: 'banana',   color: '#fbbf24' },
  { emoji: '🍕', label: 'Pizza!',       outcome: 'pizza',    color: '#f97316' },
  { emoji: '🍌', label: 'Banana!',      outcome: 'banana',   color: '#fde68a' },
  { emoji: '🍕', label: 'Negative Pizza', outcome: 'negative', color: '#ef4444' },
  { emoji: '🍌', label: 'Banana!',       outcome: 'banana',   color: '#fbbf24' },
  { emoji: '🍕', label: 'Pizza!',        outcome: 'pizza',    color: '#f97316' },
  { emoji: '🍌', label: 'Banana!',       outcome: 'banana',   color: '#fde68a' },
  { emoji: '🍕', label: 'Negative Pizza', outcome: 'negative', color: '#ef4444' },
]

const N = SEGMENTS.length
const SEG_DEG = 360 / N
const CX = 120, CY = 120, R = 100, INNER = 24

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function segmentPath(i) {
  const start = i * SEG_DEG
  const end   = (i + 1) * SEG_DEG
  const p1 = polarToXY(CX, CY, R, start)
  const p2 = polarToXY(CX, CY, R, end)
  const pi1 = polarToXY(CX, CY, INNER, start)
  const pi2 = polarToXY(CX, CY, INNER, end)
  const large = SEG_DEG > 180 ? 1 : 0
  return [
    `M ${pi1.x} ${pi1.y}`,
    `L ${p1.x} ${p1.y}`,
    `A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${pi2.x} ${pi2.y}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${pi1.x} ${pi1.y}`,
    'Z',
  ].join(' ')
}

function emojiPos(i) {
  const mid = (i + 0.5) * SEG_DEG
  return polarToXY(CX, CY, (R + INNER) / 2, mid)
}

function SpinnerWheel({ onResult }) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [lastResult, setLastResult] = useState(null)
  const totalRotRef = useRef(0)

  const spin = () => {
    if (spinning) return
    const targetIdx = Math.floor(Math.random() * N)
    // The pointer is at top (0°). After rotating CW by angle A,
    // the segment at top = floor(((360 - A % 360) % 360) / SEG_DEG)
    // We want targetIdx, so: (360 - A % 360) % 360 = targetIdx * SEG_DEG + SEG_DEG/2
    const targetAngle = targetIdx * SEG_DEG + SEG_DEG / 2
    const partial = (360 - targetAngle % 360 + 360) % 360
    const current = totalRotRef.current % 360
    const diff = (partial - current + 360) % 360
    const newTotal = totalRotRef.current + 5 * 360 + diff
    totalRotRef.current = newTotal
    setRotation(newTotal)
    setSpinning(true)
    setTimeout(() => {
      setSpinning(false)
      const seg = SEGMENTS[targetIdx]
      setLastResult(seg)
      onResult(seg.outcome)
    }, 4200)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 240, height: 240 }}>
        {/* Wheel */}
        <svg
          width="240" height="240"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.08, 1)' : 'none',
          }}
        >
          {SEGMENTS.map((seg, i) => (
            <g key={i}>
              <path d={segmentPath(i)} fill={seg.color} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
              <text
                x={emojiPos(i).x}
                y={emojiPos(i).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {seg.emoji}
              </text>
            </g>
          ))}
          {/* Centre hub */}
          <circle cx={CX} cy={CY} r={INNER} fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="2" />
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="14">🎰</text>
        </svg>

        {/* Pointer triangle at top */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '20px solid var(--color-text)',
          zIndex: 10,
        }} />
      </div>

      <button
        className="btn btn-primary text-base px-8 py-3"
        onClick={spin}
        disabled={spinning}
      >
        {spinning ? 'Spinning…' : lastResult ? 'Spin Again' : '🎰 Spin!'}
      </button>

      {lastResult && !spinning && (
        <div className="text-xl font-bold animate-bounce" style={{ color: lastResult.color }}>
          {lastResult.emoji} {lastResult.label}
        </div>
      )}
    </div>
  )
}

function highestRound(cells) {
  let best = null, bestPts = 0
  ROUNDS.forEach(round => {
    const { primary, passover } = cells[round.id]
    const pts = (primary === 2 || primary === 3 ? primary : 0) + (passover === 2 ? 2 : 0)
    if (pts > bestPts) { bestPts = pts; best = round.label }
  })
  return { label: best || '—', pts: bestPts }
}

export function EndGameSummary({ scores, saveGame, user, onClose, onBananaRain, onPizzaRain, onNegativePizzaRain }) {
  const { cells, teamA, teamB, colorA, colorB, resetCells } = scores
  const { scoreA, scoreB } = totalScores(cells)
  const { label: bestRound, pts: bestPts } = highestRound(cells)

  const tied = scoreA === scoreB
  const winnerName = tied ? null : scoreA > scoreB ? teamA : teamB
  const winnerColor = tied ? 'var(--color-text)' : scoreA > scoreB ? colorA : colorB

  const handleSaveAndNew = async () => {
    if (user) await saveGame({ teamA, teamB, scoreA, scoreB, cells })
    resetCells()
    onClose()
  }

  const handleSpinResult = (outcome) => {
    if (outcome === 'banana') onBananaRain()
    else if (outcome === 'pizza') onPizzaRain()
    else if (outcome === 'negative') onNegativePizzaRain()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div
        className="flex items-center justify-between px-4 pb-3 border-b border-subtle shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
      >
        <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>🏆 Game Over</h2>
        <button onClick={onClose} className="btn btn-ghost text-sm px-3 py-2">✕ Close</button>
      </div>

      <div className="flex-1 flex flex-col items-center gap-8 px-4 py-8 max-w-lg mx-auto w-full">

        {/* Winner announcement */}
        <div className="text-center">
          {tied ? (
            <div>
              <div className="text-5xl mb-2">🤝</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>It's a tie!</div>
            </div>
          ) : (
            <div>
              <div className="text-5xl mb-2">🥇</div>
              <div className="text-3xl font-bold" style={{ color: winnerColor }}>{winnerName} wins!</div>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="card p-5 text-center" style={{ borderColor: colorA + '60' }}>
            <div className="text-xs text-muted mb-1 truncate">{teamA}</div>
            <div className="text-5xl font-bold tabular-nums" style={{ color: colorA }}>{scoreA}</div>
          </div>
          <div className="card p-5 text-center" style={{ borderColor: colorB + '60' }}>
            <div className="text-xs text-muted mb-1 truncate">{teamB}</div>
            <div className="text-5xl font-bold tabular-nums" style={{ color: colorB }}>{scoreB}</div>
          </div>
        </div>

        {/* Highlight stat */}
        {bestPts > 0 && (
          <div className="text-center text-sm text-muted">
            Best round: <span style={{ color: 'var(--color-text)' }}>{bestRound}</span> — {bestPts} pts
          </div>
        )}

        {/* Divider */}
        <div className="w-full border-t border-subtle" />

        {/* Spinner */}
        <div className="text-center">
          <p className="section-label mb-4">Prize Wheel</p>
          <SpinnerWheel onResult={handleSpinResult} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap justify-center w-full pb-8">
          {user && (
            <button className="btn btn-primary px-6 py-3" onClick={handleSaveAndNew}>
              Save &amp; New Game
            </button>
          )}
          <button className="btn btn-ghost px-6 py-3" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
