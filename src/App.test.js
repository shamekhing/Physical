import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title and features', () => {
  render(<App />);
  
  // Check for main app title
  const titleElement = screen.getByText(/Physical - User Discovery/i);
  expect(titleElement).toBeInTheDocument();
  
  // Check for age verification section (main section header)
  const ageVerificationTitle = screen.getAllByRole('heading', { name: /Age Verification/i })[0];
  expect(ageVerificationTitle).toBeInTheDocument();
  
  // Check for bluetooth proximity section (main section header)
  const bluetoothTitle = screen.getAllByRole('heading', { name: /Bluetooth Proximity/i })[0];
  expect(bluetoothTitle).toBeInTheDocument();
  
  // Check for privacy notice (first occurrence)
  const privacyNotice = screen.getAllByText(/Privacy Notice:/i)[0];
  expect(privacyNotice).toBeInTheDocument();
});
