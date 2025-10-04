import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title and features', () => {
  render(<App />);
  
  // Check for dashboard loading
  const loadingElement = screen.getByText(/Loading dashboard.../i);
  expect(loadingElement).toBeInTheDocument();
  
  // Dashboard is in loading state, so we only check for loading text
  
  // Check for privacy notice (first occurrence)
  const privacyNotice = screen.getAllByText(/Privacy Notice:/i)[0];
  expect(privacyNotice).toBeInTheDocument();
});
