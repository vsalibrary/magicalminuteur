import { useState } from 'react'
import { SoundLibrary } from './SoundLibrary'
import { ScoreHistory } from './ScoreHistory'
import { ConfirmDialog } from './ui/ConfirmDialog'

export function AdminPage({ user, sounds, settings, uploading, uploadProgress, uploadError, uploadSound, deleteSound, assignSound, audio, games, onRestore, onClose, deleteGame, deleteAllGames }) {
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div
        className="flex items-center justify-between px-4 pb-3 border-b border-subtle shrink-0"
        style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
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
              uploadError={uploadError}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-label">Past Games</h3>
              {games?.length > 0 && (
                <button
                  onClick={() => setDeleteAllConfirm(true)}
                  className="btn btn-ghost text-xs px-2 py-1"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Delete All
                </button>
              )}
            </div>
            <ScoreHistory games={games} onRestore={setRestoreTarget} onDelete={deleteGame} />
          </div>

        </div>
      </div>

      {restoreTarget && (
        <ConfirmDialog
          message={`Restore "${restoreTarget.teamA} vs ${restoreTarget.teamB}"? Your current game will be replaced.`}
          onConfirm={() => { onRestore(restoreTarget); onClose(); setRestoreTarget(null) }}
          onCancel={() => setRestoreTarget(null)}
        />
      )}

      {deleteAllConfirm && (
        <ConfirmDialog
          message="Delete all saved games? This cannot be undone."
          onConfirm={() => { deleteAllGames(games); setDeleteAllConfirm(false) }}
          onCancel={() => setDeleteAllConfirm(false)}
        />
      )}
    </div>
  )
}
