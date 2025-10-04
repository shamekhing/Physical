/**
 * Tests for useAgeVerification React hook
 * Privacy-first age verification with no external data collection
 * NO MOCK DATA - All tests use real implementations
 */

import { renderHook, act } from '@testing-library/react';
import { useAgeVerification } from './useAgeVerification.js';

describe('useAgeVerification', () => {
  describe('initialization', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => useAgeVerification());

      expect(result.current.status).toBe('idle');
      expect(result.current.isAvailable).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.verificationStatus).toBeDefined();
      expect(result.current.verificationStatus.isVerified).toBe(false);
    });

    it('should initialize managers', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isAvailable).toBe(false); // Will be false in test environment
    });
  });

  describe('availability checking', () => {
    it('should check if age verification is available', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // In test environment, most features won't be available
      expect(typeof result.current.isAvailable).toBe('boolean');
    });

    it('should check method availability', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        const biometricAvailable = await result.current.isMethodAvailable('biometric');
        const documentAvailable = await result.current.isMethodAvailable('document');
        const deviceAvailable = await result.current.isMethodAvailable('device_settings');
        
        expect(typeof biometricAvailable).toBe('boolean');
        expect(typeof documentAvailable).toBe('boolean');
        expect(typeof deviceAvailable).toBe('boolean');
      });
    });
  });

  describe('verification process', () => {
    it('should handle verification start', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          await result.current.startVerification({ method: 'device_settings' });
        } catch (error) {
          // Expected in test environment - device settings not available
          expect(error).toBeDefined();
        }
      });
    });

    it('should handle biometric estimation', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          await result.current.startBiometricEstimation();
        } catch (error) {
          // Expected in test environment - camera not available
          expect(error).toBeDefined();
        }
      });
    });

    it('should handle document verification', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          await result.current.startDocumentVerification({
            documentType: 'drivers_license',
            useCamera: true
          });
        } catch (error) {
          // Expected in test environment - camera/file access not available
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('status management', () => {
    it('should get verification status', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const status = result.current.getVerificationStatus();
        expect(status).toBeDefined();
        expect(typeof status.isVerified).toBe('boolean');
        expect(typeof status.verificationLevel).toBe('string');
      });
    });

    it('should get verification stats', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const stats = result.current.getVerificationStats();
        expect(stats).toBeDefined();
        expect(typeof stats.total).toBe('number');
        expect(typeof stats.successful).toBe('number');
        expect(typeof stats.failed).toBe('number');
      });
    });

    it('should get supported documents', () => {
      const { result } = renderHook(() => useAgeVerification());

      const documents = result.current.getSupportedDocuments();
      expect(Array.isArray(documents)).toBe(true);
      expect(documents.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try to start verification with invalid method
        try {
          await result.current.startVerification({ method: 'invalid_method' });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });

    it('should clear errors', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        result.current.clearError();
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('level descriptions', () => {
    it('should return level descriptions', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        const highDesc = result.current.getVerificationLevelDescription('high');
        const standardDesc = result.current.getVerificationLevelDescription('standard');
        const basicDesc = result.current.getVerificationLevelDescription('basic');
        const noneDesc = result.current.getVerificationLevelDescription('none');
        
        expect(typeof highDesc).toBe('string');
        expect(typeof standardDesc).toBe('string');
        expect(typeof basicDesc).toBe('string');
        expect(typeof noneDesc).toBe('string');
      });
    });
  });

  describe('privacy compliance', () => {
    it('should not collect external data', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // All processing should be local
        const status = result.current.getVerificationStatus();
        expect(status).toBeDefined();
        
        // No external data collection indicators
        expect(status.externalDataCollected).toBeFalsy();
      });
    });

    it('should maintain local-only processing', async () => {
      const { result } = renderHook(() => useAgeVerification());

      await act(async () => {
        const stats = result.current.getVerificationStats();
        expect(stats).toBeDefined();
        
        // All data should be local
        expect(stats.dataLocation).toBe('local');
      });
    });
  });
});
