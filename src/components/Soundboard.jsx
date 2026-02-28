import { useState } from 'react'

const PS_SLOTS = [
  { symbol: '△', color: '#4ade80', activeBg: 'rgba(74,222,128,0.15)', activeBorder: 'rgba(74,222,128,0.4)' },
  { symbol: '○', color: '#f87171', activeBg: 'rgba(248,113,113,0.15)', activeBorder: 'rgba(248,113,113,0.4)' },
  { symbol: '×', color: '#60a5fa', activeBg: 'rgba(96,165,250,0.15)', activeBorder: 'rgba(96,165,250,0.4)' },
  { symbol: '□', color: '#e879f9', activeBg: 'rgba(232,121,249,0.15)', activeBorder: 'rgba(232,121,249,0.4)' },
]

const DEFAULT_SLOTS = [
  { id: 'default-fanfare',     name: 'Fanfare',     url: '/sounds/fanfare.mp3' },
  { id: 'default-cheer',       name: 'Cheer',       url: '/sounds/cheer.mp3' },
  { id: 'default-wow',         name: 'Wow',         url: '/sounds/Wow.mp3' },
  { id: 'default-sadtrombone', name: 'Sad Trombone', url: '/sounds/sadtrombone.mp3' },
]

export function Soundboard({ audio, sounds, user }) {
  const [playingSlot, setPlayingSlot] = useState(null)

  const handleSlot = (idx) => {
    const sound = sounds[idx] || DEFAULT_SLOTS[idx]
    if (!sound) return
    if (playingSlot === idx) {
      audio.stopCustom()
      setPlayingSlot(null)
      return
    }
    audio.stopCustom()
    const { audioEl } = audio.playCustom(sound.url)
    setPlayingSlot(idx)
    audioEl.addEventListener('ended', () => setPlayingSlot(s => s === idx ? null : s))
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <h2 className="section-label text-center">Soundboard</h2>
      <div className="grid grid-cols-4 md:grid-cols-1 gap-3">
        {PS_SLOTS.map((slot, idx) => {
          const sound = sounds[idx] || DEFAULT_SLOTS[idx]
          const isPlaying = playingSlot === idx
          return (
            <button
              key={idx}
              onClick={() => handleSlot(idx)}
              className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{
                background: isPlaying ? slot.activeBg : 'var(--color-hover)',
                border: `2px solid ${isPlaying ? slot.activeBorder : 'var(--color-border)'}`,
              }}
            >
              <span className="text-3xl md:text-4xl leading-none font-light select-none" style={{ color: slot.color }}>{slot.symbol}</span>
              <span className="text-[10px] text-muted truncate w-full text-center px-1 leading-tight">{sound.name}</span>
            </button>
          )
        })}
      </div>
      {!user && (
        <p className="text-xs text-muted italic text-center pt-1 border-t border-subtle mt-1">
          Log in to upload your own sounds
        </p>
      )}
    </div>
  )
}
