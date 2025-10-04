/**
 * Bluetooth Proximity Detection Manager
 * Handles Web Bluetooth API interactions for proximity detection
 */

import { 
  isWebBluetoothAvailable, 
  generateDeviceId, 
  calculateDistance, 
  isWithinRange,
  debounce 
} from '../../shared/utils.js';

/**
 * Bluetooth Manager class for proximity detection
 */
export class BluetoothManager {
  constructor() {
    this.isScanning = false;
    this.deviceId = generateDeviceId();
    this.nearbyDevices = new Map();
    this.callbacks = {
      onDeviceFound: null,
      onDeviceLost: null,
      onError: null,
      onStatusChange: null
    };
    
    // Debounced device update to prevent excessive callbacks
    this.updateDevices = debounce(this._updateDevices.bind(this), 500);
    
    // Service UUID for Physical app
    this.serviceUuid = '0000180d-0000-1000-8000-00805f9b34fb'; // Heart Rate Service as example
    this.characteristicUuid = '00002a37-0000-1000-8000-00805f9b34fb'; // Heart Rate Measurement
  }

  /**
   * Check if Bluetooth is available and supported
   * @returns {Promise<boolean>} True if Bluetooth is available
   */
  async isAvailable() {
    if (!isWebBluetoothAvailable()) {
      return false;
    }

    try {
      // Check if Bluetooth is available
      const available = await navigator.bluetooth.getAvailability();
      return available;
    } catch (error) {
      console.error('Error checking Bluetooth availability:', error);
      return false;
    }
  }

  /**
   * Start scanning for nearby devices
   * @param {Object} options - Scanning options
   * @returns {Promise<boolean>} True if scanning started successfully
   */
  async startScanning(options = {}) {
    if (this.isScanning) {
      console.warn('Bluetooth scanning already in progress');
      return true;
    }

    if (!await this.isAvailable()) {
      const error = new Error('Bluetooth not available');
      this._handleError(error);
      return false;
    }

    try {
      this.isScanning = true;
      this._notifyStatusChange('scanning');
      
      // Request device with specific service
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [this.serviceUuid]
      });

      // Listen for device events
      device.addEventListener('gattserverdisconnected', this._handleDeviceDisconnected.bind(this));
      
      // Connect to device and start monitoring
      await this._connectAndMonitor(device);
      
