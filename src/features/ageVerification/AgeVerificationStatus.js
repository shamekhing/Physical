import React from 'react';
import { useAgeVerification } from './useAgeVerification.js';
import './AgeVerificationStatus.css';

/**
 * Age Verification Status Component
 * Displays current verification status and history
 */
const AgeVerificationStatus = () => {
  const {
    verificationResult,
    verificationHistory,
    getVerificationStatus,
    getVerificationProof,
    getVerificationStats,
    getVerificationLevelDescription,
    clearVerificationData
  } = useAgeVerification();

  const status = getVerificationStatus();
  const stats = getVerificationStats();
  const proof = getVerificationProof();
  const levelDescription = getVerificationLevelDescription();

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Format confidence as percentage
   */
  const formatConfidence = (confidence) => {
    return Math.round(confidence * 100);
  };

  /**
   * Get verification level badge class
   */
  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'high': return 'level-high';
      case 'standard': return 'level-standard';
      case 'basic': return 'level-basic';
      case 'none':
      default: return 'level-none';
    }
  };

  /**
   * Get verification level display name
   */
  const getLevelDisplayName = (level) => {
    switch (level) {
      case 'high': return 'High Confidence';
      case 'standard': return 'Standard';
      case 'basic': return 'Basic';
      case 'none':
      default: return 'Not Verified';
    }
  };

  /**
   * Get method display name
   */
  const getMethodDisplayName = (method) => {
    switch (method) {
      case 'biometric': return 'Biometric';
      case 'document': return 'Document';
      case 'device_settings': return 'Device Settings';
      case 'multi_factor': return 'Multi-Factor';
      default: return method;
    }
  };

  /**
   * Handle clear verification data
   */
  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all verification data? This action cannot be undone.')) {
      await clearVerificationData();
    }
  };

  return (
    <div className="age-verification-status">
      <div className="status-header">
        <h2>Age Verification Status</h2>
        <p className="privacy-notice">
          <strong>Privacy Notice:</strong> All data is stored locally on your device only.
        </p>
      </div>

      {/* Current Status */}
      <div className="current-status">
        <div className="status-card">
          <div className="status-indicator">
            <div className={`status-dot ${status.isVerified ? 'verified' : 'unverified'}`}></div>
            <div className="status-info">
              <h3>{status.isVerified ? 'Verified' : 'Not Verified'}</h3>
              <p className="level-description">{levelDescription}</p>
            </div>
          </div>
          
          <div className="verification-details">
            <div className="detail-row">
              <span className="label">Verification Level:</span>
              <span className={`value level-badge ${getLevelBadgeClass(status.verificationLevel)}`}>
                {getLevelDisplayName(status.verificationLevel)}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="label">Confidence:</span>
              <span className="value">{formatConfidence(status.confidence)}%</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Last Verified:</span>
              <span className="value">{formatTimestamp(status.lastVerified)}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Methods Used:</span>
              <span className="value">
                {status.methods.length > 0 
                  ? status.methods.map(getMethodDisplayName).join(', ')
                  : 'None'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Proof */}
      {proof && (
        <div className="verification-proof">
          <h3>Anonymous Verification Proof</h3>
          <div className="proof-card">
            <div className="proof-details">
              <div className="detail-row">
                <span className="label">Verified:</span>
                <span className="value">{proof.verified ? 'Yes' : 'No'}</span>
              </div>
              
              <div className="detail-row">
                <span className="label">Level:</span>
                <span className={`value level-badge ${getLevelBadgeClass(proof.level)}`}>
                  {getLevelDisplayName(proof.level)}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="label">Confidence:</span>
                <span className="value">{formatConfidence(proof.confidence)}%</span>
              </div>
              
              <div className="detail-row">
                <span className="label">Proof Hash:</span>
                <span className="value proof-hash">{proof.proof}</span>
              </div>
              
              <div className="detail-row">
                <span className="label">Timestamp:</span>
                <span className="value">{formatTimestamp(proof.timestamp)}</span>
              </div>
            </div>
            
            <div className="proof-note">
              <p>
                <strong>Note:</strong> This proof can be shared anonymously with other users 
                to verify your age without revealing personal information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Statistics */}
      <div className="verification-stats">
        <h3>Verification Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{stats.successful}</div>
            <div className="stat-label">Successful</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{stats.failed}</div>
            <div className="stat-label">Failed</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{Math.round(stats.successRate)}%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
        
        {stats.lastVerified && (
          <div className="last-verified">
            <p><strong>Last Verification:</strong> {formatTimestamp(stats.lastVerified)}</p>
          </div>
        )}
      </div>

      {/* Method Statistics */}
      {stats.methodStats && Object.keys(stats.methodStats).length > 0 && (
        <div className="method-stats">
          <h3>Method Statistics</h3>
          <div className="method-stats-list">
            {Object.entries(stats.methodStats).map(([method, methodStats]) => (
              <div key={method} className="method-stat-item">
                <div className="method-name">{getMethodDisplayName(method)}</div>
                <div className="method-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${methodStats.total > 0 ? (methodStats.successful / methodStats.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="method-numbers">
                    {methodStats.successful}/{methodStats.total} successful
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification History */}
      <div className="verification-history">
        <h3>Verification History</h3>
        {verificationHistory.length > 0 ? (
          <div className="history-list">
            {verificationHistory.slice(-5).reverse().map((verification, index) => (
              <div key={verification.id || index} className="history-item">
                <div className="history-header">
                  <span className={`verification-status ${verification.verified ? 'success' : 'failed'}`}>
                    {verification.verified ? '✓' : '✗'}
                  </span>
                  <span className="method">{getMethodDisplayName(verification.method)}</span>
                  <span className="timestamp">{formatTimestamp(verification.timestamp)}</span>
                </div>
                
                <div className="history-details">
                  <span className="confidence">
                    Confidence: {formatConfidence(verification.confidence)}%
                  </span>
                  
                  {verification.estimatedAge && (
                    <span className="age">
                      Estimated Age: {verification.estimatedAge}
                    </span>
                  )}
                  
                  {verification.age && (
                    <span className="age">
                      Age: {verification.age}
                    </span>
                  )}
                  
                  {verification.level && (
                    <span className="level">
                      Level: {getLevelDisplayName(verification.level)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No verification history available</p>
        )}
      </div>

      {/* Actions */}
      <div className="status-actions">
        <button 
          onClick={() => {
            // In test environment, just log instead of reloading
            if (process.env.NODE_ENV === 'test') {
              console.log('Refresh clicked');
            } else {
              window.location.reload();
            }
          }}
          className="refresh-btn"
        >
          Refresh
        </button>
        
        <button 
          onClick={handleClearData}
          className="clear-data-btn"
          disabled={verificationHistory.length === 0}
        >
          Clear All Data
        </button>
        
        <div className="data-info">
          <p>
            <strong>Data Storage:</strong> All verification data is stored locally on your device. 
            No data is transmitted to external servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgeVerificationStatus;
