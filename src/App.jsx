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
import { AdminPage } from './components/AdminPage'

export default function App() {
  const { user, signIn, signOut } = useAuth()
  const { timer, scores } = useSession(user?.uid || null)
  const audio = useAudio()
  const { settings, sounds, games, uploadSound, deleteSound, assignSound, saveGame, deleteGame, deleteAllGames, uploading, uploadProgress, uploadError } =
    useUserData(user?.uid || null)
  const { theme, toggleTheme } = useTheme()

  const [activeTab, setActiveTab] = useState('timer')
  const [fiveSecKey, setFiveSecKey] = useState(0)
  const [timesUpKey, setTimesUpKey] = useState(0)
  const [confettiKey, setConfettiKey] = useState(0)
  const [bananaKey, setBananaKey] = useState(0)
  const [showAdmin, setShowAdmin] = useState(false)

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
      navigator.vibrate?.([400, 100, 400])
      setTimesUpKey(k => k + 1)
      const customSound = settings?.timesUpSoundId !== 'default'
        ? sounds?.find(s => s.id === settings?.timesUpSoundId)
        : null
      audio.playTimerEnd(customSound?.url)
    }
  }, [timer.justFinished])

  // Play sounds broadcast from the other device
  useEffect(() => {
    if (!timer.remoteSoundEvent) return
    const { url } = timer.remoteSoundEvent
    if (url) audio.playSimple(url)
    else audio.stopCustom()
  }, [timer.remoteSoundEvent?.key])

  const handleCorrect = () => {
    setConfettiKey(k => k + 1)
    timer.reset()
  }

  const handleRestore = (game) => {
    scores.setTeamA(game.teamA || 'Team A')
    scores.setTeamB(game.teamB || 'Team B')
    scores.restoreCells(game.cells || null)
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
      onIncorrect={() => timer.reset()}
    />
  )
  const soundboardPanel = (
    <Soundboard
      audio={audio}
      sounds={sounds}
      settings={settings}
      user={user}
      onPlay={(url) => user && timer.broadcastSound(url)}
      onStop={() => user && timer.broadcastSound(null)}
    />
  )
  const scoresheetPanel = (
    <Scoresheet
      user={user}
      saveGame={saveGame}
      scores={scores}
      onThreePoints={() => setBananaKey(k => k + 1)}
    />
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Header
        user={user}
        signIn={signIn}
        signOut={signOut}
        theme={theme}
        toggleTheme={toggleTheme}
        onAdmin={() => setShowAdmin(true)}
      />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        {/* Desktop: Timer | Scoresheet | Soundboard (narrow, vertical) */}
        <div className="hidden md:grid md:grid-cols-[1fr_1fr_128px] gap-6">
          {timerPanel}
          {scoresheetPanel}
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
        bananaKey={bananaKey}
      />

      {showAdmin && (
        <AdminPage
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
          games={games}
          onRestore={handleRestore}
          onClose={() => setShowAdmin(false)}
          deleteGame={deleteGame}
          deleteAllGames={deleteAllGames}
        />
      )}
    </div>
  )
}
