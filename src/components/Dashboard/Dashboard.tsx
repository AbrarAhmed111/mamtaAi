'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FaBaby, FaCamera, FaUsers, FaCheck, FaTrophy, FaStar, FaMicrophone } from 'react-icons/fa';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import WelcomeChecklist from './WelcomeChecklist';
import RecordingSection from './RecordingSection';
import BabyProfiles from './BabyProfiles';
import BadgesSection from './BadgesSection';
import QuickActions from './QuickActions';
import ProgressSummary from './ProgressSummary';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  points: number;
  action: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  earned: boolean;
  earnedAt?: Date;
}

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'add-baby',
      title: 'Add Baby Profile',
      description: 'Complete your baby\'s profile with photos and details',
      completed: false,
      icon: FaBaby,
      points: 50,
      action: 'Complete Profile'
    },
    {
      id: 'first-cry',
      title: 'Record First Cry',
      description: 'Record your baby\'s cry to get AI-powered insights',
      completed: false,
      icon: FaCamera,
      points: 30,
      action: 'Record Cry'
    },
    {
      id: 'join-community',
      title: 'Join Community',
      description: 'Connect with other parents and get expert advice',
      completed: false,
      icon: FaUsers,
      points: 20,
      action: 'Join Now'
    }
  ]);

  const [badges, setBadges] = useState<Badge[]>([
    {
      id: 'super-parent',
      name: 'Super Parent',
      description: 'Completed all onboarding steps',
      icon: FaTrophy,
      color: 'text-yellow-600',
      earned: false
    },
    {
      id: 'engaged-parent',
      name: 'Engaged Parent',
      description: 'Active in community discussions',
      icon: FaStar,
      color: 'text-blue-600',
      earned: false
    },
    {
      id: 'cry-expert',
      name: 'Cry Expert',
      description: 'Recorded 10+ baby cries',
      icon: FaMicrophone,
      color: 'text-green-600',
      earned: false
    }
  ]);

  const [babies, setBabies] = useState<Baby[]>([]);
  const [babiesLoading, setBabiesLoading] = useState(false);
  const [showSelectBaby, setShowSelectBaby] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);

  const [totalPoints, setTotalPoints] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    // Calculate total points
    const points = checklist.reduce((total, item) => {
      return item.completed ? total + item.points : total;
    }, 0);
    setTotalPoints(points);

    // Update badges based on progress
    setBadges(prev => prev.map(badge => {
      let earned = false;
      
      switch (badge.id) {
        case 'super-parent':
          earned = checklist.every(item => item.completed);
          break;
        case 'engaged-parent':
          earned = checklist.find(item => item.id === 'join-community')?.completed || false;
          break;
        case 'cry-expert':
          earned = babies.some(baby => baby.totalCries >= 10);
          break;
      }
      
      return { ...badge, earned, earnedAt: earned && !badge.earned ? new Date() : badge.earnedAt };
    }));
  }, [checklist, babies]);

  const effectiveRole = (role ?? user.role ?? '').toLowerCase();
  const isParent = effectiveRole === 'parent';
  const isRoleUnset = !effectiveRole || (effectiveRole !== 'parent' && effectiveRole !== 'expert');
  const isOnboardingIncomplete = onboardingCompleted === false;

  useEffect(() => {
    const fetchBabies = async () => {
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
    fetchBabies();
  }, [isParent]);

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
    setIsRecording(true);
    setRecordingTime(0);
    
    // Simulate recording
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // Stop recording after 10 seconds (simulation)
    setTimeout(() => {
      setIsRecording(false);
      clearInterval(interval);
      completeChecklistItem('first-cry');
    }, 10000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    completeChecklistItem('first-cry');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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
    if (isOnboardingIncomplete || isRoleUnset) {
      toast.error('Please complete onboarding before adding a baby.');
      return;
    }
    // TODO: Implement add baby functionality
    console.log('Add baby clicked');
  };

  const handleBabyClick = (baby: Baby) => {
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        currentPath={currentPath} 
        user={user}
        isOpen={isMobileMenuOpen}
        onToggle={toggleMobileMenu}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <DashboardHeader
          greeting={getGreeting()}
          userName={user.name.split(' ')[0]}
          userAvatarUrl={user.avatar}
          onNotificationClick={handleNotificationClick}
          onSettingsClick={handleSettingsClick}
          onMenuToggle={toggleMobileMenu}
          onSignOut={onSignOut}
        />

        {(isRoleUnset || isOnboardingIncomplete) && (
          <div className="mx-4 sm:mx-6 mt-4">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {isRoleUnset
                      ? 'Please choose your role (Parent or Expert).'
                      : 'Please complete your profile onboarding to continue.'}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {isRoleUnset
                      ? 'This helps us tailor the dashboard to your needs.'
                      : 'Complete your profile to unlock all features.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700"
                  >
                    Go to onboarding
                  </Link>
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
                  <button
                    onClick={() => {
                      setShowSelectBaby(false);
                      handleAddBaby();
                    }}
                    className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add Baby
                  </button>
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
                    className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              <WelcomeChecklist
                checklist={checklist}
                totalPoints={totalPoints}
                onItemAction={handleChecklistAction}
              />
              
              {isParent && (
                <RecordingSection
                  isRecording={isRecording}
                  recordingTime={recordingTime}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                />
              )}
              
              {isParent && (
                babiesLoading ? (
                  <div className="bg-white rounded-xl p-6 border border-gray-100 text-gray-600">Loading babies...</div>
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
                    <button
                      onClick={handleAddBaby}
                      className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    >
                      Add Baby
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <BadgesSection badges={badges} />
              <QuickActions onActionClick={handleActionClick} />
              <ProgressSummary
                completedItems={checklist.filter(item => item.completed).length}
                totalItems={checklist.length}
                totalPoints={totalPoints}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
