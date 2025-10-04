/**
 * Age Verification Feature Exports
 * Privacy-first age verification with no external data collection
 */

export { AgeVerificationManager } from './services/ageVerificationManager.js';
export { BiometricAgeEstimator } from './services/biometricAgeEstimator.js';
export { DocumentVerifier } from './services/documentVerifier.js';
export { useAgeVerification } from './hooks/useAgeVerification.js';
export { default as AgeVerificationSetup } from './components/AgeVerificationSetup.js';
export { default as AgeVerificationStatus } from './components/AgeVerificationStatus.js';
