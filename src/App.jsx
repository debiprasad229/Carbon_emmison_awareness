import { useState, useEffect, useMemo } from 'react';
import { Leaf, RefreshCw, BarChart3, CheckSquare, Globe } from 'lucide-react';
import { calculateFootprint, calculateOffsets, getRecommendations } from './utils/carbonCalculations';
import OnboardingWizard from './components/OnboardingWizard';
import EcoSphere from './components/EcoSphere';
import CarbonScoreCard from './components/CarbonScoreCard';
import ChartCard from './components/ChartCard';
import HabitTrackerCard from './components/HabitTrackerCard';
import OffsetSimulatorCard from './components/OffsetSimulatorCard';
import RecommendationsCard from './components/RecommendationsCard';
import EcoPulseAI from './components/EcoPulseAI';
import CarbonPersonalityCard from './components/CarbonPersonalityCard';
import CarbonForecastCard from './components/CarbonForecastCard';
import ChallengeTrackerCard from './components/ChallengeTrackerCard';
import AccessibilitySettings from './components/AccessibilitySettings';
import CarbonScannerCard from './components/CarbonScannerCard';
import { calculatePersonality } from './utils/personalityEngine';
import { generateForecast } from './utils/forecastEngine';

const STORAGE_KEY_INPUTS = 'ecopulse_inputs';
const STORAGE_KEY_XP = 'ecopulse_xp';
const STORAGE_KEY_HABITS = 'ecopulse_habits';

