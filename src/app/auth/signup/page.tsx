'use client';

import { useRouter } from 'next/navigation';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  const router = useRouter();

  const handleStepChange = (step: string) => {
    console.log('Step changed to:', step);
  };

  const handleComplete = (data: any) => {
    console.log('Signup completed:', data);
    // Redirect based on role
    if (data.role === 'expert') {
      router.push('/auth/verification-pending');
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md sm:max-w-lg">
        <SignupForm
          onStepChange={handleStepChange}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}