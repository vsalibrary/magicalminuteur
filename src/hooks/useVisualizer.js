import { useState, useEffect, useRef } from 'react'

export function useVisualizer(analyserNode) {
  const [bars, setBars] = useState(() => new Float32Array(30).fill(0))
  const rafRef = useRef(null)

  useEffect(() => {
    if (!analyserNode) {
      setBars(new Float32Array(30).fill(0))
      return
    }

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount)

    const loop = () => {
      analyserNode.getByteFrequencyData(dataArray)
      const out = new Float32Array(30)
      for (let i = 0; i < 30; i++) {
        out[i] = dataArray[i] / 255
      }
      setBars(out)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [analyserNode])

  return bars
}
