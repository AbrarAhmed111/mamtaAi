'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (user: any) => {
    console.log('User logged in:', user);
    
    // Redirect based on role and verification status
    if (user.role === 'expert' && !user.isVerified) {
      router.push('/auth/verification-pending');
    } else if (!user.onboardingCompleted) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  };

  const handleError = (error: string) => {
    console.error('Login error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md sm:max-w-lg">
        <LoginForm
          onLogin={handleLogin}
          onError={handleError}
        />
      </div>
    </div>
  );
}