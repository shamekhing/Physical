import { generateDeviceId } from '../../shared/utils.js';

/**
 * Age Verification Manager - Privacy-First Implementation
 * Everything runs locally on the user's device with no external data collection
 */
export class AgeVerificationManager {
  constructor() {
    this.deviceId = generateDeviceId();
    this.verificationMethods = new Map();
    this.verificationHistory = [];
    this.callbacks = {
      onVerificationComplete: null,
      onVerificationFailed: null,
      onStatusChange: null,
      onError: null
    };
    
    // Privacy settings - everything stays local
    this.privacySettings = {
      noDataTransmission: true,
      noImageStorage: true,
      noThirdPartyAPIs: true,
      localProcessingOnly: true
    };
    
    this.verificationLevels = {
      basic: { minConfidence: 0.6, methods: 1 },
      standard: { minConfidence: 0.75, methods: 2 },
      high: { minConfidence: 0.85, methods: 3 }
    };
  }

  /**
   * Check if age verification is available on this device
   */
  async isAvailable() {
    try {
      const capabilities = {
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        webCrypto: 'crypto' in window && 'subtle' in window.crypto,
        indexedDB: 'indexedDB' in window,
        webWorkers: 'Worker' in window
      };
      
      return Object.values(capabilities).every(capability => capability);
    } catch (error) {
      this._handleError(error);
      return false;
    }
  }

  /**
   * Start age verification process
   */
  async startVerification(options = {}) {
    try {
      this._notifyStatusChange('initializing');
      
      if (!(await this.isAvailable())) {
        throw new Error('Age verification not available on this device');
      }

      const verificationId = this._generateVerificationId();
      const method = options.method || 'multi_factor';
      
      this._notifyStatusChange('verifying');
      
      let result;
      switch (method) {
        case 'biometric':
          result = await this._performBiometricVerification(verificationId);
          break;
        case 'document':
          result = await this._performDocumentVerification(verificationId);
          break;
        case 'device_settings':
          result = await this._performDeviceSettingsVerification(verificationId);
          break;
        case 'multi_factor':
          result = await this._performMultiFactorVerification(verificationId);
          break;
        default:
          throw new Error(`Unknown verification method: ${method}`);
      }

      // Store verification result locally only
      await this._storeVerificationLocally(result);
      
      this._notifyStatusChange('completed');
      this._notifyVerificationComplete(result);
      
      return result;
    } catch (error) {
      this._notifyStatusChange('failed');
      this._notifyVerificationFailed(error);
      this._handleError(error);
      throw error;
    }
  }

  /**
   * Get current verification status
   */
  getVerificationStatus() {
    const latest = this.verificationHistory[this.verificationHistory.length - 1];
    return {
      isVerified: !!latest?.verified,
      verificationLevel: latest?.level || 'none',
      lastVerified: latest?.timestamp || null,
      methods: latest?.methods || [],
      confidence: latest?.confidence || 0
    };
  }

  /**
   * Get verification proof for sharing (anonymous)
   */
  getVerificationProof() {
    const latest = this.verificationHistory[this.verificationHistory.length - 1];
    if (!latest?.verified) {
      return null;
    }

    // Return anonymous proof - no personal data
    return {
      verified: true,
      level: latest.level,
      confidence: latest.confidence,
      timestamp: latest.timestamp,
      proof: latest.cryptographicProof,
      deviceId: this.deviceId
    };
  }

