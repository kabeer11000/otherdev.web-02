'use client'

import { useEffect, useRef } from 'react'

const BARS = [
  { w: 2, base: 0.18 },
  { w: 2, base: 0.22 },
  { w: 3, base: 0.28 },
  { w: 2, base: 0.35 },
  { w: 3, base: 0.45 },
  { w: 2, base: 0.52 },
  { w: 3, base: 0.62 },
  { w: 2, base: 0.7 },
  { w: 3, base: 0.78 },
  { w: 2, base: 0.84 },
  { w: 3, base: 0.9 },
  { w: 2, base: 0.94 },
  { w: 3, base: 0.97 },
  { w: 2, base: 0.99 },
  { w: 3, base: 1.0 },
  { w: 3, base: 1.0 },
  { w: 2, base: 0.99 },
  { w: 3, base: 0.97 },
  { w: 2, base: 0.94 },
  { w: 3, base: 0.9 },
  { w: 2, base: 0.84 },
  { w: 3, base: 0.78 },
  { w: 2, base: 0.7 },
  { w: 3, base: 0.62 },
  { w: 2, base: 0.52 },
  { w: 3, base: 0.45 },
  { w: 2, base: 0.35 },
  { w: 3, base: 0.28 },
  { w: 2, base: 0.22 },
  { w: 2, base: 0.18 },
] as const

const MIN_H = 3
const MAX_H = 32

interface VoiceWaveformProps {
  stream: MediaStream
}

export function VoiceWaveform({ stream }: VoiceWaveformProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const animRef = useRef<number>(0)

  useEffect(() => {
    let audioCtx: AudioContext | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let analyser: AnalyserNode | null = null

    try {
      audioCtx = new AudioContext()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.75
      source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
    } catch {
      return
    }

    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      animRef.current = requestAnimationFrame(tick)
      analyser?.getByteFrequencyData(data)

      barsRef.current.forEach((bar, i) => {
        if (!bar) return
        const cfg = BARS[i]
        // Sample from vocal frequency range (~85–3000 Hz, lower half of bins)
        const idx = Math.floor((i / BARS.length) * data.length * 0.55)
        const energy = data[idx] / 255
        // Modulate envelope: base shape * audio energy, with a floor so bars are always visible
        const h = MIN_H + cfg.base * energy * (MAX_H - MIN_H) + cfg.base * 4
        bar.style.height = `${h}px`
        bar.style.opacity = String(0.3 + cfg.base * 0.4 + energy * 0.3)
      })
    }

    tick()

    return () => {
      cancelAnimationFrame(animRef.current)
      source?.disconnect()
      audioCtx?.close()
    }
  }, [stream])

  return (
    <div className="flex items-center gap-2 px-1 py-2 min-h-[44px]">
      {/* Live indicator */}
      <span className="relative flex h-2 w-2 shrink-0 ml-1">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>

      {/* Waveform bars */}
      <div className="flex flex-1 items-center justify-center gap-[3px]">
        {BARS.map((cfg, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed waveform bars
            key={i}
            ref={el => {
              barsRef.current[i] = el
            }}
            className="rounded-full bg-foreground transition-[height] duration-75 ease-out"
            style={{
              width: cfg.w,
              height: MIN_H + cfg.base * 4,
              opacity: 0.3 + cfg.base * 0.4,
            }}
          />
        ))}
      </div>

      {/* Spacer matching the ping dot so bars stay centered */}
      <span className="h-2 w-2 shrink-0 mr-1" />
    </div>
  )
}
