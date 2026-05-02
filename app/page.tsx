'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Side = 'left' | 'right'

const ITEM_H = 52

function ScrollColumn({ values, selected, onChange, label }: {
  values: number[]
  selected: number
  onChange: (v: number) => void
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const ignoreScroll = useRef(false)
  const len = values.length
  const tripled = [...values, ...values, ...values]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    ignoreScroll.current = true
    el.scrollTop = (len + selected) * ITEM_H
    setTimeout(() => { ignoreScroll.current = false }, 100)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    ignoreScroll.current = true
    const currentSection = Math.floor(el.scrollTop / (len * ITEM_H))
    el.scrollTop = (currentSection * len + selected) * ITEM_H
    setTimeout(() => { ignoreScroll.current = false }, 100)
  }, [selected])

  function handleScroll() {
    if (ignoreScroll.current) return
    const el = ref.current
    if (!el) return
    const idx = Math.round(el.scrollTop / ITEM_H)
    const val = values[idx % len]
    onChange(val)
    if (idx < len * 0.5) {
      ignoreScroll.current = true
      el.scrollTop = idx * ITEM_H + len * ITEM_H
      setTimeout(() => { ignoreScroll.current = false }, 100)
    } else if (idx >= len * 2.5) {
      ignoreScroll.current = true
      el.scrollTop = idx * ITEM_H - len * ITEM_H
      setTimeout(() => { ignoreScroll.current = false }, 100)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>{label}</span>
      <div style={{ position: 'relative', width: 72, height: ITEM_H * 3 }}>
        <div style={{
          position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H,
          background: 'rgba(0,0,0,0.06)', borderRadius: 8, pointerEvents: 'none', zIndex: 1
        }} />
        <div
          ref={ref}
          onScroll={handleScroll}
          style={{
            height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
            scrollbarWidth: 'none', position: 'relative',
          }}
        >
          <div style={{ paddingTop: ITEM_H, paddingBottom: ITEM_H }}>
            {tripled.map((v, i) => (
              <div key={i} style={{
                height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                scrollSnapAlign: 'center', fontSize: 28, fontWeight: 500,
                color: v === selected ? '#111' : '#bbb',
                transition: 'color 0.15s',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {String(v).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const HOURS = Array.from({ length: 100 }, (_, i) => i)
const MINS = Array.from({ length: 60 }, (_, i) => i)
const SECS = Array.from({ length: 60 }, (_, i) => i)

export default function SheepTimer() {
  const [hours, setHours] = useState(0)
  const [mins, setMins] = useState(0)
  const [secs, setSecs] = useState(30)
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [sheep, setSheep] = useState(0)
  const [done, setDone] = useState(false)
  const [side, setSide] = useState<Side>('left')
  const [jumping, setJumping] = useState(false)
  const [pendingReset, setPendingReset] = useState(false)
  const [pendingStart, setPendingStart] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef = useRef(0)
  const durationRef = useRef(30)
  const sideRef = useRef<Side>('left')
  const jumpingRef = useRef(false)
  const pendingJumpRef = useRef(false)
  const activeRef = useRef(false)
  const pendingResetRef = useRef(false)
  const pendingStartRef = useRef(false)
  const pendingStartDurationRef = useRef(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const duration = hours * 3600 + mins * 60 + secs

  const doJump = useCallback(() => {
    if (!activeRef.current) return
    jumpingRef.current = true
    pendingJumpRef.current = false
    setJumping(true)
  }, [])

  function executeStart(dur: number) {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    elapsedRef.current = 0
    durationRef.current = dur
    jumpingRef.current = false
    pendingJumpRef.current = false
    pendingResetRef.current = false
    pendingStartRef.current = false
    activeRef.current = true
    setSheep(0)
    setDone(false)
    setPendingReset(false)
    setPendingStart(false)
    setTimeLeft(dur)
    setJumping(false)
    setTimeout(() => {
      setRunning(true)
      doJump()
    }, 16)
  }

  function handleVideoEnded() {
    const nextSide: Side = sideRef.current === 'left' ? 'right' : 'left'
    sideRef.current = nextSide
    setSide(nextSide)
    jumpingRef.current = false
    setSheep(s => s + 1)

    if (pendingResetRef.current) {
      pendingResetRef.current = false
      setPendingReset(false)
      setJumping(false)
      return
    }

    if (pendingStartRef.current) {
      const dur = pendingStartDurationRef.current
      setJumping(false)
      setTimeout(() => executeStart(dur), 16)
      return
    }

    if (pendingJumpRef.current && activeRef.current) {
      setJumping(false)
      setTimeout(doJump, 16)
    } else {
      setJumping(false)
    }
  }

  useEffect(() => {
    if (jumping && videoRef.current) {
      videoRef.current.load()
      videoRef.current.play()
    }
  }, [jumping])

  useEffect(() => {
    if (!running) return
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      const elapsed = elapsedRef.current
      const remaining = durationRef.current - elapsed
      setTimeLeft(remaining)
      if (elapsed % 5 === 0) {
        if (!jumpingRef.current) {
          doJump()
        } else {
          pendingJumpRef.current = true
        }
      }
      if (remaining <= 0) {
        clearInterval(timerRef.current!)
        timerRef.current = null
        activeRef.current = false
        pendingJumpRef.current = false
        setRunning(false)
        setDone(true)
      }
    }, 1000)
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [running, doJump])

  function start() {
    if (duration === 0) return
    if (jumpingRef.current) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      activeRef.current = false
      pendingJumpRef.current = false
      pendingResetRef.current = false
      pendingStartRef.current = true
      pendingStartDurationRef.current = duration
      setRunning(false)
      setPendingReset(false)
      setPendingStart(true)
      return
    }
    executeStart(duration)
  }

  function reset() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    activeRef.current = false
    pendingJumpRef.current = false
    pendingStartRef.current = false
    setPendingStart(false)
    setRunning(false)
    setDone(false)
    if (jumpingRef.current) {
      pendingResetRef.current = true
      setPendingReset(true)
    } else {
      pendingResetRef.current = false
      setSheep(0)
      setTimeLeft(0)
      setJumping(false)
    }
  }

  function handleManualJump() {
    if (!jumpingRef.current) {
      activeRef.current = true
      doJump()
    }
  }

  const idleSrc = side === 'left' ? '/sheep/FrameA.png' : '/sheep/FrameC.png'
  const videoSrc = side === 'left' ? '/sheep/jump-left.mp4' : '/sheep/jump-right.mp4'

  function formatTime(s: number) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const isStartDisabled = running || pendingReset || pendingStart
  const isJumpDisabled = jumping || pendingReset || pendingStart

  const getBtn = (id: string, active: boolean, disabled: boolean): React.CSSProperties => ({
    padding: '12px 0', fontSize: 15, fontFamily: 'monospace',
    borderRadius: 10,
    border: `1.5px solid ${hovered === id && !disabled && !active ? '#999' : '#ccc'}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500, flex: 1, letterSpacing: 1,
    transition: 'all 0.15s',
    background: active ? '#d0d0d0' : hovered === id && !disabled ? '#f0f0f0' : '#fff',
    color: active ? '#555' : disabled ? '#bbb' : '#111',
    boxShadow: active ? 'inset 0 2px 6px rgba(0,0,0,0.18)' : 'none',
    transform: active ? 'translateY(1px)' : hovered === id && !disabled ? 'translateY(-1px)' : 'none',
  })

  return (
    <main style={{
      fontFamily: 'monospace',
      maxWidth: 640,
      margin: '0 auto',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      boxSizing: 'border-box',
      width: '100%',
    }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>🐑 Sheep Timer</h1>

      <div style={{
        background: '#f5f5f5', borderRadius: 16, padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        boxSizing: 'border-box',
      }}>
        <ScrollColumn values={HOURS} selected={hours} onChange={setHours} label="horas" />
        <span style={{ fontSize: 32, fontWeight: 300, color: '#999', marginTop: 16 }}>:</span>
        <ScrollColumn values={MINS} selected={mins} onChange={setMins} label="min" />
        <span style={{ fontSize: 32, fontWeight: 300, color: '#999', marginTop: 16 }}>:</span>
        <ScrollColumn values={SECS} selected={secs} onChange={setSecs} label="seg" />
      </div>

      <div style={{ fontSize: 20, letterSpacing: 3, color: done ? '#e53' : '#333' }}>
        {running ? formatTime(timeLeft) : '00:00:00'
        }
      </div>

      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        background: '#87CEEB',
        flexShrink: 0,
      }}>
        <img
          src={idleSrc} alt="sheep idle"
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'fill',
            display: !jumping ? 'block' : 'none',
          }}
        />
        <video
          key={videoSrc} ref={videoRef}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'fill',
            display: jumping ? 'block' : 'none',
          }}
          onEnded={handleVideoEnded}
          playsInline muted preload="auto"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>

      <div style={{ display: 'flex', gap: 12, width: '100%' }}>
        <button
          onClick={start}
          disabled={isStartDisabled}
          style={getBtn('start', running || pendingStart, isStartDisabled)}
          onMouseEnter={() => setHovered('start')}
          onMouseLeave={() => setHovered(null)}
        >
          Start
        </button>
        <button
          onClick={reset}
          style={getBtn('reset', false, false)}
          onMouseEnter={() => setHovered('reset')}
          onMouseLeave={() => setHovered(null)}
        >
          Reset
        </button>
        <button
          onClick={handleManualJump}
          disabled={isJumpDisabled}
          style={getBtn('jump', jumping, isJumpDisabled)}
          onMouseEnter={() => setHovered('jump')}
          onMouseLeave={() => setHovered(null)}
        >
          Jump 🐑
        </button>
      </div>
    </main>
  )
}