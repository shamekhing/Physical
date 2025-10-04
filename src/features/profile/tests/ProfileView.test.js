/**
 * ProfileView Component Tests
 * Tests for the ProfileView component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileView from '../components/ProfileView.js';

// Mock the useProfile hook
jest.mock('../hooks/useProfile.js', () => ({
  useProfile: jest.fn()
}));

describe('ProfileView', () => {
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
    stats: {
      isComplete: true,
      completionPercentage: 85,
      lastUpdated: '2023-01-01T00:00:00.000Z'
    },
    loading: false,
    error: null,
    getFormattedProfile: jest.fn(() => ({
      displayName: 'John Doe',
      bio: 'Software developer',
      interests: ['Technology', 'Music'],
      age: '25',
      createdAt: 'Jan 1, 2023',
      profilePicture: 'data:image/jpeg;base64,mockdata'
    })),
    generateAvatar: jest.fn(() => 'mock-avatar-url')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfile.mockReturnValue({
      ...defaultMockReturn,
      getFormattedProfile: jest.fn(() => ({
        displayName: 'John Doe',
        bio: 'Software developer',
        interests: ['Technology', 'Music'],
        age: '25',
        createdAt: 'Jan 1, 2023',
        profilePicture: 'data:image/jpeg;base64,mockdata'
      }))
    });
  });

  describe('rendering', () => {
    it('should render profile information', () => {
      render(<ProfileView />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Software developer')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        loading: true
      });

      render(<ProfileView />);
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        error: 'Failed to load profile'
      });

      render(<ProfileView />);
      
      expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });

    it('should show no profile state', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        profile: null
      });

      render(<ProfileView />);
      
      expect(screen.getByText('No Profile Found')).toBeInTheDocument();
      expect(screen.getByText("You haven't created a profile yet.")).toBeInTheDocument();
    });
  });

  describe('profile display', () => {
    it('should display profile picture', () => {
      render(<ProfileView />);
      
      const profileImage = screen.getByAltText('John Doe');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', 'data:image/jpeg;base64,mockdata');
    });

    it('should display profile badges', () => {
      render(<ProfileView />);
      
      expect(screen.getByText('Complete Profile')).toBeInTheDocument();
      expect(screen.getByText('friends profile')).toBeInTheDocument();
    });

    it('should display discovery settings', () => {
      render(<ProfileView />);
      
      expect(screen.getByText('Discovery Settings')).toBeInTheDocument();
      expect(screen.getByText('Looking for:')).toBeInTheDocument();
      expect(screen.getAllByText('friends')).toHaveLength(2);
      expect(screen.getByText('Privacy:')).toBeInTheDocument();
      expect(screen.getByText('Discovery:')).toBeInTheDocument();
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText('Max Distance:')).toBeInTheDocument();
      expect(screen.getByText('100m')).toBeInTheDocument();
    });

    it('should display profile statistics', () => {
      render(<ProfileView />);
      
      expect(screen.getByText('Profile Statistics')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('should call onEdit when edit button is clicked', () => {
      const mockOnEdit = jest.fn();
      render(<ProfileView onEdit={mockOnEdit} />);
      
      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('should call onSettings when settings button is clicked', () => {
      const mockOnSettings = jest.fn();
      render(<ProfileView onSettings={mockOnSettings} />);
      
      const settingsButton = screen.getByText('Settings');
      fireEvent.click(settingsButton);
      
      expect(mockOnSettings).toHaveBeenCalled();
    });

    it('should call onCreateProfile when create profile button is clicked', () => {
      const mockOnCreateProfile = jest.fn();
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        profile: null
      });

      render(<ProfileView onCreateProfile={mockOnCreateProfile} />);
      
      const createButton = screen.getByText('Create Profile');
      fireEvent.click(createButton);
      
      expect(mockOnCreateProfile).toHaveBeenCalled();
    });

    it('should not show action buttons when callbacks are not provided', () => {
      render(<ProfileView />);
      
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('privacy notice', () => {
    it('should display privacy notice', () => {
      render(<ProfileView />);
      
      expect(screen.getByText('Privacy Notice:')).toBeInTheDocument();
      expect(screen.getByText(/All profile data is stored locally on your device only/)).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('should hide interests section when no interests', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        getFormattedProfile: jest.fn(() => ({
          displayName: 'John Doe',
          bio: 'Software developer',
          interests: [],
          age: '25',
          createdAt: 'Jan 1, 2023'
        }))
      });

      render(<ProfileView />);
      
      expect(screen.queryByText('Interests')).not.toBeInTheDocument();
    });

    it('should hide max distance when discovery is disabled', () => {
      mockUseProfile.mockReturnValue({
        ...defaultMockReturn,
        settings: {
          discovery: {
            enabled: false,
            lookingFor: 'friends'
          },
          privacy: {
            level: 'friends'
          }
        },
        getFormattedProfile: jest.fn(() => ({
          displayName: 'John Doe',
          bio: 'Software developer',
          interests: ['Technology', 'Music'],
          age: '25',
          createdAt: 'Jan 1, 2023',
          profilePicture: 'data:image/jpeg;base64,mockdata'
        }))
      });

      render(<ProfileView />);
      
      expect(screen.getByText('Disabled')).toBeInTheDocument();
      expect(screen.queryByText('Max Distance:')).not.toBeInTheDocument();
    });
  });
});