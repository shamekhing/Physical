import React from 'react';
import './App.css';
import BluetoothProximity from './features/bluetooth/BluetoothProximity.js';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Physical - User Discovery</h1>
        <p>Find other Physical app users nearby - No pairing required!</p>
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
