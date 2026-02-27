import { AudioVisualizer } from './AudioVisualizer'
import { RippleButton } from './ui/RippleButton'

export function SoundCard({
  sound,
  isPlaying,
  onPlay,
  onStop,
  onAssignCorrect,
  onAssignIncorrect,
  onDelete,
  bars,
  isCorrectAssigned,
  isIncorrectAssigned,
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
        <div className="flex gap-2">
          <button
            onClick={onAssignCorrect}
            className={`score-btn flex-1 text-xs py-1.5 ${isCorrectAssigned ? 'score-btn-active border-success' : ''}`}
            style={isCorrectAssigned ? { borderColor: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.4)' } : {}}
          >
            {isCorrectAssigned ? '✓ Correct' : 'Set as ✓'}
          </button>
          <button
            onClick={onAssignIncorrect}
            className={`score-btn flex-1 text-xs py-1.5 ${isIncorrectAssigned ? 'score-btn-active border-danger' : ''}`}
            style={isIncorrectAssigned ? { borderColor: '#f87171', boxShadow: '0 0 8px rgba(248,113,113,0.4)' } : {}}
          >
            {isIncorrectAssigned ? '✗ Wrong' : 'Set as ✗'}
          </button>
        </div>
      )}
    </div>
  )
}
