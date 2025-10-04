/**
 * ProfileEdit Component Tests
 * Tests for the ProfileEdit component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import ProfileEdit from '../components/ProfileEdit.js';

// Mock the useProfile hook
jest.mock('../hooks/useProfile.js', () => ({
  useProfile: jest.fn()
}));

describe('ProfileEdit', () => {
  const mockUseProfile = require('../hooks/useProfile.js').useProfile;
  
  const defaultMockReturn = {
    profile: {
      id: 'test-id',
      displayName: 'John Doe',
      bio: 'Software developer',
      interests: ['Technology', 'Music'],
      profilePicture: 'data:image/jpeg;base64,mockdata'
    },
    settings: {
      privacy: { level: 'friends' },
      discovery: {
        enabled: true,
        lookingFor: 'friends',
        maxDistance: 100
      }
    },
    updateProfile: jest.fn().mockResolvedValue({}),
    updateSettings: jest.fn().mockResolvedValue({}),
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

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render edit form', () => {
      render(<ProfileEdit />);
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        loading: true
      });

      render(<ProfileEdit />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error message when no profile exists', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        profile: null
      });

      render(<ProfileEdit />);
      
      expect(screen.getByText('No Profile Found')).toBeInTheDocument();
      expect(screen.getByText('You need to create a profile first.')).toBeInTheDocument();
    });

    it('should show error banner when error exists', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        error: 'Update failed'
      });

      render(<ProfileEdit />);
      
      expect(screen.getByText('Update failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('should switch between profile and settings tabs', () => {
      render(<ProfileEdit />);
      
      // Default to profile tab
      expect(screen.getByLabelText('Display Name *')).toBeInTheDocument();
      
      // Switch to settings tab
      const settingsTab = screen.getAllByText('Settings')[0];
      fireEvent.click(settingsTab);
      
      expect(screen.getByLabelText('Looking For')).toBeInTheDocument();
      expect(screen.getByLabelText('Privacy Level')).toBeInTheDocument();
    });

    it('should highlight active tab', () => {
      render(<ProfileEdit />);
      
      const profileTab = screen.getByText('Profile');
      const settingsTab = screen.getByText('Settings');
      
      expect(profileTab).toHaveClass('active');
      expect(settingsTab).not.toHaveClass('active');
      
      fireEvent.click(settingsTab);
      
      expect(settingsTab).toHaveClass('active');
      expect(profileTab).not.toHaveClass('active');
    });
  });

  describe('profile tab', () => {
    it('should render profile form fields', () => {
      render(<ProfileEdit />);
      
      expect(screen.getByLabelText('Display Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Bio *')).toBeInTheDocument();
      expect(screen.getByLabelText('Profile Picture')).toBeInTheDocument();
      // Interests should be rendered from the mock
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
    });

    it('should populate form with existing profile data', () => {
      render(<ProfileEdit />);
      
      const displayNameInput = screen.getByLabelText('Display Name *');
      const bioInput = screen.getByLabelText('Bio *');
      
      expect(displayNameInput).toHaveValue('John Doe');
      expect(bioInput).toHaveValue('Software developer');
    });

    it('should show selected interests', () => {
      render(<ProfileEdit />);
      
      const technologyButton = screen.getByText('Technology');
      const musicButton = screen.getByText('Music');
      
      expect(technologyButton).toHaveClass('selected');
      expect(musicButton).toHaveClass('selected');
    });

    it('should handle profile picture upload', () => {
      render(<ProfileEdit />);
      
      const fileInput = screen.getByLabelText('Profile Picture');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Should not throw error
      expect(fileInput.files[0]).toBe(file);
    });

    it('should validate profile form', async () => {
      render(<ProfileEdit />);
      
      // Clear required fields
      const displayNameInput = screen.getByLabelText('Display Name *');
      const bioInput = screen.getByLabelText('Bio *');
      
      fireEvent.change(displayNameInput, { target: { value: '' } });
      fireEvent.change(bioInput, { target: { value: '' } });
      
      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeInTheDocument();
        expect(screen.getByText('Bio is required')).toBeInTheDocument();
      });
    });

    it('should save profile successfully', async () => {
      const mockOnSave = jest.fn();
      const mockUpdateProfile = jest.fn().mockResolvedValue({});
      
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        updateProfile: mockUpdateProfile
      });
      
      render(<ProfileEdit onSave={mockOnSave} />);
      
      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          displayName: 'John Doe',
          bio: 'Software developer',
          interests: ['Technology', 'Music'],
          profilePictureFile: null
        });
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('settings tab', () => {
    beforeEach(() => {
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
      
      render(<ProfileEdit />);
      
      // Switch to settings tab
      const settingsTab = screen.getAllByText('Settings')[0];
      fireEvent.click(settingsTab);
    });

    it('should render settings form fields', () => {
      expect(screen.getByLabelText('Looking For')).toBeInTheDocument();
      expect(screen.getByLabelText('Privacy Level')).toBeInTheDocument();
      expect(screen.getByText('Enable Discovery')).toBeInTheDocument();
    });

    it('should populate form with existing settings', () => {
      const lookingForSelect = screen.getByLabelText('Looking For');
      const privacySelect = screen.getByLabelText('Privacy Level');
      const discoveryCheckbox = screen.getByRole('checkbox', { name: /Enable Discovery/i });
      
      expect(lookingForSelect).toHaveValue('friends');
      expect(privacySelect).toHaveValue('friends');
      expect(discoveryCheckbox).toBeChecked();
    });

    it('should show max distance field when discovery is enabled', () => {
      expect(screen.getByLabelText('Maximum Distance (meters)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });

    it('should hide max distance field when discovery is disabled', () => {
      const discoveryCheckbox = screen.getByText('Enable Discovery');
      fireEvent.click(discoveryCheckbox);
      
      expect(screen.queryByLabelText('Maximum Distance (meters)')).not.toBeInTheDocument();
    });

    it('should save settings successfully', async () => {
      const mockOnSave = jest.fn();
      const mockUpdateSettings = jest.fn().mockResolvedValue({});

      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        profile: {
          id: 'test',
          displayName: 'John Doe',
          bio: 'Software developer',
          interests: ['Technology', 'Music'],
          profilePicture: 'data:image/jpeg;base64,mockdata'
        },
        updateSettings: mockUpdateSettings,
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
      
      const { container } = render(<ProfileEdit onSave={mockOnSave} />);
      
      // Switch to settings tab
      const settingsTab = screen.getAllByText('Settings')[0];
      fireEvent.click(settingsTab);
      
      const saveButton = screen.getByText('Save Settings');
      await act(async () => {
        fireEvent.click(saveButton);
      });
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          discovery: {
            lookingFor: 'friends',
            enabled: true,
            maxDistance: 100
          },
          privacy: {
            level: 'friends'
          }
        });
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('save all functionality', () => {
    it('should save both profile and settings', async () => {
      const mockOnSave = jest.fn();
      const mockUpdateProfile = jest.fn().mockResolvedValue({});
      const mockUpdateSettings = jest.fn().mockResolvedValue({});
      
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        updateProfile: mockUpdateProfile,
        updateSettings: mockUpdateSettings
      });
      
      render(<ProfileEdit onSave={mockOnSave} />);
      
      const saveAllButton = screen.getByText('Save All');
      fireEvent.click(saveAllButton);
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
        expect(mockUpdateSettings).toHaveBeenCalled();
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('cancel functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      const mockOnCancel = jest.fn();
      render(<ProfileEdit onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not show cancel button when onCancel is not provided', () => {
      render(<ProfileEdit />);
      
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('saving state', () => {
    it('should show saving state during save operations', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        saving: true
      });

      render(<ProfileEdit />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('Save All')).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('should clear error when close button is clicked', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        error: 'Update failed'
      });

      render(<ProfileEdit />);
      
      const closeButton = screen.getByRole('button', { name: '×' });
      fireEvent.click(closeButton);
      
      expect(defaultMockReturn.clearError).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const mockUpdateProfile = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        updateProfile: mockUpdateProfile
      });

      render(<ProfileEdit />);
      
      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);
      
      // Error should be handled by the hook
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should validate display name length', async () => {
      render(<ProfileEdit />);
      
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'a'.repeat(51) } });
      
      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Display name must be less than 50 characters')).toBeInTheDocument();
      });
    });

    it('should validate bio length', async () => {
      render(<ProfileEdit />);
      
      const bioInput = screen.getByLabelText('Bio *');
      fireEvent.change(bioInput, { target: { value: 'a'.repeat(501) } });
      
      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Bio must be less than 500 characters')).toBeInTheDocument();
      });
    });

    it('should validate interests count', async () => {
      render(<ProfileEdit />);
      
      // Clear all interests
      const technologyButton = screen.getByText('Technology');
      const musicButton = screen.getByText('Music');
      fireEvent.click(technologyButton);
      fireEvent.click(musicButton);
      
      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please select at least one interest')).toBeInTheDocument();
      });
    });
  });

  describe('character counts', () => {
    it('should show character count for display name', () => {
      render(<ProfileEdit />);
      
      const displayNameInput = screen.getByLabelText('Display Name *');
      fireEvent.change(displayNameInput, { target: { value: 'Test' } });
      
      expect(screen.getByText('4/50 characters')).toBeInTheDocument();
    });

    it('should show character count for bio', () => {
      render(<ProfileEdit />);
      
      const bioInput = screen.getByLabelText('Bio *');
      fireEvent.change(bioInput, { target: { value: 'Test bio content' } });
      
      expect(screen.getByText('16/500 characters')).toBeInTheDocument();
    });
  });

  describe('interest selection', () => {
    it('should toggle interest selection', () => {
      render(<ProfileEdit />);
      
      const sportsButton = screen.getByText('Sports');
      fireEvent.click(sportsButton);
      
      expect(sportsButton).toHaveClass('selected');
    });

    it('should show interest count', () => {
      render(<ProfileEdit />);
      
      expect(screen.getByText('2/10 selected')).toBeInTheDocument();
    });
  });
});
