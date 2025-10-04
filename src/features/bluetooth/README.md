# Bluetooth Proximity Detection Feature

## 🔵 Overview

This feature enables automatic discovery of other Physical app users nearby using Bluetooth Low Energy (BLE) technology. Users can find each other without manual pairing or connection setup.

## 🎯 Key Features

- **Automatic Discovery** - Finds other Physical app users without pairing
- **Real-time Proximity** - Shows distance and signal strength
- **App-specific Filtering** - Only shows other Physical app users
- **Privacy-focused** - No location tracking, Bluetooth-only proximity
- **Cross-platform** - Works on any device with Web Bluetooth support

## 📁 File Structure

```
src/features/bluetooth/
├── README.md                     # This file
├── bluetoothManager.js           # Core Bluetooth discovery logic
├── bluetoothService.js           # Physical app service management
├── useBluetooth.js               # React hook for state management
├── BluetoothProximity.js         # UI component
├── BluetoothProximity.css        # Component styles
├── BluetoothProximity.test.js    # Component tests
├── bluetoothManager.test.js      # Manager tests
├── useBluetooth.test.js          # Hook tests
└── index.js                      # Feature exports
```

## 🔧 Core Components

### BluetoothManager (`bluetoothManager.js`)
- **Purpose**: Handles all Bluetooth discovery operations
- **Key Methods**:
  - `startScanning()` - Begin discovering Physical app users
  - `stopScanning()` - Stop discovery and cleanup
  - `isAvailable()` - Check Bluetooth support
  - `getNearbyDevices()` - Get list of discovered users

### BluetoothServiceManager (`bluetoothService.js`)
- **Purpose**: Manages Physical app-specific Bluetooth service
- **Key Features**:
  - Creates Physical app identity (`PHYSICAL_APP_v1`)
  - Custom service UUID for app filtering
  - Validates discovered devices are Physical app users

### useBluetooth Hook (`useBluetooth.js`)
- **Purpose**: React integration for Bluetooth functionality
- **Returns**:
  - `isSupported` - Bluetooth availability
  - `isScanning` - Current scanning status
  - `nearbyDevices` - Array of discovered users
  - `startScanning()` - Begin discovery
  - `stopScanning()` - Stop discovery
  - `clearDevices()` - Clear discovered users

### BluetoothProximity Component (`BluetoothProximity.js`)
- **Purpose**: UI for testing and displaying Bluetooth discovery
- **Features**:
  - Real-time status indicators
  - Device statistics (close/medium/far range)
  - User cards with distance and connection info
  - Control buttons for discovery management

## 🚀 Usage

### Basic Integration

```javascript
import { useBluetooth } from './features/bluetooth/useBluetooth.js';

function MyComponent() {
  const {
    isSupported,
    isScanning,
    nearbyDevices,
    startScanning,
    stopScanning
  } = useBluetooth();

  return (
    <div>
      <button onClick={startScanning} disabled={!isSupported || isScanning}>
        {isScanning ? 'Discovering...' : 'Discover Users'}
      </button>
      
      <div>
        {nearbyDevices.map(device => (
          <div key={device.id}>
            {device.name} - {device.distanceFormatted}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Using the Component

```javascript
import { BluetoothProximity } from './features/bluetooth/index.js';

