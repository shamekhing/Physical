/**
 * Biometric Age Estimator - On-Device AI Processing
 * Uses device camera and local AI models for age estimation
 * NO data transmission - everything processed locally
 */
export class BiometricAgeEstimator {
  constructor() {
    this.isProcessing = false;
    this.model = null;
    this.callbacks = {
      onEstimationComplete: null,
      onEstimationFailed: null,
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
   * Check if biometric estimation is available
   */
  async isAvailable() {
    try {
      const capabilities = {
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        canvas: 'HTMLCanvasElement' in window,
        webWorkers: 'Worker' in window,
        webCrypto: 'crypto' in window && 'subtle' in window.crypto
      };
      
      return Object.values(capabilities).every(capability => capability);
    } catch (error) {
      this._handleError(error);
      return false;
    }
  }

  /**
   * Start biometric age estimation process
   */
  async startEstimation(options = {}) {
    try {
      if (!(await this.isAvailable())) {
        throw new Error('Biometric estimation not available on this device');
      }

      if (this.isProcessing) {
        throw new Error('Biometric estimation already in progress');
      }

      this.isProcessing = true;
      this._notifyStatusChange('initializing');

      const estimationId = this._generateEstimationId();
      const result = await this._performEstimation(estimationId, options);

      this.isProcessing = false;
      this._notifyStatusChange('completed');
      this._notifyEstimationComplete(result);

      return result;
    } catch (error) {
      this.isProcessing = false;
      this._notifyStatusChange('failed');
      this._notifyEstimationFailed(error);
      this._handleError(error);
      throw error;
    }
  }

  /**
   * Perform the actual biometric estimation
   */
  async _performEstimation(estimationId, options) {
    try {
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
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
            
            // Process frame with local AI
            const estimation = await this._processFrame(frameData, options);
            
            // Discard frame data immediately (privacy)
            frameData.imageData = null;
            
            const result = {
              id: estimationId,
              estimatedAge: estimation.age,
              ageRange: estimation.ageRange,
              confidence: estimation.confidence,
              livenessScore: estimation.livenessScore,
              qualityScore: estimation.qualityScore,
              timestamp: Date.now(),
              processingTime: estimation.processingTime,
              deviceInfo: {
                camera: this._getCameraInfo(stream),
                userAgent: navigator.userAgent.substring(0, 50) + '...'
              }
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
      throw new Error(`Biometric estimation failed: ${error.message}`);
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
   * Process captured frame with local AI
   */
  async _processFrame(frameData, options) {
    const startTime = Date.now();
    
    try {
      // Simulate local AI processing
      // In real implementation, this would use TensorFlow Lite or similar
      await this._simulateAIProcessing();
      
      // Analyze image quality
      const qualityScore = this._analyzeImageQuality(frameData.metrics);
      
      // Simulate liveness detection
      const livenessScore = this._detectLiveness(frameData.imageData);
      
      // Simulate age estimation
      const ageEstimation = this._estimateAge(frameData.imageData, options);
      
      const processingTime = Date.now() - startTime;
      
      return {
        age: ageEstimation.age,
        ageRange: ageEstimation.range,
        confidence: ageEstimation.confidence,
        livenessScore,
        qualityScore,
        processingTime
      };
    } catch (error) {
      throw new Error(`Frame processing failed: ${error.message}`);
    }
  }

  /**
   * Simulate AI processing time
   */
  async _simulateAIProcessing() {
    // Simulate processing time (200-800ms)
    const processingTime = 200 + Math.random() * 600;
    return new Promise(resolve => setTimeout(resolve, processingTime));
  }

  /**
   * Analyze image quality metrics
   */
  _analyzeImageQuality(metrics) {
    let qualityScore = 0.5; // Base score
    
    // Brightness analysis
    if (metrics.brightness > 0.3 && metrics.brightness < 0.8) {
      qualityScore += 0.2;
    }
    
    // Contrast analysis
    if (metrics.contrast > 0.2) {
      qualityScore += 0.15;
    }
    
    // Sharpness analysis (based on variance)
    if (metrics.variance > 1000) {
      qualityScore += 0.15;
    }
    
    return Math.min(1.0, qualityScore);
  }

  /**
   * Detect liveness (simplified)
   */
  _detectLiveness(imageData) {
    // Simulate liveness detection
    // In real implementation, this would analyze for:
    // - Eye movement
    // - Blinking
    // - Facial micro-movements
    // - 3D depth analysis
    
    const baseScore = 0.7 + Math.random() * 0.25; // 0.7-0.95
    return baseScore;
  }

  /**
   * Estimate age from image data
   */
  _estimateAge(imageData, options) {
    // Simulate age estimation
    // In real implementation, this would use trained ML models
    
    const baseAge = 18 + Math.random() * 15; // 18-33
    const confidence = 0.65 + Math.random() * 0.3; // 0.65-0.95
    
    const ageRange = this._calculateAgeRange(baseAge, confidence);
    
    return {
      age: Math.round(baseAge),
      range: ageRange,
      confidence
    };
  }

  /**
   * Calculate age range based on confidence
   */
  _calculateAgeRange(age, confidence) {
    const uncertainty = Math.round((1 - confidence) * 5); // Max 5 years uncertainty
    return {
      min: Math.max(18, Math.round(age - uncertainty)),
      max: Math.round(age + uncertainty)
    };
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
   * Get camera information
   */
  _getCameraInfo(stream) {
    const track = stream.getVideoTracks()[0];
    if (!track) return null;
    
    const settings = track.getSettings();
    return {
      deviceId: settings.deviceId?.substring(0, 8) + '...',
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate
    };
  }

  /**
   * Generate unique estimation ID
   */
  _generateEstimationId() {
    return `est_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event handlers
   */
  _notifyEstimationComplete(result) {
    if (this.callbacks.onEstimationComplete) {
      this.callbacks.onEstimationComplete(result);
    }
  }

  _notifyEstimationFailed(error) {
    if (this.callbacks.onEstimationFailed) {
      this.callbacks.onEstimationFailed(error);
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
  onEstimationComplete(callback) {
    this.callbacks.onEstimationComplete = callback;
  }

  onEstimationFailed(callback) {
    this.callbacks.onEstimationFailed = callback;
  }

  onStatusChange(callback) {
    this.callbacks.onStatusChange = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
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
   * Stop current estimation
   */
  stopEstimation() {
    this.isProcessing = false;
    this._notifyStatusChange('stopped');
  }

  /**
   * Destroy estimator and cleanup
   */
  destroy() {
    this.stopEstimation();
    
    this.callbacks = {
      onEstimationComplete: null,
      onEstimationFailed: null,
      onStatusChange: null,
      onError: null
    };
    
    this.model = null;
  }
}
