'use client';

import { useState } from 'react';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaPhone, FaCheck, FaGoogle, FaApple, FaUpload, FaArrowRight, FaUserMd, FaShieldAlt } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

type SignupStep = 'account' | 'personal' | 'role' | 'verification' | 'onboarding';
type UserRole = 'parent' | 'expert' | 'admin';

interface FormData {
  // Step 1: Account
  email: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Personal Info
  firstName: string;
  lastName: string;
  phone: string;
  profilePicture: File | null;
  
  // Step 3: Role
  role: UserRole | '';
  
  // Step 4: Expert verification
  verificationDocuments: File[];
  professionalTitle: string;
  licenseNumber: string;
  yearsOfExperience: string;
  
  // Terms
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

interface SignupFormProps {
  onStepChange?: (step: SignupStep) => void;
  onComplete?: (data: FormData) => void;
}

export default function SignupForm({ onStepChange, onComplete }: SignupFormProps) {
  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    profilePicture: null,
    role: '',
    verificationDocuments: [],
    professionalTitle: '',
    licenseNumber: '',
    yearsOfExperience: '',
    agreeToTerms: false,
    agreeToPrivacy: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [verificationSent, setVerificationSent] = useState(false);

  const steps = [
    { id: 'account', title: 'Create Account', icon: FaUser },
    { id: 'personal', title: 'Personal Info', icon: FaUser },
    { id: 'role', title: 'Choose Role', icon: FaUser },
    { id: 'verification', title: 'Email Verification', icon: FaCheck },
    { id: 'onboarding', title: 'Setup', icon: FaUser }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      [field]: field === 'verificationDocuments' ? files : files[0]
    }));
  };

  const validateStep = (step: SignupStep): boolean => {
    const newErrors: {[key: string]: string} = {};

    switch (step) {
      case 'account':
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 'personal':
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
        }
        break;

      case 'role':
        if (!formData.role) {
          newErrors.role = 'Please select a role';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const stepOrder: SignupStep[] = ['account', 'personal', 'role', 'verification', 'onboarding'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    }
  };

  const handleBack = () => {
    const stepOrder: SignupStep[] = ['account', 'personal', 'role', 'verification', 'onboarding'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1];
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    
    try {
      // TODO: Implement Supabase integration
      console.log('Form submitted:', formData);
      
      if (currentStep === 'account') {
        setVerificationSent(true);
        setCurrentStep('verification');
        onStepChange?.('verification');
      }
      
      onComplete?.(formData);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600">Join thousands of parents using MamtaAI</p>
            </div>

            {/* Social Login Options */}
            <div className="space-y-4">
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaGoogle className="mr-3 text-red-500" />
                Continue with Google
              </button>
              
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaApple className="mr-3 text-gray-800" />
                Continue with Apple
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 mr-3"
                />
                <label className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </form>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
              <p className="text-gray-600">Help us personalize your experience</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="First name"
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Last name"
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {formData.profilePicture ? (
                      <Image
                        src={URL.createObjectURL(formData.profilePicture)}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <FaUser className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'profilePicture')}
                      className="hidden"
                      id="profile-picture"
                    />
                    <label
                      htmlFor="profile-picture"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FaUpload className="mr-2" />
                      Upload Photo
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
        );

      case 'role':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
              <p className="text-gray-600">How will you be using MamtaAI?</p>
            </div>

            <div className="space-y-4">
              <div
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.role === 'parent'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'parent' }))}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-pink-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Parent/Caregiver</h3>
                    <p className="text-gray-600">Track your baby&apos;s needs and get AI-powered insights</p>
                  </div>
                  {formData.role === 'parent' && <FaCheck className="text-blue-500 text-xl" />}
                </div>
              </div>

              <div
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.role === 'expert'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'expert' }))}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FaUserMd className="text-green-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Expert</h3>
                    <p className="text-gray-600">Provide professional guidance to parents (requires verification)</p>
                  </div>
                  {formData.role === 'expert' && <FaCheck className="text-blue-500 text-xl" />}
                </div>
              </div>

              {/* Admin role - hidden for now */}
              {process.env.NODE_ENV === 'development' && (
                <div
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.role === 'admin'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <FaShieldAlt className="text-purple-600 text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Admin</h3>
                      <p className="text-gray-600">Manage the platform and verify experts</p>
                    </div>
                    {formData.role === 'admin' && <FaCheck className="text-blue-500 text-xl" />}
                  </div>
                </div>
              )}
            </div>

            {formData.role === 'expert' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Expert Verification Required:</strong> You&apos;ll need to upload professional documents for verification. 
                  Your account will be reviewed by our admin team before activation.
                </p>
              </div>
            )}

            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-green-600 text-2xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600">
                We&apos;ve sent a verification link to <strong>{formData.email}</strong>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
              <ol className="text-blue-800 space-y-2">
                <li>1. Check your email inbox (and spam folder)</li>
                <li>2. Click the verification link</li>
                <li>3. Complete your profile setup</li>
                {formData.role === 'expert' && (
                  <li>4. Upload your professional documents for verification</li>
                )}
              </ol>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  // TODO: Implement resend verification
                  console.log('Resend verification');
                }}
              >
                Didn&apos;t receive the email? Resend verification
              </button>
            </div>
          </div>
        );

      case 'onboarding':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to MamtaAI!</h2>
              <p className="text-gray-600">Let&apos;s get you set up</p>
            </div>

            {formData.role === 'parent' ? (
              <div className="space-y-4">
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                  <h3 className="font-semibold text-pink-900 mb-2">👶 Parent Setup</h3>
                  <p className="text-pink-800 mb-4">Add your baby&apos;s information to get started:</p>
                  <button className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors">
                    Add Baby Profile
                  </button>
                </div>
              </div>
            ) : formData.role === 'expert' ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-2">👨‍⚕️ Expert Setup</h3>
                  <p className="text-green-800 mb-4">Complete your professional profile:</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        name="professionalTitle"
                        value={formData.professionalTitle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Pediatrician, Child Psychologist"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Your professional license number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <select
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select experience</option>
                        <option value="1-2">1-2 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="6-10">6-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Documents
                      </label>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'verificationDocuments')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Upload your professional license, degree, or certification documents
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = steps.indexOf(steps.find(s => s.id === currentStep)!) > index;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center min-w-0 flex-shrink-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? <FaCheck /> : <Icon />}
                </div>
                <span className={`text-xs mt-2 text-center ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'} hidden sm:block`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 sm:mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 'account'}
            className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            <FaArrowRight className="mr-2 rotate-180" />
            Back
          </button>

          {currentStep !== 'verification' && (
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
            >
              {isLoading ? 'Processing...' : 'Next'}
              <FaArrowRight className="ml-2" />
            </button>
          )}
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
