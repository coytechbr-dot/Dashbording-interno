'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Trash2 } from 'lucide-react'
import { AudioPlayer } from './audio-player'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onClear: () => void
}

export function AudioRecorder({ onRecordingComplete, onClear }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onRecordingComplete(blob)
        chunksRef.current = []
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)

      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Não foi possível acessar o microfone.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const handleClear = () => {
    setAudioUrl(null)
    onClear()
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')
    return `${m}:${s}`
  }

  if (audioUrl) {
    return (
      <AudioPlayer src={audioUrl}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1.5 h-7 w-7 rounded-full shrink-0 ml-1 cursor-pointer"
          title="Excluir áudio"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </AudioPlayer>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {!isRecording ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          className="rounded-full bg-[var(--surface)] border-[var(--line2)] text-[var(--ds-muted)] gap-2 hover:bg-[var(--line)]/50 hover:text-[var(--fg)] cursor-pointer h-[32px] px-3 text-[12px]"
        >
          <Mic className="w-3.5 h-3.5 text-[var(--color-brand-orange)]" />
          Gravar Áudio
        </Button>
      ) : (
        <div className="flex items-center gap-2.5 bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[12px] font-medium font-mono">{formatTime(recordingTime)}</span>
          <button
            type="button"
            onClick={stopRecording}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1 rounded-full cursor-pointer ml-1"
            title="Parar gravação"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      )}
    </div>
  )
}
