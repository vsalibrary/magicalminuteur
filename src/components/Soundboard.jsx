import { SoundLibrary } from './SoundLibrary'

export function Soundboard({ user, audio, sounds, settings, uploading, uploadProgress, uploadSound, deleteSound, assignSound }) {
  const handleVolume = (e) => {
    audio.setVolume(Number(e.target.value) / 100)
  }

  const currentVolume = Math.round((audio.volumeRef.current || 0.8) * 100)

  return (
    <div className="card p-6 flex flex-col gap-6">
      {/* Volume slider */}
      <div className="flex items-center gap-3">
        <svg className="w-4 h-4 text-white/50 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue={currentVolume}
          onChange={handleVolume}
          className="flex-1 accent-accent"
          aria-label="Volume"
        />
        <svg className="w-5 h-5 text-white/50 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </div>

      {/* Sound Library */}
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
    </div>
  )
}
