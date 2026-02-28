import { SoundLibrary } from './SoundLibrary'
import { ScoreHistory } from './ScoreHistory'

export function AdminPage({ user, sounds, settings, uploading, uploadProgress, uploadSound, deleteSound, assignSound, audio, games, onRestore, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-subtle shrink-0"
        style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
      >
        <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Admin</h2>
        <button onClick={onClose} className="btn btn-ghost text-sm px-3 py-2">✕ Close</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

          {/* Sound Library */}
          <div className="card p-6">
            <SoundLibrary
              user={user}
              sounds={sounds}
              settings={settings}
              uploading={uploading}
              uploadProgress={uploadProgress}
              uploadSound={uploadSound}
              deleteSound={deleteSound}
              assignSound={assignSound}
              audio={audio}
            />
            {sounds.length >= 4 && (
              <p className="text-xs text-muted italic mt-3 text-center">Maximum 4 sounds reached. Delete one to upload another.</p>
            )}
          </div>

          {/* Past Games */}
          <div className="card p-6">
            <h3 className="section-label mb-4">Past Games</h3>
            <ScoreHistory games={games} onRestore={(game) => { onRestore(game); onClose() }} />
          </div>

        </div>
      </div>
    </div>
  )
}
