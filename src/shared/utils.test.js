/**
 * Tests for utility functions
 */

import { 
  isBluetoothSupported, 
  isWebBluetoothAvailable, 
  generateDeviceId, 
  calculateDistance, 
  formatDistance, 
  debounce, 
  isWithinRange 
} from './utils.js';

// Mock navigator for testing
const mockNavigator = {
  bluetooth: {
    requestDevice: jest.fn()
  }
};

describe('Utils', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('isBluetoothSupported', () => {
    it('should return true when bluetooth is in navigator', () => {
      Object.defineProperty(window, 'navigator', {
        value: mockNavigator,
        writable: true
      });

      expect(isBluetoothSupported()).toBe(true);
    });

    it('should return false when bluetooth is not in navigator', () => {
      Object.defineProperty(window, 'navigator', {
        value: {},
        writable: true
      });

      expect(isBluetoothSupported()).toBe(false);
    });
  });

  describe('isWebBluetoothAvailable', () => {
    it('should return true when both bluetooth and requestDevice are available', () => {
      Object.defineProperty(window, 'navigator', {
        value: mockNavigator,
        writable: true
      });

      expect(isWebBluetoothAvailable()).toBe(true);
    });

    it('should return false when bluetooth is not supported', () => {
      Object.defineProperty(window, 'navigator', {
        value: {},
        writable: true
      });

      expect(isWebBluetoothAvailable()).toBe(false);
    });

    it('should return false when requestDevice is not available', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          bluetooth: {}
        },
        writable: true
      });

      expect(isWebBluetoothAvailable()).toBe(false);
    });
  });

  describe('generateDeviceId', () => {
    it('should generate a unique device ID', () => {
      const id1 = generateDeviceId();
      const id2 = generateDeviceId();

      expect(id1).toMatch(/^device_[a-z0-9]{9}_\d+$/);
      expect(id2).toMatch(/^device_[a-z0-9]{9}_\d+$/);
      expect(id1).not.toBe(id2);
    });

    it('should start with device_ prefix', () => {
      const id = generateDeviceId();
      expect(id).toMatch(/^device_/);
    });
  });

  describe('calculateDistance', () => {
    it('should return -1 for rssi of 0', () => {
      expect(calculateDistance(0)).toBe(-1.0);
    });

    it('should calculate distance for ratio < 1', () => {
      const rssi = -30;
      const txPower = -59;
      const expected = Math.pow(rssi / txPower, 10);
      
      expect(calculateDistance(rssi, txPower)).toBe(expected);
    });

    it('should calculate distance for ratio >= 1', () => {
      const rssi = -50;
      const txPower = -60;
      const ratio = rssi / txPower;
      const expected = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
      
      expect(calculateDistance(rssi, txPower)).toBeCloseTo(expected, 3);
    });

    it('should use default txPower when not provided', () => {
      const rssi = -30;
      const result1 = calculateDistance(rssi);
      const result2 = calculateDistance(rssi, -59);
      
      expect(result1).toBe(result2);
    });
  });

  describe('formatDistance', () => {
    it('should return "Unknown" for negative distance', () => {
      expect(formatDistance(-1)).toBe('Unknown');
      expect(formatDistance(-5)).toBe('Unknown');
    });

    it('should format distance in cm for values < 1m', () => {
      expect(formatDistance(0.5)).toBe('50cm');
      expect(formatDistance(0.25)).toBe('25cm');
    });

    it('should format distance in meters for values < 1000m', () => {
      expect(formatDistance(5)).toBe('5m');
      expect(formatDistance(25)).toBe('25m');
      expect(formatDistance(999)).toBe('999m');
    });

    it('should format distance in kilometers for values >= 1000m', () => {
      expect(formatDistance(1000)).toBe('1.0km');
      expect(formatDistance(2500)).toBe('2.5km');
      expect(formatDistance(15000)).toBe('15.0km');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should reset delay on multiple calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn();
      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('isWithinRange', () => {
    it('should return true for valid distances within range', () => {
      expect(isWithinRange(5, 50)).toBe(true);
      expect(isWithinRange(25, 50)).toBe(true);
      expect(isWithinRange(50, 50)).toBe(true);
    });

    it('should return false for distances outside range', () => {
      expect(isWithinRange(60, 50)).toBe(false);
      expect(isWithinRange(100, 50)).toBe(false);
    });

    it('should return false for invalid distances', () => {
      expect(isWithinRange(0, 50)).toBe(false);
      expect(isWithinRange(-1, 50)).toBe(false);
    });

    it('should use default maxRange of 50 when not provided', () => {
      expect(isWithinRange(30)).toBe(true);
      expect(isWithinRange(60)).toBe(false);
    });
  });
});
