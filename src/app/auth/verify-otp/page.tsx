'use client';

import { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaBaby, FaEnvelope, FaPhone, FaClock, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email');
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((digit, index) => !digit && index < pastedData.length);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(pastedData.length - 1, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate verification success
      setIsVerified(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      console.error('Verification failed:', error);
      // Reset OTP on failure
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setCanResend(false);
    setTimeLeft(300);
    setOtp(['', '', '', '', '', '']);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('OTP resent successfully');
    } catch (error) {
      console.error('Resend failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');
  const isOtpValid = otp.every(digit => /^\d$/.test(digit));

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <FaBaby className="h-12 w-12 text-blue-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">MamtaAI</span>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                Your account has been verified successfully. Redirecting to dashboard...
              </p>
              
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/auth/signup" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
            <FaArrowLeft className="mr-2" />
            Back to Signup
          </Link>
          
          <div className="flex items-center justify-center mb-6">
            <FaBaby className="h-12 w-12 text-blue-600 mr-3" />
            <span className="text-3xl font-bold text-gray-900">MamtaAI</span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Your Account
          </h2>
          <p className="text-gray-600">
            We&apos;ve sent a verification code to your {verificationMethod}
          </p>
        </div>

        {/* OTP Verification Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Verification Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setVerificationMethod('email')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                verificationMethod === 'email'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaEnvelope className="mr-2" />
              Email
            </button>
            <button
              onClick={() => setVerificationMethod('phone')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                verificationMethod === 'phone'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaPhone className="mr-2" />
              Phone
            </button>
          </div>

          {/* OTP Input Fields */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Enter the 6-digit code
            </label>
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              ))}
            </div>
          </div>

          {/* Timer and Resend */}
          <div className="text-center mb-6">
            {!canResend ? (
              <div className="flex items-center justify-center text-sm text-gray-600">
                <FaClock className="mr-2" />
                Resend code in {formatTime(timeLeft)}
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                Resend verification code
              </button>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={!isOtpComplete || !isOtpValid || isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify Account'
            )}
          </button>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                Resend
              </button>
            </p>
          </div>

          {/* Alternative Contact */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Having trouble? Contact our{' '}
              <Link href="/support" className="text-blue-600 hover:text-blue-700">
                support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
