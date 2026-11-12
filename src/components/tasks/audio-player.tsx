'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  children?: React.ReactNode
}

export function AudioPlayer({ src, children }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | undefined>(undefined)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Usa requestAnimationFrame para a barra de progresso rodar suavemente a 60 FPS
  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime)
        rafRef.current = requestAnimationFrame(updateProgress)
      }
    }

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress)
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying])

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00'
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')
    return `${m}:${s}`
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || duration === 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div className="flex items-center gap-2 bg-[var(--surface)] px-2.5 py-1.5 rounded-full border border-[var(--line2)] w-full max-w-[280px]">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
          }
        }}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(duration)
        }}
        className="hidden"
      />

      <button
        type="button"
        onClick={togglePlay}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--color-brand-orange)] text-[#141414] shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center px-1">
        <div className="flex items-center justify-between text-[10px] text-[var(--ds-muted)] font-mono mb-[2px] leading-none cursor-default select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div
          className="w-full h-3 flex items-center cursor-pointer group"
          onClick={handleSeek}
          ref={progressRef}
        >
          <div className="w-full h-1 bg-[var(--line)] rounded-full overflow-hidden relative group-hover:h-1.5 transition-all">
            <div
              className="absolute top-0 left-0 h-full bg-[var(--color-brand-orange)] pointer-events-none transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
