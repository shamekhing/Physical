/**
 * Tests for BluetoothProximity component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BluetoothProximity from './BluetoothProximity.js';
import { useBluetooth } from '../features/bluetooth/useBluetooth.js';

// Mock the useBluetooth hook
jest.mock('../features/bluetooth/useBluetooth.js');

describe('BluetoothProximity', () => {
  const mockUseBluetooth = useBluetooth;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Bluetooth not supported message when Bluetooth is not supported', () => {
    mockUseBluetooth.mockReturnValue({
      isSupported: false,
      isScanning: false,
      nearbyDevices: [],
      error: null,
      status: 'idle',
      deviceCount: 0,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: false
    });

    render(<BluetoothProximity />);

    expect(screen.getByText('🔵 Bluetooth Proximity Detection')).toBeInTheDocument();
    expect(screen.getByText('Bluetooth Not Supported')).toBeInTheDocument();
    expect(screen.getByText(/Bluetooth is not supported or available/)).toBeInTheDocument();
  });

  it('should render main interface when Bluetooth is supported', () => {
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: false,
      nearbyDevices: [],
      error: null,
      status: 'idle',
      deviceCount: 0,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: true
    });

    render(<BluetoothProximity />);

    expect(screen.getByText('🔵 Bluetooth Proximity Detection')).toBeInTheDocument();
    expect(screen.getByText('Ready to scan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Scanning/i })).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: false,
      nearbyDevices: [],
      error: 'Test error message',
      status: 'error',
      deviceCount: 0,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: false
    });

    render(<BluetoothProximity />);

    expect(screen.getByText(/Error: Test error message/)).toBeInTheDocument();
  });

  it('should show scanning status when scanning', () => {
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: true,
      nearbyDevices: [],
      error: null,
      status: 'scanning',
      deviceCount: 0,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: false
    });

    render(<BluetoothProximity />);

    expect(screen.getByText('Scanning for devices...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scanning.../i })).toBeDisabled();
  });

  it('should call startScanning when Start Scanning button is clicked', async () => {
    const mockStartScanning = jest.fn();
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: false,
      nearbyDevices: [],
      error: null,
      status: 'idle',
      deviceCount: 0,
      startScanning: mockStartScanning,
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: true
    });

    render(<BluetoothProximity />);

    const startButton = screen.getByRole('button', { name: /Start Scanning/i });
    fireEvent.click(startButton);

    expect(mockStartScanning).toHaveBeenCalled();
  });

  it('should call stopScanning when Stop Scanning button is clicked', () => {
    const mockStopScanning = jest.fn();
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: true,
      nearbyDevices: [],
      error: null,
      status: 'scanning',
      deviceCount: 0,
      startScanning: jest.fn(),
      stopScanning: mockStopScanning,
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: false
    });

    render(<BluetoothProximity />);

    const stopButton = screen.getByRole('button', { name: /Stop Scanning/i });
    fireEvent.click(stopButton);

    expect(mockStopScanning).toHaveBeenCalled();
  });

  it('should call clearDevices when Clear Devices button is clicked', () => {
    const mockClearDevices = jest.fn();
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: false,
      nearbyDevices: [
        { id: 'device1', name: 'Device 1', distance: 10 }
      ],
      error: null,
      status: 'idle',
      deviceCount: 1,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: mockClearDevices,
      getDevicesInRange: jest.fn(() => []),
      hasDevices: true,
      canScan: true
    });

    render(<BluetoothProximity />);

    const clearButton = screen.getByRole('button', { name: /Clear Devices/i });
    fireEvent.click(clearButton);

    expect(mockClearDevices).toHaveBeenCalled();
  });

  it('should display device statistics correctly', () => {
    const mockGetDevicesInRange = jest.fn()
      .mockReturnValueOnce([{ id: 'device1' }]) // Close range
      .mockReturnValueOnce([{ id: 'device1' }, { id: 'device2' }]) // Medium range
      .mockReturnValueOnce([{ id: 'device1' }, { id: 'device2' }, { id: 'device3' }]); // Far range

    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: false,
      nearbyDevices: [
        { id: 'device1', name: 'Device 1', distance: 5 },
        { id: 'device2', name: 'Device 2', distance: 15 },
        { id: 'device3', name: 'Device 3', distance: 30 }
      ],
      error: null,
      status: 'idle',
      deviceCount: 3,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: mockGetDevicesInRange,
      hasDevices: true,
      canScan: true
    });

    render(<BluetoothProximity />);

    expect(screen.getByText('3')).toBeInTheDocument(); // Total devices
    expect(screen.getByText('Total Devices')).toBeInTheDocument();
    expect(screen.getByText('Close (≤10m)')).toBeInTheDocument();
    expect(screen.getByText('Medium (≤25m)')).toBeInTheDocument();
    expect(screen.getByText('Far (≤50m)')).toBeInTheDocument();
  });

  it('should display nearby devices correctly', () => {
    const testDevices = [
      {
        id: 'device1',
        name: 'Test Device 1',
        distance: 5,
        distanceFormatted: '5m',
        rssi: -50,
        lastSeen: new Date('2023-01-01T12:00:00Z'),
        connected: true
      },
      {
        id: 'device2',
        name: 'Test Device 2',
        distance: 15,
        distanceFormatted: '15m',
        rssi: -60,
        lastSeen: new Date('2023-01-01T12:01:00Z'),
        connected: false
      }
    ];

    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: false,
      nearbyDevices: testDevices,
      error: null,
      status: 'idle',
      deviceCount: 2,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => testDevices),
      hasDevices: true,
      canScan: true
    });

    render(<BluetoothProximity />);

    expect(screen.getByText('Nearby Devices (2)')).toBeInTheDocument();
    expect(screen.getByText('Test Device 1')).toBeInTheDocument();
    expect(screen.getByText('Test Device 2')).toBeInTheDocument();
    expect(screen.getByText('5m')).toBeInTheDocument();
    expect(screen.getByText('15m')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument(); // Connected
    expect(screen.getByText('No')).toBeInTheDocument(); // Disconnected
  });

  it('should show no devices message when no devices are found', () => {
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: false,
      nearbyDevices: [],
      error: null,
      status: 'idle',
      deviceCount: 0,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: true
    });

    render(<BluetoothProximity />);

    expect(screen.getByText(/No devices found nearby/)).toBeInTheDocument();
    expect(screen.getByText(/Click "Start Scanning" to begin searching/)).toBeInTheDocument();
  });

  it('should show scanning message when scanning and no devices', () => {
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: true,
      nearbyDevices: [],
      error: null,
      status: 'scanning',
      deviceCount: 0,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: false
    });

    render(<BluetoothProximity />);

    expect(screen.getByText(/Scanning for nearby devices.../)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scanning.../i })).toBeDisabled();
  });

  it('should disable buttons when appropriate', () => {
    mockUseBluetooth.mockReturnValue({
      isSupported: true,
      isScanning: false,
      nearbyDevices: [],
      error: null,
      status: 'idle',
      deviceCount: 0,
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      clearDevices: jest.fn(),
      getDevicesInRange: jest.fn(() => []),
      hasDevices: false,
      canScan: true
    });

    render(<BluetoothProximity />);

    expect(screen.getByRole('button', { name: /Start Scanning/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Stop Scanning/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Clear Devices/i })).toBeDisabled();
  });
});
