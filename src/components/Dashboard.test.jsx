import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock the fetch calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        metrics: { lcp: 2.5 },
        insights: 'Improve LCP by optimizing images.',
        recommendations: [{ title: 'Use Lazy Load', description: 'Lazy load images below the fold.' }],
        aiInsights: ['Optimize CSS delivery'],
        title: 'Test Title',
        description: 'Test Description',
        keywords: 'SEO, Lighthouse',
        key_phrases: ['optimize images', 'reduce JS'],
      }),
  })
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders URL input and analyze button', () => {
    render(<Dashboard />);
    expect(screen.getByPlaceholderText(/Enter Website URL/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze/i)).toBeInTheDocument();
  });

  test('shows error for invalid URL', async () => {
    render(<Dashboard />);
    fireEvent.change(screen.getByPlaceholderText(/Enter Website URL/i), {
      target: { value: 'invalid-url' },
    });
    fireEvent.click(screen.getByText(/Analyze/i));
    expect(await screen.findByText(/Please enter a valid URL/i)).toBeInTheDocument();
  });

  test('performs analysis on valid URL', async () => {
    render(<Dashboard />);
    fireEvent.change(screen.getByPlaceholderText(/Enter Website URL/i), {
      target: { value: 'https://example.com' },
    });
    fireEvent.click(screen.getByText(/Analyze/i));

    await waitFor(() =>
      expect(screen.getByText(/AI-Generated Insights/i)).toBeInTheDocument()
    );

    expect(fetch).toHaveBeenCalledTimes(3); // analyze, lighthouse, analyze-meta
    expect(screen.getByDisplayValue(/Optimize CSS delivery/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Title/)).toBeInTheDocument();
  });
});
