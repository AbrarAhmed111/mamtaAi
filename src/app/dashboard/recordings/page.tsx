'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { FaPlay, FaStop, FaTrash, FaBaby, FaFilter, FaSearch, FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa';
import BabySelectionModal from '@/components/Dashboard/BabySelectionModal';
import RecordingSection from '@/components/Dashboard/RecordingSection';

interface Recording {
  id: string;
  fileUrl: string;
  durationSeconds: number | null;
  recordedAt: string;
  babyId: string;
  babyName: string;
  babyAvatar: string | null;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBabyFilter, setSelectedBabyFilter] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [babies, setBabies] = useState<Array<{ id: string; name: string }>>([]);
  const [babiesForModal, setBabiesForModal] = useState<Array<{ id: string; name: string; age: string; avatar: string }>>([]);
  const [showSelectBaby, setShowSelectBaby] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadRecordings();
    loadBabies();
  }, []);

  useEffect(() => {
    filterRecordings();
  }, [recordings, searchQuery, selectedBabyFilter]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recordings', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || 'Failed to load recordings');
        return;
      }
      const items = (json.items || []) as Recording[];
      setRecordings(items);
      setFilteredRecordings(items);
    } catch (error) {
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const loadBabies = async () => {
    try {
      const res = await fetch('/api/babies', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      const babyList = (json.babies || []).map((b: any) => ({
        id: b.id,
        name: b.name,
      }));
      setBabies(babyList);
      
      // Format babies for modal (with age and avatar)
      const babiesForModalList = (json.babies || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        age: formatAge(b.birth_date),
        avatar: b.avatar_url || '/api/placeholder/64/64',
      }));
      setBabiesForModal(babiesForModalList);
    } catch (error) {
      // Silently fail - babies filter is optional
    }
  };

  const formatAge = (birthDateISO: string): string => {
    try {
      if (!birthDateISO) return '';
      const bd = new Date(birthDateISO);
      const now = new Date();
      const months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
      if (months <= 0) return 'Newborn';
      if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
      const years = Math.floor(months / 12);
      const remMonths = months % 12;
      return remMonths ? `${years}y ${remMonths}m` : `${years}y`;
    } catch {
      return '';
    }
  };

  const filterRecordings = () => {
    let filtered = [...recordings];

    // Filter by baby
    if (selectedBabyFilter !== 'all') {
      filtered = filtered.filter(r => r.babyId === selectedBabyFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.babyName.toLowerCase().includes(query) ||
          formatDate(r.recordedAt).toLowerCase().includes(query)
      );
    }

    setFilteredRecordings(filtered);
  };

  const handlePlay = (recording: Recording) => {
    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    if (playingId === recording.id) {
      // If clicking the same recording, stop it
      setPlayingId(null);
      return;
    }

    // Create or get audio element
    if (!audioRefs.current[recording.id]) {
      const audio = new Audio(recording.fileUrl);
      audioRefs.current[recording.id] = audio;
      audio.onended = () => {
        setPlayingId(null);
      };
      audio.onerror = () => {
        toast.error('Failed to play recording');
        setPlayingId(null);
      };
    }

    const audio = audioRefs.current[recording.id];
    audio.play();
    setPlayingId(recording.id);
  };

  const handleStop = () => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingId(null);
  };

  const handleDelete = async (recordingId: string) => {
    if (showDeleteConfirm !== recordingId) {
      setShowDeleteConfirm(recordingId);
      return;
    }

    try {
      setDeletingId(recordingId);
      // Stop playback if this recording is playing
      if (playingId === recordingId) {
        handleStop();
      }
      
      const res = await fetch(`/api/recordings/${recordingId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to delete');
      }

      toast.success('Recording deleted');
      setShowDeleteConfirm(null);
      await loadRecordings();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete recording');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return dateString;
    }
  };

  const formatFullDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Recordings
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all your baby cry recordings
          </p>
        </div>
        <button
          onClick={() => {
            if (babiesForModal.length === 0) {
              toast.error('Please add a baby first');
              router.push('/dashboard/babies/add-baby');
              return;
            }
            if (babiesForModal.length === 1) {
              // Auto-select if only one baby
              setSelectedBabyId(babiesForModal[0].id);
              setShowRecordingModal(true);
            } else {
              // Show selection modal if multiple babies
              setShowSelectBaby(true);
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <FaBaby />
          Record New
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-pink-100 p-4 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-pink-200 bg-pink-50/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all"
            />
          </div>

          {/* Baby Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedBabyFilter}
                onChange={(e) => setSelectedBabyFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-pink-200 bg-pink-50/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all appearance-none"
              >
                <option value="all">All Babies</option>
                {babies.map((baby) => (
                  <option key={baby.id} value={baby.id}>
                    {baby.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          {filteredRecordings.length === recordings.length ? (
            <span>{recordings.length} recording{recordings.length === 1 ? '' : 's'}</span>
          ) : (
            <span>
              Showing {filteredRecordings.length} of {recordings.length} recording{recordings.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

      {/* Recordings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-pink-100 p-4">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="bg-white rounded-xl border border-pink-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBaby className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {recordings.length === 0 ? 'No recordings yet' : 'No recordings found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {recordings.length === 0
              ? 'Start recording your baby\'s cries to see them here.'
              : 'Try adjusting your filters to find what you\'re looking for.'}
          </p>
          {recordings.length === 0 && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FaBaby />
              Record Your First Cry
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecordings.map((recording) => {
            const isPlaying = playingId === recording.id;
            const isDeleting = deletingId === recording.id;
            const showConfirm = showDeleteConfirm === recording.id;

            return (
              <div
                key={recording.id}
                className="bg-white rounded-xl border border-pink-100 p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Baby Avatar */}
                  <Link href={`/dashboard/babies/${recording.babyId}`}>
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pink-200 flex-shrink-0 cursor-pointer hover:border-pink-400 transition-colors">
                      <Image
                        src={recording.babyAvatar || '/api/placeholder/64/64'}
                        alt={recording.babyName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </Link>

                  {/* Recording Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/babies/${recording.babyId}`}
                          className="text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors"
                        >
                          {recording.babyName}
                        </Link>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-pink-500" />
                            <span>{formatDate(recording.recordedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FaClock className="text-pink-500" />
                            <span>{formatDuration(recording.durationSeconds)}</span>
                          </div>
                        </div>
                        {showConfirm && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800 font-medium mb-2">
                              Are you sure you want to delete this recording?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDelete(recording.id)}
                                disabled={isDeleting}
                                className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isPlaying ? (
                          <button
                            onClick={handleStop}
                            className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg"
                            title="Stop playback"
                          >
                            <FaStop className="text-sm" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePlay(recording)}
                            className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg"
                            title="Play recording"
                          >
                            <FaPlay className="text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(recording.id)}
                          disabled={isDeleting || showConfirm}
                          className="p-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete recording"
                        >
                          {isDeleting ? (
                            <Spinner size={16} />
                          ) : (
                            <FaTrash className="text-sm" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Audio Player (hidden, controlled programmatically) */}
                    {isPlaying && (
                      <div className="mt-3 text-xs text-gray-500">
                        Playing: {formatFullDate(recording.recordedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }          )}
        </div>
      )}

      {/* Baby Selection Modal */}
      <BabySelectionModal
        isOpen={showSelectBaby}
        babies={babiesForModal}
        selectedBabyId={selectedBabyId}
        onSelectBaby={(babyId) => setSelectedBabyId(babyId)}
        onConfirm={() => {
          if (!selectedBabyId) {
            toast.error('Please select a baby');
            return;
          }
          setShowSelectBaby(false);
          setShowRecordingModal(true);
        }}
        onCancel={() => {
          setShowSelectBaby(false);
          setSelectedBabyId(null);
        }}
        onAddBaby={() => {
          setShowSelectBaby(false);
          router.push('/dashboard/babies/add-baby');
        }}
        isLoading={false}
      />

      {/* Recording Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Record Baby Cry</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedBabyId && babiesForModal.find(b => b.id === selectedBabyId)?.name
                    ? `Recording for ${babiesForModal.find(b => b.id === selectedBabyId)?.name}`
                    : 'Select a baby to record'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRecordingModal(false);
                  setSelectedBabyId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Recording Section */}
            <div className="p-6">
              <RecordingSection
                selectedBaby={selectedBabyId ? babiesForModal.find(b => b.id === selectedBabyId) || null : null}
                babyId={selectedBabyId || undefined}
                onSave={async (blob, durationSeconds) => {
                  if (!selectedBabyId) {
                    toast.error('Please select a baby first');
                    return;
                  }
                  try {
                    const fd = new FormData();
                    fd.append('file', blob, `recording_${Date.now()}.webm`);
                    fd.append('baby_id', selectedBabyId);
                    fd.append('duration_seconds', String(durationSeconds || 0));
                    const res = await fetch('/api/recordings', { method: 'POST', body: fd });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      toast.error(json?.error || 'Failed to save recording');
                      return;
                    }
                    toast.success('Recording saved successfully');
                    setShowRecordingModal(false);
                    setSelectedBabyId(null);
                    await loadRecordings();
                  } catch (error) {
                    toast.error('Failed to save recording');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
