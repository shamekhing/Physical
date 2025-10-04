import React from 'react';
import './App.css';
import BluetoothProximity from './components/BluetoothProximity.js';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Physical - Bluetooth Proximity Detection</h1>
        <p>A privacy-first, peer-to-peer meeting app</p>
      </header>
      
      <main className="App-main">
        <BluetoothProximity />
      </main>
      
      <footer className="App-footer">
        <p>
          <strong>Privacy Notice:</strong> This app uses Bluetooth proximity detection only. 
          No location data or personal information is collected or transmitted.
        </p>
      </footer>
    </div>
  );
}

export default App;
