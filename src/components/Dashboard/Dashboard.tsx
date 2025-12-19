'use client';

import { useState, useEffect } from 'react';
import { toast, Toaster } from '@/components/ui/sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { FaBaby, FaCamera, FaUsers } from 'react-icons/fa';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import WelcomeChecklist from './WelcomeChecklist';
import RecordingSection from './RecordingSection';
import BabyProfiles from './BabyProfiles';
// import BadgesSection from './BadgesSection';
import QuickActions from './QuickActions';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  action: string;
}

// Badge system removed

interface Baby {
  id: string;
  name: string;
  age: string;
  avatar: string;
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
  const [showSelectBaby, setShowSelectBaby] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);
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
  const [recentRecs, setRecentRecs] = useState<Array<{ id: string; fileUrl: string; durationSeconds: number | null; recordedAt: string; babyId: string; babyName: string; babyAvatar?: string | null }>>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  useEffect(() => {
    // Points and badges removed
  }, [checklist, babies]);

  const effectiveRole = (role ?? user.role ?? '').toLowerCase();
  const isParent = effectiveRole === 'parent';
  const isRoleUnset = !effectiveRole || (effectiveRole !== 'parent' && effectiveRole !== 'expert');
  const isOnboardingIncomplete = onboardingCompleted === false;

  useEffect(() => {
    void loadBabies();
  }, [isParent]);

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

  // Apply stats to checklist items
  useEffect(() => {
    setChecklist(prev =>
      prev.map(item => {
        if (item.id === 'add-baby') return { ...item, completed: hasBaby };
        if (item.id === 'first-cry') return { ...item, completed: hasRecording };
        if (item.id === 'join-community') return { ...item, completed: hasCommunity };
        return item;
      }),
    );
  }, [hasBaby, hasRecording, hasCommunity]);

  const loadRecentRecordings = async () => {
    try {
      setRecentLoading(true);
      const res = await fetch('/api/recordings', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      setRecentRecs(Array.isArray(json?.items) ? json.items : []);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    void loadRecentRecordings();
  }, []);
  const loadBabies = async () => {
    if (!isParent) return;
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
        }>;
        const mapped: Baby[] = dbBabies.map(b => ({
          id: b.id,
          name: b.name,
          age: formatAge(b.birth_date),
          avatar: b.avatar_url || '/api/placeholder/64/64',
          lastCry: new Date(),
          totalCries: 0,
        }));
        setBabies(mapped);
      } finally {
        setBabiesLoading(false);
      }
    };

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
    // Deprecated simulation removed; real recording is controlled inside RecordingSection
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    // Do not auto-complete checklist on stop; completion is driven by saved recording (stats)
    setIsRecording(false);
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
    if (babies.length === 0) {
      toast.error('Please add your baby first.');
      // Optionally surface the add baby flow
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

  return (
    <>
     
        {(isRoleUnset || isOnboardingIncomplete || (isParent && babies.length === 0)) && (
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
        
        {showSelectBaby && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
              <h3 className="text-lg font-semibold">Select your baby</h3>
              <p className="text-sm text-gray-600 mt-1">Choose which baby this recording is for.</p>
              {babies.length === 0 ? (
                <div className="mt-4 text-center">
                  <p className="text-gray-700 font-medium">No babies found</p>
                  <p className="text-gray-500 text-sm mt-1">Please add a baby before recording a cry.</p>
                </div>
              ) : (
                <div className="mt-3 space-y-2 max-h-60 overflow-auto">
                  {babies.map(b => (
                    <label key={b.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="selectedBaby"
                        checked={selectedBabyId === b.id}
                        onChange={() => setSelectedBabyId(b.id)}
                      />
                      <span className="font-medium text-gray-800">{b.name}</span>
                      <span className="ml-auto text-xs text-gray-500">{b.age}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowSelectBaby(false)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {babies.length === 0 ? (
                  <Link
                    href="/dashboard/babies/add-baby"
                    onClick={() => {
                      setShowSelectBaby(false);
                      handleAddBaby();
                    }}
                    className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg"
                  >
                    Add Baby
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (!selectedBabyId) {
                        toast.error('Please select a baby');
                        return;
                      }
                      setShowSelectBaby(false);
                      startRecording();
                    }}
                    className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
                  isRecording={isRecording}
                  recordingTime={recordingTime}
                onStartRecording={handleStartRecording}
                  onStopRecording={stopRecording}
                onSave={async (blob, durationSeconds) => {
                  try {
                    const targetBabyId = selectedBabyId || (babies[0]?.id || null);
                    if (!targetBabyId) {
                      toast.error('Please add/select a baby first');
                      return;
                    }
                    const fd = new FormData();
                    fd.append('file', blob, `recording_${Date.now()}.webm`);
                    fd.append('baby_id', targetBabyId);
                    fd.append('duration_seconds', String(durationSeconds || 0));
                    const res = await fetch('/api/recordings', { method: 'POST', body: fd });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      toast.error(json?.error || 'Failed to save recording');
                      return;
                    }
                    toast.success('Recording saved');
                    // Refresh stats
                    try {
                      const statsRes = await fetch('/api/user/stats', { cache: 'no-store' });
                      const s = await statsRes.json().catch(() => ({}));
                      setHasRecording(Boolean(s?.hasRecording));
                    } catch {}
                    // Refresh recordings list (if rendered)
                    await loadRecentRecordings();
                  } catch {
                    toast.error('Failed to save recording');
                  }
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
                {recentRecs.map(r => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.babyAvatar || '/api/placeholder/40/40'} alt={r.babyName} className="w-8 h-8 rounded-full object-cover border" />
                      <div>
                        <div className="font-medium text-gray-900">{r.babyName}</div>
                        <div className="text-gray-600">{new Date(r.recordedAt).toLocaleString()} • {r.durationSeconds ? `${r.durationSeconds}s` : ''}</div>
                      </div>
                    </div>
                    <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open</a>
                  </li>
                ))}
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
      {/* Toast container (scoped fallback) */}
      <Toaster position="top-center" />
    </>
  );
}