      return true;
    } catch (error) {
      this.isScanning = false;
      this._notifyStatusChange('stopped');
      
      if (error.name === 'NotFoundError') {
        console.log('No Bluetooth devices found');
        return false;
      } else if (error.name === 'SecurityError') {
        const securityError = new Error('Bluetooth permission denied');
        this._handleError(securityError);
        return false;
      } else {
        this._handleError(error);
        return false;
      }
    }
  }

  /**
   * Stop scanning for devices
   */
  stopScanning() {
    if (!this.isScanning) {
      return;
    }

    this.isScanning = false;
    this.nearbyDevices.clear();
    this._notifyStatusChange('stopped');
  }

  /**
   * Connect to a device and start monitoring
   * @param {BluetoothDevice} device - The Bluetooth device to connect to
   * @private
   */
  async _connectAndMonitor(device) {
    try {
      if (!device.gatt.connected) {
        await device.gatt.connect();
      }

      // Get the service
      const service = await device.gatt.getPrimaryService(this.serviceUuid);
      
      // Get the characteristic
      const characteristic = await service.getCharacteristic(this.characteristicUuid);
      
      // Start notifications
      await characteristic.startNotifications();
      
      // Listen for characteristic value changes
      characteristic.addEventListener('characteristicvaluechanged', 
        this._handleCharacteristicChanged.bind(this, device));
      
      // Simulate proximity detection based on connection quality
      this._simulateProximityDetection(device);
      
    } catch (error) {
      console.error('Error connecting to device:', error);
      this._handleError(error);
    }
  }

  /**
   * Handle characteristic value changes (simulated proximity data)
   * @param {BluetoothDevice} device - The device
   * @param {Event} event - The characteristic value changed event
   * @private
   */
  _handleCharacteristicChanged(device, event) {
    // In a real implementation, this would process actual proximity data
    // For now, we'll simulate proximity detection
    this._simulateProximityDetection(device);
  }

  /**
   * Simulate proximity detection for testing
   * @param {BluetoothDevice} device - The device to simulate
   * @private
   */
  _simulateProximityDetection(device) {
    // Simulate RSSI values between -30 and -100 dBm
    const rssi = Math.random() * (-100 - (-30)) + (-30);
    const distance = this._calculateDistanceFromRSSI(rssi);
    
    if (isWithinRange(distance)) {
      const deviceInfo = {
        id: device.id || generateDeviceId(),
        name: device.name || `Device_${device.id?.substr(0, 8) || 'Unknown'}`,
        distance: distance,
        rssi: rssi,
        lastSeen: new Date(),
        connected: device.gatt.connected
      };
      
      this.nearbyDevices.set(deviceInfo.id, deviceInfo);
      this.updateDevices();
    }
  }

  /**
   * Calculate distance from RSSI value
   * @param {number} rssi - RSSI value in dBm
   * @returns {number} Distance in meters
   * @private
   */
  _calculateDistanceFromRSSI(rssi) {
    // Simple distance calculation (not accurate in real scenarios)
    const txPower = -59; // Typical transmit power
    if (rssi === 0) return -1;
    
    const ratio = rssi / txPower;
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      return (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
    }
  }

  /**
   * Handle device disconnection
   * @param {Event} event - The disconnection event
   * @private
   */
  _handleDeviceDisconnected(event) {
    const device = event.target;
    const deviceId = device.id || 'unknown';
    
    if (this.nearbyDevices.has(deviceId)) {
      this.nearbyDevices.delete(deviceId);
      this._notifyDeviceLost(deviceId);
      this.updateDevices();
    }
  }

  /**
   * Update devices list and notify callbacks
   * @private
   */
  _updateDevices() {
    const devices = Array.from(this.nearbyDevices.values());
    
    if (this.callbacks.onDeviceFound) {
      devices.forEach(device => {
        this.callbacks.onDeviceFound(device);
      });
    }
  }

  /**
   * Notify that a device was found
   * @param {Object} device - Device information
   * @private
   */
  _notifyDeviceFound(device) {
    if (this.callbacks.onDeviceFound) {
      this.callbacks.onDeviceFound(device);
    }
  }

  /**
   * Notify that a device was lost
   * @param {string} deviceId - Device ID
   * @private
   */
  _notifyDeviceLost(deviceId) {
    if (this.callbacks.onDeviceLost) {
      this.callbacks.onDeviceLost(deviceId);
    }
  }

  /**
   * Handle errors
   * @param {Error} error - The error
   * @private
   */
  _handleError(error) {
    console.error('Bluetooth error:', error);
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Notify status changes
   * @param {string} status - New status
   * @private
   */
  _notifyStatusChange(status) {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status);
    }
  }

  /**
   * Set callback for device found events
   * @param {Function} callback - Callback function
   */
  onDeviceFound(callback) {
    this.callbacks.onDeviceFound = callback;
  }

  /**
   * Set callback for device lost events
   * @param {Function} callback - Callback function
   */
  onDeviceLost(callback) {
    this.callbacks.onDeviceLost = callback;
  }

  /**
   * Set callback for error events
   * @param {Function} callback - Callback function
   */
  onError(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Set callback for status change events
   * @param {Function} callback - Callback function
   */
  onStatusChange(callback) {
    this.callbacks.onStatusChange = callback;
  }

  /**
   * Get currently nearby devices
   * @returns {Array} Array of nearby devices
   */
  getNearbyDevices() {
    return Array.from(this.nearbyDevices.values());
  }

  /**
   * Get scanning status
   * @returns {boolean} True if currently scanning
   */
  getScanningStatus() {
    return this.isScanning;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopScanning();
    this.callbacks = {
      onDeviceFound: null,
      onDeviceLost: null,
      onError: null,
      onStatusChange: null
    };
  }
}
