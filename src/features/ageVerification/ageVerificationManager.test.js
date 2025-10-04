/**
 * Tests for AgeVerificationManager
 * Privacy-first age verification with no external data collection
 */

import { AgeVerificationManager } from './ageVerificationManager.js';

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
  }
};

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn().mockReturnValue({
    onupgradeneeded: jest.fn(),
    onsuccess: jest.fn()
  })
};

// Mock navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn()
};

// Mock global objects
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: mockMediaDevices,
    userAgent: 'Mozilla/5.0 (Test Browser)'
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    crypto: mockCrypto,
    indexedDB: mockIndexedDB,
    Worker: jest.fn()
  },
  writable: true
});

describe('AgeVerificationManager', () => {
  let manager;

  beforeEach(() => {
    manager = new AgeVerificationManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(manager.deviceId).toBeDefined();
      expect(manager.verificationMethods).toBeInstanceOf(Map);
      expect(manager.verificationHistory).toEqual([]);
      expect(manager.privacySettings.noDataTransmission).toBe(true);
      expect(manager.privacySettings.noImageStorage).toBe(true);
    });

    it('should set up verification levels', () => {
      expect(manager.verificationLevels.basic).toEqual({
        minConfidence: 0.6,
        methods: 1
      });
      expect(manager.verificationLevels.standard).toEqual({
        minConfidence: 0.75,
        methods: 2
      });
      expect(manager.verificationLevels.high).toEqual({
        minConfidence: 0.85,
        methods: 3
      });
    });
  });

  describe('isAvailable', () => {
    it('should return true when all capabilities are available', async () => {
      const result = await manager.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when camera is not available', async () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        writable: true
      });

      const result = await manager.isAvailable();
      expect(result).toBe(false);
    });

    it('should return false when Web Crypto is not available', async () => {
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true
      });

      const result = await manager.isAvailable();
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Mock navigator.mediaDevices to be missing
      const originalMediaDevices = navigator.mediaDevices;
      delete navigator.mediaDevices;

      const result = await manager.isAvailable();
      expect(result).toBe(false);

      // Restore
      navigator.mediaDevices = originalMediaDevices;
    });
  });

  describe('startVerification', () => {
    it('should throw error when verification is not available', async () => {
      jest.spyOn(manager, 'isAvailable').mockResolvedValue(false);

      await expect(manager.startVerification()).rejects.toThrow(
        'Age verification not available on this device'
      );
    });

    it('should start biometric verification', async () => {
      jest.spyOn(manager, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(manager, '_performBiometricVerification').mockResolvedValue({
        id: 'test-id',
        method: 'biometric',
        verified: true,
        estimatedAge: 25,
        confidence: 0.8,
        timestamp: Date.now(),
        cryptographicProof: 'test-proof'
      });

      const result = await manager.startVerification({ method: 'biometric' });

      expect(result.method).toBe('biometric');
      expect(result.verified).toBe(true);
      expect(manager._performBiometricVerification).toHaveBeenCalled();
    });

    it('should start document verification', async () => {
      jest.spyOn(manager, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(manager, '_performDocumentVerification').mockResolvedValue({
        id: 'test-id',
        method: 'document',
        verified: true,
        age: 25,
        confidence: 0.9,
        timestamp: Date.now(),
        cryptographicProof: 'test-proof'
      });

      const result = await manager.startVerification({ method: 'document' });

      expect(result.method).toBe('document');
      expect(result.verified).toBe(true);
      expect(manager._performDocumentVerification).toHaveBeenCalled();
    });

    it('should start device settings verification', async () => {
      jest.spyOn(manager, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(manager, '_performDeviceSettingsVerification').mockResolvedValue({
        id: 'test-id',
        method: 'device_settings',
        verified: true,
        deviceAge: 'verified',
        confidence: 0.8,
        timestamp: Date.now(),
        cryptographicProof: 'test-proof'
      });

      const result = await manager.startVerification({ method: 'device_settings' });

      expect(result.method).toBe('device_settings');
      expect(result.verified).toBe(true);
      expect(manager._performDeviceSettingsVerification).toHaveBeenCalled();
    });

    it('should start multi-factor verification', async () => {
      jest.spyOn(manager, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(manager, '_performMultiFactorVerification').mockResolvedValue({
        id: 'test-id',
        method: 'multi_factor',
        verified: true,
        factors: [
          { type: 'biometric', confidence: 0.8, weight: 0.4 },
          { type: 'device_settings', confidence: 0.9, weight: 0.3 }
        ],
        confidence: 0.85,
        level: 'high',
        timestamp: Date.now(),
        cryptographicProof: 'test-proof'
      });

      const result = await manager.startVerification({ method: 'multi_factor' });

      expect(result.method).toBe('multi_factor');
      expect(result.verified).toBe(true);
      expect(manager._performMultiFactorVerification).toHaveBeenCalled();
    });

    it('should throw error for unknown method', async () => {
      jest.spyOn(manager, 'isAvailable').mockResolvedValue(true);

      await expect(manager.startVerification({ method: 'unknown' })).rejects.toThrow(
        'Unknown verification method: unknown'
      );
    });

    it('should handle verification errors', async () => {
      jest.spyOn(manager, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(manager, '_performBiometricVerification').mockRejectedValue(
        new Error('Biometric verification failed')
      );

      const onError = jest.fn();
      manager.onError(onError);

      await expect(manager.startVerification({ method: 'biometric' })).rejects.toThrow(
        'Biometric verification failed'
      );

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('_performBiometricVerification', () => {
    beforeEach(() => {
      // Mock video element
      const mockVideo = {
        addEventListener: jest.fn(),
        play: jest.fn().mockResolvedValue(),
        srcObject: null
      };

      global.document = {
        createElement: jest.fn().mockReturnValue(mockVideo)
      };

      // Mock getUserMedia
      const mockStream = {
        getTracks: jest.fn().mockReturnValue([
          { stop: jest.fn() }
        ])
      };
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);
    });

    it('should perform biometric verification successfully', async () => {
      // Mock navigator.mediaDevices if it doesn't exist
      if (!navigator.mediaDevices) {
        navigator.mediaDevices = {};
      }
      navigator.mediaDevices.getUserMedia = mockMediaDevices.getUserMedia;
      
      // Mock document.createElement to return a properly mocked video element
      const mockVideo = {
        addEventListener: jest.fn((event, callback) => {
          if (event === 'loadedmetadata') {
            setTimeout(callback, 0);
          }
        }),
        play: jest.fn().mockResolvedValue(),
        srcObject: null
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockVideo);

      const result = await manager._performBiometricVerification('test-id');

      expect(result.id).toBe('test-id');
      expect(result.method).toBe('biometric');
      expect(result.estimatedAge).toBeGreaterThanOrEqual(18);
      expect(result.estimatedAge).toBeLessThanOrEqual(32);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
      expect(result.verified).toBeDefined();
      expect(result.cryptographicProof).toBeDefined();
    });

    it('should handle camera access errors', async () => {
      // Mock navigator.mediaDevices if it doesn't exist
      if (!navigator.mediaDevices) {
        navigator.mediaDevices = {};
      }
      navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(new Error('Camera access denied'));

      await expect(manager._performBiometricVerification('test-id')).rejects.toThrow(
        'Biometric verification failed: Camera access denied'
      );
    });
  });

  describe('_performDocumentVerification', () => {
    it('should perform document verification successfully', async () => {
      const result = await manager._performDocumentVerification('test-id');

      expect(result.id).toBe('test-id');
      expect(result.method).toBe('document');
      expect(result.verified).toBeDefined();
      expect(result.age).toBeGreaterThanOrEqual(18);
      expect(result.documentType).toBe('drivers_license');
      expect(result.confidence).toBe(0.9);
      expect(result.cryptographicProof).toBeDefined();
    });
  });

  describe('_performDeviceSettingsVerification', () => {
    it('should perform device settings verification successfully', async () => {
      const result = await manager._performDeviceSettingsVerification('test-id');

      expect(result.id).toBe('test-id');
      expect(result.method).toBe('device_settings');
      expect(result.verified).toBe(true);
      expect(result.deviceAge).toBe('verified');
      expect(result.confidence).toBe(0.8);
      expect(result.cryptographicProof).toBeDefined();
    });
  });

  describe('_performMultiFactorVerification', () => {
    it('should perform multi-factor verification successfully', async () => {
      jest.spyOn(manager, '_performBiometricVerification').mockResolvedValue({
        id: 'test-id_bio',
        method: 'biometric',
        confidence: 0.8
      });

      jest.spyOn(manager, '_performDeviceSettingsVerification').mockResolvedValue({
        id: 'test-id_device',
        method: 'device_settings',
        confidence: 0.9
      });

      jest.spyOn(manager, '_performBehavioralVerification').mockResolvedValue({
        id: 'test-id_behavior',
        method: 'behavioral',
        confidence: 0.85
      });

      const result = await manager._performMultiFactorVerification('test-id');

      expect(result.id).toBe('test-id');
      expect(result.method).toBe('multi_factor');
      expect(result.factors).toHaveLength(3);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.level).toBe('standard');
      expect(result.verified).toBe(true);
    });

    it('should handle partial factor failures', async () => {
      jest.spyOn(manager, '_performBiometricVerification').mockRejectedValue(
        new Error('Biometric failed')
      );

      jest.spyOn(manager, '_performDeviceSettingsVerification').mockResolvedValue({
        id: 'test-id_device',
        method: 'device_settings',
        confidence: 0.9
      });

      jest.spyOn(manager, '_performBehavioralVerification').mockResolvedValue({
        id: 'test-id_behavior',
        method: 'behavioral',
        confidence: 0.85
      });

      const result = await manager._performMultiFactorVerification('test-id');

      expect(result.factors).toHaveLength(2);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle all factors failing', async () => {
      jest.spyOn(manager, '_performBiometricVerification').mockRejectedValue(
        new Error('Biometric failed')
      );

      jest.spyOn(manager, '_performDeviceSettingsVerification').mockRejectedValue(
        new Error('Device settings failed')
      );

      jest.spyOn(manager, '_performBehavioralVerification').mockRejectedValue(
        new Error('Behavioral failed')
      );

      await expect(manager._performMultiFactorVerification('test-id')).rejects.toThrow(
        'Multi-factor verification failed: All verification factors failed'
      );
    });
  });

  describe('getVerificationStatus', () => {
    it('should return default status when no verification history', () => {
      const status = manager.getVerificationStatus();

      expect(status.isVerified).toBe(false);
      expect(status.verificationLevel).toBe('none');
      expect(status.lastVerified).toBeNull();
      expect(status.methods).toEqual([]);
      expect(status.confidence).toBe(0);
    });

    it('should return latest verification status', () => {
      const mockVerification = {
        verified: true,
        level: 'high',
        timestamp: Date.now(),
        methods: ['biometric', 'document'],
        confidence: 0.9
      };

      manager.verificationHistory.push(mockVerification);

      const status = manager.getVerificationStatus();

      expect(status.isVerified).toBe(true);
      expect(status.verificationLevel).toBe('high');
      expect(status.lastVerified).toBe(mockVerification.timestamp);
      expect(status.methods).toEqual(['biometric', 'document']);
      expect(status.confidence).toBe(0.9);
    });
  });

  describe('getVerificationProof', () => {
    it('should return null when not verified', () => {
      const proof = manager.getVerificationProof();
      expect(proof).toBeNull();
    });

    it('should return anonymous proof when verified', () => {
      const mockVerification = {
        verified: true,
        level: 'high',
        confidence: 0.9,
        timestamp: Date.now(),
        cryptographicProof: 'test-proof'
      };

      manager.verificationHistory.push(mockVerification);

      const proof = manager.getVerificationProof();

      expect(proof).toEqual({
        verified: true,
        level: 'high',
        confidence: 0.9,
        timestamp: mockVerification.timestamp,
        proof: 'test-proof',
        deviceId: manager.deviceId
      });
    });
  });

  describe('_generateCryptographicProof', () => {
    it('should generate cryptographic proof', async () => {
      const data = { test: 'data' };
      const proof = await manager._generateCryptographicProof(data);

      expect(proof).toBeDefined();
      expect(typeof proof).toBe('string');
      expect(proof.length).toBeGreaterThan(0);
    });

    it('should handle crypto errors gracefully', async () => {
      mockCrypto.subtle.digest.mockRejectedValue(new Error('Crypto error'));

      const data = { test: 'data' };
      const proof = await manager._generateCryptographicProof(data);

      expect(proof).toBeDefined();
      expect(proof.startsWith('proof_')).toBe(true);
    });
  });

  describe('_calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = '1995-06-15';
      const age = manager._calculateAge(birthDate);

      expect(age).toBeGreaterThan(18);
      expect(age).toBeLessThan(50);
    });

    it('should handle edge case dates', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      const age = manager._calculateAge(yesterdayString);
      expect(age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('_determineVerificationLevel', () => {
    it('should determine high level verification', () => {
      const level = manager._determineVerificationLevel(0.9, 3);
      expect(level).toBe('high');
    });

    it('should determine standard level verification', () => {
      const level = manager._determineVerificationLevel(0.8, 2);
      expect(level).toBe('standard');
    });

    it('should determine basic level verification', () => {
      const level = manager._determineVerificationLevel(0.7, 1);
      expect(level).toBe('basic');
    });

    it('should determine none level verification', () => {
      const level = manager._determineVerificationLevel(0.5, 1);
      expect(level).toBe('none');
    });
  });

  describe('event handlers', () => {
    it('should set up event callbacks', () => {
      const onComplete = jest.fn();
      const onFailed = jest.fn();
      const onStatusChange = jest.fn();
      const onError = jest.fn();

      manager.onVerificationComplete(onComplete);
      manager.onVerificationFailed(onFailed);
      manager.onStatusChange(onStatusChange);
      manager.onError(onError);

      expect(manager.callbacks.onVerificationComplete).toBe(onComplete);
      expect(manager.callbacks.onVerificationFailed).toBe(onFailed);
      expect(manager.callbacks.onStatusChange).toBe(onStatusChange);
      expect(manager.callbacks.onError).toBe(onError);
    });

    it('should notify verification complete', () => {
      const onComplete = jest.fn();
      manager.onVerificationComplete(onComplete);

      const result = { verified: true };
      manager._notifyVerificationComplete(result);

      expect(onComplete).toHaveBeenCalledWith(result);
    });

    it('should notify verification failed', () => {
      const onFailed = jest.fn();
      manager.onVerificationFailed(onFailed);

      const error = new Error('Test error');
      manager._notifyVerificationFailed(error);

      expect(onFailed).toHaveBeenCalledWith(error);
    });

    it('should notify status change', () => {
      const onStatusChange = jest.fn();
      manager.onStatusChange(onStatusChange);

      manager._notifyStatusChange('verifying');

      expect(onStatusChange).toHaveBeenCalledWith('verifying');
    });

    it('should handle errors', () => {
      const onError = jest.fn();
      manager.onError(onError);

      const error = new Error('Test error');
      manager._handleError(error);

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('clearVerificationData', () => {
    it('should clear verification history', async () => {
      manager.verificationHistory.push({ test: 'data' });
      
      await manager.clearVerificationData();
      
      expect(manager.verificationHistory).toEqual([]);
    });

    it('should handle IndexedDB errors gracefully', async () => {
      mockIndexedDB.open.mockReturnValue({
        onsuccess: jest.fn().mockImplementation((callback) => {
          // Simulate error
          setTimeout(() => callback(new Error('DB error')), 0);
        })
      });

      // Should not throw
      await expect(manager.clearVerificationData()).resolves.toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('should cleanup all resources', () => {
      const onComplete = jest.fn();
      manager.onVerificationComplete(onComplete);
      
      manager.verificationHistory.push({ test: 'data' });
      manager.verificationMethods.set('test', 'data');

      manager.destroy();

      expect(manager.callbacks.onVerificationComplete).toBeNull();
      expect(manager.verificationHistory).toEqual([]);
      expect(manager.verificationMethods.size).toBe(0);
    });
  });
});
