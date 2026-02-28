import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'

function randomId() { return Math.random().toString(36).slice(2, 9) }
import { db } from '../firebase/config'

const ROUNDS = [
  { id: 'r1' }, { id: 'r2' }, { id: 'r3' }, { id: 'r4' },
  { id: 'r5' }, { id: 'r6' }, { id: 'r7' }, { id: 'r8' },
  { id: 'r9' }, { id: 'r10' }, { id: 'r11' }, { id: 'r12' },
  { id: 'b1' }, { id: 'b2' }, { id: 'b3' }, { id: 'b4' },
]

function initCells() {
  const cells = {}
  ROUNDS.forEach(r => { cells[r.id] = { primary: null, passover: null } })
  return cells
}

export function useSession(uid) {
  // ── Timer state ───────────────────────────────────────────────
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [justFiveSec, setJustFiveSec] = useState(false)
  const [justFinished, setJustFinished] = useState(false)
  const [remoteSoundEvent, setRemoteSoundEvent] = useState(null)

  // ── Score state ───────────────────────────────────────────────
  const [cells, setCells] = useState(initCells)
  const [teamA, setTeamAState] = useState('Team A')
  const [teamB, setTeamBState] = useState('Team B')
  const [page, setPageState] = useState(0)

  // ── Internal refs ─────────────────────────────────────────────
  const remoteRef = useRef({})          // latest Firestore snapshot data
  const intervalRef = useRef(null)
  const fiveSecFiredRef = useRef(false)
  const finishedFiredRef = useRef(false)
  const lastStartedAtRef = useRef(null) // detect new timer start on receiving device
  const lastSoundIdRef = useRef(null)   // prevent replaying sounds sent by this device

  const sessionRef = uid && db ? doc(db, 'users', uid, 'session', 'main') : null

  // ── Firestore listener ────────────────────────────────────────
  useEffect(() => {
    if (!sessionRef) return
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      remoteRef.current = data

      if (data.cells) setCells(data.cells)
      if (data.teamA !== undefined) setTeamAState(data.teamA)
      if (data.teamB !== undefined) setTeamBState(data.teamB)
      if (data.page !== undefined) setPageState(data.page)

      // Sound sync — fire on remote device only (skip if this device sent it)
      const ps = data.pendingSound
      if (ps?.id && ps.id !== lastSoundIdRef.current) {
        lastSoundIdRef.current = ps.id
        setRemoteSoundEvent({ url: ps.url, key: Date.now() })
      }

      setIsPaused(!!data.isPaused)

      if (!data.isActive) {
        lastStartedAtRef.current = null
        setIsRunning(false)
        setIsPaused(false)
        setSeconds(0)
        setProgress(0)
        fiveSecFiredRef.current = false
        finishedFiredRef.current = false
      } else if (data.isPaused) {
        setIsRunning(false)
        setSeconds(Math.ceil(data.remainingOnPause || 0))
      } else {
        // Detect a new timer start on the receiving device and reset event guards
        const sa = data.startedAt?.toMillis ? data.startedAt.toMillis() : data.startedAt
        if (sa && sa !== lastStartedAtRef.current) {
          lastStartedAtRef.current = sa
          fiveSecFiredRef.current = false
          finishedFiredRef.current = false
        }
        setIsRunning(true)
      }
    })
    return unsub
  }, [uid])

  // ── Tick interval — runs always, reads remoteRef ──────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const data = remoteRef.current
      if (!data.isActive || data.isPaused) return

      const startedAt = data.startedAt?.toMillis ? data.startedAt.toMillis() : data.startedAt
      if (!startedAt) return
      const endsAt = startedAt + (data.originalTotal || 0) * 1000

      const remMs = Math.max(0, endsAt - Date.now())
      const remSec = Math.ceil(remMs / 1000)
      const orig = (data.originalTotal || 1) * 1000
      const prog = Math.min(100, ((orig - remMs) / orig) * 100)

      setSeconds(remSec)
      setProgress(prog)

      if (!fiveSecFiredRef.current && remSec <= 5 && remSec > 0 && (data.originalTotal || 0) > 5) {
        fiveSecFiredRef.current = true
        setJustFiveSec(true)
        requestAnimationFrame(() => setJustFiveSec(false))
      }

      if (remMs <= 0 && !finishedFiredRef.current) {
        finishedFiredRef.current = true
        setIsRunning(false)
        setJustFinished(true)
        requestAnimationFrame(() => setJustFinished(false))
        if (sessionRef) setDoc(sessionRef, { isActive: false }, { merge: true })
      }
    }, 50)
    return () => clearInterval(intervalRef.current)
  }, [uid])

  // ── Timer controls ────────────────────────────────────────────
  const start = useCallback((secs) => {
    const now = Date.now()
    // Use a local approximation in remoteRef so the interval works immediately
    const localStartedAt = { toMillis: () => now }
    remoteRef.current = { ...remoteRef.current, startedAt: localStartedAt, originalTotal: secs, isPaused: false, isActive: true, remainingOnPause: 0 }
    fiveSecFiredRef.current = false
    finishedFiredRef.current = false
    lastStartedAtRef.current = now
    setIsRunning(true)
    setIsPaused(false)
    setSeconds(secs)
    setProgress(0)
    if (sessionRef) setDoc(sessionRef, { startedAt: serverTimestamp(), originalTotal: secs, isPaused: false, isActive: true, remainingOnPause: 0 }, { merge: true })
  }, [uid])

  const pause = useCallback(() => {
    const data = remoteRef.current
    if (!data.isActive || data.isPaused) return
    const startedAt = data.startedAt?.toMillis ? data.startedAt.toMillis() : data.startedAt
    const endsAt = startedAt + (data.originalTotal || 0) * 1000
    const remaining = Math.max(0, (endsAt - Date.now()) / 1000)
    const update = { isPaused: true, remainingOnPause: remaining }
    remoteRef.current = { ...data, ...update }
    setIsRunning(false)
    setIsPaused(true)
    if (sessionRef) setDoc(sessionRef, update, { merge: true })
  }, [uid])

  const resume = useCallback(() => {
    const data = remoteRef.current
    if (!data.isPaused) return
    const now = Date.now()
    const remaining = data.remainingOnPause || 0
    const localStartedAt = { toMillis: () => now }
    remoteRef.current = { ...data, startedAt: localStartedAt, originalTotal: remaining, isPaused: false, isActive: true, remainingOnPause: 0 }
    fiveSecFiredRef.current = false
    finishedFiredRef.current = false
    lastStartedAtRef.current = now
    setIsRunning(true)
    setIsPaused(false)
    if (sessionRef) setDoc(sessionRef, { startedAt: serverTimestamp(), originalTotal: remaining, isPaused: false, isActive: true, remainingOnPause: 0 }, { merge: true })
  }, [uid])

  const reset = useCallback(() => {
    remoteRef.current = { ...remoteRef.current, isActive: false, isPaused: false }
    setIsRunning(false)
    setIsPaused(false)
    setSeconds(0)
    setProgress(0)
    fiveSecFiredRef.current = false
    finishedFiredRef.current = false
    if (sessionRef) setDoc(sessionRef, { isActive: false, isPaused: false }, { merge: true })
  }, [uid])

  // ── Score controls ────────────────────────────────────────────
  const updateCell = useCallback((roundId, field, value) => {
    setCells(prev => {
      const updated = { ...prev[roundId], [field]: value }
      if (field === 'primary' && value !== 'wrong') updated.passover = null
      const next = { ...prev, [roundId]: updated }
      if (sessionRef) setDoc(sessionRef, { cells: next }, { merge: true })
      return next
    })
  }, [uid])

  const setTeamA = useCallback((name) => {
    setTeamAState(name)
    if (sessionRef) setDoc(sessionRef, { teamA: name }, { merge: true })
  }, [uid])

  const setTeamB = useCallback((name) => {
    setTeamBState(name)
    if (sessionRef) setDoc(sessionRef, { teamB: name }, { merge: true })
  }, [uid])

  const setPage = useCallback((pageOrFn) => {
    setPageState(prev => {
      const next = typeof pageOrFn === 'function' ? pageOrFn(prev) : pageOrFn
      if (next !== prev && sessionRef) setDoc(sessionRef, { page: next }, { merge: true })
      return next
    })
  }, [uid])

  const resetCells = useCallback(() => {
    const fresh = initCells()
    setCells(fresh)
    setPageState(0)
    if (sessionRef) setDoc(sessionRef, { cells: fresh, page: 0 }, { merge: true })
  }, [uid])

  const restoreCells = useCallback((cells) => {
    setCells(cells)
    setPageState(0)
    if (sessionRef) setDoc(sessionRef, { cells, page: 0 }, { merge: true })
  }, [uid])

  const broadcastSound = useCallback((url) => {
    if (!sessionRef) return
    const id = randomId()
    lastSoundIdRef.current = id
    setDoc(sessionRef, { pendingSound: { id, url: url || null } }, { merge: true })
  }, [uid])

  const timer = { seconds, isRunning, isPaused, progress, justFiveSec, justFinished, start, pause, resume, reset, broadcastSound, remoteSoundEvent }
  const scores = { cells, teamA, teamB, page, updateCell, setTeamA, setTeamB, setPage, resetCells, restoreCells }

  return { timer, scores }
}
