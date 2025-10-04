/**
 * ProfileView Component
 * Component for displaying user profile information
 */

import React from 'react';
import { useProfile } from '../hooks/useProfile.js';
import '../styles/ProfileView.css';

const ProfileView = ({ onEdit, onSettings, onCreateProfile }) => {
  const {
    profile,
    settings,
    stats,
    loading,
    error,
    getFormattedProfile,
    generateAvatar
  } = useProfile();

  if (loading) {
    return (
      <div className="profile-view">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-view">
        <div className="error-message">
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-view">
        <div className="no-profile">
          <h3>No Profile Found</h3>
          <p>You haven't created a profile yet.</p>
          {onCreateProfile && (
            <button onClick={onCreateProfile} className="btn-primary">
              Create Profile
            </button>
          )}
        </div>
      </div>
    );
  }

  const formattedProfile = getFormattedProfile();
  const profilePicture = formattedProfile.profilePicture || 
    generateAvatar(formattedProfile.displayName);

  return (
    <div className="profile-view">
      <div className="profile-header">
        <div className="profile-picture">
          <img 
            src={profilePicture} 
            alt={formattedProfile.displayName}
            className="profile-avatar"
          />
        </div>
        
        <div className="profile-info">
          <h2 className="profile-name">{formattedProfile.displayName}</h2>
          <p className="profile-age">{formattedProfile.age}</p>
          <div className="profile-badges">
            {stats?.isComplete && (
              <span className="badge complete">Complete Profile</span>
            )}
            <span className={`badge privacy ${settings?.privacy?.level || 'friends'}`}>
              {settings?.privacy?.level || 'friends'} profile
            </span>
          </div>
        </div>

        <div className="profile-actions">
          {onEdit && (
            <button onClick={onEdit} className="btn-secondary">
              Edit Profile
            </button>
          )}
          {onSettings && (
            <button onClick={onSettings} className="btn-secondary">
              Settings
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3>About</h3>
          <p className="profile-bio">{formattedProfile.bio}</p>
        </div>

        {formattedProfile.interests && formattedProfile.interests.length > 0 && (
          <div className="profile-section">
            <h3>Interests</h3>
            <div className="interests-list">
              {formattedProfile.interests.map((interest, index) => (
                <span key={index} className="interest-tag">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="profile-section">
          <h3>Discovery Settings</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <span className="setting-label">Looking for:</span>
              <span className="setting-value">
                {settings?.discovery?.lookingFor || 'Not specified'}
              </span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Privacy:</span>
              <span className="setting-value">
                {settings?.privacy?.level || 'friends'}
              </span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Discovery:</span>
              <span className="setting-value">
                {settings?.discovery?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {settings?.discovery?.enabled && (
              <div className="setting-item">
                <span className="setting-label">Max Distance:</span>
                <span className="setting-value">
                  {settings.discovery.maxDistance}m
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3>Profile Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats?.completionPercentage || 0}%</span>
              <span className="stat-label">Complete</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {formattedProfile.createdAt}
              </span>
              <span className="stat-label">Created</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats?.lastUpdated ? 
                  new Date(stats.lastUpdated).toLocaleDateString() : 
                  'Never'
                }
              </span>
              <span className="stat-label">Last Updated</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-footer">
        <div className="privacy-notice">
          <strong>Privacy Notice:</strong> All profile data is stored locally on your device only.
          No data is shared with external servers.
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
