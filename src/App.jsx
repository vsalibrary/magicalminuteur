import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import { useAudio } from './hooks/useAudio'
import { useUserData } from './hooks/useUserData'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { MobileNav } from './components/MobileNav'
import { Timer } from './components/Timer'
import { Soundboard } from './components/Soundboard'
import { Scoresheet } from './components/Scoresheet'
import { Overlay } from './components/Overlay'

export default function App() {
  const { user, signIn, signOut } = useAuth()
  const { timer, scores } = useSession(user?.uid || null)
  const audio = useAudio()
  const { settings, sounds, games, uploadSound, deleteSound, assignSound, saveGame, uploading, uploadProgress } =
    useUserData(user?.uid || null)
  const { theme, toggleTheme } = useTheme()

  const [activeTab, setActiveTab] = useState('timer')
  const [fiveSecKey, setFiveSecKey] = useState(0)
  const [timesUpKey, setTimesUpKey] = useState(0)
  const [confettiKey, setConfettiKey] = useState(0)

  // Sync volume from user settings
  useEffect(() => {
    if (settings?.volume != null) {
      audio.setVolume(settings.volume)
    }
  }, [settings?.volume])

  // Timer event responses
  useEffect(() => {
    if (timer.justFiveSec) {
      setFiveSecKey(k => k + 1)
      audio.playFiveSecond()
    }
  }, [timer.justFiveSec])

  useEffect(() => {
    if (timer.justFinished) {
      setTimesUpKey(k => k + 1)
      audio.playTimerEnd()
    }
  }, [timer.justFinished])

  const handleCorrect = () => {
    setConfettiKey(k => k + 1)
    timer.reset()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (timer.isRunning) timer.pause()
          else if (timer.isPaused) timer.resume()
          break
        case 'r':
        case 'R':
          timer.reset()
          break
        case '1':
          timer.start(10)
          break
        case '2':
          timer.start(20)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [timer])

  const timerPanel = (
    <Timer
      timer={timer}
      audio={audio}
      sounds={sounds}
      settings={settings}
      onCorrect={handleCorrect}
    />
  )
  const soundboardPanel = (
    <Soundboard
      user={user}
      audio={audio}
      sounds={sounds}
      settings={settings}
      uploading={uploading}
      uploadProgress={uploadProgress}
      uploadSound={uploadSound}
      deleteSound={deleteSound}
      assignSound={assignSound}
    />
  )
  const scoresheetPanel = (
    <Scoresheet
      user={user}
      games={games}
      saveGame={saveGame}
      scores={scores}
    />
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Header user={user} signIn={signIn} signOut={signOut} theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        {/* Desktop: top row (Timer | Scoresheet same height), bottom row (Soundboard full-width) */}
        <div className="hidden md:flex md:flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            {timerPanel}
            {scoresheetPanel}
          </div>
          {soundboardPanel}
        </div>

        {/* Mobile: single active panel */}
        <div className="md:hidden">
          {activeTab === 'timer' && timerPanel}
          {activeTab === 'soundboard' && soundboardPanel}
          {activeTab === 'scoresheet' && scoresheetPanel}
        </div>
      </main>

      <Footer />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <Overlay
        fiveSecKey={fiveSecKey}
        timesUpKey={timesUpKey}
        confettiKey={confettiKey}
      />
    </div>
  )
}
