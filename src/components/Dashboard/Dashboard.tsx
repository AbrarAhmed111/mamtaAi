'use client';

import { useState, useEffect } from 'react';
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
}

export default function Dashboard({ 
  user = { name: 'Sarah Johnson', role: 'Parent' },
  currentPath = '/dashboard',
  onSignOut
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

  const [babies, setBabies] = useState<Baby[]>([
    {
      id: '1',
      name: 'Emma',
      age: '3 months',
      avatar: '/api/placeholder/64/64',
      lastCry: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      totalCries: 15
    }
  ]);

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
      startRecording();
    } else {
      completeChecklistItem(itemId);
    }
  };

  const handleAddBaby = () => {
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
        
        <div className="flex-1 p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              <WelcomeChecklist
                checklist={checklist}
                totalPoints={totalPoints}
                onItemAction={handleChecklistAction}
              />
              
              <RecordingSection
                isRecording={isRecording}
                recordingTime={recordingTime}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
              />
              
              <BabyProfiles
                babies={babies}
                onAddBaby={handleAddBaby}
                onBabyClick={handleBabyClick}
              />
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
