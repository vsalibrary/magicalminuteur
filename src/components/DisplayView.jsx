import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSession } from '../hooks/useSession'
import { ROUNDS, totalScores } from '../utils/scores'
import { SpinnerWheelDisplay, SEGMENTS } from './EndGameSummary'

const DISPLAY_CYCLE = { light: 'dark', dark: 'arcade', arcade: 'light' }

const BANANA_COUNT = 18

const R = 130
const CIRC = 2 * Math.PI * R

function getRingColor(progress, arcade = false) {
  const remaining = 100 - (progress || 0)
  if (remaining > 30) return arcade ? '#57c8f2' : '#4ade80'
  if (remaining > 15) return arcade ? '#ffa94d' : '#fbbf24'
  return arcade ? '#f055a0' : '#f87171'
}

export function DisplayView() {
  const [theme, setTheme] = useState(() => localStorage.getItem('displayTheme') || 'light')
  const { user, signIn } = useAuth()
  const { timer, scores } = useSession(user?.uid || null)
  const [bananaVisible, setBananaVisible] = useState(false)
  const [bananaTeam, setBananaTeam] = useState('a')
  const [comeback, setComeback] = useState(null) // { teamName, color, mascot }
  const prevDiffRef = useRef(null)
  const [mirrored, setMirrored] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'arcade')
    if (theme === 'dark') root.classList.add('dark')
    if (theme === 'arcade') root.classList.add('arcade')
    localStorage.setItem('displayTheme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => DISPLAY_CYCLE[t] || 'light')

  useEffect(() => {
    if (!timer.remoteBananaEvent) return
    setBananaTeam(timer.remoteBananaEvent.team || 'a')
    setBananaVisible(true)
    const t = setTimeout(() => setBananaVisible(false), 2500)
    return () => clearTimeout(t)
  }, [timer.remoteBananaEvent?.key])

  const { scoreA, scoreB } = totalScores(scores.cells)

  // Comeback detection: fires when score gap closes from >2 to ≤2
  useEffect(() => {
    const diff = scoreA - scoreB
    const prev = prevDiffRef.current
    if (prev !== null && Math.abs(prev) > 2 && Math.abs(diff) <= 2 && Math.abs(diff) > 0) {
      const isAClosing = prev < 0  // A was behind
      const teamName = isAClosing ? scores.teamA : scores.teamB
      const color = isAClosing ? (scores.colorA || '#5b4fe8') : (scores.colorB || '#fbbf24')
      const mascot = isAClosing ? (scores.mascotA || '⭐') : (scores.mascotB || '🔥')
      setComeback({ teamName, color, mascot })
      const t = setTimeout(() => setComeback(null), 3000)
      return () => clearTimeout(t)
    }
    prevDiffRef.current = diff
  }, [scoreA, scoreB])

  const activeRoundIdx = ROUNDS.findIndex(r => {
    const { primary, passover } = scores.cells[r.id]
    return primary === null || (primary === 'wrong' && passover === null)
  })
  const activeRound = activeRoundIdx >= 0 ? ROUNDS[activeRoundIdx] : null
  const roundLabel = activeRound ? activeRound.label : 'Game Complete'
  const primaryTeamName = activeRound
    ? (activeRound.primary === 'a' ? scores.teamA : scores.teamB)
    : null
  const primaryTeamColor = activeRound
    ? (activeRound.primary === 'a' ? (scores.colorA || '#5b4fe8') : (scores.colorB || '#fbbf24'))
    : null

  const { seconds, progress, isRunning, isPaused } = timer
  const ringColor = getRingColor(progress, theme === 'arcade')
  const offset = CIRC * (1 - (progress || 0) / 100)
  const statusLabel = isPaused ? 'paused' : isRunning ? 'seconds' : 'ready'

  const leftName   = mirrored ? scores.teamB : scores.teamA
  const leftScore  = mirrored ? scoreB : scoreA
  const leftColor  = mirrored ? (scores.colorB || '#fbbf24') : (scores.colorA || '#5b4fe8')
  const leftMascot = mirrored ? (scores.mascotB || '🔥') : (scores.mascotA || '⭐')
  const rightName   = mirrored ? scores.teamA : scores.teamB
  const rightScore  = mirrored ? scoreA : scoreB
  const rightColor  = mirrored ? (scores.colorA || '#5b4fe8') : (scores.colorB || '#fbbf24')
  const rightMascot = mirrored ? (scores.mascotA || '⭐') : (scores.mascotB || '🔥')
  const rainEmoji = bananaTeam === 'a' ? (scores.mascotA || '⭐') : (scores.mascotB || '🔥')

  const themeIcon = theme === 'dark' ? '☀' : theme === 'light' ? '✦' : '☾'

  const winner = scoreA > scoreB ? scores.teamA : scoreB > scoreA ? scores.teamB : null
  const winnerColor = scoreA > scoreB ? (scores.colorA || '#5b4fe8') : (scores.colorB || '#fbbf24')

  if (timer.endGameActive) {
    const sp = timer.spinState
    const spinLastResult = (sp && sp.resultIdx != null) ? SEGMENTS[sp.resultIdx] : null

    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-8 select-none overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)', padding: '4vh 6vw' }}
      >
        {/* Controls */}
        <div className="absolute top-3 right-4 flex gap-2" style={{ zIndex: 10 }}>
          <button onClick={toggleTheme} className="btn btn-ghost text-xs px-2 py-1" title="Toggle theme">{themeIcon}</button>
        </div>

        {/* Winner */}
        <div className="text-center">
          {winner ? (
            <>
              <div style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
                {scoreA > scoreB ? (scores.mascotA || '⭐') : (scores.mascotB || '🔥')}
              </div>
              <div className="font-bold tracking-widest uppercase" style={{ color: winnerColor, fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.1 }}>
                {winner} wins!
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>🤝</div>
              <div className="font-bold tracking-widest uppercase" style={{ color: 'var(--color-text)', fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.1 }}>
                It's a tie!
              </div>
            </>
          )}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="card p-5 text-center" style={{ borderColor: (scores.colorA || '#5b4fe8') + '60' }}>
            <div className="text-xs text-muted mb-1 truncate">{scores.teamA}</div>
            <div className="font-bold tabular-nums" style={{ color: scores.colorA || '#5b4fe8', fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>{scoreA}</div>
          </div>
          <div className="card p-5 text-center" style={{ borderColor: (scores.colorB || '#fbbf24') + '60' }}>
            <div className="text-xs text-muted mb-1 truncate">{scores.teamB}</div>
            <div className="font-bold tabular-nums" style={{ color: scores.colorB || '#fbbf24', fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>{scoreB}</div>
          </div>
        </div>

        {/* Prize wheel */}
        <div className="text-center">
          <p className="section-label mb-4">Prize Wheel</p>
          <SpinnerWheelDisplay
            rotation={sp?.rotation}
            spinning={sp?.spinning}
            lastResult={sp?.spinning === false ? spinLastResult : null}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-between select-none"
      style={{ backgroundColor: 'var(--color-bg)', padding: '6vh 6vw' }}
    >
      {/* Controls (top-right corner) */}
      <div className="absolute top-3 right-4 flex gap-2" style={{ zIndex: 10 }}>
        {!user && (
          <button onClick={signIn} className="btn btn-ghost text-xs px-2 py-1" style={{ opacity: 0.5 }}>Sign in</button>
        )}
        <button
          onClick={() => setMirrored(m => !m)}
          className="btn btn-ghost text-xs px-2 py-1"
          title="Toggle mirror"
        >
          {mirrored ? '⇆ Mirrored' : '⇆ Normal'}
        </button>
        <button onClick={toggleTheme} className="btn btn-ghost text-xs px-2 py-1" title="Toggle theme">
          {themeIcon}
        </button>
      </div>

      {/* Team scores */}
      <div className="w-full flex items-start justify-between gap-8">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span style={{ fontSize: 'clamp(1.5rem, 4vw, 3.5rem)', lineHeight: 1 }}>{leftMascot}</span>
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ color: leftColor, fontSize: 'clamp(0.85rem, 2vw, 1.75rem)' }}
          >
            {leftName}
          </span>
          <span
            className="font-bold tabular-nums"
            style={{ color: leftColor, fontSize: 'clamp(4rem, 12vw, 9rem)', lineHeight: 1 }}
          >
            {leftScore}
          </span>
        </div>

        <span style={{ color: 'var(--color-muted)', fontSize: 'clamp(2rem, 5vw, 4rem)', paddingTop: '0.5em' }}>vs</span>

        <div className="flex flex-col items-center gap-1 flex-1">
          <span style={{ fontSize: 'clamp(1.5rem, 4vw, 3.5rem)', lineHeight: 1 }}>{rightMascot}</span>
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ color: rightColor, fontSize: 'clamp(0.85rem, 2vw, 1.75rem)' }}
          >
            {rightName}
          </span>
          <span
            className="font-bold tabular-nums"
            style={{ color: rightColor, fontSize: 'clamp(4rem, 12vw, 9rem)', lineHeight: 1 }}
          >
            {rightScore}
          </span>
        </div>
      </div>

      {/* Comeback alert */}
      {comeback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 20 }}>
          <div className="text-center" style={{ animation: 'score-fly-up 0.4s ease-out' }}>
            <div style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1 }}>{comeback.mascot}</div>
            <div className="font-bold tracking-widest uppercase" style={{ color: comeback.color, fontSize: 'clamp(2rem, 5vw, 4rem)', textShadow: `0 0 30px ${comeback.color}88` }}>
              COMEBACK!
            </div>
            <div className="font-semibold tracking-widest uppercase" style={{ color: comeback.color, fontSize: 'clamp(1rem, 2.5vw, 2rem)' }}>
              {comeback.teamName}
            </div>
          </div>
        </div>
      )}

      {/* Timer ring */}
      <div className={`flex flex-col items-center${isRunning && seconds <= 5 ? ' timer-pulsing' : ''}`}>
        <svg
          style={{ width: 'clamp(220px, 35vw, 420px)', height: 'clamp(220px, 35vw, 420px)' }}
          viewBox="0 0 320 320"
        >
          <circle
            cx="160" cy="160" r={R}
            fill="none"
            stroke="var(--color-border)"
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
              fill: 'var(--color-muted)',
            }}
          >
            {statusLabel}
          </text>
        </svg>
      </div>

      {/* Round label + primary team */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-text)', fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}
        >
          {roundLabel}
        </div>
        {primaryTeamName && (
          <div
            className="tracking-wider uppercase"
            style={{ color: primaryTeamColor, fontSize: 'clamp(0.7rem, 1.5vw, 1rem)' }}
          >
            {primaryTeamName} primary
          </div>
        )}
      </div>

      {/* Mascot rain on 3-pointer */}
      {bananaVisible && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: BANANA_COUNT }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 select-none"
              style={{
                left: `${(i / BANANA_COUNT) * 100 + (i % 3) * 1.5}%`,
                fontSize: `${2 + (i % 4) * 0.5}rem`,
                animationName: 'confetti-fall',
                animationDuration: `${0.7 + (i % 6) * 0.18}s`,
                animationDelay: `${(i * 0.09) % 0.6}s`,
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards',
              }}
            >
              {rainEmoji}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