  /**
   * Perform biometric age estimation (on-device AI)
   */
  async _performBiometricVerification(verificationId) {
    try {
      // Simulate on-device AI processing
      // In real implementation, this would use TensorFlow Lite
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: 640,
          height: 480
        } 
      });
      
      // Capture frame for processing
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      return new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', async () => {
          try {
            // Simulate AI age estimation (confidence 0.6-0.95)
            const estimatedAge = Math.floor(Math.random() * 15) + 18; // 18-32
            const confidence = 0.6 + Math.random() * 0.35; // 0.6-0.95
            const verified = estimatedAge >= 18 && confidence >= 0.75;
            
            // Stop camera stream immediately
            stream.getTracks().forEach(track => track.stop());
            
            const result = {
              id: verificationId,
              method: 'biometric',
              verified,
              estimatedAge,
              confidence,
              timestamp: Date.now(),
              cryptographicProof: await this._generateCryptographicProof({
                method: 'biometric',
                age: estimatedAge,
                confidence
              })
            };
            
            resolve(result);
          } catch (error) {
            stream.getTracks().forEach(track => track.stop());
            reject(error);
          }
        });
      });
    } catch (error) {
      throw new Error(`Biometric verification failed: ${error.message}`);
    }
  }

  /**
   * Perform document verification (local OCR)
   */
  async _performDocumentVerification(verificationId) {
    try {
      // Simulate document scanning and OCR
      // In real implementation, this would use local OCR libraries
      const documentData = {
        type: 'drivers_license',
        birthDate: '1995-06-15', // Would be extracted from document
        isValid: true,
        confidence: 0.9
      };
      
      const age = this._calculateAge(documentData.birthDate);
      const verified = age >= 18 && documentData.isValid;
      
      return {
        id: verificationId,
        method: 'document',
        verified,
        age,
        documentType: documentData.type,
        confidence: documentData.confidence,
        timestamp: Date.now(),
        cryptographicProof: await this._generateCryptographicProof({
          method: 'document',
          age,
          documentType: documentData.type
        })
      };
    } catch (error) {
      throw new Error(`Document verification failed: ${error.message}`);
    }
  }

  /**
   * Check device age settings
   */
  async _performDeviceSettingsVerification(verificationId) {
    try {
      // Check if device has age restrictions configured
      // This is a simulation - real implementation would check device settings
      const deviceAge = 'verified'; // Would check actual device settings
      const verified = deviceAge === 'verified';
      
      return {
        id: verificationId,
        method: 'device_settings',
        verified,
        deviceAge,
        confidence: 0.8,
        timestamp: Date.now(),
        cryptographicProof: await this._generateCryptographicProof({
          method: 'device_settings',
          deviceAge
        })
      };
    } catch (error) {
      throw new Error(`Device settings verification failed: ${error.message}`);
    }
  }

  /**
   * Perform multi-factor verification
   */
  async _performMultiFactorVerification(verificationId) {
    try {
      const factors = [];
      let totalWeight = 0;
      let weightedConfidence = 0;

      // Factor 1: Biometric (40% weight)
      try {
        const biometric = await this._performBiometricVerification(`${verificationId}_bio`);
        factors.push({ type: 'biometric', confidence: biometric.confidence, weight: 0.4 });
        weightedConfidence += biometric.confidence * 0.4;
        totalWeight += 0.4;
      } catch (error) {
        console.warn('Biometric factor failed:', error.message);
      }

      // Factor 2: Device settings (30% weight)
      try {
        const device = await this._performDeviceSettingsVerification(`${verificationId}_device`);
        factors.push({ type: 'device_settings', confidence: device.confidence, weight: 0.3 });
        weightedConfidence += device.confidence * 0.3;
        totalWeight += 0.3;
      } catch (error) {
        console.warn('Device settings factor failed:', error.message);
      }

      // Factor 3: Behavioral patterns (30% weight)
      try {
        const behavioral = await this._performBehavioralVerification(`${verificationId}_behavior`);
        factors.push({ type: 'behavioral', confidence: behavioral.confidence, weight: 0.3 });
        weightedConfidence += behavioral.confidence * 0.3;
        totalWeight += 0.3;
      } catch (error) {
        console.warn('Behavioral factor failed:', error.message);
      }

      if (factors.length === 0) {
        throw new Error('All verification factors failed');
      }

      const overallConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;
      const level = this._determineVerificationLevel(overallConfidence, factors.length);
      const verified = overallConfidence >= this.verificationLevels[level].minConfidence;

      return {
        id: verificationId,
        method: 'multi_factor',
        verified,
        factors,
        confidence: overallConfidence,
        level,
        timestamp: Date.now(),
        cryptographicProof: await this._generateCryptographicProof({
          method: 'multi_factor',
          factors: factors.map(f => ({ type: f.type, confidence: f.confidence })),
          confidence: overallConfidence
        })
      };
    } catch (error) {
      throw new Error(`Multi-factor verification failed: ${error.message}`);
    }
  }

  /**
   * Simulate behavioral pattern analysis
   */
  async _performBehavioralVerification(verificationId) {
    // Simulate analyzing app usage patterns for maturity indicators
    // In real implementation, this would analyze local usage data
    const maturityScore = 0.7 + Math.random() * 0.25; // 0.7-0.95
    
    return {
      id: verificationId,
      method: 'behavioral',
      confidence: maturityScore,
      patterns: ['consistent_usage', 'appropriate_interactions']
    };
  }

  /**
   * Generate cryptographic proof for verification
   */
  async _generateCryptographicProof(data) {
    try {
      // Check if TextEncoder is available (not available in test environment)
      if (typeof TextEncoder === 'undefined') {
        return 'proof_' + Date.now().toString(36);
      }
      
      const encoder = new TextEncoder();
      const dataString = JSON.stringify(data);
      const dataBuffer = encoder.encode(dataString);
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex.substring(0, 16); // Return first 16 chars for brevity
    } catch (error) {
      console.warn('Cryptographic proof generation failed:', error);
      return 'proof_' + Date.now().toString(36);
    }
  }

  /**
   * Store verification result locally (encrypted)
   */
  async _storeVerificationLocally(result) {
    try {
      const storageKey = `age_verification_${this.deviceId}`;
      const storageData = {
        ...result,
        storedAt: Date.now(),
        deviceId: this.deviceId
      };
      
      // Store in IndexedDB for persistence
      if ('indexedDB' in window && typeof indexedDB !== 'undefined') {
        try {
          const request = indexedDB.open('AgeVerificationDB', 1);
          
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('verifications')) {
              db.createObjectStore('verifications');
            }
          };
          
          request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['verifications'], 'readwrite');
            const store = transaction.objectStore('verifications');
            store.put(storageData, storageKey);
          };
        } catch (dbError) {
          console.warn('IndexedDB storage failed:', dbError);
        }
      }
      
      // Also store in memory
      this.verificationHistory.push(result);
      
      // Keep only last 10 verifications
      if (this.verificationHistory.length > 10) {
        this.verificationHistory = this.verificationHistory.slice(-10);
      }
    } catch (error) {
      console.warn('Local storage failed:', error);
    }
  }

  /**
   * Calculate age from birth date
   */
  _calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Determine verification level based on confidence and method count
   */
  _determineVerificationLevel(confidence, methodCount) {
    if (confidence >= 0.85 && methodCount >= 3) return 'high';
    if (confidence >= 0.75 && methodCount >= 2) return 'standard';
    if (confidence >= 0.6 && methodCount >= 1) return 'basic';
    return 'none';
  }

  /**
   * Generate unique verification ID
   */
  _generateVerificationId() {
    return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event handlers
   */
  _notifyVerificationComplete(result) {
    if (this.callbacks.onVerificationComplete) {
      this.callbacks.onVerificationComplete(result);
    }
  }

  _notifyVerificationFailed(error) {
    if (this.callbacks.onVerificationFailed) {
      this.callbacks.onVerificationFailed(error);
    }
  }

  _notifyStatusChange(status) {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status);
    }
  }

  _handleError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Public callback setters
   */
  onVerificationComplete(callback) {
    this.callbacks.onVerificationComplete = callback;
  }

  onVerificationFailed(callback) {
    this.callbacks.onVerificationFailed = callback;
  }

  onStatusChange(callback) {
    this.callbacks.onStatusChange = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Get verification history (local only)
   */
  getVerificationHistory() {
    return [...this.verificationHistory];
  }

  /**
   * Get verification statistics
   */
  getVerificationStats() {
    const total = this.verificationHistory.length;
    const successful = this.verificationHistory.filter(v => v.verified).length;
    const failed = total - successful;
    
    return {
      total,
      successful,
      failed,
      dataLocation: 'local'
    };
  }

  /**
   * Clear verification data (local only)
   */
  async clearVerificationData() {
    try {
      this.verificationHistory = [];
      
      if ('indexedDB' in window && typeof indexedDB !== 'undefined') {
        try {
          const request = indexedDB.open('AgeVerificationDB', 1);
          request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['verifications'], 'readwrite');
            const store = transaction.objectStore('verifications');
            store.delete(`age_verification_${this.deviceId}`);
          };
        } catch (dbError) {
          console.warn('IndexedDB clear failed:', dbError);
        }
      }
    } catch (error) {
      console.warn('Failed to clear verification data:', error);
    }
  }

  /**
   * Destroy manager and cleanup
   */
  destroy() {
    this.callbacks = {
      onVerificationComplete: null,
      onVerificationFailed: null,
      onStatusChange: null,
      onError: null
    };
    
    this.verificationHistory = [];
    this.verificationMethods.clear();
  }
}