function App() {
  return (
    <div>
      <BluetoothProximity />
    </div>
  );
}
```

## 🔒 Privacy & Security

### Data Security
- **No Location Data** - Uses Bluetooth proximity only, no GPS tracking
- **App-specific Filtering** - Only discovers other Physical app users
- **Local Storage Only** - All discovered device data stays on your device
- **No Server Communication** - Direct device-to-device discovery, no data sent to servers
- **Permission-based** - Requires explicit user permission for Bluetooth access
- **Ephemeral Data** - Device data cleared when you stop scanning or close app

### Connection Security
- **Not End-to-End Encrypted** - Bluetooth discovery itself is NOT encrypted
- **Device IDs Only** - No personal information transmitted during discovery
- **No Automatic Pairing** - Discovery only, no automatic device pairing
- **User Control** - You control when to start/stop discovery

### What's Shared During Discovery
- ✅ Random device ID (changes each session)
- ✅ Physical app identifier ("PHYSICAL_APP_v1")
- ✅ Bluetooth signal strength (for distance calculation)
- ❌ NO personal information
- ❌ NO location data
- ❌ NO chat messages
- ❌ NO profile data

### Security Recommendations
1. **Use in Safe Environments** - Only enable discovery in appropriate settings
2. **Stop When Done** - Turn off discovery when not actively looking for users
3. **Verify Users** - The app shows who's nearby, but verify identity before sharing personal info
4. **Report Issues** - Report any suspicious behavior through the app

### Technical Security Details
- **Bluetooth Low Energy (BLE)** - Uses standard BLE protocols
- **UUID-based Filtering** - Custom service UUID prevents non-app devices from appearing
- **Web Bluetooth API** - Browser-controlled security model
- **HTTPS Required** - App must run on HTTPS for Bluetooth access
- **No Background Access** - Scanning stops when app is closed or backgrounded

## 🌐 Browser Compatibility

- **Chrome/Edge**: Full support (Windows, Mac, Linux, Android)
- **Safari**: Limited support (Mac, iOS 15+)
- **Firefox**: Basic support

## ⚡ Technical Details

### Bluetooth Service UUID
- **Service**: `12345678-1234-1234-1234-123456789abc`
- **Characteristic**: `12345678-1234-1234-1234-123456789abd`
- **App Identifier**: `PHYSICAL_APP_v1`

### Discovery Process
1. **Start Service** - Make device discoverable with Physical app service
2. **Scan Continuously** - Every 3 seconds, scan for devices with Physical app service
3. **Validate Devices** - Connect and verify app identifier
4. **Calculate Distance** - Use RSSI to estimate proximity
5. **Update UI** - Show discovered users with real-time updates

### Distance Calculation
- **Method**: RSSI-based proximity estimation
- **Range**: 1-50 meters
- **Categories**: Close (≤10m), Medium (≤25m), Far (≤50m)

## 🧪 Testing

Run tests for this feature:

```bash
# Run all Bluetooth feature tests
npm test src/features/bluetooth/

# Run specific test files
npm test bluetoothManager.test.js
npm test useBluetooth.test.js
npm test BluetoothProximity.test.js
```

## 🐛 Troubleshooting

### Common Issues

**Bluetooth not supported**
- Ensure device has Bluetooth capability
- Check browser compatibility
- Verify Bluetooth is enabled

**No users found**
- Make sure other devices have Physical app running
- Check Bluetooth permissions are granted
- Verify devices are within 50m range

**Permission denied**
- Grant Bluetooth permission when prompted
- Check browser settings for Bluetooth access
- Ensure HTTPS connection (required for Web Bluetooth)

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('bluetooth-debug', 'true');
```

## 📈 Performance

- **Scan Interval**: 3 seconds (configurable)
- **Connection Timeout**: Automatic cleanup after validation
- **Memory Usage**: Minimal - disconnects after device validation
- **Battery Impact**: Low - uses Bluetooth Low Energy

## 🔮 Future Enhancements

- **Background Discovery** - Continue scanning when app is backgrounded
- **Mesh Networking** - Extended range through device relay
- **Voice/Video** - Direct communication between discovered users
- **Event Discovery** - Find users at specific events/locations
- **Interest Matching** - Filter users by shared interests

## 📝 Development Notes

- **No Mock Data** - All functionality uses real Bluetooth APIs
- **Feature-based** - Self-contained with all related files
- **Type Safety** - Comprehensive JSDoc documentation
- **Error Handling** - Graceful degradation for unsupported browsers
- **Resource Management** - Automatic cleanup of Bluetooth connections

## 🧪 Feature Test List

