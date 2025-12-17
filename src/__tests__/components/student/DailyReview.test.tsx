/**
 * Component Tests for DailyReview
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyReview from '@/components/student/DailyReview';

// Mock fetch
global.fetch = jest.fn();

const mockReviewItems = {
  success: true,
  data: {
    items: [
      {
        id: '1',
        conceptKey: 'concept_1',
        question: 'What is 2 + 2?',
        answer: '4',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        correctCount: 0,
        incorrectCount: 0,
      },
      {
        id: '2',
        conceptKey: 'concept_2',
        question: 'What is the capital of France?',
        answer: 'Paris',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        correctCount: 0,
        incorrectCount: 0,
      },
    ],
    total: 2,
  },
};

const mockReviewStats = {
  success: true,
  data: {
    totalItems: 10,
    dueItems: 2,
    reviewedToday: 5,
    masteredItems: 3,
    masteryPercentage: 30,
    accuracy: 75,
  },
};

describe('DailyReview Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );

      render(<DailyReview />);

      // Look for the spinner SVG element
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show "All Caught Up" when no items due', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true, data: { items: [], total: 0 } }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewStats),
        });

      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
      });
    });

    it('should display mastery stats when no reviews due', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true, data: { items: [], total: 0 } }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewStats),
        });

      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText(/mastered/i)).toBeInTheDocument();
      });
    });
  });

  describe('Review Session', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewItems),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewStats),
        });
    });

    it('should display first question', async () => {
      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });
    });

    it('should show progress indicator', async () => {
      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
      });
    });

    it('should initially hide the answer', async () => {
      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      // Answer should not be visible initially
      expect(screen.queryByText('4')).not.toBeInTheDocument();
    });

    it('should reveal answer when show button is clicked', async () => {
      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      const showButton = screen.getByRole('button', { name: /show answer/i });
      await userEvent.click(showButton);

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display quality rating buttons after showing answer', async () => {
      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      const showButton = screen.getByRole('button', { name: /show answer/i });
      await userEvent.click(showButton);

      // Should show rating buttons
      expect(screen.getByRole('button', { name: /again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /good/i })).toBeInTheDocument();
    });
  });

  describe('Review Submission', () => {
    it('should submit review and move to next card', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewItems),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewStats),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true, data: { interval: 1 } }),
        });

      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      // Show answer
      const showButton = screen.getByRole('button', { name: /show answer/i });
      await userEvent.click(showButton);

      // Rate as good
      const goodButton = screen.getByRole('button', { name: /good/i });
      await userEvent.click(goodButton);

      // Should show next question
      await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      });
    });

    it('should call onComplete when session finishes', async () => {
      const onComplete = jest.fn();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                items: [{ id: '1', question: 'Test?', answer: 'Answer' }],
                total: 1,
              },
            }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewStats),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true }),
        });

      render(<DailyReview onComplete={onComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Test?')).toBeInTheDocument();
      });

      // Show answer and rate
      const showButton = screen.getByRole('button', { name: /show answer/i });
      await userEvent.click(showButton);

      const goodButton = screen.getByRole('button', { name: /good/i });
      await userEvent.click(goodButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Session Complete', () => {
    it('should show completion screen with stats', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                items: [{ id: '1', question: 'Test?', answer: 'Answer' }],
                total: 1,
              },
            }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewStats),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true }),
        });

      render(<DailyReview />);

      await waitFor(() => {
        expect(screen.getByText('Test?')).toBeInTheDocument();
      });

      // Complete the review
      const showButton = screen.getByRole('button', { name: /show answer/i });
      await userEvent.click(showButton);

      const goodButton = screen.getByRole('button', { name: /good/i });
      await userEvent.click(goodButton);

      // Should show completion
      await waitFor(() => {
        expect(screen.getByText(/excellent work/i)).toBeInTheDocument();
      });
    });
  });

  describe('Course Filtering', () => {
    it('should pass courseId to API when provided', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true, data: { items: [], total: 0 } }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockReviewStats),
        });

      render(<DailyReview courseId="course-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('courseId=course-123')
        );
      });
    });
  });
});
