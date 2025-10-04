/**
 * Document Verifier - Local ID Verification
 * Uses device camera and local OCR for document verification
 * NO data transmission - everything processed locally
 */
export class DocumentVerifier {
  constructor() {
    this.isProcessing = false;
    this.supportedDocuments = [
      'drivers_license',
      'passport',
      'national_id',
      'student_id'
    ];
    this.callbacks = {
      onVerificationComplete: null,
      onVerificationFailed: null,
      onStatusChange: null,
      onError: null
    };
    
    // Privacy settings - everything stays local
    this.privacySettings = {
      noImageStorage: true,
      noDataTransmission: true,
      localProcessingOnly: true,
      immediateDiscard: true
    };
  }

  /**
   * Check if document verification is available
   */
  async isAvailable() {
    try {
      const capabilities = {
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        canvas: 'HTMLCanvasElement' in window,
        webWorkers: 'Worker' in window,
        fileReader: 'FileReader' in window
      };
      
      return Object.values(capabilities).every(capability => capability);
    } catch (error) {
      this._handleError(error);
      return false;
    }
  }

  /**
   * Start document verification process
   */
  async startVerification(options = {}) {
    try {
      if (!(await this.isAvailable())) {
        throw new Error('Document verification not available on this device');
      }

      if (this.isProcessing) {
        throw new Error('Document verification already in progress');
      }

      this.isProcessing = true;
      this._notifyStatusChange('initializing');

      const verificationId = this._generateVerificationId();
      const documentType = options.documentType || 'drivers_license';
      
      let result;
      if (options.useCamera) {
        result = await this._verifyWithCamera(verificationId, documentType);
      } else if (options.file) {
        result = await this._verifyWithFile(verificationId, documentType, options.file);
      } else {
        throw new Error('Either camera or file must be provided');
      }

      this.isProcessing = false;
      this._notifyStatusChange('completed');
      this._notifyVerificationComplete(result);

      return result;
    } catch (error) {
      this.isProcessing = false;
      this._notifyStatusChange('failed');
      this._notifyVerificationFailed(error);
      this._handleError(error);
      throw error;
    }
  }

  /**
   * Verify document using camera
   */
  async _verifyWithCamera(verificationId, documentType) {
    try {
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera for documents
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      // Create video element for capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      return new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', async () => {
          try {
            // Start video playback
            await video.play();
            
            // Wait for video to be ready
            await this._waitForVideoReady(video);
            
            // Capture frame
            const frameData = await this._captureFrame(video);
            
            // Stop camera immediately
            stream.getTracks().forEach(track => track.stop());
            
            // Process document
            const verification = await this._processDocument(frameData, documentType);
            
            // Discard frame data immediately (privacy)
            frameData.imageData = null;
            
            const result = {
              id: verificationId,
              method: 'camera',
              documentType,
              verified: verification.isValid,
              extractedData: verification.extractedData,
              confidence: verification.confidence,
              qualityScore: verification.qualityScore,
              timestamp: Date.now(),
              processingTime: verification.processingTime
            };

            resolve(result);
          } catch (error) {
            stream.getTracks().forEach(track => track.stop());
            reject(error);
          }
        });

