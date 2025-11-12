'use client';

import { useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaPlay, FaStop } from 'react-icons/fa';
import { Tooltip } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/sonner';
import Spinner from '@/components/ui/spinner';

interface RecordingSectionProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSave?: (blob: Blob, durationSeconds: number) => void;
}

export default function RecordingSection({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onSave
}: RecordingSectionProps) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startRef = useRef<number>(0);
  const [internalRecording, setInternalRecording] = useState(false);
  const [internalTime, setInternalTime] = useState(0);
  const timerRef = useRef<any>(null);
  const [volume, setVolume] = useState(0);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const [bars, setBars] = useState<number[]>(Array(8).fill(2));
  const streamRef = useRef<MediaStream | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const cleanupAudio = async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try { sourceRef.current?.disconnect(); } catch {}
    try { analyserRef.current?.disconnect(); } catch {}
    sourceRef.current = null;
    analyserRef.current = null;
    // Guard against double-close
    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        await audioCtxRef.current.close();
      }
    } catch { /* noop */ }
    audioCtxRef.current = null;
    // Stop media tracks
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach(t => t.stop()); } catch {}
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      void cleanupAudio();
    };
  }, [recorder]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        void cleanupAudio();
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const durationSeconds = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));
        setInternalRecording(false);
        setInternalTime(0);
        setVolume(0);
        onStopRecording();
        if (onSave) {
          try {
            const maybePromise: any = (onSave as unknown as (b: Blob, d: number) => any)(blob, durationSeconds);
            // If consumer returns a promise, reflect saving state until finished
            if (typeof maybePromise?.then === 'function') {
              setIsSaving(true);
              (maybePromise as Promise<any>)
                .catch(() => {})
                .finally(() => setIsSaving(false));
            }
          } catch {
            // ignore sync errors, user handler will surface UI
          }
        }
      };
      rec.start();
      setRecorder(rec);
      startRef.current = Date.now();
      setInternalRecording(true);
      setInternalTime(0);
      timerRef.current = setInterval(() => {
        setInternalTime(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);

      // Setup analyser for realtime volume
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);
      const bufferLength = analyser.fftSize;
      const timeData = new Uint8Array(bufferLength);
      const freqData = new Uint8Array(256);
      const loop = () => {
        // Time domain for RMS
        analyser.getByteTimeDomainData(timeData);
        // Compute normalized RMS roughly
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeData[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / bufferLength); // ~0..1
        setVolume(rms);

        // Frequency bars (8 bands)
        analyser.getByteFrequencyData(freqData);
        const bandSize = Math.floor(freqData.length / 8);
        const nextBars: number[] = [];
        for (let b = 0; b < 8; b++) {
          let acc = 0;
          for (let i = b * bandSize; i < (b + 1) * bandSize; i++) acc += freqData[i];
          const avg = acc / bandSize; // 0..255
          nextBars.push(Math.max(2, Math.min(100, Math.round((avg / 255) * 100))));
        }
        setBars(nextBars);

        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      onStartRecording();
    } catch (e: any) {
      toast.error('Microphone permission is required to record');
      // ensure state is clean
      setInternalRecording(false);
      setInternalTime(0);
      setVolume(0);
      if (timerRef.current) clearInterval(timerRef.current);
      await cleanupAudio();
    }
  };

  const stop = () => {
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      onStopRecording();
      void cleanupAudio();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const effectiveRecording = isRecording || internalRecording;
  const effectiveTime = internalRecording ? internalTime : recordingTime;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎤 Record Baby Cry</h3>
      
      <div className="text-center">
        {effectiveRecording ? (
          <div className="space-y-4 flex items-center justify-center flex-col gap-2 mt-2">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-12 h-12 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Recording...</p>
            </div>
            {/* Volume meter */}
            <div className="w-56">
              {/* Multi-bar visualizer */}
              <div className="flex items-end gap-1 h-10">
                {bars.map((h, idx) => (
                  <div
                    key={idx}
                    className="w-4 rounded-t-sm bg-gradient-to-t from-green-500 via-yellow-400 to-red-500 transition-all"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
             
            </div>
            <button
              onClick={stop}
              className="px-6 py-3 bg-red-600 text-white flex item-center !gap-x-2 justify-center rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaStop className="" />
              Stop Recording
            </button>
          </div>
        ) : (
          <div className="space-y-4 flex items-center justify-center flex-col gap-2 mt-2">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <FaMicrophone className="text-blue-600 text-2xl" />
            </div>
            {isSaving ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-lg font-medium text-gray-900">Saving recording...</p>
                <Spinner size={28} />
                <p className="text-xs text-gray-500">Please wait</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-lg font-medium text-gray-900">Ready to Record</p>
                  <p className="text-gray-600">Tap the button when your baby starts crying</p>
                </div>
                <Tooltip content="Start recording a cry">
                  <button
                    onClick={start}
                    disabled={isSaving}
                    aria-busy={isSaving}
                    className={`px-6 py-3 bg-blue-600 flex item-center !gap-x-2 justify-center text-white rounded-lg transition-colors ${isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                  >
                    <FaPlay className="" />
                    <h1>
                    Start Recording
                    </h1>
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
