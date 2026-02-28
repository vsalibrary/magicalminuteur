import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, setDoc, onSnapshot, serverTimestamp, deleteField } from 'firebase/firestore'
import { db } from '../firebase/config'

function randomId() { return Math.random().toString(36).slice(2, 9) }

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
  const remoteRef = useRef({})
  const intervalRef = useRef(null)
  const fiveSecFiredRef = useRef(false)
  const finishedFiredRef = useRef(false)
  const lastStartedAtRef = useRef(null)
  const lastSoundIdRef = useRef(null)
  // Clock calibration: offset such that Date.now() + clockOffsetRef.current ≈ server time
  const clockOffsetRef = useRef(0)
  const calibWriteSentAt = useRef(null)  // local time when calibration write was sent
  const calibNonce = useRef(null)        // nonce to match our own calibration write

  const sessionRef = uid && db ? doc(db, 'users', uid, 'session', 'main') : null

  // Returns an approximation of current server time, corrected for clock drift
  const serverNow = () => Date.now() + clockOffsetRef.current

  // ── Firestore listener + clock calibration ────────────────────
  useEffect(() => {
    if (!sessionRef) return

    // Write a calibration timestamp so we can measure clock offset on receipt
    const nonce = randomId()
    calibNonce.current = nonce
    calibWriteSentAt.current = Date.now()
    setDoc(sessionRef, { _calibId: nonce, _calibAt: serverTimestamp() }, { merge: true })

    const unsub = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      remoteRef.current = data

      // Clock calibration: once we get our own calibration write confirmed by server,
      // compute offset = serverTime + propagation - localNow.
      // We only accept our own nonce so stale data doesn't corrupt the offset.
      if (!snap.metadata.hasPendingWrites &&
          data._calibId === calibNonce.current &&
          data._calibAt?.toMillis &&
          calibWriteSentAt.current) {
        const serverCalib = data._calibAt.toMillis()
        const localNow = Date.now()
        const rtt = localNow - calibWriteSentAt.current
        // offset = (serverCalib + propagation) - localNow, propagation ≈ rtt/2
        clockOffsetRef.current = serverCalib + Math.round(rtt / 2) - localNow
        calibWriteSentAt.current = null  // calibrated, no need to recalibrate
      }

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

      // Use server-calibrated time so all devices agree on remaining time
      const now = serverNow()
      const remMs = Math.max(0, endsAt - now)
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
    const localStartedAt = { toMillis: () => now }
    remoteRef.current = { ...remoteRef.current, startedAt: localStartedAt, originalTotal: secs, isPaused: false, isActive: true, remainingOnPause: 0 }
    fiveSecFiredRef.current = false
    finishedFiredRef.current = false
    lastStartedAtRef.current = now
    setIsRunning(true)
    setIsPaused(false)
    setSeconds(secs)
    setProgress(0)
    if (sessionRef) setDoc(sessionRef, {
      startedAt: serverTimestamp(),
      originalTotal: secs,
      isPaused: false,
      isActive: true,
      remainingOnPause: 0,
      endsAt: deleteField(),  // remove legacy field
    }, { merge: true })
  }, [uid])

  const pause = useCallback(() => {
    const data = remoteRef.current
    if (!data.isActive || data.isPaused) return
    const startedAt = data.startedAt?.toMillis ? data.startedAt.toMillis() : data.startedAt
    const endsAt = startedAt + (data.originalTotal || 0) * 1000
    const remaining = Math.max(0, (endsAt - serverNow()) / 1000)
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
    if (sessionRef) setDoc(sessionRef, {
      startedAt: serverTimestamp(),
      originalTotal: remaining,
      isPaused: false,
      isActive: true,
      remainingOnPause: 0,
      endsAt: deleteField(),
    }, { merge: true })
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