| # | Test Name | Description |
|---|-----------|-------------|
| 1 | bluetoothManager.test.js - constructor | Tests BluetoothManager initialization with default values |
| 2 | bluetoothManager.test.js - isAvailable success | Tests Bluetooth availability check when supported |
| 3 | bluetoothManager.test.js - isAvailable error | Tests Bluetooth availability check error handling |
| 4 | bluetoothManager.test.js - startScanning success | Tests successful Bluetooth scanning start |
| 5 | bluetoothManager.test.js - startScanning already scanning | Tests handling when already scanning |
| 6 | bluetoothManager.test.js - startScanning bluetooth unavailable | Tests when Bluetooth is not available |
| 7 | bluetoothManager.test.js - startScanning NotFoundError | Tests NotFoundError handling during discovery |
| 8 | bluetoothManager.test.js - startScanning SecurityError | Tests SecurityError handling during discovery |
| 9 | bluetoothManager.test.js - startScanning other errors | Tests general error handling during discovery |
| 10 | bluetoothManager.test.js - stopScanning | Tests Bluetooth scanning stop functionality |
| 11 | bluetoothManager.test.js - getNearbyDevices | Tests getting list of nearby devices |
| 12 | bluetoothManager.test.js - getScanningStatus | Tests getting current scanning status |
| 13 | bluetoothManager.test.js - device callbacks | Tests device found/lost callback functionality |
| 14 | bluetoothManager.test.js - error callbacks | Tests error callback functionality |
| 15 | bluetoothManager.test.js - status callbacks | Tests status change callback functionality |
| 16 | bluetoothManager.test.js - destroy | Tests cleanup and resource management |
| 17 | bluetoothManager.test.js - device management | Tests device addition and removal |
| 18 | useBluetooth.test.js - initialization | Tests useBluetooth hook initialization |
| 19 | useBluetooth.test.js - bluetooth supported | Tests when Bluetooth is supported |
| 20 | useBluetooth.test.js - bluetooth not supported | Tests when Bluetooth is not supported |
| 21 | useBluetooth.test.js - init error | Tests initialization error handling |
| 22 | useBluetooth.test.js - startScanning success | Tests successful scanning start |
| 23 | useBluetooth.test.js - startScanning error | Tests scanning start error handling |
| 24 | useBluetooth.test.js - stopScanning | Tests scanning stop functionality |
| 25 | useBluetooth.test.js - clearDevices | Tests device clearing functionality |
| 26 | useBluetooth.test.js - device discovery | Tests device discovery and state updates |
| 27 | useBluetooth.test.js - device loss | Tests device loss handling |
| 28 | useBluetooth.test.js - range filtering | Tests device range filtering functionality |
| 29 | useBluetooth.test.js - cleanup | Tests hook cleanup on unmount |
| 30 | useBluetooth.test.js - state updates | Tests React state updates |
| 31 | useBluetooth.test.js - callback integration | Tests callback integration with manager |
| 32 | useBluetooth.test.js - error state management | Tests error state management |
| 33 | useBluetooth.test.js - scanning state | Tests scanning state management |
| 34 | useBluetooth.test.js - device count | Tests device count calculations |
| 35 | useBluetooth.test.js - hasDevices | Tests hasDevices computed value |
| 36 | useBluetooth.test.js - canScan | Tests canScan computed value |
| 37 | BluetoothProximity.test.js - bluetooth not supported | Tests UI when Bluetooth not supported |
| 38 | BluetoothProximity.test.js - main interface | Tests main interface rendering |
| 39 | BluetoothProximity.test.js - error message | Tests error message display |
| 40 | BluetoothProximity.test.js - scanning status | Tests scanning status display |
| 41 | BluetoothProximity.test.js - start scanning button | Tests start scanning button click |
| 42 | BluetoothProximity.test.js - stop scanning button | Tests stop scanning button click |
| 43 | BluetoothProximity.test.js - clear devices button | Tests clear devices button click |
| 44 | BluetoothProximity.test.js - device statistics | Tests device statistics display |
| 45 | BluetoothProximity.test.js - nearby devices | Tests nearby devices display |
| 46 | BluetoothProximity.test.js - no devices message | Tests no devices message |
| 47 | BluetoothProximity.test.js - scanning message | Tests scanning message display |
| 48 | BluetoothProximity.test.js - button states | Tests button enabled/disabled states |
| 49 | BluetoothProximity.test.js - device cards | Tests individual device card rendering |

---

**Built for privacy, security, and genuine human connection.**
