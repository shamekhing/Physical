/**
 * ProfileSetup Component Tests
 * Tests for the ProfileSetup component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileSetup from '../components/ProfileSetup.js';

// Mock the useProfile hook
jest.mock('../hooks/useProfile.js', () => ({
  useProfile: jest.fn()
}));

describe('ProfileSetup', () => {
  const mockUseProfile = require('../hooks/useProfile.js').useProfile;
  
  const defaultMockReturn = {
    createProfile: jest.fn(),
    loading: false,
    error: null,
    saving: false,
    clearError: jest.fn(),
    getAvailableInterests: jest.fn(() => ['Technology', 'Music', 'Sports', 'Art']),
    getLookingForOptions: jest.fn(() => [
      { value: 'friends', label: 'Friends' },
      { value: 'networking', label: 'Professional Networking' }
    ]),
    getPrivacyLevels: jest.fn(() => [
      { value: 'public', label: 'Public', description: 'Visible to everyone' },
      { value: 'friends', label: 'Friends Only', description: 'Visible to matched users only' }
    ])
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure the mock returns the expected data
    mockUseProfile.mockReturnValue({
      ...defaultMockReturn,
      getAvailableInterests: jest.fn(() => ['Technology', 'Music', 'Sports', 'Art']),
      getLookingForOptions: jest.fn(() => [
        { value: 'friends', label: 'Friends' },
        { value: 'networking', label: 'Professional Networking' }
      ]),
      getPrivacyLevels: jest.fn(() => [
        { value: 'public', label: 'Public', description: 'Visible to everyone' },
        { value: 'friends', label: 'Friends Only', description: 'Visible to matched users only' }
      ])
    });
  });

  describe('rendering', () => {
    it('should render setup form', () => {
      render(<ProfileSetup />);
      
      expect(screen.getByText('Create Your Profile')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        loading: true
      });

      render(<ProfileSetup />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error banner when error exists', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        error: 'Test error message'
      });

      render(<ProfileSetup />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
    });
  });

  describe('step 1 - basic information', () => {
    it('should render basic information form', () => {
      render(<ProfileSetup />);
      
      expect(screen.getByLabelText('Display Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Profile Picture')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should validate display name', async () => {
      render(<ProfileSetup />);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeInTheDocument();
      });
    });

    it('should show character count for display name', () => {
      render(<ProfileSetup />);
      
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test' } });
      
      expect(screen.getByText('4/50 characters')).toBeInTheDocument();
    });

    it('should handle profile picture upload', () => {
      render(<ProfileSetup />);
      
      const fileInput = screen.getByLabelText('Profile Picture');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Should not throw error
      expect(fileInput.files[0]).toBe(file);
    });
  });

  describe('step 2 - bio', () => {
    beforeEach(() => {
      // Mock successful step 1
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        createProfile: jest.fn().mockResolvedValue(),
        getAvailableInterests: jest.fn(() => ['Technology', 'Music', 'Sports', 'Art']),
        getLookingForOptions: jest.fn(() => [
          { value: 'friends', label: 'Friends' },
          { value: 'networking', label: 'Professional Networking' }
        ]),
        getPrivacyLevels: jest.fn(() => [
          { value: 'public', label: 'Public', description: 'Visible to everyone' },
          { value: 'friends', label: 'Friends Only', description: 'Visible to matched users only' }
        ])
      });
    });

    it('should navigate to step 2', async () => {
      render(<ProfileSetup />);
      
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
        expect(screen.getByText('Tell Us About Yourself')).toBeInTheDocument();
        expect(screen.getByLabelText('Bio *')).toBeInTheDocument();
      });
    });

    it('should validate bio', async () => {
      render(<ProfileSetup />);
      
      // Navigate to step 2
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const nextButton2 = screen.getByText('Next');
        fireEvent.click(nextButton2);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Bio is required')).toBeInTheDocument();
      });
    });

    it('should show character count for bio', async () => {
      render(<ProfileSetup />);
      
      // Navigate to step 2
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const bioInput = screen.getByLabelText('Bio *');
        fireEvent.change(bioInput, { target: { value: 'Test bio content' } });
        
        expect(screen.getByText('16/500 characters')).toBeInTheDocument();
      });
    });
  });

  describe('step 3 - interests', () => {
    beforeEach(async () => {
      // Ensure the mock returns the expected data
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        createProfile: jest.fn().mockResolvedValue(),
        getAvailableInterests: jest.fn(() => ['Technology', 'Music', 'Sports', 'Art']),
        getLookingForOptions: jest.fn(() => [
          { value: 'friends', label: 'Friends' },
          { value: 'networking', label: 'Professional Networking' }
        ]),
        getPrivacyLevels: jest.fn(() => [
          { value: 'public', label: 'Public', description: 'Visible to everyone' },
          { value: 'friends', label: 'Friends Only', description: 'Visible to matched users only' }
        ])
      });
      
      render(<ProfileSetup />);
      
      // Navigate to step 3
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const bioInput = screen.getByLabelText('Bio *');
        fireEvent.change(bioInput, { target: { value: 'Test bio content' } });
        
        const nextButton2 = screen.getByText('Next');
        fireEvent.click(nextButton2);
      });
    });

    it('should render interests selection', async () => {
      await waitFor(() => {
        expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
        expect(screen.getByText('Your Interests')).toBeInTheDocument();
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Music')).toBeInTheDocument();
      });
    });

    it('should toggle interest selection', async () => {
      await waitFor(() => {
        const technologyButton = screen.getByText('Technology');
        fireEvent.click(technologyButton);
        
        expect(technologyButton).toHaveClass('selected');
      });
    });

    it('should validate interests selection', async () => {
      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
        
        expect(screen.getByText('Please select at least one interest')).toBeInTheDocument();
      });
    });
  });

  describe('step 4 - preferences', () => {
    beforeEach(async () => {
      // Ensure the mock returns the expected data
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        createProfile: jest.fn().mockResolvedValue(),
        getAvailableInterests: jest.fn(() => ['Technology', 'Music', 'Sports', 'Art']),
        getLookingForOptions: jest.fn(() => [
          { value: 'friends', label: 'Friends' },
          { value: 'networking', label: 'Professional Networking' }
        ]),
        getPrivacyLevels: jest.fn(() => [
          { value: 'public', label: 'Public', description: 'Visible to everyone' },
          { value: 'friends', label: 'Friends Only', description: 'Visible to matched users only' }
        ])
      });
      
      render(<ProfileSetup />);
      
      // Navigate to step 4
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      let nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const bioInput = screen.getByLabelText('Bio *');
        fireEvent.change(bioInput, { target: { value: 'Test bio content' } });
        
        nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });
      
      await waitFor(() => {
        const technologyButton = screen.getByText('Technology');
        fireEvent.click(technologyButton);
        
        nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });
    });

    it('should render preferences form', async () => {
      await waitFor(() => {
        expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
        expect(screen.getByText('Discovery Preferences')).toBeInTheDocument();
        expect(screen.getByLabelText('Looking For')).toBeInTheDocument();
        expect(screen.getByLabelText('Privacy Level')).toBeInTheDocument();
      });
    });

    it('should show create profile button on final step', async () => {
      await waitFor(() => {
        expect(screen.getByText('Create Profile')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should submit profile successfully', async () => {
      const mockOnComplete = jest.fn();
      const mockCreateProfile = jest.fn().mockResolvedValue({ id: 'test' });
      
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        createProfile: mockCreateProfile,
        getAvailableInterests: jest.fn(() => ['Technology', 'Music', 'Sports', 'Art']),
        getLookingForOptions: jest.fn(() => [
          { value: 'friends', label: 'Friends' },
          { value: 'networking', label: 'Professional Networking' }
        ]),
        getPrivacyLevels: jest.fn(() => [
          { value: 'public', label: 'Public', description: 'Visible to everyone' },
          { value: 'friends', label: 'Friends Only', description: 'Visible to matched users only' }
        ])
      });

      render(<ProfileSetup onComplete={mockOnComplete} />);
      
      // Fill out the form
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      let nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const bioInput = screen.getByLabelText('Bio *');
        fireEvent.change(bioInput, { target: { value: 'Test bio content' } });
        
        nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });
      
      await waitFor(() => {
        const technologyButton = screen.getByText('Technology');
        fireEvent.click(technologyButton);
        
        nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Profile');
        fireEvent.click(createButton);
      });
      
      await waitFor(() => {
        expect(mockCreateProfile).toHaveBeenCalledWith({
          displayName: 'Test User',
          bio: 'Test bio content',
          interests: ['Technology'],
          lookingFor: 'friends',
          privacyLevel: 'friends',
          profilePictureFile: null
        });
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should handle submission error', async () => {
      const mockCreateProfile = jest.fn().mockRejectedValue(new Error('Creation failed'));
      
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        createProfile: mockCreateProfile,
        getAvailableInterests: jest.fn(() => ['Technology', 'Music', 'Sports', 'Art']),
        getLookingForOptions: jest.fn(() => [
          { value: 'friends', label: 'Friends' },
          { value: 'networking', label: 'Professional Networking' }
        ]),
        getPrivacyLevels: jest.fn(() => [
          { value: 'public', label: 'Public', description: 'Visible to everyone' },
          { value: 'friends', label: 'Friends Only', description: 'Visible to matched users only' }
        ])
      });

      render(<ProfileSetup />);
      
      // Fill out minimal form and submit
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      let nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const bioInput = screen.getByLabelText('Bio *');
        fireEvent.change(bioInput, { target: { value: 'Test bio' } });
        
        nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });
      
      await waitFor(() => {
        const technologyButton = screen.getByText('Technology');
        fireEvent.click(technologyButton);
        
        nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Profile');
        fireEvent.click(createButton);
      });
      
      // Error should be handled by the hook
      expect(mockCreateProfile).toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('should navigate back to previous step', async () => {
      render(<ProfileSetup />);
      
      // Go to step 2
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const previousButton = screen.getByText('Previous');
        fireEvent.click(previousButton);
        
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      });
    });

    it('should not show previous button on first step', () => {
      render(<ProfileSetup />);
      
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });
  });

  describe('cancel functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      const mockOnCancel = jest.fn();
      render(<ProfileSetup onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not show cancel button when onCancel is not provided', () => {
      render(<ProfileSetup />);
      
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should clear error when close button is clicked', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        error: 'Test error'
      });

      render(<ProfileSetup />);
      
      const closeButton = screen.getByRole('button', { name: '×' });
      fireEvent.click(closeButton);
      
      expect(defaultMockReturn.clearError).toHaveBeenCalled();
    });
  });

  describe('saving state', () => {
    it('should show saving state during submission', async () => {
      const mockCreateProfile = jest.fn().mockResolvedValue({});
      
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        saving: true,
        createProfile: mockCreateProfile,
        getAvailableInterests: jest.fn(() => ['Technology', 'Music', 'Sports', 'Art']),
        getLookingForOptions: jest.fn(() => [
          { value: 'friends', label: 'Friends' },
          { value: 'networking', label: 'Professional Networking' }
        ]),
        getPrivacyLevels: jest.fn(() => [
          { value: 'public', label: 'Public', description: 'Visible to everyone' },
          { value: 'friends', label: 'Friends Only', description: 'Visible to matched users only' }
        ])
      });

      render(<ProfileSetup />);
      
      // Navigate to final step
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
      
      let nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const bioInput = screen.getByLabelText('Bio *');
        fireEvent.change(bioInput, { target: { value: 'Test bio' } });
        
        nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });
      
      await waitFor(() => {
        const technologyButton = screen.getByText('Technology');
        fireEvent.click(technologyButton);
        
        nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Creating Profile...')).toBeInTheDocument();
      });
    });
  });
});
