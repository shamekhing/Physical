/**
 * React Hook for Bluetooth Proximity Detection
 * Provides state management and Bluetooth functionality to React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BluetoothManager } from '../services/bluetoothManager.js';
import { formatDistance } from '../../../shared/utils.js';

/**
 * Custom hook for Bluetooth proximity detection
 * @returns {Object} Bluetooth state and methods
 */
export const useBluetooth = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, scanning, stopped, error
  
  const bluetoothManagerRef = useRef(null);
  const devicesRef = useRef(new Map());

  // Initialize Bluetooth manager
  useEffect(() => {
    const initBluetooth = async () => {
      try {
        const manager = new BluetoothManager();
        bluetoothManagerRef.current = manager;
        
        // Set up event handlers
        manager.onDeviceFound((device) => {
          devicesRef.current.set(device.id, {
            ...device,
            distanceFormatted: formatDistance(device.distance)
          });
          
          setNearbyDevices(Array.from(devicesRef.current.values()));
        });

        manager.onDeviceLost((deviceId) => {
          devicesRef.current.delete(deviceId);
          setNearbyDevices(Array.from(devicesRef.current.values()));
        });

        manager.onError((error) => {
          setError(error.message);
          setStatus('error');
          setIsScanning(false);
        });

        manager.onStatusChange((newStatus) => {
          setStatus(newStatus);
          setIsScanning(newStatus === 'scanning');
        });

        // Check if Bluetooth is available
        const available = await manager.isAvailable();
        setIsSupported(available);
        
        if (!available) {
          setError('Bluetooth is not supported or available on this device');
          setStatus('error');
        }
        
      } catch (error) {
        console.error('Failed to initialize Bluetooth:', error);
        setError('Failed to initialize Bluetooth');
        setStatus('error');
      }
    };

    initBluetooth();

    // Cleanup on unmount
    return () => {
      if (bluetoothManagerRef.current) {
        bluetoothManagerRef.current.destroy();
      }
    };
  }, []);

  // Start scanning for nearby devices
  const startScanning = useCallback(async () => {
    if (!bluetoothManagerRef.current) {
      setError('Bluetooth manager not initialized');
      return false;
    }

    try {
      setError(null);
      setStatus('scanning');
      const success = await bluetoothManagerRef.current.startScanning();
      
      if (!success) {
        setError('Failed to start scanning');
        setStatus('error');
      }
      
      return success;
    } catch (error) {
      setError(error.message);
      setStatus('error');
      return false;
    }
  }, []);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (bluetoothManagerRef.current) {
      bluetoothManagerRef.current.stopScanning();
      setStatus('stopped');
    }
  }, []);

  // Clear nearby devices
  const clearDevices = useCallback(() => {
    devicesRef.current.clear();
    setNearbyDevices([]);
  }, []);

  // Get device count
  const deviceCount = nearbyDevices.length;

  // Get devices within specific range
  const getDevicesInRange = useCallback((maxDistance = 50) => {
    return nearbyDevices.filter(device => device.distance <= maxDistance);
  }, [nearbyDevices]);

  return {
    // State
    isSupported,
    isScanning,
    nearbyDevices,
    error,
    status,
    deviceCount,
    
    // Methods
    startScanning,
    stopScanning,
    clearDevices,
    getDevicesInRange,
    
    // Computed values
    hasDevices: deviceCount > 0,
    canScan: isSupported && !isScanning && status !== 'error'
  };
};
