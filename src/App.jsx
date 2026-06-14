import { useState, useEffect, useMemo } from 'react';
import { Leaf, RefreshCw } from 'lucide-react';
import { calculateFootprint, calculateOffsets, getRecommendations } from './utils/carbonCalculations';
import OnboardingWizard from './components/OnboardingWizard';
import EcoSphere from './components/EcoSphere';
import CarbonScoreCard from './components/CarbonScoreCard';
import ChartCard from './components/ChartCard';
import HabitTrackerCard from './components/HabitTrackerCard';
import OffsetSimulatorCard from './components/OffsetSimulatorCard';
import RecommendationsCard from './components/RecommendationsCard';

const STORAGE_KEY_INPUTS = 'ecopulse_inputs';
const STORAGE_KEY_XP = 'ecopulse_xp';
const STORAGE_KEY_HABITS = 'ecopulse_habits';

export default function App() {
  // Lazily initialize states directly from localStorage to prevent double rendering cycles
  const [inputs, setInputs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INPUTS);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to parse stored inputs:", e);
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

  const [showWizard, setShowWizard] = useState(() => !inputs);
  const [habitSavings, setHabitSavings] = useState(0);
  
  const [offsets, setOffsets] = useState({
    treesPlanted: 0,
    cleanEnergyFund: 0,
    plasticRemoved: 0
  });

  // Safe saving to localStorage when state updates
  const saveInputs = (newInputs) => {
    try {
      localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(newInputs));
      setInputs(newInputs);
      setShowWizard(false);
    } catch (e) {
      console.error("Failed to save onboarding parameters:", e);
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

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all tracking data, points, and configurations?")) {
      try {
        localStorage.clear();
        setInputs(null);
        setXp(0);
        setCompletedHabits({});
        setHabitSavings(0);
        setOffsets({ treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 });
        setShowWizard(true);
      } catch (e) {
        console.error("Failed to clear local storage:", e);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Brand Header */}
      <header className="app-header">
        <div className="brand-group">
          <Leaf className="brand-logo" size={32} />
          <h1 className="brand-name">EcoPulse</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {inputs && (
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowWizard(true)}
              aria-label="Recalculate baseline footprint"
            >
              <RefreshCw size={14} /> Recalculate
            </button>
          )}

          <div className="user-badge-header">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level:</span>
            <span className="xp-indicator">{Math.floor(xp / 100) + 1}</span>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            <span className="xp-indicator">{xp} XP</span>
          </div>
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
          </div>
        ) : (
          <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', padding: '20px' }}>
            <Leaf size={48} style={{ color: 'var(--accent-green)', marginBottom: '15px' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '10px' }}>Welcome to EcoPulse</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Calculate your baseline carbon emissions to build your dashboard and custom reduction plan.
            </p>
            <button 
              type="button"
              className="btn btn-primary" 
              style={{ margin: '0 auto' }}
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
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto'
        }}
      >
        <span>© {new Date().getFullYear()} EcoPulse Carbon Platform. Built for Virtual PromptWars.</span>
        <button 
          type="button"
          onClick={handleResetData}
          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          Reset Session Data
        </button>
      </footer>

    </div>
  );
}
