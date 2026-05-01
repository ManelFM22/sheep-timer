'use client'

import { useState, useEffect, useRef } from 'react'

export default function SheepTimer() {
  const [duration, setDuration] = useState(30)
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [sheep, setSheep] = useState(0)
  const [done, setDone] = useState(false)
  const [position, setPosition] = useState<'left' | 'right'>('left')
  const [arcing, setArcing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef = useRef(0)
  const durationRef = useRef(duration)
  const positionRef = useRef<'left' | 'right'>('left')
  const [transitioning, setTransitioning] = useState(true)

  useEffect(() => {
    if (!running) return
    if (intervalRef.current) return

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1
      const elapsed = elapsedRef.current
      const remaining = durationRef.current - elapsed
      setTimeLeft(remaining)

      // Al segundo 1 de cada ciclo de 5: inicia el salto
      if (elapsed % 5 === 1) {
        const nextPos = positionRef.current === 'left' ? 'right' : 'left'
        positionRef.current = nextPos
        setArcing(true)
        setTimeout(() => setArcing(false), 3500)
        setTimeout(() => setPosition(nextPos), 100)
      }

      // Al segundo 5 de cada ciclo: cuenta la oveja
      if (elapsed % 5 === 0) {
        setSheep(s => s + 1)
      }

      if (remaining <= 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setRunning(false)
        setDone(true)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running])

  function start() {
    elapsedRef.current = 0
    durationRef.current = duration
    positionRef.current = 'left'
    setSheep(0)
    setDone(false)
    setTimeLeft(duration)
    setArcing(false)
    setRunning(false)
    setTransitioning(false)
    setPosition('left')
    setTimeout(() => {
      setTransitioning(true)
      setRunning(true)
    }, 100)
  }

  function reset() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    elapsedRef.current = 0
    positionRef.current = 'left'
    setRunning(false)
    setDone(false)
    setSheep(0)
    setTimeLeft(0)
    setPosition('left')
    setArcing(false)
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <style>{`
        @keyframes arc {
          0%   { transform: translateY(0); }
          40%  { transform: translateY(-60px); }
          100% { transform: translateY(0); }
        }
        .sheep-jumping {
          animation: arc 3.5s ease-in-out;
        }
      `}</style>

      <h1>🐑 Sheep Timer</h1>

      <div style={{ marginTop: '1rem' }}>
        <label>Duración: </label>
        <select
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          disabled={running}
        >
          {[5,10,15,20,25,30,45,60].map(n => (
            <option key={n} value={n}>{n} segundos</option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={start} disabled={running}>Start</button>
        {' '}
        <button onClick={reset}>Reset</button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <p>Tiempo restante: {timeLeft}s</p>
        <p>Ovejas saltadas: {sheep} 🐑</p>
      </div>

      <div style={{
        marginTop: '2rem',
        position: 'relative',
        width: '400px',
        height: '140px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'visible',
        background: '#f0f7e6'
      }}>
        {/* Oveja */}
        <div
          className={arcing ? 'sheep-jumping' : ''}
          style={{
            position: 'absolute',
            bottom: '30px',
            left: position === 'left' ? '10%' : '70%',
            fontSize: '2rem',
            transition: transitioning ? 'left 3.5s ease-in-out' : 'none',
            transform: position === 'right' ? 'scaleX(-1)' : 'scaleX(1)',
          }}
        >
          🐑
        </div>

        {/* Valla */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '2rem',
        }}>
          🪵
        </div>

        {/* Suelo */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '30px',
          background: '#8BC34A',
          borderTop: '2px solid #558B2F',
          borderRadius: '0 0 8px 8px'
        }} />
      </div>

      {done && (
        <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>
          ✅ Done! {sheep} sheep jumped the fence.
        </div>
      )}
    </main>
  )
}