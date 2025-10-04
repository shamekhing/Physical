/**
 * ProfileManager Tests
 * Tests for the ProfileManager service
 */

import { ProfileManager } from '../services/profileManager.js';

// Mock IndexedDB
const mockDB = {
  objectStoreNames: {
    contains: jest.fn(),
    length: 0
  },
  createObjectStore: jest.fn(),
  transaction: jest.fn()
};

const mockTransaction = {
  objectStore: jest.fn()
};

const mockStore = {
  add: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  createIndex: jest.fn()
};

const mockRequest = {
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
  result: mockDB,
  error: null
};

// Mock indexedDB
global.indexedDB = {
  open: jest.fn(() => mockRequest)
};

// Mock generateDeviceId
jest.mock('../../../shared/utils.js', () => ({
  generateDeviceId: jest.fn(() => 'test-device-id')
}));

describe('ProfileManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ProfileManager();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockRequest.onsuccess = null;
    mockRequest.onerror = null;
    mockRequest.onupgradeneeded = null;
    mockRequest.result = mockDB;
    mockRequest.error = null;
    
    mockDB.transaction.mockReturnValue(mockTransaction);
    mockTransaction.objectStore.mockReturnValue(mockStore);
    
    // Ensure device ID is set
    manager.deviceId = 'test-device-id';
    
    // Mock indexedDB.open to return our mock request
    indexedDB.open.mockReturnValue(mockRequest);
  });

  describe('init', () => {
    it('should initialize database successfully', async () => {
      const promise = manager.init();
      
      // Simulate successful database initialization
      mockRequest.onsuccess();
      
      await promise;
      
      expect(indexedDB.open).toHaveBeenCalledWith('PhysicalProfileDB', 1);
      expect(manager.db).toBe(mockDB);
    }, 10000);

    it('should handle database initialization error', async () => {
      const error = new Error('Database error');
      mockRequest.error = error;
      
      const promise = manager.init();
      
      // Simulate database error
      mockRequest.onerror();
      
      await expect(promise).rejects.toThrow('Database error');
    }, 10000);

    it('should create object stores on upgrade', async () => {
      const mockUpgradeEvent = {
        target: { result: mockDB }
      };
      
      mockDB.objectStoreNames.contains.mockReturnValue(false);
      mockDB.createObjectStore.mockReturnValue(mockStore);
      
      mockRequest.onupgradeneeded = jest.fn();
      
      const promise = manager.init();
      
      // Simulate upgrade needed
      if (mockRequest.onupgradeneeded) {
        mockRequest.onupgradeneeded(mockUpgradeEvent);
      }
      
      // Simulate successful database initialization
      mockRequest.onsuccess();
      
      await promise;
      
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('profiles', { keyPath: 'id' });
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('profileSettings', { keyPath: 'id' });
    });
  });

  describe('createProfile', () => {
    beforeEach(async () => {
      manager.db = mockDB;
    });

    it('should create a new profile successfully', async () => {
      const profileData = {
        displayName: 'Test User',
        bio: 'Test bio',
        interests: ['Technology', 'Music']
      };

      const mockAddRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn()
      };
      mockStore.add.mockReturnValue(mockAddRequest);

      const promise = manager.createProfile(profileData);
      
      // Simulate successful add
      mockAddRequest.onsuccess();
      
      const result = await promise;

      expect(mockStore.add).toHaveBeenCalledWith({
        id: 'test-device-id',
        deviceId: 'test-device-id',
        ...profileData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        isActive: true
      });
      expect(result).toMatchObject({
        id: 'test-device-id',
        deviceId: 'test-device-id',
        ...profileData,
        isActive: true
      });
    });

    it('should handle profile creation error', async () => {
      const profileData = { displayName: 'Test User' };
      const error = new Error('Creation failed');
      
      const mockAddRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        error
      };
      mockStore.add.mockReturnValue(mockAddRequest);

      const promise = manager.createProfile(profileData);
      
      // Simulate error
      mockAddRequest.onerror();
      
      await expect(promise).rejects.toThrow('Creation failed');
    });
  });

  describe('getProfile', () => {
    beforeEach(async () => {
      manager.db = mockDB;
    });

    it('should get existing profile', async () => {
      const mockProfile = {
        id: 'test-device-id',
        displayName: 'Test User',
        bio: 'Test bio'
      };

      const mockGetRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: mockProfile
      };
      mockStore.get.mockReturnValue(mockGetRequest);

      const promise = manager.getProfile();
      
      // Simulate successful get
      mockGetRequest.onsuccess();
      
      const result = await promise;

      expect(mockStore.get).toHaveBeenCalledWith('test-device-id');
      expect(result).toEqual(mockProfile);
    });

    it('should return null for non-existent profile', async () => {
      const mockGetRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: undefined
      };
      mockStore.get.mockReturnValue(mockGetRequest);

      const promise = manager.getProfile();
      
      // Simulate successful get with no result
      mockGetRequest.onsuccess();
      
      const result = await promise;

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    beforeEach(async () => {
      manager.db = mockDB;
    });

    it('should update existing profile', async () => {
      const existingProfile = {
        id: 'test-device-id',
        displayName: 'Old Name',
        bio: 'Old bio'
      };

      const updates = {
        displayName: 'New Name',
        bio: 'New bio'
      };

      // Mock getProfile to return existing profile
      jest.spyOn(manager, 'getProfile').mockResolvedValue(existingProfile);

      const mockPutRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn()
      };
      mockStore.put.mockReturnValue(mockPutRequest);

      const promise = manager.updateProfile(updates);
      
      // Simulate successful put immediately
      setTimeout(() => mockPutRequest.onsuccess(), 0);
      
      const result = await promise;

      expect(mockStore.put).toHaveBeenCalledWith({
        ...existingProfile,
        ...updates,
        updatedAt: expect.any(String)
      });
      expect(result).toMatchObject({
        ...existingProfile,
        ...updates
      });
    });

    it('should throw error if profile not found', async () => {
      jest.spyOn(manager, 'getProfile').mockResolvedValue(null);

      await expect(manager.updateProfile({ displayName: 'New Name' }))
        .rejects.toThrow('Profile not found');
    });
  });

  describe('deleteProfile', () => {
    beforeEach(async () => {
      manager.db = mockDB;
    });

    it('should delete profile successfully', async () => {
      const mockDeleteRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn()
      };
      mockStore.delete.mockReturnValue(mockDeleteRequest);

      const promise = manager.deleteProfile();
      
      // Simulate successful delete
      mockDeleteRequest.onsuccess();
      
      await promise;

      expect(mockStore.delete).toHaveBeenCalledWith('test-device-id');
    });
  });

  describe('getProfileSettings', () => {
    beforeEach(async () => {
      manager.db = mockDB;
    });

    it('should get existing settings', async () => {
      const mockSettings = {
        id: 'test-device-id',
        privacy: { level: 'friends' },
        discovery: { enabled: true }
      };

      const mockGetRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: mockSettings
      };
      mockStore.get.mockReturnValue(mockGetRequest);

      const promise = manager.getProfileSettings();
      
      // Simulate successful get
      mockGetRequest.onsuccess();
      
      const result = await promise;

      expect(result).toEqual(mockSettings);
    });

    it('should return default settings if none exist', async () => {
      const mockGetRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: undefined
      };
      mockStore.get.mockReturnValue(mockGetRequest);

      const promise = manager.getProfileSettings();
      
      // Simulate successful get with no result
      mockGetRequest.onsuccess();
      
      const result = await promise;

      expect(result).toMatchObject({
        id: 'test-device-id',
        deviceId: 'test-device-id',
        privacy: { level: 'friends' },
        discovery: { enabled: true }
      });
    });
  });

  describe('updateProfileSettings', () => {
    beforeEach(async () => {
      manager.db = mockDB;
    });

    it('should update settings successfully', async () => {
      const existingSettings = {
        id: 'test-device-id',
        privacy: { level: 'friends' }
      };

      const updates = {
        privacy: { level: 'public' }
      };

      // Mock getProfileSettings
      jest.spyOn(manager, 'getProfileSettings').mockResolvedValue(existingSettings);

      const mockPutRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn()
      };
      mockStore.put.mockReturnValue(mockPutRequest);

      const promise = manager.updateProfileSettings(updates);
      
      // Simulate successful put immediately
      setTimeout(() => mockPutRequest.onsuccess(), 0);
      
      const result = await promise;

      expect(result).toMatchObject({
        ...existingSettings,
        ...updates,
        updatedAt: expect.any(String)
      });
    });
  });

  describe('validateProfile', () => {
    it('should validate profile data correctly', () => {
      const validProfile = {
        displayName: 'Test User',
        bio: 'Valid bio',
        interests: ['Technology']
      };

      const result = manager.validateProfile(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const invalidProfile = {
        displayName: '', // Too short
        bio: 'a'.repeat(501), // Too long
        interests: new Array(11).fill('Interest') // Too many
      };

      const result = manager.validateProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getProfileStats', () => {
    beforeEach(async () => {
      manager.db = mockDB;
    });

    it('should return profile statistics', async () => {
      const mockProfile = {
        id: 'test-device-id',
        displayName: 'Test User',
        bio: 'Test bio',
        interests: ['Technology'],
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      const mockSettings = {
        privacy: { level: 'friends' },
        discovery: { enabled: true }
      };

      jest.spyOn(manager, 'getProfile').mockResolvedValue(mockProfile);
      jest.spyOn(manager, 'getProfileSettings').mockResolvedValue(mockSettings);

      const stats = await manager.getProfileStats();

      expect(stats).toMatchObject({
        hasProfile: true,
        isComplete: true,
        completionPercentage: expect.any(Number),
        privacyLevel: 'friends',
        discoveryEnabled: true,
        lastUpdated: '2023-01-01T00:00:00.000Z'
      });
    });
  });

  describe('isProfileComplete', () => {
    it('should return true for complete profile', () => {
      const completeProfile = {
        displayName: 'Test User',
        bio: 'Test bio',
        interests: ['Technology']
      };

      expect(manager.isProfileComplete(completeProfile)).toBe(true);
    });

    it('should return false for incomplete profile', () => {
      const incompleteProfile = {
        displayName: 'Test User',
        bio: '',
        interests: []
      };

      expect(manager.isProfileComplete(incompleteProfile)).toBe(false);
    });
  });

  describe('getCompletionPercentage', () => {
    it('should calculate completion percentage correctly', () => {
      const profile = {
        displayName: 'Test User',
        bio: 'Test bio',
        interests: ['Technology'],
        profilePicture: 'data:image/jpeg;base64,...'
      };

      const percentage = manager.getCompletionPercentage(profile);
      expect(percentage).toBe(100);
    });

    it('should return 0 for empty profile', () => {
      const emptyProfile = {};
      const percentage = manager.getCompletionPercentage(emptyProfile);
      expect(percentage).toBe(0);
    });
  });

  describe('clearAllData', () => {
    beforeEach(async () => {
      manager.db = mockDB;
    });

    it('should clear all profile data', async () => {
      const mockDeleteRequest1 = {
        onsuccess: jest.fn(),
        onerror: jest.fn()
      };
      const mockDeleteRequest2 = {
        onsuccess: jest.fn(),
        onerror: jest.fn()
      };

      mockStore.delete
        .mockReturnValueOnce(mockDeleteRequest1)
        .mockReturnValueOnce(mockDeleteRequest2);

      const promise = manager.clearAllData();
      
      // Simulate both deletes succeeding
      mockDeleteRequest1.onsuccess();
      mockDeleteRequest2.onsuccess();
      
      await promise;

      expect(mockStore.delete).toHaveBeenCalledTimes(2);
    });
  });
});
