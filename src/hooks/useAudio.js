import { useRef, useCallback } from 'react'

let sharedCtx = null
let sharedGain = null
let sharedVolume = 0.8
let currentCustomAudio = null

// Preload default sounds so they play instantly on first press
const PRELOAD_URLS = ['/sounds/correct.mp3', '/sounds/incorrect.mp3', '/sounds/timesup.mp3',
  '/sounds/fanfare.mp3', '/sounds/cheer.mp3', '/sounds/Wow.mp3', '/sounds/sadtrombone.mp3']
const preloaded = {}
function ensurePreloaded() {
  PRELOAD_URLS.forEach(url => {
    if (!preloaded[url]) {
      const el = new Audio(url)
      el.preload = 'auto'
      preloaded[url] = el
    }
  })
}

function playFile(url, fallback) {
  try {
    if (currentCustomAudio) {
      currentCustomAudio.pause()
      currentCustomAudio.currentTime = 0
      currentCustomAudio = null
    }
    // Reuse preloaded element if available for instant playback; otherwise create new
    const audioEl = preloaded[url] || new Audio(url)
    audioEl.currentTime = 0
    audioEl.volume = sharedVolume
    currentCustomAudio = audioEl

    let didFallback = false
    const tryFallback = () => {
      if (didFallback) return
      didFallback = true
      if (currentCustomAudio === audioEl) currentCustomAudio = null
      fallback?.()
    }

    audioEl.addEventListener('error', tryFallback)
    audioEl.addEventListener('ended', () => {
      if (currentCustomAudio === audioEl) currentCustomAudio = null
    })
    const p = audioEl.play()
    if (p && p.catch) p.catch(tryFallback)
  } catch {
    fallback?.()
  }
}

function playCorrectSynth() {
  const { ctx, gain } = getCtx()
  const t = ctx.currentTime
  ;[523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.3, t + 0.02 + i * 0.03)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    osc.connect(env); env.connect(gain)
    osc.start(t + i * 0.03); osc.stop(t + 0.7)
  })
}

function playIncorrectSynth() {
  const { ctx, gain } = getCtx()
  const t = ctx.currentTime
  ;[300, 220].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, t + i * 0.15)
    osc.frequency.linearRampToValueAtTime(freq * 0.7, t + i * 0.15 + 0.3)
    env.gain.setValueAtTime(0.4, t + i * 0.15)
    env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.35)
    osc.connect(env); env.connect(gain)
    osc.start(t + i * 0.15); osc.stop(t + i * 0.15 + 0.4)
  })
}

function playTimerEndSynth() {
  const { ctx, gain } = getCtx()
  const t = ctx.currentTime
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 220
    env.gain.setValueAtTime(0.5, t + i * 0.3)
    env.gain.setValueAtTime(0.5, t + i * 0.3 + 0.22)
    env.gain.linearRampToValueAtTime(0, t + i * 0.3 + 0.3)
    osc.connect(env); env.connect(gain)
    osc.start(t + i * 0.3); osc.stop(t + i * 0.3 + 0.3)
  }
}

function getCtx() {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)()
    sharedGain = sharedCtx.createGain()
    sharedGain.connect(sharedCtx.destination)
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume()
  }
  return { ctx: sharedCtx, gain: sharedGain }
}

export function useAudio() {
  const volumeRef = useRef(0.8)
  // Kick off preloading on first render (requires no user gesture for audio loading, only for play)
  ensurePreloaded()

  const setVolume = useCallback((v) => {
    volumeRef.current = v
    sharedVolume = v
    if (sharedGain) {
      sharedGain.gain.setTargetAtTime(v, sharedCtx.currentTime, 0.01)
    }
  }, [])

  const playCorrect = useCallback(() => { playFile('/sounds/correct.mp3', playCorrectSynth) }, [])
  const playIncorrect = useCallback(() => { playFile('/sounds/incorrect.mp3', playIncorrectSynth) }, [])
  const playTimerEnd = useCallback(() => { playFile('/sounds/timesup.mp3', playTimerEndSynth) }, [])

  const playFiveSecond = useCallback(() => {
    const { ctx, gain } = getCtx()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    env.gain.setValueAtTime(0.3, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    osc.connect(env)
    env.connect(gain)
    osc.start(t)
    osc.stop(t + 0.4)
  }, [])

  const playBeep = useCallback(() => {
    const { ctx, gain } = getCtx()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 440
    env.gain.setValueAtTime(0.2, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    osc.connect(env)
    env.connect(gain)
    osc.start(t)
    osc.stop(t + 0.15)
  }, [])

  const stopCustom = useCallback(() => {
    if (currentCustomAudio) {
      currentCustomAudio.pause()
      currentCustomAudio.currentTime = 0
      currentCustomAudio = null
    }
  }, [])

  // Simple playback without Web Audio — for soundboard buttons (fast, iOS-compatible)
  const playSimple = useCallback((url) => {
    if (currentCustomAudio) {
      currentCustomAudio.pause()
      currentCustomAudio.currentTime = 0
      currentCustomAudio = null
    }
    const audioEl = preloaded[url] || new Audio(url)
    audioEl.currentTime = 0
    audioEl.volume = sharedVolume
    currentCustomAudio = audioEl
    audioEl.play().catch(console.error)
    audioEl.addEventListener('ended', () => {
      if (currentCustomAudio === audioEl) currentCustomAudio = null
    })
    return {
      audioEl,
      stop: () => {
        audioEl.pause()
        audioEl.currentTime = 0
        if (currentCustomAudio === audioEl) currentCustomAudio = null
      },
    }
  }, [])

  const playCustom = useCallback((url) => {
    if (currentCustomAudio) {
      currentCustomAudio.pause()
      currentCustomAudio.currentTime = 0
      currentCustomAudio = null
    }

    const { ctx, gain } = getCtx()
    const audioEl = new Audio()
    audioEl.crossOrigin = 'anonymous'
    audioEl.src = url
    currentCustomAudio = audioEl

    const source = ctx.createMediaElementSource(audioEl)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64

    source.connect(analyser)
    analyser.connect(gain)

    audioEl.play().catch(console.error)
    audioEl.addEventListener('ended', () => {
      if (currentCustomAudio === audioEl) currentCustomAudio = null
    })

    return {
      analyser,
      stop: () => {
        audioEl.pause()
        audioEl.currentTime = 0
        if (currentCustomAudio === audioEl) currentCustomAudio = null
      },
      audioEl,
    }
  }, [])

  return { volumeRef, setVolume, playCorrect, playIncorrect, playTimerEnd, playFiveSecond, playBeep, playCustom, playSimple, stopCustom }
}
