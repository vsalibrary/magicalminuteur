import React from 'react'
import { AudioVisualizer } from './AudioVisualizer'
import { RippleButton } from './ui/RippleButton'

const ASSIGNMENT_SLOTS = [
  { key: 'slot0',     symbol: '△', label: "Soundboard △", color: '#4ade80', glow: 'rgba(74,222,128,0.4)' },
  { key: 'slot1',     symbol: '○', label: "Soundboard ○", color: '#f87171', glow: 'rgba(248,113,113,0.4)' },
  { key: 'slot2',     symbol: '×', label: "Soundboard ×", color: '#60a5fa', glow: 'rgba(96,165,250,0.4)' },
  { key: 'slot3',     symbol: '□', label: "Soundboard □", color: '#e879f9', glow: 'rgba(232,121,249,0.4)' },
  { key: 'correct',   symbol: '✓', label: "Correct",      color: '#34d399', glow: 'rgba(52,211,153,0.4)' },
  { key: 'incorrect', symbol: '✗', label: "Incorrect",    color: '#f87171', glow: 'rgba(248,113,113,0.4)' },
  { key: 'timesup',   symbol: '⏱', label: "Time's Up",   color: '#fb923c', glow: 'rgba(251,146,60,0.4)' },
]

export function SoundCard({
  sound,
  isPlaying,
  onPlay,
  onStop,
  onAssign,
  onDelete,
  bars,
  assignedSlots,
  canManage,
}) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white/90 truncate flex-1" title={sound.name}>
          {sound.name}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {isPlaying ? (
            <RippleButton
              className="btn btn-ghost text-xs px-2 py-1"
              onClick={onStop}
            >
              ■ Stop
            </RippleButton>
          ) : (
            <RippleButton
              className="btn btn-ghost text-xs px-2 py-1"
              onClick={onPlay}
            >
              ▶ Play
            </RippleButton>
          )}
          {canManage && (
            <button
              onClick={onDelete}
              className="text-white/30 hover:text-danger transition-colors text-xs p-1"
              title="Delete sound"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Visualizer */}
      <AudioVisualizer bars={isPlaying ? bars : null} />

      {/* Assignment buttons */}
      {canManage && (
        <div className="flex gap-1.5 flex-wrap">
          {ASSIGNMENT_SLOTS.map((slot, i) => {
            const active = assignedSlots?.has(slot.key)
            return (
              <React.Fragment key={slot.key}>
                {i === 4 && <div className="w-px self-stretch bg-white/10 mx-0.5" />}
                <button
                  onClick={() => onAssign(slot.key)}
                  className={`score-btn text-sm px-2 py-1 ${active ? 'score-btn-active' : ''}`}
                  style={active ? { borderColor: slot.color, boxShadow: `0 0 8px ${slot.glow}`, color: slot.color } : {}}
                  title={active ? `Remove from ${slot.label}` : `Assign to ${slot.label}`}
                >
                  {slot.symbol}
                </button>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
