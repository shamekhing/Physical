/**
 * ProfileEdit Component
 * Component for editing existing user profile
 */

import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile.js';
import '../styles/ProfileEdit.css';

const ProfileEdit = ({ onSave, onCancel }) => {
  const {
    profile,
    settings,
    updateProfile,
    updateSettings,
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
    profilePictureFile: null
  });

  const [settingsData, setSettingsData] = useState({
    lookingFor: 'friends',
    privacyLevel: 'friends',
    discoveryEnabled: true,
    maxDistance: 100
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const availableInterests = getAvailableInterests() || [];
  const lookingForOptions = getLookingForOptions() || [];
  const privacyLevels = getPrivacyLevels() || [];

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        interests: profile.interests || [],
        profilePictureFile: null
      });
      setPreviewImage(profile.profilePicture || null);
    }
  }, [profile]);

  // Initialize settings data when settings load
  useEffect(() => {
    if (settings) {
      setSettingsData({
        lookingFor: settings.discovery?.lookingFor || 'friends',
        privacyLevel: settings.privacy?.level || 'friends',
        discoveryEnabled: settings.discovery?.enabled || true,
        maxDistance: settings.discovery?.maxDistance || 100
      });
    }
  }, [settings]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  /**
   * Handle profile input changes
   */
  const handleProfileInputChange = (field, value) => {
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
   * Handle settings input changes
   */
  const handleSettingsInputChange = (field, value) => {
    setSettingsData(prev => ({
      ...prev,
      [field]: value
    }));
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
   * Validate profile form
   */
  const validateProfileForm = () => {
    const errors = {};

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    } else if (formData.displayName.length > 50) {
      errors.displayName = 'Display name must be less than 50 characters';
    }

    if (!formData.bio.trim()) {
      errors.bio = 'Bio is required';
    } else if (formData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.interests.length === 0) {
      errors.interests = 'Please select at least one interest';
    } else if (formData.interests.length > 10) {
      errors.interests = 'Maximum 10 interests allowed';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle save profile
   */
  const handleSaveProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }

    try {
      await updateProfile(formData);
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  /**
   * Handle save settings
   */
  const handleSaveSettings = async () => {
    try {
      const settingsUpdate = {
        discovery: {
          lookingFor: settingsData.lookingFor,
          enabled: settingsData.discoveryEnabled,
          maxDistance: settingsData.maxDistance
        },
        privacy: {
          level: settingsData.privacyLevel
        }
      };

      await updateSettings(settingsUpdate);
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Settings update failed:', err);
    }
  };

  /**
   * Handle save all
   */
  const handleSaveAll = async () => {
    const profileValid = validateProfileForm();
    
    if (profileValid) {
      try {
        await Promise.all([
          updateProfile(formData),
          updateSettings({
            discovery: {
              lookingFor: settingsData.lookingFor,
              enabled: settingsData.discoveryEnabled,
              maxDistance: settingsData.maxDistance
            },
            privacy: {
              level: settingsData.privacyLevel
            }
          })
        ]);
        
        if (onSave) {
          onSave();
        }
      } catch (err) {
        console.error('Update failed:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="profile-edit">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-edit">
        <div className="error-message">
          <h3>No Profile Found</h3>
          <p>You need to create a profile first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit">
      <div className="profile-edit-header">
        <h2>Edit Profile</h2>
        <div className="tab-navigation">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError} className="close-error">×</button>
        </div>
      )}

      <div className="profile-edit-content">
        {activeTab === 'profile' && (
          <div className="profile-tab">
            <div className="form-group">
              <label htmlFor="displayName">Display Name *</label>
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleProfileInputChange('displayName', e.target.value)}
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
              <label htmlFor="bio">Bio *</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength={500}
                rows={4}
                className={validationErrors.bio ? 'error' : ''}
              />
              {validationErrors.bio && (
                <span className="error-message">{validationErrors.bio}</span>
              )}
              <small>{formData.bio.length}/500 characters</small>
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
                      <span>Change Photo</span>
                    </div>
                  )}
                </label>
              </div>
              <small>Optional. Max 5MB, JPEG/PNG/WebP</small>
            </div>

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
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="form-group">
              <label htmlFor="lookingFor">Looking For</label>
              <select
                id="lookingFor"
                value={settingsData.lookingFor}
                onChange={(e) => handleSettingsInputChange('lookingFor', e.target.value)}
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
                value={settingsData.privacyLevel}
                onChange={(e) => handleSettingsInputChange('privacyLevel', e.target.value)}
              >
                {privacyLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <small>
                {privacyLevels.find(l => l.value === settingsData.privacyLevel)?.description}
              </small>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settingsData.discoveryEnabled}
                  onChange={(e) => handleSettingsInputChange('discoveryEnabled', e.target.checked)}
                />
                Enable Discovery
              </label>
              <small>Allow others to discover your profile</small>
            </div>

            {settingsData.discoveryEnabled && (
              <div className="form-group">
                <label htmlFor="maxDistance">Maximum Distance (meters)</label>
                <input
                  type="number"
                  id="maxDistance"
                  value={settingsData.maxDistance}
                  onChange={(e) => handleSettingsInputChange('maxDistance', parseInt(e.target.value))}
                  min="10"
                  max="1000"
                  step="10"
                />
                <small>Maximum distance for discovery (10-1000 meters)</small>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="profile-edit-actions">
        <button 
          type="button" 
          onClick={activeTab === 'profile' ? handleSaveProfile : handleSaveSettings}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : `Save ${activeTab === 'profile' ? 'Profile' : 'Settings'}`}
        </button>

        <button 
          type="button" 
          onClick={handleSaveAll}
          disabled={saving}
          className="btn-secondary"
        >
          Save All
        </button>

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

export default ProfileEdit;
