import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
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

      setIsPaused(!!data.isPaused)

      if (!data.isActive) {
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

      const endsAt = data.endsAt?.toMillis ? data.endsAt.toMillis() : data.endsAt
      if (!endsAt) return

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
    const endsAt = new Date(Date.now() + secs * 1000)
    const update = { endsAt, originalTotal: secs, isPaused: false, isActive: true, remainingOnPause: 0 }
    remoteRef.current = { ...remoteRef.current, ...update }
    fiveSecFiredRef.current = false
    finishedFiredRef.current = false
    setIsRunning(true)
    setIsPaused(false)
    setSeconds(secs)
    setProgress(0)
    if (sessionRef) setDoc(sessionRef, update, { merge: true })
  }, [uid])

  const pause = useCallback(() => {
    const data = remoteRef.current
    if (!data.isActive || data.isPaused) return
    const endsAt = data.endsAt?.toMillis ? data.endsAt.toMillis() : data.endsAt
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
    const endsAt = new Date(Date.now() + (data.remainingOnPause || 0) * 1000)
    const update = { isPaused: false, endsAt, remainingOnPause: 0 }
    remoteRef.current = { ...data, ...update }
    setIsRunning(true)
    setIsPaused(false)
    if (sessionRef) setDoc(sessionRef, update, { merge: true })
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

  const timer = { seconds, isRunning, isPaused, progress, justFiveSec, justFinished, start, pause, resume, reset }
  const scores = { cells, teamA, teamB, page, updateCell, setTeamA, setTeamB, setPage, resetCells }

  return { timer, scores }
}
