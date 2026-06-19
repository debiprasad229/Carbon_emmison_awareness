/**
 * Component Tests for OnboardingWizard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingWizard from '../OnboardingWizard';

describe('OnboardingWizard', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it('renders the wizard dialog', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Calculate Your Baseline')).toBeInTheDocument();
  });

  it('starts on Step 1 of 4', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('renders transport step with commute distance input', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    expect(screen.getByText('How do you commute?')).toBeInTheDocument();
    expect(screen.getByLabelText(/Weekly Commute Distance/)).toBeInTheDocument();
  });

  it('renders transport type radio buttons with proper ARIA roles', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    const radiogroup = screen.getByRole('radiogroup', { name: /Primary Mode of Transport/ });
    expect(radiogroup).toBeInTheDocument();
    const radios = within(radiogroup).getAllByRole('radio');
    expect(radios.length).toBe(5);
  });

  it('back button is disabled on first step', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    const backBtn = screen.getByText(/Back/i).closest('button');
    expect(backBtn).toBeDisabled();
  });

  it('navigates to step 2 when Continue is clicked', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByText('Do you fly?')).toBeInTheDocument();
  });

  it('navigates back from step 2 to step 1', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    
    await user.click(screen.getByText(/Back/i));
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('shows validation error when commute distance is empty', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    const input = screen.getByLabelText(/Weekly Commute Distance/);
    await user.clear(input);
    await user.click(screen.getByText(/Continue/i));
    
    expect(screen.getByText(/Please enter a weekly commute distance/i)).toBeInTheDocument();
  });

  it('can navigate through all 4 steps to the final step', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    // Step 1 → 2
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    
    // Step 2 → 3
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    
    // Step 3 → 4
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    expect(screen.getByText('Lifestyle & Diet Choices')).toBeInTheDocument();
  });

  it('final step shows "Calculate" button instead of "Continue"', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    // Navigate to step 4
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText(/Continue/i));
    }
    
    // The button text is 'Calculate' (the heading 'Calculate Your Baseline' also exists)
    const calcBtn = screen.getByRole('button', { name: /Calculate/i });
    expect(calcBtn).toBeInTheDocument();
  });

  it('calls onComplete with correct data shape on final submit', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    // Navigate all the way through
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText(/Continue/i));
    }
    
    // Click Calculate button (not the heading)
    await user.click(screen.getByRole('button', { name: /Calculate/i }));
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const callArg = mockOnComplete.mock.calls[0][0];
    expect(callArg).toHaveProperty('commuteDistance');
    expect(callArg).toHaveProperty('transportType');
    expect(callArg).toHaveProperty('flightHours');
    expect(callArg).toHaveProperty('electricityKwh');
    expect(callArg).toHaveProperty('greenEnergyShare');
    expect(callArg).toHaveProperty('heatingSource');
    expect(callArg).toHaveProperty('dietType');
    expect(callArg).toHaveProperty('shoppingHabit');
    expect(callArg).toHaveProperty('recycles');
  });

  it('progress bar updates as steps advance', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    const progressFill = document.querySelector('.progress-bar-fill');
    expect(progressFill).toBeInTheDocument();
    
    const initialWidth = progressFill.style.width;
    await user.click(screen.getByText(/Continue/i));
    expect(progressFill.style.width).not.toBe(initialWidth);
  });
});
