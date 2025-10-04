import { useState, useEffect, useCallback, useRef } from 'react';
import { AgeVerificationManager } from './ageVerificationManager.js';
import { BiometricAgeEstimator } from './biometricAgeEstimator.js';
import { DocumentVerifier } from './documentVerifier.js';

/**
 * Custom React hook for age verification functionality
 * Provides privacy-first age verification with no external data collection
 */
export const useAgeVerification = () => {
  const [status, setStatus] = useState('idle');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState(null);
  
  // Manager instances (created once)
  const managerRef = useRef(null);
  const biometricRef = useRef(null);
  const documentRef = useRef(null);

  /**
   * Initialize managers on mount
   */
  useEffect(() => {
    const initializeManagers = async () => {
      try {
        // Create manager instances
        managerRef.current = new AgeVerificationManager();
        biometricRef.current = new BiometricAgeEstimator();
        documentRef.current = new DocumentVerifier();

        // Set up event handlers
        setupEventHandlers();

        // Check availability
        const available = await managerRef.current.isAvailable();
        setIsAvailable(available);

        // Load verification history
        loadVerificationHistory();
      } catch (error) {
        setError(error.message);
        setIsAvailable(false);
      }
    };

    initializeManagers();

    // Cleanup on unmount
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
      }
      if (biometricRef.current) {
        biometricRef.current.destroy();
      }
      if (documentRef.current) {
        documentRef.current.destroy();
      }
    };
  }, []);

  /**
   * Set up event handlers for all managers
   */
  const setupEventHandlers = () => {
    if (managerRef.current) {
      managerRef.current.onStatusChange((newStatus) => {
        setStatus(newStatus);
      });

      managerRef.current.onVerificationComplete((result) => {
        setVerificationResult(result);
        setVerificationHistory(prev => [...prev, result].slice(-10));
        setError(null);
      });

      managerRef.current.onVerificationFailed((error) => {
        setError(error.message);
        setVerificationResult(null);
      });

      managerRef.current.onError((error) => {
        setError(error.message);
      });
    }

    if (biometricRef.current) {
      biometricRef.current.onStatusChange((newStatus) => {
        setStatus(newStatus);
      });

      biometricRef.current.onError((error) => {
        setError(error.message);
      });
    }

    if (documentRef.current) {
      documentRef.current.onStatusChange((newStatus) => {
        setStatus(newStatus);
      });

      documentRef.current.onError((error) => {
        setError(error.message);
      });
    }
  };

  /**
   * Load verification history from manager
   */
  const loadVerificationHistory = () => {
    if (managerRef.current) {
      const history = managerRef.current.getVerificationHistory();
      // Use setTimeout to defer state update to avoid act() warnings in tests
      setTimeout(() => {
        setVerificationHistory(history);
      }, 0);
    }
  };

  /**
   * Start age verification process
   */
  const startVerification = useCallback(async (options = {}) => {
    if (!managerRef.current || !isAvailable) {
      throw new Error('Age verification not available');
    }

    try {
      setError(null);
      setStatus('starting');
      
      const result = await managerRef.current.startVerification(options);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [isAvailable]);

  /**
   * Start biometric age estimation
   */
  const startBiometricEstimation = useCallback(async (options = {}) => {
    if (!biometricRef.current) {
      throw new Error('Biometric estimator not available');
    }

    try {
      setError(null);
      setStatus('biometric_processing');
      
      const result = await biometricRef.current.startEstimation(options);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  /**
   * Start document verification
   */
  const startDocumentVerification = useCallback(async (options = {}) => {
    if (!documentRef.current) {
      throw new Error('Document verifier not available');
    }

    try {
      setError(null);
      setStatus('document_processing');
      
      const result = await documentRef.current.startVerification(options);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  /**
   * Get current verification status
   */
  const getVerificationStatus = useCallback(() => {
    if (!managerRef.current) {
      return {
        isVerified: false,
        verificationLevel: 'none',
        lastVerified: null,
        methods: [],
        confidence: 0
      };
    }

    return managerRef.current.getVerificationStatus();
  }, []);

  /**
   * Get verification proof for sharing
   */
  const getVerificationProof = useCallback(() => {
    if (!managerRef.current) {
      return null;
    }

    return managerRef.current.getVerificationProof();
  }, []);

  /**
   * Clear verification data
   */
  const clearVerificationData = useCallback(async () => {
    if (!managerRef.current) {
      return;
    }

    try {
      await managerRef.current.clearVerificationData();
      setVerificationResult(null);
      setVerificationHistory([]);
      setError(null);
      setStatus('idle');
    } catch (error) {
      setError(error.message);
    }
  }, []);

  /**
   * Stop current verification process
   */
  const stopVerification = useCallback(() => {
    try {
      if (managerRef.current) {
        // Manager doesn't have stop method, but we can reset status
        setStatus('idle');
      }
      
      if (biometricRef.current) {
        biometricRef.current.stopEstimation();
      }
      
      if (documentRef.current) {
        documentRef.current.stopVerification();
      }
      
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  /**
   * Get processing status for individual components
   */
  const getProcessingStatus = useCallback(() => {
    const biometricStatus = biometricRef.current ? 
      biometricRef.current.getProcessingStatus() : { isProcessing: false, available: false };
    
    const documentStatus = documentRef.current ? 
      documentRef.current.getProcessingStatus() : { isProcessing: false, available: false };

    return {
      biometric: biometricStatus,
      document: documentStatus,
      overall: status !== 'idle' && status !== 'completed' && status !== 'failed'
    };
  }, [status]);

  /**
   * Get supported document types
   */
  const getSupportedDocuments = useCallback(() => {
    if (!documentRef.current) {
      return [];
    }

    return documentRef.current.getSupportedDocuments();
  }, []);

  /**
   * Check if specific verification method is available
   */
  const isMethodAvailable = useCallback(async (method) => {
    try {
      switch (method) {
        case 'biometric':
          return biometricRef.current ? await biometricRef.current.isAvailable() : false;
        case 'document':
          return documentRef.current ? await documentRef.current.isAvailable() : false;
        case 'multi_factor':
        case 'device_settings':
          return isAvailable;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }, [isAvailable]);

  /**
   * Get verification statistics
   */
  const getVerificationStats = useCallback(() => {
    if (managerRef.current) {
      return managerRef.current.getVerificationStats();
    }
    
    // Fallback if manager not available
    const total = verificationHistory.length;
    const successful = verificationHistory.filter(v => v.verified).length;
    const failed = total - successful;
    const lastVerified = verificationHistory.length > 0 ? 
      verificationHistory[verificationHistory.length - 1].timestamp : null;

    const methodStats = verificationHistory.reduce((stats, verification) => {
      const method = verification.method;
      if (!stats[method]) {
        stats[method] = { total: 0, successful: 0 };
      }
      stats[method].total++;
      if (verification.verified) {
        stats[method].successful++;
      }
      return stats;
    }, {});

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      lastVerified,
      methodStats,
      dataLocation: 'local'
    };
  }, [verificationHistory]);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get current verification level description
   */
  const getVerificationLevelDescription = useCallback(() => {
    const status = getVerificationStatus();
    
    switch (status.verificationLevel) {
      case 'high':
        return 'High confidence verification with multiple factors';
      case 'standard':
        return 'Standard verification with good confidence';
      case 'basic':
        return 'Basic verification with acceptable confidence';
      case 'none':
      default:
        return 'No verification completed';
    }
  }, [getVerificationStatus]);

  return {
    // State
    status,
    verificationResult,
    verificationHistory,
    verificationStatus: getVerificationStatus(),
    isAvailable,
    error,

    // Actions
    startVerification,
    startBiometricEstimation,
    startDocumentVerification,
    stopVerification,
    clearVerificationData,
    clearError,

    // Getters
    getVerificationStatus,
    getVerificationProof,
    getProcessingStatus,
    getSupportedDocuments,
    getVerificationStats,
    getVerificationLevelDescription,

    // Utilities
    isMethodAvailable
  };
};