        video.addEventListener('error', (error) => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error(`Video error: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`Camera verification failed: ${error.message}`);
    }
  }

  /**
   * Verify document using uploaded file
   */
  async _verifyWithFile(verificationId, documentType, file) {
    try {
      // Validate file type
      if (!this._isValidImageFile(file)) {
        throw new Error('Invalid file type. Please upload a valid image file.');
      }

      // Read file data
      const imageData = await this._readFileData(file);
      
      // Process document
      const verification = await this._processDocument(imageData, documentType);
      
      // Discard image data immediately (privacy)
      imageData.imageData = null;
      
      return {
        id: verificationId,
        method: 'file',
        documentType,
        verified: verification.isValid,
        extractedData: verification.extractedData,
        confidence: verification.confidence,
        qualityScore: verification.qualityScore,
        timestamp: Date.now(),
        processingTime: verification.processingTime
      };
    } catch (error) {
      throw new Error(`File verification failed: ${error.message}`);
    }
  }

  /**
   * Wait for video to be ready for capture
   */
  async _waitForVideoReady(video) {
    return new Promise((resolve) => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        resolve();
      } else {
        video.addEventListener('canplay', () => resolve(), { once: true });
      }
    });
  }

  /**
   * Capture frame from video
   */
  async _captureFrame(video) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Calculate basic image metrics
    const metrics = this._calculateImageMetrics(imageData);
    
    return {
      canvas,
      imageData,
      metrics,
      timestamp: Date.now()
    };
  }

  /**
   * Read file data from uploaded file
   */
  async _readFileData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            context.drawImage(img, 0, 0);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const metrics = this._calculateImageMetrics(imageData);
            
            resolve({
              canvas,
              imageData,
              metrics,
              timestamp: Date.now()
            });
          };
          
          img.src = event.target.result;
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Process document with local OCR
   */
  async _processDocument(frameData, documentType) {
    const startTime = Date.now();
    
    try {
      // Simulate local OCR processing
      // In real implementation, this would use local OCR libraries
      await this._simulateOCRProcessing();
      
      // Analyze document quality
      const qualityScore = this._analyzeDocumentQuality(frameData.metrics);
      
      // Extract document data based on type
      const extractedData = await this._extractDocumentData(frameData.imageData, documentType);
      
      // Validate extracted data
      const validation = this._validateDocumentData(extractedData, documentType);
      
      const processingTime = Date.now() - startTime;
      
      return {
        isValid: validation.isValid,
        extractedData: validation.extractedData,
        confidence: validation.confidence,
        qualityScore,
        processingTime,
        validationErrors: validation.errors
      };
    } catch (error) {
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Simulate OCR processing time
   */
  async _simulateOCRProcessing() {
    // Simulate processing time (500-1500ms)
    const processingTime = 500 + Math.random() * 1000;
    return new Promise(resolve => setTimeout(resolve, processingTime));
  }

  /**
   * Extract data from document based on type
   */
  async _extractDocumentData(imageData, documentType) {
    // Simulate OCR data extraction
    // In real implementation, this would use trained models for each document type
    
    const baseData = {
      documentType,
      extractedAt: new Date().toISOString()
    };

    switch (documentType) {
      case 'drivers_license':
        return {
          ...baseData,
          fullName: 'John Doe',
          dateOfBirth: '1995-06-15',
          licenseNumber: 'DL123456789',
          expiryDate: '2025-06-15',
          issuingAuthority: 'DMV California'
        };
      
      case 'passport':
        return {
          ...baseData,
          fullName: 'John Doe',
          dateOfBirth: '1995-06-15',
          passportNumber: 'P123456789',
          expiryDate: '2030-06-15',
          nationality: 'US',
          issuingCountry: 'United States'
        };
      
      case 'national_id':
        return {
          ...baseData,
          fullName: 'John Doe',
          dateOfBirth: '1995-06-15',
          idNumber: 'ID123456789',
          expiryDate: '2030-06-15',
          issuingAuthority: 'Department of State'
        };
      
      case 'student_id':
        return {
          ...baseData,
          fullName: 'John Doe',
          dateOfBirth: '1995-06-15',
          studentId: 'S123456789',
          institution: 'University of California',
          expiryDate: '2025-06-15'
        };
      
      default:
        return baseData;
    }
  }

  /**
   * Validate extracted document data
   */
  _validateDocumentData(extractedData, documentType) {
    const errors = [];
    let confidence = 0.8; // Base confidence
    
    // Check required fields
    if (!extractedData.fullName) {
      errors.push('Full name not found');
      confidence -= 0.2;
    }
    
    if (!extractedData.dateOfBirth) {
      errors.push('Date of birth not found');
      confidence -= 0.2;
    } else {
      // Validate date format and calculate age
      const birthDate = new Date(extractedData.dateOfBirth);
      const age = this._calculateAge(birthDate);
      
      if (age < 18) {
        errors.push('Age verification failed - under 18');
        confidence -= 0.3;
      } else if (age > 100) {
        errors.push('Invalid birth date');
        confidence -= 0.2;
      }
    }
    
    // Document-specific validation
    switch (documentType) {
      case 'drivers_license':
        if (!extractedData.licenseNumber) {
          errors.push('License number not found');
          confidence -= 0.1;
        }
        break;
      
      case 'passport':
        if (!extractedData.passportNumber) {
          errors.push('Passport number not found');
          confidence -= 0.1;
        }
        break;
    }
    
    // Check expiry date
    if (extractedData.expiryDate) {
      const expiryDate = new Date(extractedData.expiryDate);
      if (expiryDate < new Date()) {
        errors.push('Document expired');
        confidence -= 0.1;
      }
    }
    
    const isValid = errors.length === 0 && confidence >= 0.6;
    
    return {
      isValid,
      extractedData: isValid ? extractedData : null,
      confidence: Math.max(0, confidence),
      errors
    };
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
   * Analyze document quality
   */
  _analyzeDocumentQuality(metrics) {
    let qualityScore = 0.5; // Base score
    
    // Brightness analysis
    if (metrics.brightness > 0.3 && metrics.brightness < 0.8) {
      qualityScore += 0.2;
    }
    
    // Contrast analysis
    if (metrics.contrast > 0.3) {
      qualityScore += 0.2;
    }
    
    // Sharpness analysis
    if (metrics.variance > 2000) {
      qualityScore += 0.1;
    }
    
    return Math.min(1.0, qualityScore);
  }

  /**
   * Calculate basic image metrics
   */
  _calculateImageMetrics(imageData) {
    const data = imageData.data;
    let totalBrightness = 0;
    let totalVariance = 0;
    let pixelCount = 0;
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3 / 255;
      totalBrightness += brightness;
      
      pixelCount++;
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    
    // Calculate variance (contrast indicator)
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3 / 255;
      
      totalVariance += Math.pow(brightness - avgBrightness, 2);
    }
    
    return {
      brightness: avgBrightness,
      variance: totalVariance / pixelCount,
      contrast: Math.sqrt(totalVariance / pixelCount)
    };
  }

  /**
   * Validate image file type
   */
  _isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  }

  /**
   * Generate unique verification ID
   */
  _generateVerificationId() {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Get supported document types
   */
  getSupportedDocuments() {
    return [...this.supportedDocuments];
  }

  /**
   * Get processing status
   */
  getProcessingStatus() {
    return {
      isProcessing: this.isProcessing,
      available: this.isAvailable()
    };
  }

  /**
   * Stop current verification
   */
  stopVerification() {
    this.isProcessing = false;
    this._notifyStatusChange('stopped');
  }

  /**
   * Destroy verifier and cleanup
   */
  destroy() {
    this.stopVerification();
    
    this.callbacks = {
      onVerificationComplete: null,
      onVerificationFailed: null,
      onStatusChange: null,
      onError: null
    };
  }
}
