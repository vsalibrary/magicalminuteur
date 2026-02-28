import { useState } from 'react'
import { RippleButton } from './ui/RippleButton'

const R = 95
const CIRC = 2 * Math.PI * R

function getRingColor(progress) {
  const p = progress || 0
  const remaining = 100 - p
  if (remaining > 30) return '#5b4fe8'
  if (remaining > 15) return '#fbbf24'
  return '#f87171'
}

export function Timer({ timer, audio, sounds, settings, onCorrect }) {
  const { seconds, isRunning, isPaused, progress, start, pause, resume, reset } = timer
  const ringColor = getRingColor(progress)
  const offset = CIRC * (1 - (progress || 0) / 100)
  const currentVolume = Math.round((audio?.volumeRef?.current || 0.8) * 100)
  const handleVolume = (e) => audio?.setVolume(Number(e.target.value) / 100)
  const [playingButton, setPlayingButton] = useState(null)

  const handleCorrect = () => {
    if (playingButton === 'correct') {
      audio.stopCustom()
      setPlayingButton(null)
      return
    }
    if (playingButton === 'incorrect') {
      audio.stopCustom()
      setPlayingButton(null)
    }
    if (settings?.correctSoundId !== 'default') {
      const sound = sounds?.find((s) => s.id === settings?.correctSoundId)
      if (sound) {
        const { audioEl } = audio.playCustom(sound.url)
        setPlayingButton('correct')
        audioEl.addEventListener('ended', () => setPlayingButton(p => p === 'correct' ? null : p))
      } else {
        audio.playCorrect()
      }
    } else {
      audio.playCorrect()
    }
    onCorrect?.()
  }

  const handleIncorrect = () => {
    if (playingButton === 'incorrect') {
      audio.stopCustom()
      setPlayingButton(null)
      return
    }
    if (playingButton === 'correct') {
      audio.stopCustom()
      setPlayingButton(null)
    }
    if (settings?.incorrectSoundId !== 'default') {
      const sound = sounds?.find((s) => s.id === settings?.incorrectSoundId)
      if (sound) {
        const { audioEl } = audio.playCustom(sound.url)
        setPlayingButton('incorrect')
        audioEl.addEventListener('ended', () => setPlayingButton(p => p === 'incorrect' ? null : p))
      } else {
        audio.playIncorrect()
      }
    } else {
      audio.playIncorrect()
    }
  }

  return (
    <div className="card p-4 md:p-6 flex flex-col items-center gap-3 md:gap-5 h-full">
      <h2 className="section-label">Countdown Timer</h2>

      {/* SVG Ring */}
      <div className="relative">
        <svg className="w-36 h-36 md:w-[220px] md:h-[220px]" viewBox="0 0 220 220">
          {/* Background track */}
          <circle
            cx="110" cy="110" r={R}
            fill="none"
            stroke="var(--color-ring-bg)"
            strokeWidth="10"
          />
          {/* Progress ring */}
          <circle
            cx="110" cy="110" r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            transform="rotate(-90 110 110)"
            style={{
              transition: 'stroke-dashoffset 0.08s linear, stroke 0.4s ease',
            }}
          />
          {/* Seconds text */}
          <text
            x="110" y="110"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-mono"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '52px',
              fontWeight: 'bold',
              fill: ringColor,
              transition: 'fill 0.4s ease',
            }}
          >
            {seconds}
          </text>
          <text
            x="110" y="148"
            textAnchor="middle"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fill: 'var(--color-muted)',
            }}
          >
            seconds
          </text>
        </svg>
      </div>

      {/* All timer controls on one line */}
      <div className="flex gap-2 flex-wrap justify-center">
        <RippleButton className="btn btn-ghost text-sm" onClick={() => start(20)} disabled={isRunning}>20s</RippleButton>
        <RippleButton className="btn btn-ghost text-sm" onClick={() => start(10)} disabled={isRunning}>Pass Over</RippleButton>
        {!isRunning && !isPaused ? null : isPaused ? (
          <RippleButton className="btn btn-primary text-sm" onClick={resume}>Resume</RippleButton>
        ) : (
          <RippleButton className="btn btn-ghost text-sm" onClick={pause}>Pause</RippleButton>
        )}
        <RippleButton className="btn btn-ghost text-sm" onClick={reset}>Reset</RippleButton>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 w-full">
        <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--color-muted)' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
        <input type="range" min="0" max="100" defaultValue={currentVolume} onChange={handleVolume} className="flex-1 accent-accent" aria-label="Volume" />
        <svg className="w-5 h-5 shrink-0" style={{ color: 'var(--color-muted)' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </div>

      {/* Correct / Incorrect */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <RippleButton
          className="btn-action bg-success/20 hover:bg-success/30 border border-success/40 text-success font-bold py-4 md:py-8 rounded-2xl"
          onClick={handleCorrect}
        >
          <span className="text-2xl md:text-3xl mb-0.5 block">✓</span>
          <span className="text-sm md:text-lg">Correct</span>
        </RippleButton>
        <RippleButton
          className="btn-action bg-danger/20 hover:bg-danger/30 border border-danger/40 text-danger font-bold py-4 md:py-8 rounded-2xl"
          onClick={handleIncorrect}
        >
          <span className="text-2xl md:text-3xl mb-0.5 block">✗</span>
          <span className="text-sm md:text-lg">Incorrect</span>
        </RippleButton>
      </div>
    </div>
  )
}
