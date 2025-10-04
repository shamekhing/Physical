/**
 * useProfile Hook Tests
 * Tests for the useProfile custom hook
 */

import { renderHook, act } from '@testing-library/react';
import { useProfile } from '../hooks/useProfile.js';

// Mock the services
jest.mock('../services/profileManager.js', () => ({
  ProfileManager: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    getProfile: jest.fn(),
    getProfileSettings: jest.fn(),
    getProfileStats: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    updateProfileSettings: jest.fn(),
    deleteProfile: jest.fn(),
    clearAllData: jest.fn()
  }))
}));

jest.mock('../services/profileDataService.js', () => ({
  ProfileDataService: jest.fn().mockImplementation(() => ({
    validateProfileData: jest.fn(),
    processProfilePicture: jest.fn(),
    formatProfileForDisplay: jest.fn(),
    getAvailableInterests: jest.fn(),
    getLookingForOptions: jest.fn(),
    getPrivacyLevels: jest.fn(),
    generateAvatar: jest.fn()
  }))
}));

describe('useProfile', () => {
  let mockManager;
  let mockDataService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockManager = {
      init: jest.fn().mockResolvedValue(),
      getProfile: jest.fn().mockResolvedValue(null),
      getProfileSettings: jest.fn().mockResolvedValue({
        privacy: { level: 'friends' },
        discovery: { enabled: true }
      }),
      getProfileStats: jest.fn().mockResolvedValue({
        hasProfile: false,
        isComplete: false,
        completionPercentage: 0
      }),
      createProfile: jest.fn().mockResolvedValue({}),
      updateProfile: jest.fn().mockResolvedValue({}),
      updateProfileSettings: jest.fn().mockResolvedValue({}),
      deleteProfile: jest.fn().mockResolvedValue(),
      clearAllData: jest.fn().mockResolvedValue()
    };

    mockDataService = {
      validateProfileData: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      processProfilePicture: jest.fn().mockResolvedValue({ data: 'mock-data' }),
      formatProfileForDisplay: jest.fn().mockReturnValue({}),
      getAvailableInterests: jest.fn().mockReturnValue(['Technology', 'Music']),
      getLookingForOptions: jest.fn().mockReturnValue([
        { value: 'friends', label: 'Friends' }
      ]),
      getPrivacyLevels: jest.fn().mockReturnValue([
        { value: 'friends', label: 'Friends Only' }
      ]),
      generateAvatar: jest.fn().mockReturnValue('mock-avatar')
    };

    // Mock the constructors
    const { ProfileManager } = require('../services/profileManager.js');
    const { ProfileDataService } = require('../services/profileDataService.js');
    
    ProfileManager.mockImplementation(() => mockManager);
    ProfileDataService.mockImplementation(() => mockDataService);
  });

  describe('initialization', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.profile).toBeNull();
      expect(result.current.settings).toBeNull();
      expect(result.current.stats).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.saving).toBe(false);
    });

    it('should load profile data on mount', async () => {
      const mockProfile = { id: 'test', displayName: 'Test User' };
      const mockSettings = { privacy: { level: 'friends' } };
      const mockStats = { hasProfile: true, completionPercentage: 50 };

      mockManager.getProfile.mockResolvedValue(mockProfile);
      mockManager.getProfileSettings.mockResolvedValue(mockSettings);
      mockManager.getProfileStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockManager.init).toHaveBeenCalled();
      expect(mockManager.getProfile).toHaveBeenCalled();
      expect(mockManager.getProfileSettings).toHaveBeenCalled();
      expect(mockManager.getProfileStats).toHaveBeenCalled();
    });
  });

  describe('createProfile', () => {
    it('should create profile successfully', async () => {
      const { result } = renderHook(() => useProfile());

      const profileData = {
        displayName: 'Test User',
        bio: 'Test bio',
        interests: ['Technology']
      };

      const createdProfile = { id: 'test', ...profileData };
      mockManager.createProfile.mockResolvedValue(createdProfile);
      mockManager.getProfileStats.mockResolvedValue({
        hasProfile: true,
        completionPercentage: 75
      });

      await act(async () => {
        await result.current.createProfile(profileData);
      });

      expect(mockDataService.validateProfileData).toHaveBeenCalledWith(profileData);
      expect(mockManager.createProfile).toHaveBeenCalledWith(profileData);
      expect(result.current.profile).toEqual(createdProfile);
      expect(result.current.saving).toBe(false);
    });

    it('should handle profile creation error', async () => {
      const { result } = renderHook(() => useProfile());

      const profileData = { displayName: 'Test User' };
      const error = new Error('Creation failed');
      mockManager.createProfile.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.createProfile(profileData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Creation failed');
      expect(result.current.saving).toBe(false);
    });

    it('should process profile picture if provided', async () => {
      const { result } = renderHook(() => useProfile());

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const profileData = {
        displayName: 'Test User',
        profilePictureFile: mockFile
      };

      const processedImage = { data: 'processed-data' };
      mockDataService.processProfilePicture.mockResolvedValue(processedImage);
      mockManager.createProfile.mockResolvedValue({});

      await act(async () => {
        await result.current.createProfile(profileData);
      });

      expect(mockDataService.processProfilePicture).toHaveBeenCalledWith(mockFile);
      expect(mockManager.createProfile).toHaveBeenCalledWith({
        displayName: 'Test User',
        profilePicture: 'processed-data'
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const { result } = renderHook(() => useProfile());

      const updates = { displayName: 'Updated Name' };
      const updatedProfile = { id: 'test', displayName: 'Updated Name' };
      
      mockManager.updateProfile.mockResolvedValue(updatedProfile);
      mockManager.getProfileStats.mockResolvedValue({
        hasProfile: true,
        completionPercentage: 80
      });

      await act(async () => {
        await result.current.updateProfile(updates);
      });

      expect(mockDataService.validateProfileData).toHaveBeenCalledWith(updates);
      expect(mockManager.updateProfile).toHaveBeenCalledWith(updates);
      expect(result.current.profile).toEqual(updatedProfile);
    });

    it('should handle update error', async () => {
      const { result } = renderHook(() => useProfile());

      const updates = { displayName: 'Updated Name' };
      const error = new Error('Update failed');
      mockManager.updateProfile.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.updateProfile(updates);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const { result } = renderHook(() => useProfile());

      const settingsUpdates = {
        privacy: { level: 'public' },
        discovery: { enabled: false }
      };

      const updatedSettings = { id: 'test', ...settingsUpdates };
      mockManager.updateProfileSettings.mockResolvedValue(updatedSettings);
      mockManager.getProfileStats.mockResolvedValue({
        hasProfile: true,
        completionPercentage: 60
      });

      await act(async () => {
        await result.current.updateSettings(settingsUpdates);
      });

      expect(mockManager.updateProfileSettings).toHaveBeenCalledWith(settingsUpdates);
      expect(result.current.settings).toEqual(updatedSettings);
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile successfully', async () => {
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.deleteProfile();
      });

      expect(mockManager.deleteProfile).toHaveBeenCalled();
      expect(result.current.profile).toBeNull();
      expect(result.current.settings).toBeNull();
      expect(result.current.stats).toBeNull();
    });
  });

  describe('clearAllData', () => {
    it('should clear all data successfully', async () => {
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.clearAllData();
      });

      expect(mockManager.clearAllData).toHaveBeenCalled();
      expect(result.current.profile).toBeNull();
      expect(result.current.settings).toBeNull();
      expect(result.current.stats).toBeNull();
    });
  });

  describe('refreshProfile', () => {
    it('should refresh profile data', async () => {
      const { result } = renderHook(() => useProfile());

      const mockProfile = { id: 'test', displayName: 'Test User' };
      mockManager.getProfile.mockResolvedValue(mockProfile);

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(mockManager.getProfile).toHaveBeenCalled();
      expect(mockManager.getProfileSettings).toHaveBeenCalled();
      expect(mockManager.getProfileStats).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useProfile());

      // Set an error first
      await act(async () => {
        result.current.setError?.('Test error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('utility functions', () => {
    it('should provide getFormattedProfile', async () => {
      const mockProfile = { displayName: 'Test User' };
      const formattedProfile = { displayName: 'Test User', formatted: true };
      
      mockManager.getProfile.mockResolvedValue(mockProfile);
      mockDataService.formatProfileForDisplay.mockReturnValue(formattedProfile);

      const { result } = renderHook(() => useProfile());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const formatted = result.current.getFormattedProfile();
      expect(formatted).toEqual(formattedProfile);
    });

    it('should provide getAvailableInterests', () => {
      const { result } = renderHook(() => useProfile());

      const interests = result.current.getAvailableInterests();
      expect(interests).toEqual(['Technology', 'Music']);
    });

    it('should provide getLookingForOptions', () => {
      const { result } = renderHook(() => useProfile());

      const options = result.current.getLookingForOptions();
      expect(options).toEqual([{ value: 'friends', label: 'Friends' }]);
    });

    it('should provide getPrivacyLevels', () => {
      const { result } = renderHook(() => useProfile());

      const levels = result.current.getPrivacyLevels();
      expect(levels).toEqual([{ value: 'friends', label: 'Friends Only' }]);
    });

    it('should provide generateAvatar', () => {
      const { result } = renderHook(() => useProfile());

      const avatar = result.current.generateAvatar('Test User', 100);
      expect(avatar).toBe('mock-avatar');
    });
  });

  describe('loading states', () => {
    it('should set loading to true during operations', async () => {
      const { result } = renderHook(() => useProfile());

      // Mock a slow operation
      mockManager.createProfile.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const profileData = { displayName: 'Test User' };

      act(() => {
        result.current.createProfile(profileData);
      });

      expect(result.current.saving).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.saving).toBe(false);
    });
  });
});
