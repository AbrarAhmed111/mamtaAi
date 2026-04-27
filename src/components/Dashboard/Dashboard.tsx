'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast, Toaster } from '@/components/ui/sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { FaBaby, FaCamera, FaUsers, FaPlay, FaStop, FaPause, FaUser } from 'react-icons/fa';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import WelcomeChecklist from './WelcomeChecklist';
import RecordingSection from './RecordingSection';
import BabyProfiles from './BabyProfiles';
import BabySelectionModal from './BabySelectionModal';
import ProcessingProgress from './ProcessingProgress';
// import BadgesSection from './BadgesSection';
import QuickActions from './QuickActions';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  action: string;
  loading?: boolean;
}

// Badge system removed

interface Baby {
  id: string;
  name: string;
  age: string;
  avatar?: string | null;
  gender?: string | null;
  lastCry: Date;
  totalCries: number;
}

interface DashboardProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  currentPath?: string;
  onSignOut?: () => void;
  role?: string | null;
  onboardingCompleted?: boolean | null;
}

export default function Dashboard({ 
  user = { name: 'Sarah Johnson', role: 'Parent' },
  currentPath = '/dashboard',
  onSignOut,
  role,
  onboardingCompleted
}: DashboardProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'add-baby',
      title: 'Add Baby Profile',
      description: 'Complete your baby\'s profile with photos and details',
      completed: false,
      icon: FaBaby,
      action: 'Complete Profile'
    },
    {
      id: 'first-cry',
      title: 'Record First Cry',
      description: 'Record your baby\'s cry to get AI-powered insights',
      completed: false,
      icon: FaCamera,
      action: 'Record Cry'
    },
    {
      id: 'join-community',
      title: 'Join Community',
      description: 'Connect with other parents and get expert advice',
      completed: false,
      icon: FaUsers,
      action: 'Join Now'
    }
  ]);

  // Badges removed

  const [babies, setBabies] = useState<Baby[]>([]);
  const [babiesLoading, setBabiesLoading] = useState(false);
  /** After first /api/babies resolution for parents — avoids flashing “add baby” while list is still empty */
  const [babiesListResolved, setBabiesListResolved] = useState(false);
  const [showSelectBaby, setShowSelectBaby] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);
  const [shouldStartRecording, setShouldStartRecording] = useState(false);
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [adding, setAdding] = useState(false);
  const [babyName, setBabyName] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [babyGender, setBabyGender] = useState<'male' | 'female' | ''>('');
  const [babyWeightKg, setBabyWeightKg] = useState<string>('');
  const [babyHeightCm, setBabyHeightCm] = useState<string>('');
  const [babyBloodType, setBabyBloodType] = useState<string>('');
  const [babyNotes, setBabyNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [dobError, setDobError] = useState<string>('');
  const [weightError, setWeightError] = useState<string>('');
  const [heightError, setHeightError] = useState<string>('');
  const [bloodError, setBloodError] = useState<string>('');
  const [babyRelationship, setBabyRelationship] = useState<'' | 'mother' | 'father' | 'guardian' | 'caregiver' | 'grandparent' | 'other'>('');
  const [relationshipError, setRelationshipError] = useState<string>('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [hasBaby, setHasBaby] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [hasCommunity, setHasCommunity] = useState(false);
  const [recentRecs, setRecentRecs] = useState<Array<{ id: string; fileUrl: string; durationSeconds: number | null; recordedAt: string; babyId: string; babyName: string; babyAvatar?: string | null; babyGender?: string | null }>>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [showProcessingProgress, setShowProcessingProgress] = useState(false);
  const [processingAudio, setProcessingAudio] = useState<{ blob: Blob; durationSeconds: number } | null>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<{ recordingsToday: number; minutesToday: number; avgConfidenceToday: number; urgentToday: number } | null>(null);

  useEffect(() => {
    // Points and badges removed
  }, [checklist, babies]);

  const effectiveRole = (role ?? user.role ?? '').toLowerCase();
  const isParent = effectiveRole === 'parent';
  const isRoleUnset = !effectiveRole || (effectiveRole !== 'parent' && effectiveRole !== 'expert');
  const isOnboardingIncomplete = onboardingCompleted === false;

  const loadBabies = useCallback(async () => {
    if (!isParent) {
      setBabiesListResolved(true);
      return;
    }
    setBabiesListResolved(false);
    try {
      setBabiesLoading(true);
      const res = await fetch('/api/babies', { cache: 'no-store' });
      if (!res.ok) {
        setBabies([]);
        return;
      }
      const json = await res.json();
      const dbBabies = (json.babies || []) as Array<{
        id: string;
        name: string;
        birth_date: string;
        avatar_url?: string | null;
        gender?: string | null;
      }>;
      const mapped: Baby[] = dbBabies.map(b => ({
        id: b.id,
        name: b.name,
        age: formatAge(b.birth_date),
        avatar: b.avatar_url || null,
        gender: b.gender || null,
        lastCry: new Date(),
        totalCries: 0,
      }));
      setBabies(mapped);
    } finally {
      setBabiesLoading(false);
      setBabiesListResolved(true);
    }
  }, [isParent]);

  useEffect(() => {
    void loadBabies();
  }, [loadBabies]);

  // Fetch dynamic checklist stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const res = await fetch('/api/user/stats', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        setHasBaby(Boolean(json?.hasBaby));
        setHasRecording(Boolean(json?.hasRecording));
        setHasCommunity(Boolean(json?.hasCommunity));
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const loadDailyStats = async () => {
      try {
        const res = await fetch('/api/insights', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;
        if (json?.overview) {
          setDailyStats(json.overview);
        }
      } catch {
        // ignore optional card failure
      }
    };
    void loadDailyStats();
  }, []);

  // Apply stats to checklist items
  useEffect(() => {
    setChecklist(prev =>
      prev.map(item => {
        if (item.id === 'add-baby') return { ...item, completed: hasBaby, loading: statsLoading };
        if (item.id === 'first-cry') return { ...item, completed: hasRecording, loading: statsLoading };
        if (item.id === 'join-community') return { ...item, completed: hasCommunity, loading: statsLoading };
        return { ...item, loading: statsLoading };
      }),
    );
  }, [hasBaby, hasRecording, hasCommunity, statsLoading]);

  const loadRecentRecordings = async () => {
    try {
      setRecentLoading(true);
      const res = await fetch('/api/recordings', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      const allRecordings = Array.isArray(json?.items) ? json.items : [];
      // Limit to latest 5 recordings for dashboard display
      setRecentRecs(allRecordings.slice(0, 5));
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    void loadRecentRecordings();
  }, []);

  function formatAge(birthDateISO: string): string {
    try {
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
  }

  const completeChecklistItem = (itemId: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === itemId && !item.completed) {
        return { ...item, completed: true };
      }
      return item;
    }));
  };

  const startRecording = () => {
    // Trigger actual recording start in RecordingSection
    // RecordingSection will set isRecording internally when recording actually starts
    setShouldStartRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    // Do not auto-complete checklist on stop; completion is driven by saved recording (stats)
    setIsRecording(false);
    setShouldStartRecording(false); // Reset flag when stopping
    setRecordingTime(0);
    // Reset selectedBabyId so modal appears again next time (allows selecting different baby)
    setSelectedBabyId(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    if (hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  const handleChecklistAction = (itemId: string) => {
    if (itemId === 'first-cry') {
      if (!isParent) {
        toast.error('Only parents can record cries.');
        return;
      }
      if (isOnboardingIncomplete || isRoleUnset) {
        toast.error('Please complete onboarding first.');
        return;
      }
      if (babies.length === 0) {
        setSelectedBabyId(null);
        setShowSelectBaby(true);
        return;
      }
      if (babies.length === 1) {
        setSelectedBabyId(babies[0].id);
        startRecording();
        return;
      }
      if (!selectedBabyId) setSelectedBabyId(babies[0].id);
      setShowSelectBaby(true);
      return;
    }
    completeChecklistItem(itemId);
  };

  const handleAddBaby = () => {
    if (!isParent) {
      toast.error('Only parents can add babies. Please select Parent as your role.');
      return;
    }
    router.push('/dashboard/babies/add-baby');
  };

  const handleBabyClick = (baby: any) => {
    // TODO: Implement baby click functionality
    console.log('Baby clicked:', baby);
  };

  const handleNotificationClick = () => {
    // TODO: Implement notification functionality
    console.log('Notifications clicked');
  };

  const handleSettingsClick = () => {
    // TODO: Implement settings functionality
    console.log('Settings clicked');
  };

  const handleActionClick = (action: string) => {
    // TODO: Implement action click functionality
    console.log('Action clicked:', action);
  };

  const handleStartRecording = () => {
    // Don't show baby selection if recording is already in progress or baby is already selected
    if (isRecording || shouldStartRecording) {
      return; // Recording already started, don't interfere
    }
    if (selectedBabyId) {
      // Baby already selected, just start recording
      startRecording();
      return;
    }
    if (babies.length === 0) {
      toast.error('Please add your baby first.');
      setShowSelectBaby(false);
      return;
    }
    if (babies.length === 1) {
      setSelectedBabyId(babies[0].id);
      startRecording();
      return;
    }
    if (!selectedBabyId) setSelectedBabyId(babies[0].id);
    setShowSelectBaby(true);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handlePlayRecording = (recording: { id: string; fileUrl: string; babyName: string }) => {
    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    if (playingRecordingId === recording.id) {
      // If clicking the same recording, stop it
      setPlayingRecordingId(null);
      return;
    }

    // Create or get audio element
    if (!audioRefs.current[recording.id]) {
      const audio = new Audio(recording.fileUrl);
      audioRefs.current[recording.id] = audio;
      audio.onended = () => {
        setPlayingRecordingId(null);
      };
      audio.onerror = () => {
        toast.error('Failed to play recording');
        setPlayingRecordingId(null);
      };
    }

    const audio = audioRefs.current[recording.id];
    audio.play();
    setPlayingRecordingId(recording.id);
  };

  const handleStopRecording = () => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingRecordingId(null);
  };

  // Cleanup: tear down all HTMLAudioElements we created (must read .current at unmount, not mount)
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: latest audio map on unmount only
      const audios = audioRefs.current;
      Object.values(audios).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  return (
    <>
     
        {isParent && !babiesListResolved && (
          <div className="mt-4 mb-4 rounded-xl border border-pink-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-64 max-w-full" />
                <Skeleton className="h-3 w-full max-w-xl" />
              </div>
              <Skeleton className="h-10 w-32 shrink-0 rounded-xl" />
            </div>
          </div>
        )}

        {(isRoleUnset ||
          isOnboardingIncomplete ||
          (isParent && babiesListResolved && babies.length === 0)) &&
          !(isParent && !babiesListResolved) && (
          <div className=" mt-4 mb-4">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {isRoleUnset
                      ? 'Please choose your role (Parent or Expert).'
                      : 'Please add at least one baby to continue.'}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {isRoleUnset
                      ? 'This helps us tailor the dashboard to your needs.'
                      : 'Add a baby to start tracking and get personalized insights.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isRoleUnset && (
                    <Link
                      href="/dashboard/babies/add-baby"
                      onClick={handleAddBaby}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Add Baby
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily overview card (top of overview page) */}
        <section className="mb-4">
          <div className="bg-white rounded-xl border border-pink-100 p-4 sm:p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Today&apos;s Overview</h3>
            <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg bg-pink-50 px-3 py-2">
                <div className="text-xs text-gray-500">Recordings</div>
                <div className="text-lg font-bold text-gray-900">{dailyStats?.recordingsToday ?? 0}</div>
              </div>
              <div className="rounded-lg bg-pink-50 px-3 py-2">
                <div className="text-xs text-gray-500">Cry Minutes</div>
                <div className="text-lg font-bold text-gray-900">{dailyStats?.minutesToday ?? 0}m</div>
              </div>
              <div className="rounded-lg bg-pink-50 px-3 py-2">
                <div className="text-xs text-gray-500">Avg Confidence</div>
                <div className="text-lg font-bold text-gray-900">{dailyStats?.avgConfidenceToday ?? 0}%</div>
              </div>
              <div className="rounded-lg bg-red-50 px-3 py-2">
                <div className="text-xs text-gray-500">Urgent Alerts</div>
                <div className="text-lg font-bold text-red-600">{dailyStats?.urgentToday ?? 0}</div>
              </div>
            </div>
          </div>
        </section>
        
        <BabySelectionModal
          isOpen={showSelectBaby}
          babies={babies}
          selectedBabyId={selectedBabyId}
          onSelectBaby={(babyId) => setSelectedBabyId(babyId)}
          onConfirm={() => {
            if (!selectedBabyId) {
              toast.error('Please select a baby');
              return;
            }
            setShowSelectBaby(false);
            startRecording();
          }}
          onCancel={() => setShowSelectBaby(false)}
          onAddBaby={handleAddBaby}
          isLoading={babiesLoading}
        />

        <div className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
              <WelcomeChecklist
                checklist={checklist}
                onItemAction={handleChecklistAction}
              />
          </div>
              
              {isParent && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <RecordingSection
                  onStartRecording={() => {
                    // This callback is called:
                    // 1. When user clicks "Start Recording" button (before recording starts)
                    // 2. After recording actually starts (line 220 in RecordingSection)
                    // 
                    // We need to trigger baby selection on first click, but not after recording starts
                    // Check if we're already in the process of starting (shouldStartRecording) or already recording
                    if (shouldStartRecording || isRecording) {
                      // Recording is already starting/started, just confirm state
                      setIsRecording(true);
                      return;
                    }
                    // User clicked the button - trigger baby selection flow
                    handleStartRecording();
                  }}
                  onStopRecording={stopRecording}
                  shouldStartRecording={shouldStartRecording}
                  selectedBaby={selectedBabyId ? babies.find(b => b.id === selectedBabyId) || null : null}
                  onProcessingStart={(blob, durationSeconds) => {
                    const targetBabyId = selectedBabyId || (babies[0]?.id || null);
                    if (!targetBabyId) {
                      toast.error('Please add/select a baby first');
                      return;
                    }
                    setProcessingAudio({ blob, durationSeconds });
                    setShowProcessingProgress(true);
                  }}
                />
            </div>
          )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* BadgesSection removed */}
              <QuickActions onActionClick={handleActionClick} />
              {isParent && (
                babiesLoading ? (
                  <div className="bg-white rounded-xl p-6 border border-gray-100 text-gray-600">
                    <div className="flex items-center gap-3">
                      <Spinner size={20} />
                      <span>Loading babies...</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ) : babies.length > 0 ? (
                  <BabyProfiles
                    babies={babies}
                    onAddBaby={handleAddBaby}
                    onBabyClick={handleBabyClick}
                  />
                ) : (
                  <div className="bg-white rounded-xl p-6 border border-dashed border-gray-200 text-center">
                    <p className="text-gray-700 font-medium">No babies added yet</p>
                    <p className="text-gray-500 text-sm mt-1">Add your baby to start tracking and getting insights.</p>
                    <Link
                      href="/dashboard/babies/add-baby"
                      onClick={handleAddBaby}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Add Baby
                    </Link>
                  </div>
                )
              )}

          {/* Recent recordings */}
          <div className="bg-white rounded-2xl border border-pink-100 p-5 bg-gradient-to-br from-white to-pink-50/20">
            <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">Your Baby Recordings</h3>
            {recentLoading ? (
              <div className="text-gray-600 text-sm">Loading recordings...</div>
            ) : recentRecs.length === 0 ? (
              <div className="text-gray-600 text-sm">No recordings yet.</div>
            ) : (
              <ul className="space-y-3">
                {recentRecs.map(r => {
                  const isPlaying = playingRecordingId === r.id;
                  const avatarBgClass =
                    r.babyGender === 'male'
                      ? 'bg-blue-50'
                      : r.babyGender === 'female'
                      ? 'bg-pink-50'
                      : 'bg-gray-50';
                  const avatarIconClass =
                    r.babyGender === 'male'
                      ? 'text-blue-400'
                      : r.babyGender === 'female'
                      ? 'text-pink-400'
                      : 'text-gray-400';
                  return (
                    <li key={r.id} className="flex items-center justify-between text-sm p-3 rounded-lg hover:bg-pink-50/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full overflow-hidden border-2 border-pink-200 flex-shrink-0 flex items-center justify-center ${avatarBgClass}`}>
                          {r.babyAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.babyAvatar} alt={r.babyName} className="w-full h-full object-cover" />
                          ) : (
                            <FaUser className={`text-sm ${avatarIconClass}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{r.babyName}</div>
                          <div className="text-gray-600 text-xs">
                            {new Date(r.recordedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })} • {r.durationSeconds ? `${Math.floor(r.durationSeconds / 60)}:${String(Math.floor(r.durationSeconds % 60)).padStart(2, '0')}` : '—'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => isPlaying ? handleStopRecording() : handlePlayRecording(r)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 flex-shrink-0"
                        title={isPlaying ? 'Stop playback' : 'Play recording'}
                      >
                        {isPlaying ? (
                          <FaStop className="text-xs" />
                        ) : (
                          <FaPlay className="text-xs ml-0.5" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
            </div>
          </div>
        </div>
      {showAddBaby && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-gray-900">Add Baby</h3>
            <p className="text-sm text-gray-600 mt-1">Provide your baby&apos;s basic details.</p>
            {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={babyName}
                  onChange={e => {
                    setBabyName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  onBlur={() => {
                    if (!babyName.trim()) setNameError('Name is required');
                  }}
                  placeholder="e.g., Ayaan"
                />
                {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Birth Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={babyBirthDate}
                  onChange={e => {
                    setBabyBirthDate(e.target.value);
                    if (dobError) setDobError('');
                  }}
                  onBlur={() => {
                    if (!babyBirthDate) {
                      setDobError('Birth date is required');
                      return;
                    }
                    const birth = new Date(babyBirthDate);
                    if (Number.isNaN(birth.getTime())) {
                      setDobError('Invalid birth date');
                      return;
                    }
                    const now = new Date();
                    const diffMs = now.getTime() - birth.getTime();
                    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
                    if (diffMs < 0) {
                      setDobError('Birth date cannot be in the future');
                      return;
                    }
                    if (diffMs > oneYearMs) {
                      setDobError('We currently support babies up to 12 months old');
                      return;
                    }
                  }}
                />
                {dobError && <p className="text-xs text-red-600 mt-1">{dobError}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Gender</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={babyGender}
                  onChange={e => setBabyGender(e.target.value as 'male' | 'female' | '')}
                >
                  <option value="">Select gender (optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Your relationship to the baby</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={babyRelationship}
                  onChange={e => {
                    setBabyRelationship(e.target.value as any);
                    if (relationshipError) setRelationshipError('');
                  }}
                  onBlur={() => {
                    if (!babyRelationship) setRelationshipError('Please select your relationship');
                  }}
                >
                  <option value="">Select relationship</option>
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="guardian">Guardian</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="other">Other</option>
                </select>
                {relationshipError && <p className="text-xs text-red-600 mt-1">{relationshipError}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Birth Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={babyWeightKg}
                    onChange={e => {
                      setBabyWeightKg(e.target.value);
                      if (weightError) setWeightError('');
                    }}
                    onBlur={() => {
                      if (babyWeightKg !== '') {
                        const n = Number(babyWeightKg);
                        if (Number.isNaN(n) || n < 0 || n > 20) {
                          setWeightError('Weight must be between 0 and 20 kg');
                        }
                      }
                    }}
                    placeholder="e.g., 3.2"
                  />
                  {weightError && <p className="text-xs text-red-600 mt-1">{weightError}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Birth Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="80"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={babyHeightCm}
                    onChange={e => {
                      setBabyHeightCm(e.target.value);
                      if (heightError) setHeightError('');
                    }}
                    onBlur={() => {
                      if (babyHeightCm !== '') {
                        const n = Number(babyHeightCm);
                        if (Number.isNaN(n) || n < 20 || n > 80) {
                          setHeightError('Height must be between 20 and 80 cm');
                        }
                      }
                    }}
                    placeholder="e.g., 50"
                  />
                  {heightError && <p className="text-xs text-red-600 mt-1">{heightError}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Blood Type</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={babyBloodType}
                  onChange={e => {
                    setBabyBloodType(e.target.value);
                    if (bloodError) setBloodError('');
                  }}
                  onBlur={() => {
                    if (babyBloodType && !['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(babyBloodType)) {
                      setBloodError('Invalid blood type');
                    }
                  }}
                >
                  <option value="">Select blood type (optional)</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {bloodError && <p className="text-xs text-red-600 mt-1">{bloodError}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Medical Notes</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                  maxLength={500}
                  value={babyNotes}
                  onChange={e => setBabyNotes(e.target.value)}
                  placeholder="Optional notes (max 500 chars)"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddBaby(false);
                  setBabyName('');
                  setBabyBirthDate('');
                  setBabyGender('');
                  setBabyWeightKg('');
                  setBabyHeightCm('');
                  setBabyBloodType('');
                  setBabyNotes('');
                  setBabyRelationship('');
                  setFormError('');
                  setNameError('');
                  setDobError('');
                  setWeightError('');
                  setHeightError('');
                  setBloodError('');
                  setRelationshipError('');
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                disabled={adding}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setFormError('');
                  // Block submit if any field currently invalid; do not set new errors here
                  if (!babyName.trim() || !babyBirthDate || !babyRelationship || nameError || dobError || weightError || heightError || bloodError || relationshipError) {
                    return;
                  }
                  try {
                    setAdding(true);
                    const res = await fetch('/api/babies', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: babyName.trim(),
                        birth_date: babyBirthDate,
                        gender: babyGender || undefined,
                        birth_weight_kg: babyWeightKg !== '' ? Number(babyWeightKg) : undefined,
                        birth_height_cm: babyHeightCm !== '' ? Number(babyHeightCm) : undefined,
                        blood_type: babyBloodType || undefined,
                        medical_notes: babyNotes || undefined,
                        relationship: babyRelationship,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setFormError(data?.error || 'Failed to add baby');
                      return;
                    }
                    toast.success('Baby added successfully');
                    setShowAddBaby(false);
                    setBabyName('');
                    setBabyBirthDate('');
                    setBabyGender('');
                    setBabyWeightKg('');
                    setBabyHeightCm('');
                    setBabyBloodType('');
                    setBabyNotes('');
                    setBabyRelationship('');
                    await loadBabies();
                  } catch (e: any) {
                    setFormError('Failed to add baby');
                  } finally {
                    setAdding(false);
                  }
                }}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add Baby'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Processing Progress Modal */}
      {showProcessingProgress && processingAudio && (
        <ProcessingProgress
          isOpen={showProcessingProgress}
          onClose={() => {
            setShowProcessingProgress(false);
            setProcessingAudio(null);
            setProcessingResult(null);
            // Reset selectedBabyId so modal appears again next time
            setSelectedBabyId(null);
            // Refresh stats and recordings
            void loadRecentRecordings();
            try {
              fetch('/api/user/stats', { cache: 'no-store' }).then(res => res.json()).then(s => {
                setHasRecording(Boolean(s?.hasRecording));
              }).catch(() => {});
            } catch {}
          }}
          onComplete={(result) => {
            setProcessingResult(result);
            toast.success('Audio processed successfully!');
          }}
          audioFile={processingAudio.blob}
          babyId={selectedBabyId || (babies[0]?.id || '')}
          babyName={selectedBabyId ? babies.find(b => b.id === selectedBabyId)?.name : babies[0]?.name}
        />
      )}

      {/* Toast container (scoped fallback) */}
      <Toaster position="top-center" />
    </>
  );
}
