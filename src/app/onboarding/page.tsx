'use client';

import { useState, useEffect } from 'react';
import { FaBaby, FaUserMd, FaCheck, FaStar, FaTrophy, FaGift, FaArrowRight, FaArrowLeft, FaCamera, FaHeart, FaUsers, FaChartLine } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

type OnboardingStep = 'welcome' | 'baby-setup' | 'first-cry' | 'community' | 'complete';

interface BabyInfo {
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birthWeight: string;
  birthHeight: string;
  avatar: File | null;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  points: number;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [babyInfo, setBabyInfo] = useState<BabyInfo>({
    name: '',
    birthDate: '',
    gender: 'prefer_not_to_say',
    birthWeight: '',
    birthHeight: '',
    avatar: null
  });
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'add-baby',
      title: 'Add Baby Profile',
      description: 'Create your baby&apos;s profile with basic information',
      completed: false,
      icon: FaBaby,
      points: 50
    },
    {
      id: 'first-cry',
      title: 'Record First Cry',
      description: 'Record your baby&apos;s cry to get AI insights',
      completed: false,
      icon: FaCamera,
      points: 30
    },
    {
      id: 'join-community',
      title: 'Join Community',
      description: 'Connect with other parents and experts',
      completed: false,
      icon: FaUsers,
      points: 20
    }
  ]);
  
  const [totalPoints, setTotalPoints] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  const steps = [
    { id: 'welcome', title: 'Welcome', icon: FaStar },
    { id: 'baby-setup', title: 'Baby Setup', icon: FaBaby },
    { id: 'first-cry', title: 'First Cry', icon: FaCamera },
    { id: 'community', title: 'Community', icon: FaUsers },
    { id: 'complete', title: 'Complete', icon: FaTrophy }
  ];

  const handleBabyInfoChange = (field: keyof BabyInfo, value: string | File | null) => {
    setBabyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleBabyInfoChange('avatar', file);
  };

  const completeChecklistItem = (itemId: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === itemId && !item.completed) {
        const newPoints = totalPoints + item.points;
        setTotalPoints(newPoints);
        
        // Award badges based on points
        const newBadges = [...badges];
        if (newPoints >= 50 && !badges.includes('Super Parent')) {
          newBadges.push('Super Parent');
        }
        if (newPoints >= 100 && !badges.includes('Engaged Parent')) {
          newBadges.push('Engaged Parent');
        }
        setBadges(newBadges);
        
        return { ...item, completed: true };
      }
      return item;
    }));
  };

  const handleNext = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'baby-setup', 'first-cry', 'community', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'baby-setup', 'first-cry', 'community', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
              <FaBaby className="text-white text-3xl" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to MamtaAI!</h2>
              <p className="text-gray-600 text-lg">
                Let&apos;s get you set up in just a few simple steps. 
                We&apos;ll guide you through everything you need to know.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">🎉 Welcome Checklist</h3>
              <p className="text-blue-800 text-sm mb-4">
                Complete these steps to unlock your full MamtaAI experience and earn rewards!
              </p>
              
              <div className="space-y-3">
                {checklist.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {item.completed ? <FaCheck /> : <Icon />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.completed ? 'text-green-800' : 'text-gray-700'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      <div className="text-xs text-gray-500">+{item.points} pts</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FaGift className="text-yellow-600" />
                <span className="font-semibold text-yellow-800">Earn Rewards!</span>
              </div>
              <p className="text-yellow-700 text-sm">
                Complete all steps to unlock special badges and get premium features for free!
              </p>
            </div>
          </div>
        );

      case 'baby-setup':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your Baby</h2>
              <p className="text-gray-600">Tell us about your little one to get personalized insights</p>
            </div>

            <form className="space-y-6">
              {/* Baby Avatar */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  {babyInfo.avatar ? (
                    <Image
                      src={URL.createObjectURL(babyInfo.avatar)}
                      alt="Baby avatar"
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <FaBaby className="text-gray-400 text-2xl" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="baby-avatar"
                />
                <label
                  htmlFor="baby-avatar"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaCamera className="mr-2" />
                  Add Photo
                </label>
              </div>

              {/* Baby Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Baby&apos;s Name *
                </label>
                <input
                  type="text"
                  value={babyInfo.name}
                  onChange={(e) => handleBabyInfoChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your baby's name"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Date *
                </label>
                <input
                  type="date"
                  value={babyInfo.birthDate}
                  onChange={(e) => handleBabyInfoChange('birthDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={babyInfo.gender}
                  onChange={(e) => handleBabyInfoChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Birth Weight and Height */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={babyInfo.birthWeight}
                    onChange={(e) => handleBabyInfoChange('birthWeight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Height (cm)
                  </label>
                  <input
                    type="number"
                    value={babyInfo.birthHeight}
                    onChange={(e) => handleBabyInfoChange('birthHeight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
              </div>
            </form>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FaCheck className="text-green-600" />
                <span className="font-semibold text-green-800">Great start!</span>
              </div>
              <p className="text-green-700 text-sm">
                You&apos;ve earned 50 points! Keep going to unlock more rewards.
              </p>
            </div>
          </div>
        );

      case 'first-cry':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Record Your First Cry</h2>
              <p className="text-gray-600">Let&apos;s test our AI with your baby&apos;s cry</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCamera className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Record?</h3>
              <p className="text-gray-600 mb-6">
                When your baby cries, tap the record button to capture the audio. 
                Our AI will analyze it and tell you what your baby needs.
              </p>
              
              <button
                onClick={() => completeChecklistItem('first-cry')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                🎤 Record Baby Cry
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 Pro Tip</h4>
              <p className="text-yellow-800 text-sm">
                For best results, record when your baby is in a quiet environment. 
                The AI works better with clear audio.
              </p>
            </div>
          </div>
        );

      case 'community':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Our Community</h2>
              <p className="text-gray-600">Connect with other parents and experts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FaUsers className="text-pink-600 text-xl" />
                  <h3 className="font-semibold text-pink-900">Parent Community</h3>
                </div>
                <p className="text-pink-800 text-sm mb-4">
                  Share experiences, ask questions, and get support from other parents.
                </p>
                <button className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors">
                  Join Parents Group
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FaUserMd className="text-green-600 text-xl" />
                  <h3 className="font-semibold text-green-900">Expert Network</h3>
                </div>
                <p className="text-green-800 text-sm mb-4">
                  Get advice from pediatricians, child psychologists, and other experts.
                </p>
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Connect with Experts
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">🌟 Community Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <FaHeart className="text-red-500 text-2xl mx-auto mb-2" />
                  <p className="text-blue-800 text-sm font-medium">Support</p>
                </div>
                <div className="text-center">
                  <FaChartLine className="text-blue-500 text-2xl mx-auto mb-2" />
                  <p className="text-blue-800 text-sm font-medium">Growth</p>
                </div>
                <div className="text-center">
                  <FaStar className="text-yellow-500 text-2xl mx-auto mb-2" />
                  <p className="text-blue-800 text-sm font-medium">Learning</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTrophy className="text-white text-3xl" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Congratulations!</h2>
              <p className="text-gray-600 text-lg">
                You&apos;ve completed your MamtaAI setup and earned {totalPoints} points!
              </p>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-900 mb-4">🏆 Your Badges</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {badges.map((badge, index) => (
                    <div key={index} className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Points Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">📊 Your Progress</h3>
              <div className="space-y-2">
                {checklist.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {item.completed ? <FaCheck /> : <Icon />}
                        </div>
                        <span className="text-sm text-gray-700">{item.title}</span>
                      </div>
                      <span className="text-sm text-gray-500">+{item.points} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">🎁 Special Reward!</h4>
              <p className="text-green-800 text-sm">
                You&apos;ve unlocked premium features for 30 days free! 
                Enjoy advanced AI insights and priority support.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = steps.indexOf(steps.find(s => s.id === currentStep)!) > index;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? <FaCheck /> : <Icon />}
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 'welcome'}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>

            {currentStep !== 'complete' ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <FaArrowRight className="ml-2" />
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
                <FaArrowRight className="ml-2" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
