// Authentication actions
export {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getCurrentUser,
  resetPassword,
  resendSignupConfirmation,
  updateProfile,
  checkUserVerification,
  type SignupData,
  type LoginData,
  type AuthUser,
  type AuthError
} from './auth';

// Profile management actions
export {
  getUserProfile,
  updateUserProfile,
  completeOnboarding,
  getUserBabies,
  addBaby,
  updateBaby,
  deleteBaby,
  getExpertVerificationStatus,
  updateExpertVerification,
  type BabyData,
  type ProfileData
} from './profile';
