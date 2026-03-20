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

export function Overlay({ fiveSecKey, timesUpKey, confettiKey, bananaKey, pizzaKey, pizzaNegKey }) {
  const [fiveVisible, setFiveVisible] = useState(false)
  const [timesUpVisible, setTimesUpVisible] = useState(false)
  const [confettiVisible, setConfettiVisible] = useState(false)
  const [bananaVisible, setBananaVisible] = useState(false)
  const [pizzaVisible, setPizzaVisible] = useState(false)
  const [pizzaNegVisible, setPizzaNegVisible] = useState(false)

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

  useEffect(() => {
    if (confettiKey === 0) return
    setConfettiVisible(true)
    const t = setTimeout(() => setConfettiVisible(false), 3000)
    return () => clearTimeout(t)
  }, [confettiKey])

  useEffect(() => {
    if (bananaKey === 0) return
    setBananaVisible(true)
    const t = setTimeout(() => setBananaVisible(false), 2500)
    return () => clearTimeout(t)
  }, [bananaKey])

  useEffect(() => {
    if (pizzaKey === 0) return
    setPizzaVisible(true)
    const t = setTimeout(() => setPizzaVisible(false), 2500)
    return () => clearTimeout(t)
  }, [pizzaKey])

  useEffect(() => {
    if (pizzaNegKey === 0) return
    setPizzaNegVisible(true)
    const t = setTimeout(() => setPizzaNegVisible(false), 3000)
    return () => clearTimeout(t)
  }, [pizzaNegKey])

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

      {/* Confetti */}
      {confettiVisible && (
        <div className="confetti-wrap absolute inset-0 overflow-hidden">
          {CONFETTI_COLORS.map((color, i) => (
            <ConfettiPiece
              key={i}
              color={color}
              style={{
                left: `${(i / CONFETTI_COLORS.length) * 100}%`,
                animationDelay: `${(i * 0.1) % 0.8}s`,
                animationDuration: `${0.8 + (i % 5) * 0.15}s`,
                width: `${8 + (i % 4) * 4}px`,
                height: `${8 + (i % 3) * 4}px`,
                borderRadius: i % 3 === 0 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}
      {/* Banana rain */}
      {bananaVisible && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: EMOJI_COUNT }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 select-none"
              style={{
                left: `${(i / EMOJI_COUNT) * 100 + (i % 3) * 1.5}%`,
                fontSize: `${1.4 + (i % 4) * 0.3}rem`,
                animationName: 'confetti-fall',
                animationDuration: `${0.7 + (i % 6) * 0.18}s`,
                animationDelay: `${(i * 0.09) % 0.6}s`,
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards',
              }}
            >
              🍌
            </div>
          ))}
        </div>
      )}

      {/* Pizza rain (win) */}
      {pizzaVisible && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: EMOJI_COUNT }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 select-none"
              style={{
                left: `${(i / EMOJI_COUNT) * 100 + (i % 3) * 1.5}%`,
                fontSize: `${1.4 + (i % 4) * 0.3}rem`,
                animationName: 'confetti-fall',
                animationDuration: `${0.7 + (i % 6) * 0.18}s`,
                animationDelay: `${(i * 0.09) % 0.6}s`,
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards',
              }}
            >
              🍕
            </div>
          ))}
        </div>
      )}

      {/* Negative pizza rain (owe) */}
      {pizzaNegVisible && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-white drop-shadow-lg" style={{ animation: 'none', position: 'relative', zIndex: 1 }}>
              Negative Pizza 🍕
            </span>
          </div>
          {Array.from({ length: EMOJI_COUNT }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 select-none"
              style={{
                left: `${(i / EMOJI_COUNT) * 100 + (i % 3) * 1.5}%`,
                fontSize: `${1.4 + (i % 4) * 0.3}rem`,
                animationName: 'confetti-fall',
                animationDuration: `${0.9 + (i % 6) * 0.2}s`,
                animationDelay: `${(i * 0.1) % 0.7}s`,
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards',
                filter: 'grayscale(0.3)',
              }}
            >
              🍕
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
