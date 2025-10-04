/**
 * Tests for useBluetooth hook
 */

import { renderHook, act } from '@testing-library/react';
import { useBluetooth } from './useBluetooth.js';
import { BluetoothManager } from './bluetoothManager.js';

// Mock the BluetoothManager
jest.mock('./bluetoothManager.js');

describe('useBluetooth', () => {
  let mockBluetoothManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock BluetoothManager instance
    mockBluetoothManager = {
      isAvailable: jest.fn(),
      onDeviceFound: jest.fn(),
      onDeviceLost: jest.fn(),
      onError: jest.fn(),
      onStatusChange: jest.fn(),
      destroy: jest.fn(),
      startScanning: jest.fn(),
      stopScanning: jest.fn()
    };

    // Mock BluetoothManager constructor
    BluetoothManager.mockImplementation(() => mockBluetoothManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    expect(result.current.isSupported).toBe(false); // Initially false until async check
    expect(result.current.isScanning).toBe(false);
    expect(result.current.nearbyDevices).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.status).toBe('idle');
    expect(result.current.deviceCount).toBe(0);
    expect(result.current.hasDevices).toBe(false);
    expect(result.current.canScan).toBe(false);
  });

  it('should set up Bluetooth manager and check availability', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    // Wait for async initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(BluetoothManager).toHaveBeenCalled();
    expect(mockBluetoothManager.isAvailable).toHaveBeenCalled();
    expect(mockBluetoothManager.onDeviceFound).toHaveBeenCalled();
    expect(mockBluetoothManager.onDeviceLost).toHaveBeenCalled();
    expect(mockBluetoothManager.onError).toHaveBeenCalled();
    expect(mockBluetoothManager.onStatusChange).toHaveBeenCalled();
  });

  it('should handle Bluetooth not available', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(false);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Bluetooth is not supported or available on this device');
    expect(result.current.status).toBe('error');
  });

  it('should handle Bluetooth initialization error', async () => {
    mockBluetoothManager.isAvailable.mockRejectedValue(new Error('Init error'));

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Failed to initialize Bluetooth');
    expect(result.current.status).toBe('error');
  });

  it('should start scanning when startScanning is called', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);
    mockBluetoothManager.startScanning.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.startScanning();
    });

    expect(mockBluetoothManager.startScanning).toHaveBeenCalled();
  });

  it('should handle startScanning failure', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);
    mockBluetoothManager.startScanning.mockResolvedValue(false);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.startScanning();
    });

    expect(result.current.error).toBe('Failed to start scanning');
    expect(result.current.status).toBe('error');
  });

  it('should stop scanning when stopScanning is called', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.stopScanning();
    });

    expect(mockBluetoothManager.stopScanning).toHaveBeenCalled();
  });

  it('should clear devices when clearDevices is called', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Add a device first
    act(() => {
      const onDeviceFound = mockBluetoothManager.onDeviceFound.mock.calls[0][0];
      onDeviceFound({ id: 'test-device', name: 'Test Device', distance: 10 });
    });

    expect(result.current.nearbyDevices).toHaveLength(1);

    // Clear devices
    act(() => {
      result.current.clearDevices();
    });

    expect(result.current.nearbyDevices).toHaveLength(0);
  });

  it('should handle device found events', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const testDevice = {
      id: 'test-device',
      name: 'Test Device',
      distance: 15,
      rssi: -50,
      lastSeen: new Date(),
      connected: true
    };

    act(() => {
      const onDeviceFound = mockBluetoothManager.onDeviceFound.mock.calls[0][0];
      onDeviceFound(testDevice);
    });

    expect(result.current.nearbyDevices).toHaveLength(1);
    expect(result.current.nearbyDevices[0]).toEqual({
      ...testDevice,
      distanceFormatted: '15m'
    });
    expect(result.current.deviceCount).toBe(1);
    expect(result.current.hasDevices).toBe(true);
  });

  it('should handle device lost events', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Add a device first
    act(() => {
      const onDeviceFound = mockBluetoothManager.onDeviceFound.mock.calls[0][0];
      onDeviceFound({ id: 'test-device', name: 'Test Device', distance: 10 });
    });

    expect(result.current.nearbyDevices).toHaveLength(1);

    // Remove the device
    act(() => {
      const onDeviceLost = mockBluetoothManager.onDeviceLost.mock.calls[0][0];
      onDeviceLost('test-device');
    });

    expect(result.current.nearbyDevices).toHaveLength(0);
  });

  it('should handle error events', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      const onError = mockBluetoothManager.onError.mock.calls[0][0];
      onError(new Error('Test error'));
    });

    expect(result.current.error).toBe('Test error');
    expect(result.current.status).toBe('error');
    expect(result.current.isScanning).toBe(false);
  });

  it('should handle status change events', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      const onStatusChange = mockBluetoothManager.onStatusChange.mock.calls[0][0];
      onStatusChange('scanning');
    });

    expect(result.current.status).toBe('scanning');
    expect(result.current.isScanning).toBe(true);
  });

  it('should get devices in range correctly', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { result } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Add devices at different distances
    act(() => {
      const onDeviceFound = mockBluetoothManager.onDeviceFound.mock.calls[0][0];
      onDeviceFound({ id: 'device1', name: 'Device 1', distance: 5 });
      onDeviceFound({ id: 'device2', name: 'Device 2', distance: 15 });
      onDeviceFound({ id: 'device3', name: 'Device 3', distance: 30 });
    });

    expect(result.current.getDevicesInRange(10)).toHaveLength(1);
    expect(result.current.getDevicesInRange(20)).toHaveLength(2);
    expect(result.current.getDevicesInRange(50)).toHaveLength(3);
  });

  it('should clean up on unmount', async () => {
    mockBluetoothManager.isAvailable.mockResolvedValue(true);

    const { unmount } = renderHook(() => useBluetooth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    unmount();

    expect(mockBluetoothManager.destroy).toHaveBeenCalled();
  });
});
