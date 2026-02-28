import { SoundLibrary } from './SoundLibrary'

export function Soundboard({ user, audio, sounds, settings, uploading, uploadProgress, uploadSound, deleteSound, assignSound }) {
  return (
    <div className="card p-6 flex flex-col gap-6">
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
