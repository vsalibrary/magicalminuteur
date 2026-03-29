import { useState, useEffect, lazy, Suspense } from 'react'
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
const AdminPage = lazy(() => import('./components/AdminPage').then(m => ({ default: m.AdminPage })))
const EndGameSummary = lazy(() => import('./components/EndGameSummary').then(m => ({ default: m.EndGameSummary })))
const QRModal = lazy(() => import('./components/QRModal').then(m => ({ default: m.QRModal })))

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
  const [showAdmin, setShowAdmin] = useState(false)
  const [showEndGame, setShowEndGame] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

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
      onThreePoints={(team) => timer.broadcastBanana(team)}
      onFinishGame={() => { setShowEndGame(true); timer.broadcastEndGame(true) }}
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
        onQR={() => setShowQR(true)}
      />

      {!isOnline && (
        <div className="text-center text-xs py-2 font-medium" style={{ backgroundColor: '#fef2f2', color: '#dc2626', borderBottom: '1px solid #fecaca' }}>
          Offline — changes won't sync until reconnected
        </div>
      )}

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
      />

      {showAdmin && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {showEndGame && (
        <Suspense fallback={null}>
          <EndGameSummary
            scores={scores}
            saveGame={saveGame}
            user={user}
            onSpinStateChange={timer.broadcastSpinState}
            onClose={() => { setShowEndGame(false); timer.broadcastEndGame(false); timer.broadcastSpinState(null) }}
            onBananaRain={() => {}}
            onPizzaRain={() => {}}
            onNegativePizzaRain={() => {}}
          />
        </Suspense>
      )}

      {showQR && (
        <Suspense fallback={null}>
          <QRModal onClose={() => setShowQR(false)} />
        </Suspense>
      )}
    </div>
  )
}
