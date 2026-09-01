'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Gauge } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl?: string;
  audioBlob?: Blob;
  seekTime?: number;
}

export function AudioPlayer({ audioUrl, audioBlob, seekTime }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const speeds = [0.75, 1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setSourceUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (audioUrl) {
      setSourceUrl(audioUrl);
    }
  }, [audioBlob, audioUrl]);

  useEffect(() => {
    if (seekTime !== undefined && audioRef.current) {
      audioRef.current.currentTime = seekTime;
      if (!isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }, [seekTime]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const cycleSpeed = () => {
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!sourceUrl) return null;

  return (
    <div className="sticky bottom-4 z-20 max-w-2xl mx-auto px-4 mt-6">
      <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-700/80 flex flex-col gap-2.5">
        <audio
          ref={audioRef}
          src={sourceUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Barra de Progresso */}
        <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-300">
          <span>{formatSeconds(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span>{formatSeconds(duration)}</span>
        </div>

        {/* Controles Principais */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={cycleSpeed}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-1 transition-all active:scale-95"
              title="Velocidade de reprodução"
            >
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>{playbackRate}x</span>
            </button>
          </div>

          {/* Botões Centrais */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              title="Voltar 10 segundos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              title="Avançar 10 segundos"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
