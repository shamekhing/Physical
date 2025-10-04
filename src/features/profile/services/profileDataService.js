/**
 * Profile Data Service
 * Handles profile pictures, file uploads, and data processing
 * All data stored locally with privacy-first approach
 */

/**
 * Profile Data Service Class
 * Manages profile assets and data processing
 */
export class ProfileDataService {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    this.maxImageDimensions = { width: 1024, height: 1024 };
  }

  /**
   * Process and validate profile picture
   */
  async processProfilePicture(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!this.allowedImageTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please use JPEG, PNG, or WebP');
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new Error('File too large. Maximum size is 5MB');
    }

    try {
      // Process and resize image
      const processedImage = await this.resizeImage(file);
      
      // Convert to base64 for local storage
      const base64Data = await this.fileToBase64(processedImage);
      
      return {
        data: base64Data,
        type: file.type,
        size: processedImage.size,
        dimensions: await this.getImageDimensions(processedImage)
      };
    } catch (error) {
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Resize image to fit within max dimensions
   */
  async resizeImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          this.maxImageDimensions.width,
          this.maxImageDimensions.height
        );

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          0.9 // Quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   */
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Scale down if too large
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert file to base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate avatar from initials
   */
  generateAvatar(displayName, size = 100) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = size;
    canvas.height = size;

    // Background color based on name hash
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const colorIndex = this.hashString(displayName) % colors.length;
    const backgroundColor = colors[colorIndex];

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);

    // Draw initials
    const initials = this.getInitials(displayName);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, size / 2, size / 2);

    return canvas.toDataURL();
  }

  /**
   * Get initials from display name
   */
  getInitials(displayName) {
    return displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Simple string hash function
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Validate profile data
   */
  validateProfileData(data) {
    const errors = [];

    if (data.displayName && data.displayName.length > 50) {
      errors.push('Display name must be less than 50 characters');
    }

    if (data.bio && data.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    if (data.interests && !Array.isArray(data.interests)) {
      errors.push('Interests must be an array');
    }

    if (data.interests && data.interests.length > 10) {
      errors.push('Maximum 10 interests allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available interests/tags
   */
  getAvailableInterests() {
    return [
      'Technology', 'Music', 'Sports', 'Art', 'Travel', 'Food', 'Gaming',
      'Fitness', 'Reading', 'Photography', 'Movies', 'Nature', 'Cooking',
      'Dancing', 'Writing', 'Science', 'Fashion', 'Animals', 'Gardening',
      'Meditation', 'Volunteering', 'Learning', 'Socializing', 'Adventure'
    ];
  }

  /**
   * Get looking for options
   */
  getLookingForOptions() {
    return [
      { value: 'friends', label: 'Friends' },
      { value: 'networking', label: 'Professional Networking' },
      { value: 'dating', label: 'Dating' },
      { value: 'hobbies', label: 'Hobby Partners' },
      { value: 'mentoring', label: 'Mentoring' },
      { value: 'community', label: 'Community Building' }
    ];
  }

  /**
   * Get privacy level options
   */
  getPrivacyLevels() {
    return [
      { 
        value: 'public', 
        label: 'Public', 
        description: 'Visible to everyone in discovery' 
      },
      { 
        value: 'friends', 
        label: 'Friends Only', 
        description: 'Visible to matched users only' 
      },
      { 
        value: 'private', 
        label: 'Private', 
        description: 'Not visible in discovery' 
      }
    ];
  }

  /**
   * Format profile for display
   */
  formatProfileForDisplay(profile) {
    if (!profile) return null;

    return {
      ...profile,
      displayName: profile.displayName || 'Anonymous User',
      bio: profile.bio || 'No bio available',
      interests: profile.interests || [],
      profilePicture: profile.profilePicture || this.generateAvatar(profile.displayName || 'User'),
      age: profile.age ? `${profile.age} years old` : 'Age not specified',
      createdAt: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'
    };
  }
}

