/**
 * Utility functions for the Physical app
 */

/**
 * Check if Bluetooth is supported by the browser
 * @returns {boolean} True if Bluetooth is supported
 */
export const isBluetoothSupported = () => {
  return 'bluetooth' in navigator;
};

/**
 * Check if Web Bluetooth API is available
 * @returns {boolean} True if Web Bluetooth is available
 */
export const isWebBluetoothAvailable = () => {
  return isBluetoothSupported() && 'requestDevice' in navigator.bluetooth;
};

/**
 * Generate a unique device ID
 * @returns {string} Unique device identifier
 */
export const generateDeviceId = () => {
  // Check if we already have a device ID stored
  const storedId = localStorage.getItem('physical_device_id');
  if (storedId) {
    return storedId;
  }
  
  // Generate new device ID and store it
  const newId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  localStorage.setItem('physical_device_id', newId);
  return newId;
};

/**
 * Calculate distance based on RSSI (Received Signal Strength Indicator)
 * This is a rough approximation - actual distance calculation is complex
 * @param {number} rssi - Signal strength in dBm
 * @param {number} txPower - Transmit power (default -59 dBm)
 * @returns {number} Estimated distance in meters
 */
export const calculateDistance = (rssi, txPower = -59) => {
  if (rssi === 0) {
    return -1.0;
  }
  
  const ratio = rssi * 1.0 / txPower;
  if (ratio < 1.0) {
    return Math.pow(ratio, 10);
  } else {
    const accuracy = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
    return accuracy;
  }
};

/**
 * Format distance for display
 * @param {number} distance - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 0) {
    return 'Unknown';
  } else if (distance < 1) {
    return `${Math.round(distance * 100)}cm`;
  } else if (distance < 1000) {
    return `${Math.round(distance)}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if a device is within proximity range
 * @param {number} distance - Distance in meters
 * @param {number} maxRange - Maximum range in meters (default 50m)
 * @returns {boolean} True if within range
 */
export const isWithinRange = (distance, maxRange = 50) => {
  return distance > 0 && distance <= maxRange;
};
