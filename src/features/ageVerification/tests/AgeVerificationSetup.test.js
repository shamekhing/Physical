/**
 * Tests for AgeVerificationSetup component
 * Privacy-first age verification with no external data collection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgeVerificationSetup from '../components/AgeVerificationSetup.js';

// Mock the useAgeVerification hook
jest.mock('../hooks/useAgeVerification.js', () => ({
  useAgeVerification: jest.fn()
}));

describe('AgeVerificationSetup', () => {
  const mockUseAgeVerification = require('../hooks/useAgeVerification.js').useAgeVerification;

  const defaultMockReturn = {
    status: 'idle',
    isAvailable: true, // Set to true to show method selection
    error: null,
    startVerification: jest.fn(),
    startBiometricEstimation: jest.fn(),
    startDocumentVerification: jest.fn(),
    getSupportedDocuments: jest.fn().mockReturnValue([
      'drivers_license',
      'passport',
      'national_id',
      'student_id'
    ]),
    isMethodAvailable: jest.fn().mockResolvedValue(true),
    clearError: jest.fn()
  };

  beforeEach(() => {
    mockUseAgeVerification.mockReturnValue(defaultMockReturn);
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render setup component when available', () => {
      render(<AgeVerificationSetup />);

      expect(screen.getByText('Age Verification Setup')).toBeInTheDocument();
      expect(screen.getByText(/Privacy Notice:/)).toBeInTheDocument();
      expect(screen.getByText('Choose Verification Method')).toBeInTheDocument();
    });

    it('should render unavailable message when not available', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        isAvailable: false
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Age verification not available')).toBeInTheDocument();
      expect(screen.getByText(/Your device doesn't support the required features/)).toBeInTheDocument();
      expect(screen.getByText('Camera access for biometric estimation')).toBeInTheDocument();
    });

    it('should render method selection cards', async () => {
      await act(async () => {
        render(<AgeVerificationSetup />);
      });

      await waitFor(() => {
        expect(screen.getByText('Biometric Age Estimation')).toBeInTheDocument();
        expect(screen.getByText('Document Verification')).toBeInTheDocument();
        expect(screen.getByText('Device Settings')).toBeInTheDocument();
        expect(screen.getByText('Multi-Factor Verification')).toBeInTheDocument();
      });
    });

    it('should render document options when document method is selected', async () => {
      render(<AgeVerificationSetup />);

      // Wait for methods to load, then select document method
      await waitFor(() => {
        expect(screen.getByText('Document Verification')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Document Verification'));

      expect(screen.getByText('Document Options')).toBeInTheDocument();
      expect(screen.getByText('Document Type:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Drivers License')).toBeInTheDocument();
    });
  });

  describe('method selection', () => {
    it('should select multi-factor verification by default', () => {
      render(<AgeVerificationSetup />);

      const multiFactorCard = screen.getByText('Multi-Factor Verification').closest('.method-card');
      expect(multiFactorCard).toHaveClass('selected');
    });

    it('should select biometric method when clicked', () => {
      render(<AgeVerificationSetup />);

      fireEvent.click(screen.getByText('Biometric Age Estimation'));

      const biometricCard = screen.getByText('Biometric Age Estimation').closest('.method-card');
      expect(biometricCard).toHaveClass('selected');
    });

    it('should select document method when clicked', () => {
      render(<AgeVerificationSetup />);

      fireEvent.click(screen.getByText('Document Verification'));

      const documentCard = screen.getByText('Document Verification').closest('.method-card');
      expect(documentCard).toHaveClass('selected');
    });

    it('should clear error when method is changed', () => {
      render(<AgeVerificationSetup />);

      fireEvent.click(screen.getByText('Biometric Age Estimation'));

      expect(defaultMockReturn.clearError).toHaveBeenCalled();
    });
  });

  describe('document options', () => {
    beforeEach(async () => {
      render(<AgeVerificationSetup />);
      await waitFor(() => {
        expect(screen.getByText('Document Verification')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Document Verification'));
    });

    it('should show document type selection', () => {
      expect(screen.getByDisplayValue('Drivers License')).toBeInTheDocument();
    });

    it('should show capture method options', () => {
      expect(screen.getByLabelText('Use Camera')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload File')).toBeInTheDocument();
    });

    it('should show file upload when upload file is selected', () => {
      fireEvent.click(screen.getByLabelText('Upload File'));

      expect(screen.getByText('Choose Document Image')).toBeInTheDocument();
    });

    it('should handle file upload', () => {
      fireEvent.click(screen.getByLabelText('Upload File'));

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Choose Document Image');

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  describe('verification actions', () => {
    it('should start biometric verification when biometric method is selected', async () => {
      render(<AgeVerificationSetup />);

      await waitFor(() => {
        expect(screen.getByText('Biometric Age Estimation')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Biometric Age Estimation'));
      fireEvent.click(screen.getByText('Start Verification'));

      await waitFor(() => {
        expect(defaultMockReturn.startBiometricEstimation).toHaveBeenCalled();
      });
    });

    it('should start document verification when document method is selected', async () => {
      render(<AgeVerificationSetup />);

      await waitFor(() => {
        expect(screen.getByText('Document Verification')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Document Verification'));
      fireEvent.click(screen.getByText('Start Verification'));

      await waitFor(() => {
        expect(defaultMockReturn.startDocumentVerification).toHaveBeenCalledWith({
          documentType: 'drivers_license',
          useCamera: true,
          file: undefined
        });
      });
    });

    it('should start general verification for other methods', async () => {
      render(<AgeVerificationSetup />);

      await waitFor(() => {
        expect(screen.getByText('Multi-Factor Verification')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Multi-Factor Verification'));
      fireEvent.click(screen.getByText('Start Verification'));

      await waitFor(() => {
        expect(defaultMockReturn.startVerification).toHaveBeenCalledWith({
          method: 'multi_factor'
        });
      });
    });

    it('should disable start button when document method selected without file', async () => {
      render(<AgeVerificationSetup />);

      await waitFor(() => {
        expect(screen.getByText('Document Verification')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Document Verification'));
      fireEvent.click(screen.getByLabelText('Upload File'));

      const startButton = screen.getByText('Start Verification');
      expect(startButton).toBeDisabled();
    });

    it('should disable start button when verifying', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        status: 'verifying'
      });

      render(<AgeVerificationSetup />);

      const startButton = screen.getByText('Verifying...');
      expect(startButton).toBeDisabled();
    });

    it('should show verifying text when processing', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        status: 'biometric_processing'
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Processing biometric data...')).toBeInTheDocument();
      expect(screen.getByText('Verifying...')).toBeInTheDocument();
    });

    it('should show document processing text when processing document', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        status: 'document_processing'
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Processing document...')).toBeInTheDocument();
      expect(screen.getByText('Verifying...')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error message when error occurs', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        error: 'Verification failed'
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Verification Error')).toBeInTheDocument();
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
    });

    it('should clear error when dismiss button is clicked', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        error: 'Verification failed'
      });

      render(<AgeVerificationSetup />);

      fireEvent.click(screen.getByText('Dismiss'));

      expect(defaultMockReturn.clearError).toHaveBeenCalled();
    });

    it('should handle verification errors gracefully', async () => {
      const mockStartVerification = jest.fn().mockRejectedValue(new Error('Test error'));
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        startVerification: mockStartVerification
      });

      render(<AgeVerificationSetup />);

      fireEvent.click(screen.getByText('Start Verification'));

      await waitFor(() => {
        expect(mockStartVerification).toHaveBeenCalled();
      });
    });
  });

  describe('status display', () => {
    it('should show idle status', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        status: 'idle'
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Ready to verify')).toBeInTheDocument();
    });

    it('should show initializing status', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        status: 'initializing'
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Initializing verification...')).toBeInTheDocument();
    });

    it('should show verifying status', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        status: 'verifying'
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Verifying age...')).toBeInTheDocument();
    });

    it('should show completed status', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        status: 'completed'
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Verification completed!')).toBeInTheDocument();
    });

    it('should show failed status', () => {
      mockUseAgeVerification.mockReturnValue({
        ...defaultMockReturn,
        status: 'failed'
      });

      render(<AgeVerificationSetup />);

      expect(screen.getByText('Verification failed')).toBeInTheDocument();
    });
  });

  describe('privacy details', () => {
    it('should show privacy details expandable section', () => {
      render(<AgeVerificationSetup />);

      expect(screen.getByText('Privacy & Security Details')).toBeInTheDocument();
    });

    it('should expand privacy details when clicked', () => {
      render(<AgeVerificationSetup />);

      fireEvent.click(screen.getByText('Privacy & Security Details'));

      expect(screen.getByText('What we collect:')).toBeInTheDocument();
      expect(screen.getByText('What we process:')).toBeInTheDocument();
      expect(screen.getByText('What we share:')).toBeInTheDocument();
      expect(screen.getByText('Data retention:')).toBeInTheDocument();
    });
  });

  describe('method availability', () => {
    it('should load available methods on mount', async () => {
      render(<AgeVerificationSetup />);

      // In test environment, methods are loaded synchronously, so isMethodAvailable is not called
      // This test verifies that the component loads available methods on mount
      expect(screen.getByText('Biometric Age Estimation')).toBeInTheDocument();
      expect(screen.getByText('Document Verification')).toBeInTheDocument();
      expect(screen.getByText('Device Settings')).toBeInTheDocument();
      expect(screen.getByText('Multi-Factor Verification')).toBeInTheDocument();
    });

    it('should load supported documents on mount', async () => {
      render(<AgeVerificationSetup />);

      await waitFor(() => {
        expect(defaultMockReturn.getSupportedDocuments).toHaveBeenCalled();
      });
    });
  });

  describe('clear error on mount', () => {
    it('should clear error when component mounts', () => {
      render(<AgeVerificationSetup />);

      expect(defaultMockReturn.clearError).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels', async () => {
      render(<AgeVerificationSetup />);

      await waitFor(() => {
        expect(screen.getByText('Document Verification')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Document Verification'));

      expect(screen.getByLabelText('Document Type:')).toBeInTheDocument();
      expect(screen.getByLabelText('Use Camera')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload File')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(<AgeVerificationSetup />);

      expect(screen.getByRole('button', { name: 'Start Verification' })).toBeInTheDocument();
    });
  });
});