export default function App() {
  const [inputs, setInputs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INPUTS);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [xp, setXp] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_XP);
      return stored ? Math.max(0, parseInt(stored) || 0) : 0;
    } catch {
      return 0;
    }
  });

  const [completedHabits, setCompletedHabits] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HABITS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [challengeStats, setChallengeStats] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_challenge_stats');
      return stored ? JSON.parse(stored) : { streak: 0, completedTotal: 0, lastCompletedDate: null };
    } catch {
      return { streak: 0, completedTotal: 0, lastCompletedDate: null };
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showWizard, setShowWizard] = useState(false);
  const [habitSavings, setHabitSavings] = useState(0);
  
  const [offsets, setOffsets] = useState({
    treesPlanted: 0,
    cleanEnergyFund: 0,
    plasticRemoved: 0
  });

  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem('ecopulse_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem('ecopulse_font_size') || 'normal';
    } catch {
      return 'normal';
    }
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_reduced_motion');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  // Sync state changes with localStorage and body classes
  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_high_contrast', highContrast);
    } catch (e) {
      console.error(e);
    }
    document.body.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_font_size', fontSize);
    } catch (e) {
      console.error(e);
    }
    document.body.classList.remove('accessibility-font-normal', 'accessibility-font-large', 'accessibility-font-xlarge');
    if (fontSize !== 'normal') {
      document.body.classList.add(`accessibility-font-${fontSize}`);
    }
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_reduced_motion', reducedMotion);
    } catch (e) {
      console.error(e);
    }
    document.body.classList.toggle('reduced-motion', reducedMotion);
  }, [reducedMotion]);

  // Safe saving to localStorage when state updates
  const saveInputs = (newInputs) => {
    try {
      localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(newInputs));
      setInputs(newInputs);
      setShowWizard(false);

      // Append to history
      const breakdown = calculateFootprint(newInputs);
      const totalFootprint = breakdown.total;
      setHistory(prev => {
        const newEntry = {
          timestamp: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          footprint: totalFootprint
        };
        const updated = [newEntry, ...prev].slice(0, 10);
        localStorage.setItem('ecopulse_history', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Failed to save onboarding parameters:", e);
    }
  };

  const handleResetToWelcome = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_INPUTS);
      setInputs(null);
      setShowWizard(false);
    } catch (e) {
      console.error("Failed to remove inputs:", e);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your calculation history? This will reset your progress tracking.")) {
      try {
        localStorage.removeItem('ecopulse_history');
        setHistory([]);
      } catch (e) {
        console.error("Failed to clear history:", e);
      }
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_XP, xp.toString());
    } catch (e) {
      console.error("Failed to save XP:", e);
    }
  }, [xp]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(completedHabits));
    } catch (e) {
      console.error("Failed to save habits:", e);
    }
  }, [completedHabits]);

  // Scroll to top of page when dashboard inputs are loaded/updated
  useEffect(() => {
    if (inputs) {
      window.scrollTo(0, 0);
    }
  }, [inputs]);

  // Real-time Carbon Emissions Calculations (Efficiency: useMemo)
  const footprintBreakdown = useMemo(() => {
    if (!inputs) {
      return { transport: 0, energy: 0, diet: 0, shopping: 0, total: 0 };
    }
    return calculateFootprint(inputs);
  }, [inputs]);

  const totalOffsets = useMemo(() => {
    return calculateOffsets(offsets);
  }, [offsets]);

  const netFootprint = useMemo(() => {
    const totalReduction = totalOffsets + habitSavings;
    return Math.max(0, footprintBreakdown.total - totalReduction);
  }, [footprintBreakdown.total, totalOffsets, habitSavings]);

  const recommendations = useMemo(() => {
    if (!inputs) return [];
    return getRecommendations(inputs, footprintBreakdown);
  }, [inputs, footprintBreakdown]);

  const personality = useMemo(() => {
    if (!inputs) return null;
    return calculatePersonality(inputs, footprintBreakdown, netFootprint, xp, completedHabits, offsets);
  }, [inputs, footprintBreakdown, netFootprint, xp, completedHabits, offsets]);

  const forecast = useMemo(() => {
    if (!inputs) return null;
    return generateForecast(history, netFootprint, recommendations, completedHabits, offsets);
  }, [history, netFootprint, recommendations, completedHabits, offsets]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Brand Header */}
      <header className="app-header">
        <div className="brand-group" style={{ gap: '8px' }}>
          <div onClick={handleResetToWelcome} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} title="Go to Welcome Page">
            <Leaf className="brand-logo" size={32} />
            <h1 className="brand-name">EcoPulse</h1>
          </div>
          {inputs && (
            <>
              <div style={{ width: '1px', height: '20px', background: 'var(--card-border)', margin: '0 10px' }} />
              <button
                type="button"
                onClick={handleResetToWelcome}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  fontFamily: 'var(--font-heading)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseOver={(e) => { e.target.style.color = 'var(--accent-green)'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseOut={(e) => { e.target.style.color = 'var(--text-secondary)'; e.target.style.background = 'transparent'; }}
              >
                Home
              </button>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Accessibility Options Widget */}
          <AccessibilitySettings 
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            fontSize={fontSize}
            setFontSize={setFontSize}
            reducedMotion={reducedMotion}
            setReducedMotion={setReducedMotion}
          />

          {inputs && (
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleResetToWelcome}
              aria-label="Recalculate baseline footprint"
            >
              <RefreshCw size={14} /> Recalculate
            </button>
          )}

          {inputs && (
            <div className="user-badge-header">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level:</span>
              <span className="xp-indicator">{Math.floor(xp / 100) + 1}</span>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
              <span className="xp-indicator">{xp} XP</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main style={{ flex: '1', display: 'flex', alignItems: 'center', padding: '20px 0 60px' }}>
        {inputs ? (
          <div className="bento-grid">
            {/* ROW 1 */}
            <CarbonScoreCard 
              netFootprint={netFootprint} 
              baseline={footprintBreakdown.total} 
              xp={xp}
              completedHabits={completedHabits}
              history={history}
              onClearHistory={handleClearHistory}
              challengeStats={challengeStats}
            />
            <EcoSphere 
              netFootprint={netFootprint} 
              baselineFootprint={footprintBreakdown.total} 
            />

            {/* ROW 2 */}
            <ChartCard categories={footprintBreakdown} />
            <HabitTrackerCard 
              xp={xp} 
              setXp={setXp}
              completedHabits={completedHabits}
              setCompletedHabits={setCompletedHabits}
              habitSavings={habitSavings}
              setHabitSavings={setHabitSavings}
            />

            {/* ROW 3 */}
            <OffsetSimulatorCard 
              offsets={offsets} 
              setOffsets={setOffsets} 
            />
            <RecommendationsCard 
              recommendations={recommendations} 
              onOpenCalculator={() => setShowWizard(true)}
            />

            {/* Smart Carbon Scanner */}
            <CarbonScannerCard 
              inputs={inputs} 
              onUpdateInputs={saveInputs} 
            />

            {/* Weekly Sustainability Challenges */}
            <ChallengeTrackerCard 
              xp={xp} 
              setXp={setXp} 
              completedHabits={completedHabits} 
              offsets={offsets} 
              challengeStats={challengeStats} 
              setChallengeStats={setChallengeStats} 
            />

            {/* Carbon Personality Profile */}
            <CarbonPersonalityCard 
              personality={personality} 
              xp={xp} 
              setXp={setXp} 
            />

            {/* Carbon Forecast & Projections */}
            <CarbonForecastCard 
              forecast={forecast} 
              netFootprint={netFootprint} 
              recommendations={recommendations} 
            />

            {/* EcoPulse AI Carbon Coach */}
            <EcoPulseAI 
              inputs={inputs} 
              footprintBreakdown={footprintBreakdown} 
              netFootprint={netFootprint} 
              xp={xp} 
              completedHabits={completedHabits} 
            />
          </div>
        ) : (
          <div className="bento-card welcome-card">
            <div className="card-icon-wrapper" style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)', marginBottom: '5px' }}>
              <Leaf size={32} className="float" />
            </div>
            
            <h2 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '2.2rem', 
              fontWeight: '800',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #34d399, #06b6d4)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              marginBottom: '5px'
            }}>
              Welcome to EcoPulse
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '480px', marginBottom: '15px' }}>
              Understand your environmental footprint, build a personalized carbon reduction plan, and track your daily eco-habits.
            </p>

            {/* Feature Highlights Grid */}
            <div className="welcome-highlights">
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '15px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--accent-green)' }}><BarChart3 size={20} /></div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Track Footprint</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Baseline analytics</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '15px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--accent-orange)' }}><CheckSquare size={20} /></div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Daily Green Habits</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Earn XP & rewards</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '15px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--accent-blue)' }}><Globe size={20} /></div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Offset Carbon</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Heal the EcoSphere</span>
              </div>
            </div>

            <button 
              type="button"
              className="btn btn-primary btn-pulse" 
              style={{ padding: '14px 28px', fontSize: '0.95rem', fontWeight: '700', margin: '0 auto' }}
              onClick={() => setShowWizard(true)}
            >
              Get Started
            </button>
          </div>
        )}
      </main>

      {/* Onboarding Wizard Modal */}
      {showWizard && (
        <OnboardingWizard onComplete={saveInputs} />
      )}

      {/* Accessible Footer */}
      <footer 
        style={{ 
          textAlign: 'center', 
          padding: '24px 20px', 
          borderTop: '1px solid var(--card-border)', 
          background: 'rgba(5, 10, 8, 0.4)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          marginTop: 'auto'
        }}
      >
        <span>© {new Date().getFullYear()} EcoPulse Carbon Platform. Built for Virtual PromptWars.</span>
      </footer>

    </div>
  );
}
