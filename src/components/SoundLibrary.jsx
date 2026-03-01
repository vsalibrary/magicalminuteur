import { useRef, useState } from 'react'
import { SoundCard } from './SoundCard'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { useVisualizer } from '../hooks/useVisualizer'

function PlayingSoundVisualizer({ analyser }) {
  const bars = useVisualizer(analyser)
  return bars
}

export function SoundLibrary({ user, sounds, settings, uploading, uploadProgress, uploadSound, deleteSound, assignSound, audio }) {
  const fileInputRef = useRef(null)
  const [playingId, setPlayingId] = useState(null)
  const [analyserNode, setAnalyserNode] = useState(null)
  const [analyserBars, setAnalyserBars] = useState(new Float32Array(30).fill(0))
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, storagePath }
  const stopRef = useRef(null)
  const rafRef = useRef(null)

  const handlePlay = (sound) => {
    // Stop current
    if (stopRef.current) {
      stopRef.current()
      stopRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const { analyser, stop, audioEl } = audio.playCustom(sound.url)
    setPlayingId(sound.id)
    setAnalyserNode(analyser)
    stopRef.current = stop

    // Start visualizer loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const loop = () => {
      analyser.getByteFrequencyData(dataArray)
      const out = new Float32Array(30)
      for (let i = 0; i < 30; i++) out[i] = dataArray[i] / 255
      setAnalyserBars(new Float32Array(out))
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    audioEl.onended = () => {
      setPlayingId(null)
      setAnalyserNode(null)
      setAnalyserBars(new Float32Array(30).fill(0))
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      stopRef.current = null
    }
  }

  const handleStop = () => {
    if (stopRef.current) {
      stopRef.current()
      stopRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setPlayingId(null)
    setAnalyserNode(null)
    setAnalyserBars(new Float32Array(30).fill(0))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await uploadSound(file)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    if (playingId === deleteTarget.id) handleStop()
    await deleteSound(deleteTarget.id, deleteTarget.storagePath)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-label">Sound Library</h3>
        {user && (
          <button
            className="btn btn-primary text-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg,audio/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Guest prompt */}
      {!user && (
        <p className="text-sm text-muted italic text-center py-2">
          Sign in to upload and manage your own sounds.
        </p>
      )}

      {/* Sound cards */}
      {sounds.length === 0 && user && (
        <p className="text-sm text-muted italic text-center py-2">
          No sounds uploaded yet. Click &quot;+ Upload&quot; to add your first sound.
        </p>
      )}

      <div className="space-y-3">
        {sounds.map((sound) => {
          const assignedSlots = new Set([
            settings?.correctSoundId   === sound.id && 'correct',
            settings?.incorrectSoundId === sound.id && 'incorrect',
            settings?.timesUpSoundId   === sound.id && 'timesup',
            settings?.soundboardSlot0  === sound.id && 'slot0',
            settings?.soundboardSlot1  === sound.id && 'slot1',
            settings?.soundboardSlot2  === sound.id && 'slot2',
            settings?.soundboardSlot3  === sound.id && 'slot3',
          ].filter(Boolean))
          return (
            <SoundCard
              key={sound.id}
              sound={sound}
              isPlaying={playingId === sound.id}
              onPlay={() => handlePlay(sound)}
              onStop={handleStop}
              onAssign={(slotKey) => assignSound(slotKey, assignedSlots.has(slotKey) ? 'default' : sound.id)}
              onDelete={() => setDeleteTarget({ id: sound.id, storagePath: sound.storagePath })}
              bars={playingId === sound.id ? analyserBars : null}
              assignedSlots={assignedSlots}
              canManage={!!user}
            />
          )
        })}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message="Delete this sound? This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
