'use client';

import { useState } from 'react';
import { FaClock, FaEnvelope, FaArrowLeft, FaUserMd, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';

export default function VerificationPendingPage() {
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    try {
      // TODO: Implement resend verification
      console.log('Resending verification...');
      setResendCooldown(60); // 60 seconds cooldown
      
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Resend error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaClock className="text-yellow-600 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Pending</h1>
          <p className="text-gray-600">Your expert account is under review</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <FaExclamationTriangle className="text-yellow-600 text-xl mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Account Under Review</h3>
                  <p className="text-yellow-800 text-sm">
                    Our admin team is reviewing your professional documents and credentials. 
                    This process typically takes 24-48 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* What's Being Reviewed */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">What we&apos;re reviewing:</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="text-green-500" />
                  <span className="text-sm text-gray-600">Professional license verification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="text-green-500" />
                  <span className="text-sm text-gray-600">Educational credentials</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="text-green-500" />
                  <span className="text-sm text-gray-600">Work experience validation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="text-green-500" />
                  <span className="text-sm text-gray-600">Background check</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">What happens next:</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs font-medium text-yellow-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Document Review</p>
                    <p className="text-xs text-gray-600">Our team verifies your credentials</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs font-medium text-gray-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approval Notification</p>
                    <p className="text-xs text-gray-600">You&apos;ll receive an email when approved</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs font-medium text-gray-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Access Granted</p>
                    <p className="text-xs text-gray-600">Start helping parents with your expertise</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Need help?</h4>
              <p className="text-blue-800 text-sm mb-2">
                If you have questions about the verification process, contact our support team.
              </p>
              <div className="flex items-center space-x-2">
                <FaEnvelope className="text-blue-600" />
                <a href="mailto:support@mamtaai.com" className="text-blue-600 hover:underline text-sm">
                  support@mamtaai.com
                </a>
              </div>
            </div>

            {/* Resend Verification */}
            <div className="text-center">
              <button
                onClick={handleResendVerification}
                disabled={resendCooldown > 0}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 
                  ? `Resend verification in ${resendCooldown}s`
                  : 'Resend verification email'
                }
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 space-y-4">
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </Link>
            
            <Link
              href="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
