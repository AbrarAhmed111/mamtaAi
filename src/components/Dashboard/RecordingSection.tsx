'use client';

import { FaMicrophone, FaPlay, FaStop } from 'react-icons/fa';

interface RecordingSectionProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function RecordingSection({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording
}: RecordingSectionProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎤 Record Baby Cry</h3>
      
      <div className="text-center">
        {isRecording ? (
          <div className="space-y-4 flex items-center justify-center flex-col gap-2 mt-2">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-12 h-12 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Recording...</p>
              <p className="text-2xl font-mono text-red-600">{formatTime(recordingTime)}</p>
            </div>
            <button
              onClick={onStopRecording}
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
            <div>
              <p className="text-lg font-medium text-gray-900">Ready to Record</p>
              <p className="text-gray-600">Tap the button when your baby starts crying</p>
            </div>
            <button
              onClick={onStartRecording}
              className="px-6 py-3 bg-blue-600 flex item-center !gap-x-2 justify-center text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlay className="" />
              <h1>

              Start Recording
              </h1>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
