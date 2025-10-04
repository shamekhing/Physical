/**
 * Profile Manager
 * Handles user profile data management with privacy-first approach
 * All data stored locally using IndexedDB
 */

import { generateDeviceId } from '../../../shared/utils.js';

/**
 * Profile Manager Class
 * Manages user profile data with local storage and privacy controls
 */
export class ProfileManager {
  constructor() {
    this.dbName = 'PhysicalProfileDB';
    this.dbVersion = 1;
    this.db = null;
    this.deviceId = generateDeviceId();
  }

  /**
   * Initialize the IndexedDB database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Profile store
        if (!db.objectStoreNames.contains('profiles')) {
          const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
          profileStore.createIndex('deviceId', 'deviceId', { unique: false });
          profileStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Profile settings store
        if (!db.objectStoreNames.contains('profileSettings')) {
          const settingsStore = db.createObjectStore('profileSettings', { keyPath: 'id' });
          settingsStore.createIndex('deviceId', 'deviceId', { unique: false });
        }
      };
    });
  }

  /**
   * Create a new profile
   */
  async createProfile(profileData) {
    if (!this.db) await this.init();

    const profile = {
      id: this.deviceId,
      deviceId: this.deviceId,
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    console.log('ProfileManager: Creating profile with deviceId:', this.deviceId);
    console.log('ProfileManager: Profile data:', profile);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['profiles'], 'readwrite');
      const store = transaction.objectStore('profiles');
      const request = store.add(profile);

      request.onsuccess = () => {
        console.log('ProfileManager: Profile created successfully in database');
        resolve(profile);
      };
      request.onerror = () => {
        console.error('ProfileManager: Error creating profile:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get current profile
   */
  async getProfile() {
    if (!this.db) await this.init();

    console.log('ProfileManager: Getting profile for deviceId:', this.deviceId);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['profiles'], 'readonly');
      const store = transaction.objectStore('profiles');
      const request = store.get(this.deviceId);

      request.onsuccess = () => {
        console.log('ProfileManager: Retrieved profile:', request.result);
        resolve(request.result || null);
      };
      request.onerror = () => {
        console.error('ProfileManager: Error getting profile:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update profile
   */
  async updateProfile(updates) {
    if (!this.db) await this.init();

    const existingProfile = await this.getProfile();
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    const updatedProfile = {
      ...existingProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['profiles'], 'readwrite');
      const store = transaction.objectStore('profiles');
      const request = store.put(updatedProfile);

      request.onsuccess = () => resolve(updatedProfile);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete profile
   */
  async deleteProfile() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['profiles'], 'readwrite');
      const store = transaction.objectStore('profiles');
      const request = store.delete(this.deviceId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get profile settings
   */
  async getProfileSettings() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['profileSettings'], 'readonly');
      const store = transaction.objectStore('profileSettings');
      const request = store.get(this.deviceId);

      request.onsuccess = () => {
        const settings = request.result;
        if (settings) {
          resolve(settings);
        } else {
          // Return default settings
          resolve(this.getDefaultSettings());
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update profile settings
   */
  async updateProfileSettings(settings) {
    if (!this.db) await this.init();

    const existingSettings = await this.getProfileSettings();
    const updatedSettings = {
      id: this.deviceId,
      deviceId: this.deviceId,
      ...existingSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['profileSettings'], 'readwrite');
      const store = transaction.objectStore('profileSettings');
      const request = store.put(updatedSettings);

      request.onsuccess = () => resolve(updatedSettings);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get default profile settings
   */
  getDefaultSettings() {
    return {
      id: this.deviceId,
      deviceId: this.deviceId,
      privacy: {
        level: 'friends', // public, friends, private
        showAge: true,
        showLocation: false,
        showInterests: true,
        allowDiscovery: true
      },
      discovery: {
        enabled: true,
        maxDistance: 100, // meters
        ageRange: { min: 18, max: 99 },
        interests: [],
        lookingFor: 'friends' // friends, networking, dating, etc.
      },
      notifications: {
        newMatches: true,
        messages: true,
        proximity: true,
        updates: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate profile data
   */
  validateProfile(profileData) {
    const errors = [];

    if (!profileData.displayName || profileData.displayName.trim().length < 2) {
      errors.push('Display name must be at least 2 characters');
    }

    if (profileData.displayName && profileData.displayName.length > 50) {
      errors.push('Display name must be less than 50 characters');
    }

    if (profileData.bio && profileData.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    if (profileData.interests && !Array.isArray(profileData.interests)) {
      errors.push('Interests must be an array');
    }

    if (profileData.interests && profileData.interests.length > 10) {
      errors.push('Maximum 10 interests allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get profile statistics
   */
  async getProfileStats() {
    const profile = await this.getProfile();
    const settings = await this.getProfileSettings();

    return {
      hasProfile: !!profile,
      isComplete: profile ? this.isProfileComplete(profile) : false,
      completionPercentage: profile ? this.getCompletionPercentage(profile) : 0,
      privacyLevel: settings.privacy.level,
      discoveryEnabled: settings.discovery.enabled,
      lastUpdated: profile?.updatedAt || null
    };
  }

  /**
   * Check if profile is complete
   */
  isProfileComplete(profile) {
    const requiredFields = ['displayName', 'bio', 'interests'];
    return requiredFields.every(field => {
      const value = profile[field];
      if (field === 'interests') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value.toString().trim().length > 0;
    });
  }

  /**
   * Get profile completion percentage
   */
  getCompletionPercentage(profile) {
    const fields = [
      'displayName',
      'bio',
      'interests',
      'profilePicture'
    ];

    const completedFields = fields.filter(field => {
      const value = profile[field];
      if (field === 'interests') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value.toString().trim().length > 0;
    });

    return Math.round((completedFields.length / fields.length) * 100);
  }

  /**
   * Clear all profile data
   */
  async clearAllData() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['profiles', 'profileSettings'], 'readwrite');
      
      const profileStore = transaction.objectStore('profiles');
      const settingsStore = transaction.objectStore('profileSettings');
      
      const profileRequest = profileStore.delete(this.deviceId);
      const settingsRequest = settingsStore.delete(this.deviceId);

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };

      profileRequest.onsuccess = checkComplete;
      settingsRequest.onsuccess = checkComplete;
      
      profileRequest.onerror = () => reject(profileRequest.error);
      settingsRequest.onerror = () => reject(settingsRequest.error);
    });
  }
}

