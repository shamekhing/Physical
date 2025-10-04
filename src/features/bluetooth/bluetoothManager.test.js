/**
 * Tests for BluetoothManager
 */

import { BluetoothManager } from './bluetoothManager.js';

// Mock Web Bluetooth API
const mockBluetoothDevice = {
  id: 'test-device-123',
  name: 'Test Device',
  gatt: {
    connected: true,
    connect: jest.fn().mockResolvedValue(),
    getPrimaryService: jest.fn().mockResolvedValue({
      getCharacteristic: jest.fn().mockResolvedValue({
        startNotifications: jest.fn().mockResolvedValue(),
        addEventListener: jest.fn()
      })
    })
  },
  addEventListener: jest.fn()
};

const mockNavigator = {
  bluetooth: {
    getAvailability: jest.fn().mockResolvedValue(true),
    requestDevice: jest.fn().mockResolvedValue(mockBluetoothDevice)
  }
};

// Store original navigator
const originalNavigator = global.navigator;

describe('BluetoothManager', () => {
  let bluetoothManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset navigator mock to default state
    mockNavigator.bluetooth.getAvailability.mockResolvedValue(true);
    mockNavigator.bluetooth.requestDevice.mockResolvedValue(mockBluetoothDevice);
    
    // Mock navigator
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    bluetoothManager = new BluetoothManager();
  });

  afterEach(() => {
    if (bluetoothManager) {
      bluetoothManager.destroy();
    }
    
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true
    });
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(bluetoothManager.isScanning).toBe(false);
      expect(bluetoothManager.deviceId).toMatch(/^device_[a-z0-9]{9}_\d+$/);
      expect(bluetoothManager.nearbyDevices).toBeInstanceOf(Map);
      expect(bluetoothManager.nearbyDevices.size).toBe(0);
    });

    it('should initialize callbacks as null', () => {
      expect(bluetoothManager.callbacks.onDeviceFound).toBeNull();
      expect(bluetoothManager.callbacks.onDeviceLost).toBeNull();
      expect(bluetoothManager.callbacks.onError).toBeNull();
      expect(bluetoothManager.callbacks.onStatusChange).toBeNull();
    });
  });

  describe('isAvailable', () => {
    it('should return true when Bluetooth is available', async () => {
      mockNavigator.bluetooth.getAvailability.mockResolvedValue(true);
      
      const result = await bluetoothManager.isAvailable();
      
      expect(result).toBe(true);
      expect(mockNavigator.bluetooth.getAvailability).toHaveBeenCalled();
    });

    it('should return false when Bluetooth is not available', async () => {
      mockNavigator.bluetooth.getAvailability.mockResolvedValue(false);
      
      const result = await bluetoothManager.isAvailable();
      
      expect(result).toBe(false);
    });

    it('should return false when navigator.bluetooth is not available', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {},
        writable: true
      });

      const result = await bluetoothManager.isAvailable();
      
      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      // Override the mock for this specific test
      mockNavigator.bluetooth.getAvailability.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await bluetoothManager.isAvailable();
      
      expect(result).toBe(false);
    });
  });

  describe('startScanning', () => {
    it('should start scanning successfully', async () => {
      const onStatusChange = jest.fn();
      bluetoothManager.onStatusChange(onStatusChange);

      const result = await bluetoothManager.startScanning();

      expect(result).toBe(true);
      expect(bluetoothManager.isScanning).toBe(true);
      expect(onStatusChange).toHaveBeenCalledWith('scanning');
      expect(mockNavigator.bluetooth.requestDevice).toHaveBeenCalled();
    });

    it('should return true if already scanning', async () => {
      bluetoothManager.isScanning = true;
      
      const result = await bluetoothManager.startScanning();
      
      expect(result).toBe(true);
      expect(mockNavigator.bluetooth.requestDevice).not.toHaveBeenCalled();
    });

    it('should handle NotFoundError', async () => {
      mockNavigator.bluetooth.requestDevice.mockRejectedValue({
        name: 'NotFoundError',
        message: 'No device found'
      });

      const onError = jest.fn();
      const onStatusChange = jest.fn();
      bluetoothManager.onError(onError);
      bluetoothManager.onStatusChange(onStatusChange);

      const result = await bluetoothManager.startScanning();

      expect(result).toBe(true); // NotFoundError is handled gracefully, so scanning continues
      expect(bluetoothManager.isScanning).toBe(true);
      expect(onStatusChange).toHaveBeenCalledWith('scanning');
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle SecurityError', async () => {
      mockNavigator.bluetooth.requestDevice.mockRejectedValue({
        name: 'SecurityError',
        message: 'Permission denied'
      });

      const onError = jest.fn();
      const onStatusChange = jest.fn();
      bluetoothManager.onError(onError);
      bluetoothManager.onStatusChange(onStatusChange);

      const result = await bluetoothManager.startScanning();

      expect(result).toBe(false);
      expect(bluetoothManager.isScanning).toBe(false);
      expect(onStatusChange).toHaveBeenCalledWith('stopped');
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        name: 'SecurityError',
        message: 'Permission denied'
      }));
    });

    it('should handle other errors', async () => {
      mockNavigator.bluetooth.requestDevice.mockRejectedValue(new Error('Unknown error'));

      const onError = jest.fn();
      const onStatusChange = jest.fn();
      bluetoothManager.onError(onError);
      bluetoothManager.onStatusChange(onStatusChange);

      const result = await bluetoothManager.startScanning();

      expect(result).toBe(false);
      expect(bluetoothManager.isScanning).toBe(false);
      expect(onStatusChange).toHaveBeenCalledWith('stopped');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('stopScanning', () => {
    it('should stop scanning and clear devices', () => {
      bluetoothManager.isScanning = true;
      bluetoothManager.nearbyDevices.set('test-device', { id: 'test-device' });
      
      const onStatusChange = jest.fn();
      bluetoothManager.onStatusChange(onStatusChange);

      bluetoothManager.stopScanning();

      expect(bluetoothManager.isScanning).toBe(false);
      expect(bluetoothManager.nearbyDevices.size).toBe(0);
      expect(onStatusChange).toHaveBeenCalledWith('stopped');
    });

    it('should do nothing if not scanning', () => {
      const onStatusChange = jest.fn();
      bluetoothManager.onStatusChange(onStatusChange);

      bluetoothManager.stopScanning();

      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('event callbacks', () => {
    it('should set onDeviceFound callback', () => {
      const callback = jest.fn();
      
      bluetoothManager.onDeviceFound(callback);
      
      expect(bluetoothManager.callbacks.onDeviceFound).toBe(callback);
    });

    it('should set onDeviceLost callback', () => {
      const callback = jest.fn();
      
      bluetoothManager.onDeviceLost(callback);
      
      expect(bluetoothManager.callbacks.onDeviceLost).toBe(callback);
    });

    it('should set onError callback', () => {
      const callback = jest.fn();
      
      bluetoothManager.onError(callback);
      
      expect(bluetoothManager.callbacks.onError).toBe(callback);
    });

    it('should set onStatusChange callback', () => {
      const callback = jest.fn();
      
      bluetoothManager.onStatusChange(callback);
      
      expect(bluetoothManager.callbacks.onStatusChange).toBe(callback);
    });
  });

  describe('getNearbyDevices', () => {
    it('should return array of nearby devices', () => {
      const device1 = { id: 'device1', name: 'Device 1' };
      const device2 = { id: 'device2', name: 'Device 2' };
      
      bluetoothManager.nearbyDevices.set('device1', device1);
      bluetoothManager.nearbyDevices.set('device2', device2);
      
      const devices = bluetoothManager.getNearbyDevices();
      
      expect(devices).toHaveLength(2);
      expect(devices).toContain(device1);
      expect(devices).toContain(device2);
    });

    it('should return empty array when no devices', () => {
      const devices = bluetoothManager.getNearbyDevices();
      
      expect(devices).toHaveLength(0);
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('getScanningStatus', () => {
    it('should return current scanning status', () => {
      expect(bluetoothManager.getScanningStatus()).toBe(false);
      
      bluetoothManager.isScanning = true;
      expect(bluetoothManager.getScanningStatus()).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      bluetoothManager.isScanning = true;
      bluetoothManager.nearbyDevices.set('test', { id: 'test' });
      bluetoothManager.onDeviceFound(() => {});
      bluetoothManager.onDeviceLost(() => {});
      bluetoothManager.onError(() => {});
      bluetoothManager.onStatusChange(() => {});

      bluetoothManager.destroy();

      expect(bluetoothManager.isScanning).toBe(false);
      expect(bluetoothManager.nearbyDevices.size).toBe(0);
      expect(bluetoothManager.callbacks.onDeviceFound).toBeNull();
      expect(bluetoothManager.callbacks.onDeviceLost).toBeNull();
      expect(bluetoothManager.callbacks.onError).toBeNull();
      expect(bluetoothManager.callbacks.onStatusChange).toBeNull();
    });
  });

  describe('_calculateDistanceFromRSSI', () => {
    it('should return -1 for rssi of 0', () => {
      const distance = bluetoothManager._calculateDistanceFromRSSI(0);
      expect(distance).toBe(-1);
    });

    it('should calculate distance for valid rssi', () => {
      const rssi = -50;
      const distance = bluetoothManager._calculateDistanceFromRSSI(rssi);
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });
  });
});
