import { useRef, useState, useEffect, useMemo } from 'react'
import { SoundCard } from './SoundCard'
import { ConfirmDialog } from './ui/ConfirmDialog'

export function SoundLibrary({ user, sounds, settings, uploading, uploadProgress, uploadError, uploadSound, deleteSound, assignSound, audio }) {
  const fileInputRef = useRef(null)
  const [playingId, setPlayingId] = useState(null)
  const [analyserNode, setAnalyserNode] = useState(null)
  const [analyserBars, setAnalyserBars] = useState(new Float32Array(30).fill(0))
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, storagePath }
  const stopRef = useRef(null)
  const rafRef = useRef(null)

  // Microphone recording state
  const [recordState, setRecordState] = useState(null) // null | 'requesting' | 'recording' | 'preview'
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedName, setRecordedName] = useState('')
  const [recordError, setRecordError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordTimerRef = useRef(null)

  const previewUrl = useMemo(
    () => (recordedBlob ? URL.createObjectURL(recordedBlob) : null),
    [recordedBlob]
  )
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const startRecording = async () => {
    setRecordState('requesting')
    setRecordError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      setRecordingSeconds(0)
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setRecordedBlob(blob)
        setRecordState('preview')
        clearInterval(recordTimerRef.current)
      }
      recorder.start()
      setRecordState('recording')
      recordTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)
    } catch {
      setRecordState(null)
      setRecordError('Microphone access denied.')
    }
  }

  const stopRecording = () => mediaRecorderRef.current?.stop()

  const discardRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecordState(null)
    setRecordedBlob(null)
    setRecordedName('')
    clearInterval(recordTimerRef.current)
  }

  const saveRecording = async () => {
    const name = (recordedName.trim() || 'recording')
    const ext = recordedBlob.type.includes('ogg') ? 'ogg' : recordedBlob.type.includes('mp4') ? 'mp4' : 'webm'
    const file = new File([recordedBlob], `${name}.${ext}`, { type: recordedBlob.type })
    setRecordState(null)
    setRecordedBlob(null)
    setRecordedName('')
    await uploadSound(file)
  }

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
          <div className="flex gap-2">
            <button
              className="btn btn-ghost text-sm"
              onClick={startRecording}
              disabled={uploading || !!recordState}
              title="Record from microphone"
            >
              🎤 Record
            </button>
            <button
              className="btn btn-primary text-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !!recordState}
            >
              {uploading ? 'Uploading...' : '+ Upload'}
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg,audio/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Microphone recording UI */}
      {recordState === 'requesting' && (
        <div className="card p-4 text-center text-sm text-muted">Requesting microphone…</div>
      )}
      {recordState === 'recording' && (
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-danger animate-pulse" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Recording… {recordingSeconds}s
            </span>
            <div className="flex gap-2 ml-auto">
              <button className="btn btn-danger text-sm px-3 py-1.5" onClick={stopRecording}>Stop</button>
              <button className="btn btn-ghost text-sm px-3 py-1.5" onClick={discardRecording}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {recordState === 'preview' && (
        <div className="card p-4 flex flex-col gap-3">
          <p className="text-xs text-muted">Preview &amp; save your recording</p>
          {previewUrl && <audio controls src={previewUrl} className="w-full" />}
          <input
            type="text"
            value={recordedName}
            onChange={e => setRecordedName(e.target.value)}
            placeholder="Recording name…"
            className="bg-subtle border border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            style={{ color: 'var(--color-text)' }}
          />
          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost text-sm px-3 py-1.5" onClick={discardRecording}>Discard</button>
            <button
              className="btn btn-primary text-sm px-3 py-1.5"
              onClick={saveRecording}
              disabled={uploading}
            >
              {uploading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
      {recordError && <p className="text-xs text-danger text-center">{recordError}</p>}

      {/* Upload error */}
      {uploadError && (
        <p className="text-xs text-danger text-center">{uploadError}</p>
      )}

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
            settings?.ambientSoundId   === sound.id && 'ambient',
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
