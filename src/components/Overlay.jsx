import { useEffect, useState } from 'react'

const CONFETTI_COLORS = [
  '#5b4fe8', '#34d399', '#f87171', '#fbbf24',
  '#60a5fa', '#f472b6', '#a78bfa', '#34d399',
  '#fb923c', '#4ade80', '#e879f9', '#38bdf8', '#facc15',
]

function ConfettiPiece({ color, style }) {
  return (
    <div
      className="confetti-piece"
      style={{ backgroundColor: color, ...style }}
    />
  )
}

const EMOJI_COUNT = 18

export function Overlay({ fiveSecKey, timesUpKey }) {
  const [fiveVisible, setFiveVisible] = useState(false)
  const [timesUpVisible, setTimesUpVisible] = useState(false)

  useEffect(() => {
    if (fiveSecKey === 0) return
    setFiveVisible(true)
    const t = setTimeout(() => setFiveVisible(false), 2000)
    return () => clearTimeout(t)
  }, [fiveSecKey])

  useEffect(() => {
    if (timesUpKey === 0) return
    setTimesUpVisible(true)
    const t = setTimeout(() => setTimesUpVisible(false), 3000)
    return () => clearTimeout(t)
  }, [timesUpKey])

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Five seconds flash */}
      {fiveVisible && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <div className="absolute inset-0 bg-red-500/20" />
          <span className="relative text-6xl font-display font-bold text-danger drop-shadow-lg">
            5 Seconds!
          </span>
        </div>
      )}

      {/* Time's up overlay */}
      {timesUpVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" />
          <span className="relative text-5xl font-display font-bold text-white animate-bounce drop-shadow-lg">
            Time&apos;s Up!
          </span>
        </div>
      )}
    </div>
  )
}
