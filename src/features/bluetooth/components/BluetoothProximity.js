/**
 * Bluetooth Proximity Detection Component
 * Simple UI for testing Bluetooth proximity detection functionality
 */

import React from 'react';
import { useBluetooth } from '../hooks/useBluetooth.js';
import '../styles/BluetoothProximity.css';

/**
 * Bluetooth Proximity Detection Component
 */
const BluetoothProximity = () => {
  const {
    isSupported,
    isScanning,
    nearbyDevices,
    error,
    status,
    deviceCount,
    startScanning,
    stopScanning,
    clearDevices,
    getDevicesInRange,
    hasDevices,
    canScan
  } = useBluetooth();

  const handleStartScanning = async () => {
    await startScanning();
  };

  const handleStopScanning = () => {
    stopScanning();
  };

  const handleClearDevices = () => {
    clearDevices();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'scanning': return '#4CAF50';
      case 'stopped': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'scanning': return 'Scanning for devices...';
      case 'stopped': return 'Scanning stopped';
      case 'error': return 'Error occurred';
      default: return 'Ready to scan';
    }
  };

  if (!isSupported) {
    return (
      <div className="bluetooth-proximity">
        <div className="bluetooth-header">
          <h2>🔵 Bluetooth Proximity Detection</h2>
          <div className="status-indicator error">
            <span className="status-dot"></span>
            Bluetooth Not Supported
          </div>
        </div>
        <div className="error-message">
          <p>Bluetooth is not supported or available on this device.</p>
          <p>Please use a device with Bluetooth support and ensure Bluetooth is enabled.</p>
          <p>Physical app requires Bluetooth to discover other users nearby.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bluetooth-proximity">
      <div className="bluetooth-header">
        <h2>🔵 Bluetooth Proximity Detection</h2>
        <div className="status-indicator" style={{ color: getStatusColor() }}>
          <span className="status-dot" style={{ backgroundColor: getStatusColor() }}></span>
          {getStatusText()}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="controls">
        <button 
          onClick={handleStartScanning}
          disabled={!canScan}
          className="btn btn-primary"
        >
          {isScanning ? 'Discovering Users...' : 'Discover Physical Users'}
        </button>
        
        <button 
          onClick={handleStopScanning}
          disabled={!isScanning}
          className="btn btn-secondary"
        >
          Stop Discovery
        </button>
        
        <button 
          onClick={handleClearDevices}
          disabled={!hasDevices}
          className="btn btn-outline"
        >
          Clear Users
        </button>
      </div>

      <div className="device-stats">
        <div className="stat">
          <span className="stat-number">{deviceCount}</span>
          <span className="stat-label">Users Nearby</span>
        </div>
      </div>

      <div className="devices-section">
        <h3>Physical App Users Nearby ({deviceCount})</h3>
        
        {!hasDevices && !isScanning && (
          <div className="no-devices">
            <p>No Physical app users found nearby.</p>
            <p>Click "Discover Physical Users" to begin searching for other app users.</p>
          </div>
        )}

        {!hasDevices && isScanning && (
          <div className="scanning-message">
            <div className="spinner"></div>
            <p>Discovering Physical app users...</p>
          </div>
        )}

        {hasDevices && (
          <div className="devices-list">
            {nearbyDevices.map((device) => (
              <div key={device.id} className="device-card">
                <div className="device-info">
                  <div className="device-name">
                    {device.name || 'Unknown Physical User'}
                  </div>
                  <div className="device-id">
                    ID: {device.id}
                    {device.isPhysicalAppUser && (
                      <span className="physical-badge">Physical App User</span>
                    )}
                  </div>
                </div>
                
                <div className="device-actions">
                  <button className="btn-connect">Connect</button>
                  <button className="btn-view">View Profile</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BluetoothProximity;
