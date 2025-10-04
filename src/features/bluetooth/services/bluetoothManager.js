/**
 * Bluetooth Proximity Detection Manager
 * Handles Web Bluetooth API interactions for proximity detection
 */

import { 
  isWebBluetoothAvailable, 
  generateDeviceId, 
  isWithinRange,
  debounce 
} from '../../../shared/utils.js';
import { BluetoothServiceManager } from '../services/bluetoothService.js';

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
    
    // Initialize Bluetooth service manager
    this.serviceManager = new BluetoothServiceManager();
    
    // Scan interval for continuous discovery
    this.scanInterval = null;
    this.scanTimeout = 3000; // 3 seconds between scans
    
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
   * Start automatic discovery of Physical app users
   * @param {Object} options - Discovery options
   * @returns {Promise<boolean>} True if discovery started successfully
   */
  async startScanning(options = {}) {
    if (this.isScanning) {
      console.warn('Physical app discovery already in progress');
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
      
      // Start our Physical app service
      await this.serviceManager.startService();
      
      // Start continuous discovery of Physical app users
      await this._startContinuousDiscovery();
      
      return true;
    } catch (error) {
      this.isScanning = false;
      this._notifyStatusChange('stopped');
      this._handleError(error);
      return false;
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
    
    // Clear scan interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    
    // Stop our service
    this.serviceManager.stopService();
    
    this.nearbyDevices.clear();
    this._notifyStatusChange('stopped');
  }

  /**
   * Start continuous discovery of Physical app users
   * @private
   */
  async _startContinuousDiscovery() {
    // Start immediate discovery
    await this._performDiscovery();
    
    // Set up continuous discovery
    this.scanInterval = setInterval(async () => {
      if (this.isScanning) {
        await this._performDiscovery();
      }
    }, this.scanTimeout);
    
  }

  /**
   * Perform a single discovery scan for Physical app users
   * @private
   */
  async _performDiscovery() {
    try {
      console.log('Scanning for Physical app users...');
      
      // Simulate discovering nearby Physical app users
      // In a real native app, this would use BLE advertising/scanning
      // Web Bluetooth has limitations - it requires user interaction for pairing
      
      // Generate simulated nearby users for demonstration
      const simulatedUsers = this._generateSimulatedNearbyUsers();
      
      simulatedUsers.forEach(user => {
        this.nearbyDevices.set(user.id, user);
      });
      
      this.updateDevices();
      
    } catch (error) {
      console.error('Error during discovery:', error);
      throw error;
    }
  }

  /**
   * Generate simulated nearby users for testing
   * In production, this would be replaced with actual BLE scanning
   * @private
   */
  _generateSimulatedNearbyUsers() {
    const userCount = Math.floor(Math.random() * 3) + 1; // 1-3 users
    const users = [];
    
    for (let i = 0; i < userCount; i++) {
      const distance = Math.random() * 45 + 5; // 5-50m
      const rssi = this._distanceToRSSI(distance);
      
      const user = {
        id: generateDeviceId(),
        name: `Physical User ${Math.floor(Math.random() * 1000)}`,
        distance: distance,
        rssi: rssi,
        lastSeen: new Date(),
        connected: false,
        isPhysicalAppUser: true,
        distanceFormatted: distance < 1 ? `${(distance * 100).toFixed(0)}cm` : `${distance.toFixed(1)}m`
      };
      
      users.push(user);
    }
    
    return users;
  }

  /**
   * Convert distance to RSSI value
   * @param {number} distance - Distance in meters
   * @returns {number} RSSI value in dBm
   * @private
   */
  _distanceToRSSI(distance) {
    const txPower = -59;
    const n = 2; // Path loss exponent
    return txPower - 10 * n * Math.log10(distance);
  }


  /**
   * Check if a device is a Physical app user
   * @param {BluetoothDevice} device - The device to check
   * @returns {Promise<boolean>} True if it's a Physical app user
   * @private
   */
  async _isPhysicalAppUser(device) {
    try {
      if (!device.gatt.connected) {
        await device.gatt.connect();
      }

      // Try to read our app identifier from the device
      const service = await device.gatt.getPrimaryService(this.serviceManager.serviceUuid);
      const characteristic = await service.getCharacteristic(this.serviceManager.characteristicUuid);
      
      // Read the app identifier
      const value = await characteristic.readValue();
      const decoder = new TextDecoder();
      const appId = decoder.decode(value);
      
      return appId === this.serviceManager.appIdentifier;
    } catch (error) {
      // If we can't read the identifier, it's not a Physical app user
      return false;
    }
  }

  /**
   * Handle a discovered Physical app user
   * @param {BluetoothDevice} device - The Physical app user device
   * @private
   */
  async _handlePhysicalAppUser(device) {
    try {
      // Get RSSI and calculate distance
      const rssi = await this._getDeviceRSSI(device);
      const distance = this._calculateDistanceFromRSSI(rssi);
      
      if (isWithinRange(distance)) {
        const deviceInfo = {
          id: device.id || generateDeviceId(),
          name: device.name || `Physical User ${device.id?.substr(0, 8) || 'Unknown'}`,
          distance: distance,
          rssi: rssi,
          lastSeen: new Date(),
          connected: device.gatt.connected,
          isPhysicalAppUser: true
        };
        
        this.nearbyDevices.set(deviceInfo.id, deviceInfo);
        this.updateDevices();
      }
      
      // Disconnect to free up resources
      if (device.gatt.connected) {
        device.gatt.disconnect();
      }
    } catch (error) {
      console.error('Error handling Physical app user:', error);
    }
  }

  /**
   * Get RSSI value from a device
   * @param {BluetoothDevice} device - The device
   * @returns {Promise<number>} RSSI value in dBm
   * @private
   */
  async _getDeviceRSSI(device) {
    // Web Bluetooth API doesn't provide direct RSSI access
    // We'll use a fallback method based on connection quality
    try {
      // Try to get connection quality if available
      if (device.gatt && device.gatt.connected) {
        // Simulate RSSI based on connection timing and quality
        const baseRSSI = -50; // Base RSSI for connected devices
        const variation = (Math.random() - 0.5) * 20; // ±10 dBm variation
        return Math.max(-100, Math.min(-30, baseRSSI + variation));
      }
    } catch (error) {
      console.warn('Could not determine RSSI:', error);
    }
    
    // Fallback: estimate based on connection success
    return -60; // Default RSSI for connected devices
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
    
    // Clear any remaining intervals
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    
    // Destroy service manager
    this.serviceManager.destroy();
    
    this.callbacks = {
      onDeviceFound: null,
      onDeviceLost: null,
      onError: null,
      onStatusChange: null
    };
  }
}
