'use client';

import { useState } from 'react';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaArrowLeft, FaBaby, FaGoogle, FaApple, FaUserMd, FaShieldAlt } from 'react-icons/fa';
import Link from 'next/link';
import { signInWithEmail, signOut, getCurrentUser, type AuthUser } from '@/lib/supabase/actions';

type UserRole = 'parent' | 'expert' | 'admin';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  onboardingCompleted: boolean;
  fullName: string;
}

interface LoginFormProps {
  onLogin?: (user: User) => void;
  onError?: (error: string) => void;
}

export default function LoginForm({ onLogin, onError }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const { user, error } = await signInWithEmail({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        setErrors({ general: error.message });
        onError?.(error.message);
        return;
      }

      if (user) {
        const userData: User = {
          id: user.id,
          email: user.email,
          role: user.profile.role as UserRole,
          isVerified: user.profile.is_verified || false,
          onboardingCompleted: user.profile.onboarding_completed || false,
          fullName: user.profile.full_name
        };
        
        onLogin?.(userData);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    
    try {
      // TODO: Implement social authentication
      console.log(`Social login with ${provider}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const mockUser: User = {
        id: '1',
        email: `${provider}@example.com`,
        role: 'parent',
        isVerified: true,
        onboardingCompleted: true,
        fullName: 'Social User'
      };
      
      onLogin?.(mockUser);
    } catch (error) {
      console.error('Social login error:', error);
      const errorMessage = 'Social login failed. Please try again.';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'parent':
        return <FaBaby className="text-pink-600" />;
      case 'expert':
        return <FaUserMd className="text-green-600" />;
      case 'admin':
        return <FaShieldAlt className="text-purple-600" />;
      default:
        return <FaBaby className="text-gray-600" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'parent':
        return 'bg-pink-100 text-pink-800';
      case 'expert':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaBaby className="text-white text-xl sm:text-2xl" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-sm sm:text-base text-gray-600">Sign in to continue your journey with MamtaAI</p>
      </div>

      {/* Social Login Options */}
      <div className="space-y-4 mb-6">
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <FaGoogle className="mr-3 text-red-500" />
          Continue with Google
        </button>
        
        <button
          type="button"
          onClick={() => handleSocialLogin('apple')}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <FaApple className="mr-3 text-gray-800" />
          Continue with Apple
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="mr-2"
              disabled={isLoading}
            />
            <label className="text-sm text-gray-600">Remember me</label>
          </div>
          <Link
            href="/forget-password"
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Role-based Login Hints */}
      <div className="mt-6 space-y-3">
        <p className="text-sm text-gray-600 text-center">Quick access for different roles:</p>
        
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {
              setFormData(prev => ({ ...prev, email: 'parent@example.com', password: 'password123' }));
            }}
          >
            <FaBaby className="mr-2 text-pink-600" />
            <span className="text-sm">Parent Demo</span>
          </button>
          
          <button
            type="button"
            className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {
              setFormData(prev => ({ ...prev, email: 'expert@example.com', password: 'password123' }));
            }}
          >
            <FaUserMd className="mr-2 text-green-600" />
            <span className="text-sm">Expert Demo</span>
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                setFormData(prev => ({ ...prev, email: 'admin@example.com', password: 'password123' }));
              }}
            >
              <FaShieldAlt className="mr-2 text-purple-600" />
              <span className="text-sm">Admin Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline font-medium">
            Sign up here
          </Link>
        </p>
      </div>

      {/* Back to Home */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
