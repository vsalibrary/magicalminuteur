import { useState, useRef, useEffect, useCallback } from 'react'

export function useTimer() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [justFiveSec, setJustFiveSec] = useState(false)
  const [justFinished, setJustFinished] = useState(false)

  const endTimeRef = useRef(null)
  const durationRef = useRef(0)
  const pausedRemRef = useRef(0)
  const fiveSecShownRef = useRef(false)
  const intervalRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const now = Date.now()
    const rem = Math.max(0, endTimeRef.current - now)
    const remSec = Math.ceil(rem / 1000)
    const dur = durationRef.current

    setSeconds(remSec)
    setProgress(dur > 0 ? ((dur - rem) / dur) * 100 : 100)

    if (!fiveSecShownRef.current && remSec <= 5 && remSec > 0 && dur > 5) {
      fiveSecShownRef.current = true
      setJustFiveSec(true)
      requestAnimationFrame(() => setJustFiveSec(false))
    }

    if (rem <= 0) {
      clearTimer()
      setIsRunning(false)
      setIsPaused(false)
      setJustFinished(true)
      requestAnimationFrame(() => setJustFinished(false))
    }
  }, [clearTimer])

  const start = useCallback((secs) => {
    clearTimer()
    const ms = secs * 1000
    durationRef.current = ms
    endTimeRef.current = Date.now() + ms
    fiveSecShownRef.current = false
    setSeconds(secs)
    setProgress(0)
    setIsRunning(true)
    setIsPaused(false)
    intervalRef.current = setInterval(tick, 50)
  }, [clearTimer, tick])

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return
    clearTimer()
    pausedRemRef.current = Math.max(0, endTimeRef.current - Date.now())
    setIsPaused(true)
    setIsRunning(false)
  }, [isRunning, isPaused, clearTimer])

  const resume = useCallback(() => {
    if (!isPaused) return
    endTimeRef.current = Date.now() + pausedRemRef.current
    durationRef.current = Math.max(durationRef.current, pausedRemRef.current)
    setIsRunning(true)
    setIsPaused(false)
    intervalRef.current = setInterval(tick, 50)
  }, [isPaused, tick])

  const reset = useCallback(() => {
    clearTimer()
    endTimeRef.current = null
    pausedRemRef.current = 0
    fiveSecShownRef.current = false
    setSeconds(0)
    setProgress(0)
    setIsRunning(false)
    setIsPaused(false)
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  return { seconds, isRunning, isPaused, progress, justFiveSec, justFinished, start, pause, resume, reset }
}
