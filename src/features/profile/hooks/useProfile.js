/**
 * useProfile Hook
 * Custom React hook for managing profile state and operations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProfileManager } from '../services/profileManager.js';
import { ProfileDataService } from '../services/profileDataService.js';

/**
 * Custom hook for profile management
 */
export const useProfile = () => {
  // State
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Refs
  const managerRef = useRef(null);
  const dataServiceRef = useRef(null);

  // Initialize services
  useEffect(() => {
    managerRef.current = new ProfileManager();
    dataServiceRef.current = new ProfileDataService();
    
    loadProfileData();
  }, []);

  /**
   * Load profile data
   */
  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await managerRef.current.init();
      
      const [profileData, settingsData, statsData] = await Promise.all([
        managerRef.current.getProfile(),
        managerRef.current.getProfileSettings(),
        managerRef.current.getProfileStats()
      ]);

      // Batch state updates to avoid act() warnings
      React.startTransition(() => {
        setProfile(profileData);
        setSettings(settingsData);
        setStats(statsData);
        setLoading(false);
      });
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  /**
   * Create new profile
   */
  const createProfile = useCallback(async (profileData) => {
    try {
      setSaving(true);
      setError(null);

      // Validate data
      const validation = dataServiceRef.current.validateProfileData(profileData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Process profile picture if provided
      let processedData = { ...profileData };
      if (profileData.profilePictureFile) {
        const processedImage = await dataServiceRef.current.processProfilePicture(
          profileData.profilePictureFile
        );
        processedData.profilePicture = processedImage.data;
        delete processedData.profilePictureFile;
      }

      // Create profile
      const newProfile = await managerRef.current.createProfile(processedData);
      
      // Update stats
      const newStats = await managerRef.current.getProfileStats();
      
      // Batch state updates
      React.startTransition(() => {
        setProfile(newProfile);
        setStats(newStats);
      });

      return newProfile;
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Update profile
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setSaving(true);
      setError(null);

      // Validate data
      const validation = dataServiceRef.current.validateProfileData(updates);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Process profile picture if provided
      let processedUpdates = { ...updates };
      if (updates.profilePictureFile) {
        const processedImage = await dataServiceRef.current.processProfilePicture(
          updates.profilePictureFile
        );
        processedUpdates.profilePicture = processedImage.data;
        delete processedUpdates.profilePictureFile;
      }

      // Update profile
      const updatedProfile = await managerRef.current.updateProfile(processedUpdates);
      
      // Update stats
      const newStats = await managerRef.current.getProfileStats();
      
      // Batch state updates
      React.startTransition(() => {
        setProfile(updatedProfile);
        setStats(newStats);
      });

      return updatedProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Update profile settings
   */
  const updateSettings = useCallback(async (settingsUpdates) => {
    try {
      setSaving(true);
      setError(null);

      const updatedSettings = await managerRef.current.updateProfileSettings(settingsUpdates);
      
      // Update stats
      const newStats = await managerRef.current.getProfileStats();
      
      // Batch state updates
      React.startTransition(() => {
        setSettings(updatedSettings);
        setStats(newStats);
      });

      return updatedSettings;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Delete profile
   */
  const deleteProfile = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      await managerRef.current.deleteProfile();
      
      // Batch state updates
      React.startTransition(() => {
        setProfile(null);
        setSettings(null);
        setStats(null);
      });

      return true;
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Clear all profile data
   */
  const clearAllData = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      await managerRef.current.clearAllData();
      
      // Batch state updates
      React.startTransition(() => {
        setProfile(null);
        setSettings(null);
        setStats(null);
      });

      return true;
    } catch (err) {
      console.error('Error clearing data:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    await loadProfileData();
  }, [loadProfileData]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get formatted profile for display
   */
  const getFormattedProfile = useCallback(() => {
    if (!profile) return null;
    return dataServiceRef.current?.formatProfileForDisplay(profile);
  }, [profile]);

  /**
   * Get available interests
   */
  const getAvailableInterests = useCallback(() => {
    return dataServiceRef.current?.getAvailableInterests() || [];
  }, []);

  /**
   * Get looking for options
   */
  const getLookingForOptions = useCallback(() => {
    return dataServiceRef.current?.getLookingForOptions() || [];
  }, []);

  /**
   * Get privacy levels
   */
  const getPrivacyLevels = useCallback(() => {
    return dataServiceRef.current?.getPrivacyLevels() || [];
  }, []);

  /**
   * Generate avatar from initials
   */
  const generateAvatar = useCallback((displayName, size = 100) => {
    return dataServiceRef.current?.generateAvatar(displayName, size);
  }, []);

  return {
    // State
    profile,
    settings,
    stats,
    loading,
    error,
    saving,

    // Actions
    createProfile,
    updateProfile,
    updateSettings,
    deleteProfile,
    clearAllData,
    refreshProfile,
    clearError,

    // Utilities
    getFormattedProfile,
    getAvailableInterests,
    getLookingForOptions,
    getPrivacyLevels,
    generateAvatar
  };
};
