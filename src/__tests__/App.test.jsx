/**
 * Integration Tests for App.jsx
 * Tests: rendering states, localStorage persistence, navigation, accessibility widget
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock EcoPulseAI to avoid Gemini API complexity in integration tests
vi.mock('../components/EcoPulseAI', () => ({
  default: () => <div data-testid="ecopulse-ai">EcoPulse AI Mock</div>
}));

// Mock EcoSphere to avoid complex SVG rendering issues
vi.mock('../components/EcoSphere', () => ({
  default: ({ netFootprint }) => <div data-testid="ecosphere">EcoSphere: {netFootprint}</div>
}));

const SAMPLE_INPUTS = {
  commuteDistance: 30,
  transportType: 'gasoline',
  flightHours: 5,
  electricityKwh: 200,
  greenEnergyShare: 0,
  heatingSource: 'gas',
  dietType: 'lowMeat',
  shoppingHabit: 'average',
  recycles: true
};

describe('App — Welcome State', () => {
  it('renders the welcome screen when no localStorage inputs exist', () => {
    render(<App />);
    expect(screen.getByText('Welcome to EcoPulse')).toBeInTheDocument();
  });

  it('renders the brand name "EcoPulse"', () => {
    render(<App />);
    expect(screen.getByText('EcoPulse')).toBeInTheDocument();
  });

  it('displays "Get Started" button on welcome screen', () => {
    render(<App />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('opens onboarding wizard when "Get Started" is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await user.click(screen.getByText('Get Started'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Calculate Your Baseline')).toBeInTheDocument();
  });

  it('shows feature highlights on welcome page', () => {
    render(<App />);
    expect(screen.getByText('Track Footprint')).toBeInTheDocument();
    expect(screen.getByText('Daily Green Habits')).toBeInTheDocument();
    expect(screen.getByText('Offset Carbon')).toBeInTheDocument();
  });

  it('always renders the accessibility settings widget', () => {
    render(<App />);
    expect(screen.getByLabelText('Accessibility Settings')).toBeInTheDocument();
  });

  it('renders the footer with copyright', () => {
    render(<App />);
    expect(screen.getByText(/EcoPulse Carbon Platform/)).toBeInTheDocument();
  });
});

describe('App — Dashboard State (localStorage hydration)', () => {
  beforeEach(() => {
    localStorage.setItem('ecopulse_inputs', JSON.stringify(SAMPLE_INPUTS));
    localStorage.setItem('ecopulse_xp', '250');
    localStorage.setItem('ecopulse_habits', JSON.stringify({ commute_green: 2 }));
  });

  it('renders dashboard when localStorage inputs exist', () => {
    render(<App />);
    expect(screen.queryByText('Welcome to EcoPulse')).not.toBeInTheDocument();
    expect(screen.getByText('Carbon Scoreboard')).toBeInTheDocument();
  });

  it('hydrates XP from localStorage', () => {
    render(<App />);
    // XP appears in header as '250 XP'
    const xpElements = screen.getAllByText('250 XP');
    expect(xpElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows user level in header', () => {
    render(<App />);
    // Level = Math.floor(250/100) + 1 = 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders all dashboard cards', () => {
    render(<App />);
    expect(screen.getByText('Carbon Scoreboard')).toBeInTheDocument();
    expect(screen.getByText('Emission Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Daily Green Actions')).toBeInTheDocument();
    expect(screen.getByText('Carbon Offset Simulator')).toBeInTheDocument();
    expect(screen.getByText('Personalized Reduction Plan')).toBeInTheDocument();
    expect(screen.getByText('Smart Carbon Scanner')).toBeInTheDocument();
  });

  it('shows Recalculate button on dashboard', () => {
    render(<App />);
    expect(screen.getByLabelText('Recalculate baseline footprint')).toBeInTheDocument();
  });

  it('shows Home button on dashboard', () => {
    render(<App />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('calls window.scrollTo(0,0) when inputs load', () => {
    render(<App />);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

describe('App — State Persistence', () => {
  it('saves inputs to localStorage after wizard completion', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open wizard
    await user.click(screen.getByText('Get Started'));
    
    // Navigate through all 4 steps
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText(/Continue/i));
    }
    
    // Submit via the Calculate button
    await user.click(screen.getByRole('button', { name: /Calculate/i }));
    
    // Verify localStorage was populated
    const storedInputs = JSON.parse(localStorage.getItem('ecopulse_inputs'));
    expect(storedInputs).toBeTruthy();
    expect(storedInputs).toHaveProperty('commuteDistance');
    expect(storedInputs).toHaveProperty('transportType');
  });

  it('saves history entry after wizard completion', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await user.click(screen.getByText('Get Started'));
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText(/Continue/i));
    }
    await user.click(screen.getByRole('button', { name: /Calculate/i }));
    
    const history = JSON.parse(localStorage.getItem('ecopulse_history'));
    expect(history).toBeTruthy();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]).toHaveProperty('footprint');
  });

  it('persists accessibility high contrast preference', () => {
    localStorage.setItem('ecopulse_high_contrast', 'true');
    render(<App />);
    // The body class should be set
    expect(document.body.classList.contains('high-contrast')).toBe(true);
  });

  it('persists accessibility font size preference', () => {
    localStorage.setItem('ecopulse_font_size', 'large');
    render(<App />);
    expect(document.body.classList.contains('accessibility-font-large')).toBe(true);
  });

  it('persists reduced motion preference', () => {
    localStorage.setItem('ecopulse_reduced_motion', 'true');
    render(<App />);
    expect(document.body.classList.contains('reduced-motion')).toBe(true);
  });
});
