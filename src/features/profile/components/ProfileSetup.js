/**
 * ProfileSetup Component
 * Component for creating and setting up a new user profile
 */

import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile.js';
import '../styles/ProfileSetup.css';

const ProfileSetup = ({ onComplete, onCancel }) => {
  const {
    createProfile,
    loading,
    error,
    saving,
    clearError,
    getAvailableInterests,
    getLookingForOptions,
    getPrivacyLevels
  } = useProfile();

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    interests: [],
    lookingFor: 'friends',
    privacyLevel: 'friends',
    profilePictureFile: null
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);

  const availableInterests = getAvailableInterests ? getAvailableInterests() : [];
  const lookingForOptions = getLookingForOptions ? getLookingForOptions() : [];
  const privacyLevels = getPrivacyLevels ? getPrivacyLevels() : [];

  // Clear error when component mounts
  useEffect(() => {
    if (clearError) {
      clearError();
    }
  }, [clearError]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  /**
   * Handle interest toggle
   */
  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  /**
   * Handle profile picture upload
   */
  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePictureFile: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Validate current step
   */
  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!formData.displayName.trim()) {
        errors.displayName = 'Display name is required';
      } else if (formData.displayName.length < 2) {
        errors.displayName = 'Display name must be at least 2 characters';
      } else if (formData.displayName.length > 50) {
        errors.displayName = 'Display name must be less than 50 characters';
      }
    }

    if (step === 2) {
      if (!formData.bio.trim()) {
        errors.bio = 'Bio is required';
      } else if (formData.bio.length > 500) {
        errors.bio = 'Bio must be less than 500 characters';
      }
    }

    if (step === 3) {
      if (formData.interests.length === 0) {
        errors.interests = 'Please select at least one interest';
      } else if (formData.interests.length > 10) {
        errors.interests = 'Maximum 10 interests allowed';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Handle previous step
   */
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      await createProfile(formData);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Profile creation failed:', err);
    }
  };

  /**
   * Render step 1: Basic Info
   */
  const renderStep1 = () => (
    <div className="profile-setup-step">
      <h3>Basic Information</h3>
      <p>Let's start with some basic information about you.</p>

      <div className="form-group">
        <label htmlFor="displayName">Display Name *</label>
        <input
          type="text"
          id="displayName"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          placeholder="Enter your display name"
          maxLength={50}
          className={validationErrors.displayName ? 'error' : ''}
        />
        {validationErrors.displayName && (
          <span className="error-message">{validationErrors.displayName}</span>
        )}
        <small>{formData.displayName.length}/50 characters</small>
      </div>

      <div className="form-group">
        <label htmlFor="profilePicture">Profile Picture</label>
        <div className="profile-picture-upload">
          <input
            type="file"
            id="profilePicture"
            accept="image/*"
            onChange={handleProfilePictureChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="profilePicture" className="upload-button">
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="preview-image" />
            ) : (
              <div className="upload-placeholder">
                <span>📷</span>
                <span>Upload Photo</span>
              </div>
            )}
          </label>
        </div>
        <small>Optional. Max 5MB, JPEG/PNG/WebP</small>
      </div>
    </div>
  );

  /**
   * Render step 2: Bio
   */
  const renderStep2 = () => (
    <div className="profile-setup-step">
      <h3>Tell Us About Yourself</h3>
      <p>Write a brief bio to help others get to know you.</p>

      <div className="form-group">
        <label htmlFor="bio">Bio *</label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell us about yourself, your interests, or what you're looking for..."
          maxLength={500}
          rows={4}
          className={validationErrors.bio ? 'error' : ''}
        />
        {validationErrors.bio && (
          <span className="error-message">{validationErrors.bio}</span>
        )}
        <small>{formData.bio.length}/500 characters</small>
      </div>
    </div>
  );

  /**
   * Render step 3: Interests
   */
  const renderStep3 = () => (
    <div className="profile-setup-step">
      <h3>Your Interests</h3>
      <p>Select your interests to help others find you.</p>

      <div className="form-group">
        <label>Interests *</label>
        <div className="interests-grid">
          {availableInterests.map(interest => (
            <button
              key={interest}
              type="button"
              className={`interest-tag ${formData.interests.includes(interest) ? 'selected' : ''}`}
              onClick={() => handleInterestToggle(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
        {validationErrors.interests && (
          <span className="error-message">{validationErrors.interests}</span>
        )}
        <small>{formData.interests.length}/10 selected</small>
      </div>
    </div>
  );

  /**
   * Render step 4: Preferences
   */
  const renderStep4 = () => (
    <div className="profile-setup-step">
      <h3>Discovery Preferences</h3>
      <p>Set your preferences for how others can discover you.</p>

      <div className="form-group">
        <label htmlFor="lookingFor">Looking For</label>
        <select
          id="lookingFor"
          value={formData.lookingFor}
          onChange={(e) => handleInputChange('lookingFor', e.target.value)}
        >
          {lookingForOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="privacyLevel">Privacy Level</label>
        <select
          id="privacyLevel"
          value={formData.privacyLevel}
          onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
        >
          {privacyLevels.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
        <small>
          {privacyLevels.find(l => l.value === formData.privacyLevel)?.description}
        </small>
      </div>
    </div>
  );

  /**
   * Render current step
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  if (loading) {
    return (
      <div className="profile-setup">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-setup">
      <div className="profile-setup-header">
        <h2>Create Your Profile</h2>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
        <p>Step {currentStep} of 4</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError} className="close-error">×</button>
        </div>
      )}

      <div className="profile-setup-content">
        {renderCurrentStep()}
      </div>

      <div className="profile-setup-actions">
        {currentStep > 1 && (
          <button 
            type="button" 
            onClick={handlePrevious}
            className="btn-secondary"
          >
            Previous
          </button>
        )}
        
        {currentStep < 4 ? (
          <button 
            type="button" 
            onClick={handleNext}
            className="btn-primary"
          >
            Next
          </button>
        ) : (
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Creating Profile...' : 'Create Profile'}
          </button>
        )}

        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="btn-link"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileSetup;
