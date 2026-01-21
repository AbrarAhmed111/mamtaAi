'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FaMicrophone, FaPlay, FaStop, FaUser } from 'react-icons/fa';
import { Tooltip } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/sonner';
import Spinner from '@/components/ui/spinner';

interface SelectedBaby {
  id: string;
  name: string;
  avatar?: string | null;
  gender?: string | null;
}

interface RecordingSectionProps {
  isRecording?: boolean; // Optional - component manages its own state if not provided
  recordingTime?: number; // Optional - component manages its own state if not provided
  onStartRecording?: () => void; // Optional - called when recording starts
  onStopRecording?: () => void; // Optional - called when recording stops
  onSave?: (blob: Blob, durationSeconds: number) => void; // Required for saving recordings
  shouldStartRecording?: boolean; // Flag to trigger actual recording start (for dashboard mode)
  selectedBaby?: SelectedBaby | null; // Selected baby info to display during recording
  babyId?: string; // Direct baby ID (for baby detail page mode)
  autoStart?: boolean; // Auto-start recording when component mounts (for direct mode)
  onProcessingStart?: (blob: Blob, durationSeconds: number) => void; // Callback when processing starts (for streaming)
}

export default function RecordingSection({
  isRecording: externalIsRecording,
  recordingTime: externalRecordingTime,
  onStartRecording,
  onStopRecording,
  onSave,
  shouldStartRecording = false,
  selectedBaby = null,
  babyId,
  autoStart = false,
  onProcessingStart
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
  const hasStartedRef = useRef<boolean>(false);
  
  // Use internal state if external state not provided
  const isRecording = externalIsRecording !== undefined ? externalIsRecording : internalRecording;
  const recordingTime = externalRecordingTime !== undefined ? externalRecordingTime : internalTime;

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
      // Only cleanup on unmount, not on recorder change
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      void cleanupAudio();
    };
  }, []); // Empty deps - only run on unmount

  // Start recording when shouldStartRecording becomes true
  useEffect(() => {
    if (shouldStartRecording && !internalRecording && !recorder && !hasStartedRef.current) {
      hasStartedRef.current = true;
      void start().then(() => {
        // Reset flag after successful start so it can be triggered again if needed
        setTimeout(() => {
          hasStartedRef.current = false;
        }, 500);
      }).catch(() => {
        // Reset flag on error
        hasStartedRef.current = false;
      });
    }
    // Reset flag when shouldStartRecording becomes false
    if (!shouldStartRecording) {
      hasStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStartRecording]);

  const start = async () => {
    // Prevent multiple simultaneous starts
    if (internalRecording || recorder) {
      return;
    }
    // If external isRecording is provided and true, also prevent start
    if (externalIsRecording !== undefined && externalIsRecording) {
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Check if stream is still active
      if (!stream.active) {
        toast.error('Microphone stream is not active');
        await cleanupAudio();
        return;
      }
      
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      
      // Handle data chunks
      rec.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      // Handle recording errors
      rec.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording error occurred');
        const currentRecorder = rec;
        if (currentRecorder && currentRecorder.state !== 'inactive') {
          try {
            currentRecorder.stop();
          } catch (e) {
            // Ignore errors
          }
        }
      };
      
      // Handle stop event
      rec.onstop = async () => {
        hasStartedRef.current = false; // Reset flag when recording stops
        if (timerRef.current) clearInterval(timerRef.current);
        void cleanupAudio();
        const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const durationSeconds = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));
        setInternalRecording(false);
        setInternalTime(0);
        setVolume(0);
        setRecorder(null);
        onStopRecording?.();
        
        // If onProcessingStart is provided, use streaming API
        if (onProcessingStart) {
          try {
            // Convert WebM to WAV on frontend to avoid backend format issues
            const { convertWebMToWAV } = await import('@/utils/audioConverter');
            const wavBlob = await convertWebMToWAV(webmBlob);
            onProcessingStart(wavBlob, durationSeconds);
          } catch (e) {
            console.error('Error converting or starting processing:', e);
            toast.error('Failed to process audio');
            // Fallback: try with original WebM blob
            try {
              onProcessingStart(webmBlob, durationSeconds);
            } catch (e2) {
              console.error('Fallback also failed:', e2);
            }
          }
        } else if (onSave) {
          // Fallback to regular save
          try {
            const maybePromise: any = (onSave as unknown as (b: Blob, d: number) => any)(webmBlob, durationSeconds);
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
      
      // Start recording
      rec.start(1000); // Collect data every second
      setRecorder(rec);
      startRef.current = Date.now();
      setInternalRecording(true);
      setInternalTime(0);
      // Notify parent that recording has started
      if (onStartRecording) {
        onStartRecording();
      }
      
      // Start timer
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

      // Notify parent that recording has actually started
      onStartRecording?.();
    } catch (e: any) {
      console.error('Recording start error:', e);
      toast.error(e.message || 'Microphone permission is required to record');
      // ensure state is clean
      setInternalRecording(false);
      setInternalTime(0);
      setVolume(0);
      setRecorder(null);
      if (timerRef.current) clearInterval(timerRef.current);
      await cleanupAudio();
    }
  };

  const stop = () => {
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch (e) {
        console.error('Error stopping recorder:', e);
        onStopRecording?.();
        void cleanupAudio();
      }
    } else {
      onStopRecording?.();
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
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 bg-gradient-to-br from-white to-pink-50/20">
      <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">🎤 Record Baby Cry</h3>
      
      <div className="text-center">
        {effectiveRecording ? (
          <div className="space-y-4 flex items-center justify-center flex-col gap-2 mt-2">
            {selectedBaby ? (
              <div className="relative w-24 h-24 rounded-full mx-auto ring-4 ring-red-200 ring-offset-2 animate-pulse">
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
                <div
                  className={`relative w-full h-full rounded-full overflow-hidden border-4 border-red-500 flex items-center justify-center ${
                    selectedBaby.gender === 'male'
                      ? 'bg-blue-50'
                      : selectedBaby.gender === 'female'
                      ? 'bg-pink-50'
                      : 'bg-gray-50'
                  }`}
                >
                  {selectedBaby.avatar ? (
                    <Image
                      src={selectedBaby.avatar}
                      alt={selectedBaby.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <FaUser
                      className={`text-3xl ${
                        selectedBaby.gender === 'male'
                          ? 'text-blue-300'
                          : selectedBaby.gender === 'female'
                          ? 'text-pink-300'
                          : 'text-gray-300'
                      }`}
                    />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <div className="w-12 h-12 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
            <div>
              <p className="text-lg font-medium text-gray-900">
                {selectedBaby ? `Recording ${selectedBaby.name}'s cry...` : 'Recording...'}
              </p>
              {selectedBaby && (
                <p className="text-sm text-gray-500 mt-1">Keep the microphone close to your baby</p>
              )}
            </div>
            {/* Volume meter */}
            <div className="w-56 mx-auto">
              {/* Multi-bar visualizer */}
              <div className="flex items-end justify-center gap-1 h-10">
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
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white flex item-center !gap-x-2 justify-center rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              <FaStop className="" />
              Stop Recording
            </button>
          </div>
        ) : (
          <div className="space-y-4 flex items-center justify-center flex-col gap-2 mt-2">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto border-2 border-pink-200">
              <FaMicrophone className="text-pink-600 text-2xl" />
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
                    onClick={() => {
                      // If onStartRecording is provided (dashboard mode), call it first
                      // Otherwise, start recording directly (direct mode)
                      if (onStartRecording) {
                        onStartRecording();
                      } else {
                        void start();
                      }
                    }}
                    disabled={isSaving}
                    aria-busy={isSaving}
                    className={`px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 flex item-center !gap-x-2 justify-center text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold ${isSaving ? 'opacity-60 cursor-not-allowed transform-none' : 'hover:from-pink-600 hover:to-rose-600'}`}
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
