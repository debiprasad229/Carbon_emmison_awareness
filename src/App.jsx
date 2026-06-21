import { useState, useEffect, useMemo } from 'react';
import { Leaf, RefreshCw, BarChart3, CheckSquare, Globe, Menu, Shield, Award, Zap, User, Trees, Flame, History, MessageSquare, Settings, Trash2, Activity, Sprout, Compass, Crown } from 'lucide-react';
import { calculateFootprint, calculateOffsets, getRecommendations, getUnlockedBadges } from './utils/carbonCalculations';
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
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';

const HABIT_SAVINGS_MAP = {
  commute_green: 520,
  eat_vegan_veg: 600,
  unplug_unused: 120,
  air_dry_laundry: 220,
  cold_shower: 180
};

const STORAGE_KEY_INPUTS = 'ecopulse_inputs';
const STORAGE_KEY_XP = 'ecopulse_xp';
const STORAGE_KEY_HABITS = 'ecopulse_habits';

export default function App() {
  // Session Authentication State
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('ecopulse_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // User Footprint Data States
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

  const [offsets, setOffsets] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_offsets');
      return stored ? JSON.parse(stored) : { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 };
    } catch {
      return { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 };
    }
  });

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_ai_messages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_notifications');
      return stored ? JSON.parse(stored) : [
        {
          id: 'ai-rec-1',
          category: 'AI Recommendations',
          title: 'AI Coach Recommendation',
          description: 'AI coach generated a new recommendation.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: 'challenge-1',
          category: 'Challenges',
          title: 'Daily Action Logged',
          description: 'Cold Quick Shower completed (+15 XP)',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: 'carbon-1',
          category: 'Carbon Score Updates',
          title: 'Carbon Baseline Recalculated',
          description: 'Your baseline carbon footprint is calculated at 6,805 kg CO₂e/yr.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: 'achievement-1',
          category: 'Achievements',
          title: 'New Badge Unlocked',
          description: 'You earned the Eco Starter badge. Keep going!',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: 'system-1',
          category: 'System Updates',
          title: 'Welcome to EcoPulse',
          description: 'Your carbon tracking dashboard has been initialized successfully.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true
        }
      ];
    } catch {
      return [];
    }
  });


  // Accessibility State Preferences
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

  // Routing State
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['dashboard', 'analytics', 'ai-coach', 'challenges', 'profile'].includes(hash) ? hash : 'dashboard';
  });
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Sync route hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const targetRoute = ['dashboard', 'analytics', 'ai-coach', 'challenges', 'profile'].includes(hash) ? hash : 'dashboard';
      
      setIsRouteLoading(true);
      const timer = setTimeout(() => {
        setCurrentRoute(targetRoute);
        setIsRouteLoading(false);
      }, 350); // 350ms loading delay for telemetric sync
      return () => clearTimeout(timer);
    };

    window.addEventListener('hashchange', handleHashChange);
    // If mounted with a hash directly, trigger loading it
    if (window.location.hash) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scroll to top on route change to prevent sticky header occlusion
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentRoute]);

  // Fetch backend profile data when authenticated
  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.inputs) setInputs(data.inputs);
          if (data.xp !== undefined) setXp(data.xp);
          if (data.completedHabits) setCompletedHabits(data.completedHabits);
          if (data.challengeStats) setChallengeStats(data.challengeStats);
          if (data.offsets) setOffsets(data.offsets);
          if (data.history) setHistory(data.history);
          if (data.notifications && data.notifications.length > 0) setNotifications(data.notifications);
          if (data.chatHistory && data.chatHistory.length > 0) setChatHistory(data.chatHistory);
        } else if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      } catch (err) {
        console.error("Failed to fetch backend profile:", err);
      }
    };

    fetchProfile();
  }, [token]);

  // Sync profile edits to backend DB (Debounced by 1s)
  const syncProfile = async () => {
    if (!token) return;

    const payload = {
      inputs,
      xp,
      completedHabits,
      challengeStats,
      offsets,
      history,
      notifications,
      chatHistory,
      settings: {
        highContrast,
        fontSize,
        reducedMotion
      }
    };

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to sync profile changes with DB:", err);
    }
  };

  useEffect(() => {
    if (!token || !inputs) return;
    const timer = setTimeout(() => {
      syncProfile();
    }, 1000);
    return () => clearTimeout(timer);
  }, [inputs, xp, completedHabits, challengeStats, offsets, history, notifications, chatHistory, highContrast, fontSize, reducedMotion]);

  const [habitSavings, setHabitSavings] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_habits');
      const habits = stored ? JSON.parse(stored) : {};
      return Object.entries(habits).reduce((total, [habitId, count]) => {
        const saving = HABIT_SAVINGS_MAP[habitId] || 0;
        return total + (saving * count);
      }, 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const calculated = Object.entries(completedHabits).reduce((total, [habitId, count]) => {
      const saving = HABIT_SAVINGS_MAP[habitId] || 0;
      return total + (saving * count);
    }, 0);
    setHabitSavings(calculated);
  }, [completedHabits]);

  // Accessibility syncing effects
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

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_offsets', JSON.stringify(offsets));
    } catch (e) {
      console.error(e);
    }
  }, [offsets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_XP, xp.toString());
    } catch (e) {
      console.error(e);
    }
  }, [xp]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(completedHabits));
    } catch (e) {
      console.error(e);
    }
  }, [completedHabits]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_challenge_stats', JSON.stringify(challengeStats));
    } catch (e) {
      console.error(e);
    }
  }, [challengeStats]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_ai_messages', JSON.stringify(chatHistory));
    } catch (e) {
      console.error(e);
    }
  }, [chatHistory]);

  // Scroll to top when dashboard inputs are updated
  useEffect(() => {
    if (inputs) {
      window.scrollTo(0, 0);
    }
  }, [inputs]);

  // Core Math Calculations
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
  }, [inputs, history, netFootprint, recommendations, completedHabits, offsets]);

  // Onboarding Wizard triggers
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
      setInputs(null);
      setShowWizard(false);
    } catch (e) {
      console.error("Failed to go to welcome screen:", e);
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

  const handleLogout = () => {
    try {
      localStorage.removeItem('ecopulse_token');
      localStorage.removeItem('ecopulse_user');
      localStorage.removeItem(STORAGE_KEY_INPUTS);
      localStorage.removeItem(STORAGE_KEY_XP);
      localStorage.removeItem(STORAGE_KEY_HABITS);
      localStorage.removeItem('ecopulse_challenge_stats');
      localStorage.removeItem('ecopulse_history');
      localStorage.removeItem('ecopulse_offsets');
      localStorage.removeItem('ecopulse_notifications');
      localStorage.removeItem('ecopulse_ai_messages');
    } catch (e) {
      console.error(e);
    }
    setToken(null);
    setUser(null);
    setInputs(null);
    setXp(0);
    setCompletedHabits({});
    setChallengeStats({ streak: 0, completedTotal: 0, lastCompletedDate: null });
    setHistory([]);
    setOffsets({ treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 });
    setNotifications([]);
    setChatHistory([]);
    window.location.hash = '#dashboard';
  };

  // Notification Helpers
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (category, title, description) => {
    const newNotif = {
      id: Date.now().toString(),
      category,
      title,
      description,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // 1. Gateway Authentication Check
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AuthPage onAuthSuccess={(newToken, newUser) => {
          try {
            localStorage.setItem('ecopulse_token', newToken);
            localStorage.setItem('ecopulse_user', JSON.stringify(newUser));
          } catch (e) {
            console.error(e);
          }
          setToken(newToken);
          setUser(newUser);
        }} />
      </div>
    );
  }

  // 2. Render Main Application
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Brand Header */}
      <header className="app-header">
        <div className="brand-group" style={{ gap: '8px' }}>
          {inputs && (
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              aria-label="Toggle Navigation"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
            >
              <Menu size={24} />
            </button>
          )}
          <div onClick={handleResetToWelcome} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} title="Go to Welcome Page">
            <Leaf className="brand-logo" size={32} />
            <h1 className="brand-name">EcoPulse</h1>
          </div>
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

          {user && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} className="user-email-header">
              {user.email}
            </span>
          )}

          {token && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {inputs && (
        <Navbar 
          isOpen={isMobileMenuOpen} 
          setIsOpen={setIsMobileMenuOpen} 
          currentRoute={currentRoute}
          notifications={notifications}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          clearNotification={clearNotification}
          clearAllNotifications={clearAllNotifications}
        />
      )}

      {/* Main Grid Workspace */}
      <main style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 60px', width: '100%', overflowX: 'hidden' }}>
        {inputs ? (
          isRouteLoading ? (
            <div className="telemetry-loader-container bento-card">
              <RefreshCw size={40} className="telemetry-spinner" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>Syncing Telemetry Data...</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Retrieving your environmental tracking parameters</p>
            </div>
          ) : (
            <div className="page-route-container">
              
              {currentRoute === 'dashboard' && (
                <>
                  <div className="page-header-section">
                    <h2 className="page-header-title">
                      Control <span>Dashboard</span>
                      <span style={{ display: 'none' }}>Control Dashboard</span>
                    </h2>
                    <p className="page-header-subtitle">Real-time status of your carbon footprint and planetary ecosystem health.</p>
                    <div className="page-header-divider"></div>
                  </div>

                  <div className="quick-stats-grid">
                    <div className="quick-stat-card">
                      <div className="quick-stat-label">Net Footprint</div>
                      <div className="quick-stat-value">{(netFootprint).toLocaleString()} kg/yr</div>
                      <div className="quick-stat-desc" style={{ color: 'var(--text-muted)' }}>
                        Baseline: {(footprintBreakdown.total).toLocaleString()} kg
                      </div>
                    </div>
                    <div className="quick-stat-card">
                      <div className="quick-stat-label">Active Offsets</div>
                      <div className="quick-stat-value">{totalOffsets.toLocaleString()} kg/yr</div>
                      <div className="quick-stat-desc" style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>
                        {[
                          offsets.treesPlanted > 0 ? `${offsets.treesPlanted} trees` : '',
                          offsets.cleanEnergyFund > 0 ? `$${offsets.cleanEnergyFund} fund` : '',
                          offsets.plasticRemoved > 0 ? `${offsets.plasticRemoved}kg plastic` : ''
                        ].filter(Boolean).join(', ') || '0 programs active'}
                      </div>
                    </div>
                    <div className="quick-stat-card">
                      <div className="quick-stat-label">Eco Score XP</div>
                      <div className="quick-stat-value">{xp} XP</div>
                      <div className="quick-stat-desc" style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>
                        Level {Math.floor(xp / 100) + 1}
                      </div>
                    </div>
                    <div className="quick-stat-card">
                      <div className="quick-stat-label">Actions Logged</div>
                      <div className="quick-stat-value">
                        {Object.values(completedHabits).reduce((a, b) => a + b, 0)} check-ins
                      </div>
                      <div className="quick-stat-desc" style={{ color: 'var(--accent-orange)', fontWeight: '600' }}>
                        Streak: {challengeStats.streak} Days
                      </div>
                    </div>
                  </div>

                  <div className="bento-grid">
                    {/* Carbon Scoreboard */}
                    <CarbonScoreCard 
                      id="overview"
                      netFootprint={netFootprint} 
                      baseline={footprintBreakdown.total} 
                      xp={xp}
                      completedHabits={completedHabits}
                      history={history}
                      onClearHistory={handleClearHistory}
                      challengeStats={challengeStats}
                    />

                    {/* EcoSphere */}
                    <EcoSphere 
                      netFootprint={netFootprint} 
                      baselineFootprint={footprintBreakdown.total} 
                    />

                    {/* Smart Carbon Scanner */}
                    <CarbonScannerCard 
                      id="scanner"
                      inputs={inputs} 
                      onUpdateInputs={saveInputs}
                      token={token}
                    />

                    {/* Recent Activity Logs */}
                    <div className="bento-card col-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div className="card-header">
                          <div className="card-title-group">
                            <div className="card-icon-wrapper">
                              <History size={20} />
                            </div>
                            <h3 className="card-title">Recent Activity Logs</h3>
                          </div>
                          {history.length > 0 && (
                            <button 
                              onClick={handleClearHistory} 
                              className="notif-action-btn clear-notif" 
                              title="Clear calculation history"
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        
                        <div className="activity-logs-list" style={{ marginTop: '15px' }}>
                          {history.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              No activities logged yet. Perform a footprint calculation or log an activity.
                            </div>
                          ) : (
                            history.map((item, idx) => (
                              <div key={idx} className="activity-log-item">
                                <div className="activity-log-left">
                                  <div className="activity-log-icon">
                                    <Activity size={16} />
                                  </div>
                                  <div className="activity-log-info">
                                    <span className="activity-log-title">Baseline Footprint Calculated</span>
                                    <span className="activity-log-subtitle">{(item.footprint).toLocaleString()} kg CO₂e/yr</span>
                                  </div>
                                </div>
                                <span className="activity-log-time">{item.timestamp}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentRoute === 'analytics' && (
                <>
                  <div className="page-header-section">
                    <h2 className="page-header-title">
                      Emission <span>Analytics</span>
                      <span style={{ display: 'none' }}>Emission Analytics</span>
                    </h2>
                    <p className="page-header-subtitle">Deep dive into emission breakdown, forecast models, and trend analysis.</p>
                    <div className="page-header-divider"></div>
                  </div>

                  <div className="bento-grid">
                    {/* Emission Breakdown Chart */}
                    <ChartCard id="analytics-card" categories={footprintBreakdown} />

                    {/* Carbon Offset Simulator */}
                    <OffsetSimulatorCard 
                      id="offsets"
                      offsets={offsets} 
                      setOffsets={setOffsets} 
                    />

                    {/* Carbon Forecast & Projections */}
                    <CarbonForecastCard 
                      forecast={forecast} 
                      netFootprint={netFootprint} 
                      recommendations={recommendations} 
                    />

                    {/* Historical Emission Telemetry Table */}
                    <div className="bento-card col-12">
                      <div className="card-header">
                        <div className="card-title-group">
                          <div className="card-icon-wrapper">
                            <History size={20} />
                          </div>
                          <h3 className="card-title">Historical Emission Telemetry</h3>
                        </div>
                        {history.length > 0 && (
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={handleClearHistory}
                          >
                            <Trash2 size={13} /> Clear History
                          </button>
                        )}
                      </div>
                      
                      <div className="historical-table-container">
                        {history.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No calculation records found. Complete onboarding or scan a receipt to build history.
                          </div>
                        ) : (
                          <table className="historical-table">
                            <thead>
                              <tr>
                                <th>Timestamp</th>
                                <th>Baseline Footprint</th>
                                <th>Comparison</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.map((item, idx) => {
                                const prevItem = history[idx + 1];
                                let comparison = 'First Record';
                                if (prevItem) {
                                  const diff = item.footprint - prevItem.footprint;
                                  const diffPct = Math.round((diff / prevItem.footprint) * 100);
                                  if (diff < 0) {
                                    comparison = `${Math.abs(diffPct)}% reduction`;
                                  } else if (diff > 0) {
                                    comparison = `${diffPct}% increase`;
                                  } else {
                                    comparison = 'No change';
                                  }
                                }
                                return (
                                  <tr key={idx}>
                                    <td>{item.timestamp}</td>
                                    <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>
                                      {item.footprint.toLocaleString()} kg CO₂e/yr
                                    </td>
                                    <td style={{ 
                                      color: comparison.includes('reduction') ? 'var(--success)' : 
                                             comparison.includes('increase') ? 'var(--accent-orange)' : 'var(--text-muted)',
                                      fontWeight: '600'
                                    }}>
                                      {comparison}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentRoute === 'ai-coach' && (
                <>
                  <div className="page-header-section">
                    <h2 className="page-header-title">
                      Carbon <span>AI Coach</span>
                      <span style={{ display: 'none' }}>Carbon AI Coach</span>
                    </h2>
                    <p className="page-header-subtitle">Chat with our AI model for personalized carbon reduction suggestions.</p>
                    <div className="page-header-divider"></div>
                  </div>

                  <div className="bento-grid">
                    {/* EcoPulse AI Carbon Coach */}
                    <EcoPulseAI 
                      id="ai-coach-card"
                      inputs={inputs} 
                      footprintBreakdown={footprintBreakdown} 
                      netFootprint={netFootprint} 
                      xp={xp} 
                      completedHabits={completedHabits}
                      addNotification={addNotification}
                      chatHistory={chatHistory}
                      setChatHistory={setChatHistory}
                      token={token}
                    />

                    {/* Recommendations Panel */}
                    <RecommendationsCard 
                      recommendations={recommendations} 
                      onOpenCalculator={() => setShowWizard(true)}
                    />
                  </div>
                </>
              )}

              {currentRoute === 'challenges' && (
                <>
                  <div className="page-header-section">
                    <h2 className="page-header-title">
                      Sustainability <span>Goals</span>
                      <span style={{ display: 'none' }}>Sustainability Goals</span>
                    </h2>
                    <p className="page-header-subtitle">Tackle daily checklist tasks and unlock weekly milestone achievements.</p>
                    <div className="page-header-divider"></div>
                  </div>

                  <div className="bento-grid">
                    {/* Weekly Sustainability Challenges */}
                    <ChallengeTrackerCard 
                      xp={xp} 
                      setXp={setXp} 
                      completedHabits={completedHabits} 
                      offsets={offsets} 
                      challengeStats={challengeStats} 
                      setChallengeStats={setChallengeStats} 
                      addNotification={addNotification}
                    />

                    {/* Daily Green Habits Action Tracker */}
                    <HabitTrackerCard 
                      id="habits"
                      xp={xp} 
                      setXp={setXp} 
                      completedHabits={completedHabits} 
                      setCompletedHabits={setCompletedHabits} 
                      habitSavings={habitSavings} 
                      setHabitSavings={setHabitSavings} 
                      addNotification={addNotification}
                    />

                    {/* Badge achievements collection card */}
                    <div className="bento-card col-6" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div>
                        <div className="card-header">
                          <div className="card-title-group">
                            <div className="card-icon-wrapper" style={{ color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.03)' }}>
                              <Award size={20} />
                            </div>
                            <h3 className="card-title">Unlocked Badges & Credentials</h3>
                          </div>
                        </div>
                        
                        <div className="badges-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '15px' }}>
                          {/* Eco Starter (Level 1) */}
                          <div className="badge-card-premium" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '20px 12px',
                            background: 'rgba(16, 185, 129, 0.02)',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            borderRadius: '16px',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <div className="badge-icon-wrapper-premium" style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(16, 185, 129, 0.08)',
                              color: 'var(--accent-green)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
                              marginBottom: '14px'
                            }}>
                              <Sprout size={28} />
                            </div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Eco Starter</h4>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Unlocked at Level 1</span>
                            <div className="badge-status-pill" style={{
                              fontSize: '0.65rem',
                              fontWeight: '900',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: 'var(--accent-green)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              UNLOCKED
                            </div>
                          </div>

                          {/* Green Pioneer (Level 2) */}
                          {(() => {
                            const userLevel = Math.floor(xp / 100) + 1;
                            const isPioneerUnlocked = userLevel >= 2;
                            return (
                              <div className={`badge-card-premium ${!isPioneerUnlocked ? 'locked' : ''}`} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                padding: '20px 12px',
                                background: isPioneerUnlocked ? 'rgba(6, 182, 212, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                                border: isPioneerUnlocked ? '1px solid rgba(6, 182, 212, 0.15)' : '1px solid var(--card-border)',
                                borderRadius: '16px',
                                transition: 'all 0.3s ease',
                                opacity: isPioneerUnlocked ? 1 : 0.5,
                                filter: isPioneerUnlocked ? 'none' : 'grayscale(0.6)'
                              }}>
                                <div className="badge-icon-wrapper-premium" style={{
                                  width: '56px',
                                  height: '56px',
                                  borderRadius: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isPioneerUnlocked ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                  color: isPioneerUnlocked ? 'var(--accent-blue)' : 'var(--text-muted)',
                                  border: isPioneerUnlocked ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid var(--card-border)',
                                  boxShadow: isPioneerUnlocked ? '0 0 15px rgba(6, 182, 212, 0.15)' : 'none',
                                  marginBottom: '14px'
                                }}>
                                  <Compass size={28} />
                                </div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Green Pioneer</h4>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Unlocked at Level 2</span>
                                <div className="badge-status-pill" style={{
                                  fontSize: '0.65rem',
                                  fontWeight: '900',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  background: isPioneerUnlocked ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                  color: isPioneerUnlocked ? 'var(--accent-blue)' : 'var(--text-muted)',
                                  border: isPioneerUnlocked ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid var(--card-border)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  {isPioneerUnlocked ? 'UNLOCKED' : 'LOCKED'}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Offset Champion */}
                          {(() => {
                            const totalOffsets = Object.values(offsets || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
                            const isOffsetUnlocked = totalOffsets > 0;
                            return (
                              <div className={`badge-card-premium ${!isOffsetUnlocked ? 'locked' : ''}`} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                padding: '20px 12px',
                                background: isOffsetUnlocked ? 'rgba(139, 92, 246, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                                border: isOffsetUnlocked ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid var(--card-border)',
                                borderRadius: '16px',
                                transition: 'all 0.3s ease',
                                opacity: isOffsetUnlocked ? 1 : 0.5,
                                filter: isOffsetUnlocked ? 'none' : 'grayscale(0.6)'
                              }}>
                                <div className="badge-icon-wrapper-premium" style={{
                                  width: '56px',
                                  height: '56px',
                                  borderRadius: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isOffsetUnlocked ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                  color: isOffsetUnlocked ? 'var(--accent-purple)' : 'var(--text-muted)',
                                  border: isOffsetUnlocked ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid var(--card-border)',
                                  boxShadow: isOffsetUnlocked ? '0 0 15px rgba(139, 92, 246, 0.15)' : 'none',
                                  marginBottom: '14px'
                                }}>
                                  <Globe size={28} />
                                </div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Offset Champion</h4>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Activate any carbon offset program</span>
                                <div className="badge-status-pill" style={{
                                  fontSize: '0.65rem',
                                  fontWeight: '900',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  background: isOffsetUnlocked ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                  color: isOffsetUnlocked ? 'var(--accent-purple)' : 'var(--text-muted)',
                                  border: isOffsetUnlocked ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid var(--card-border)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  {isOffsetUnlocked ? 'UNLOCKED' : 'LOCKED'}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Habit Master */}
                          {(() => {
                            const isHabitMasterUnlocked = challengeStats?.completedTotal >= 5;
                            return (
                              <div className={`badge-card-premium ${!isHabitMasterUnlocked ? 'locked' : ''}`} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                padding: '20px 12px',
                                background: isHabitMasterUnlocked ? 'rgba(245, 158, 11, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                                border: isHabitMasterUnlocked ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid var(--card-border)',
                                borderRadius: '16px',
                                transition: 'all 0.3s ease',
                                opacity: isHabitMasterUnlocked ? 1 : 0.5,
                                filter: isHabitMasterUnlocked ? 'none' : 'grayscale(0.6)'
                              }}>
                                <div className="badge-icon-wrapper-premium" style={{
                                  width: '56px',
                                  height: '56px',
                                  borderRadius: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isHabitMasterUnlocked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                  color: isHabitMasterUnlocked ? 'var(--accent-orange)' : 'var(--text-muted)',
                                  border: isHabitMasterUnlocked ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid var(--card-border)',
                                  boxShadow: isHabitMasterUnlocked ? '0 0 15px rgba(245, 158, 11, 0.15)' : 'none',
                                  marginBottom: '14px'
                                }}>
                                  <Crown size={28} />
                                </div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Habit Master</h4>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Complete 5 or more eco actions</span>
                                <div className="badge-status-pill" style={{
                                  fontSize: '0.65rem',
                                  fontWeight: '900',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  background: isHabitMasterUnlocked ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                  color: isHabitMasterUnlocked ? 'var(--accent-orange)' : 'var(--text-muted)',
                                  border: isHabitMasterUnlocked ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid var(--card-border)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  {isHabitMasterUnlocked ? 'UNLOCKED' : 'LOCKED'}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentRoute === 'profile' && (
                <>
                  <div className="page-header-section">
                    <h2 className="page-header-title">
                      Sustainability <span>Profile</span>
                      <span style={{ display: 'none' }}>Sustainability Profile</span>
                    </h2>
                    <p className="page-header-subtitle">Manage user preferences, accessibility preferences, and review achievements.</p>
                    <div className="page-header-divider"></div>
                  </div>

                  <div className="bento-grid">
                    {/* Carbon Personality Profile */}
                    <CarbonPersonalityCard 
                      key={personality?.key || 'default'}
                      personality={personality} 
                      xp={xp} 
                      setXp={setXp} 
                      netFootprint={netFootprint}
                      offsets={offsets}
                      addNotification={addNotification}
                    />
                  </div>
                </>
              )}

            </div>
          )
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

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', margin: '0 auto' }}>
              <button 
                type="button"
                className="btn btn-primary btn-pulse" 
                style={{ padding: '14px 28px', fontSize: '0.95rem', fontWeight: '700' }}
                onClick={() => setShowWizard(true)}
              >
                Get Started
              </button>
              {localStorage.getItem(STORAGE_KEY_INPUTS) && (
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ padding: '14px 28px', fontSize: '0.95rem', fontWeight: '700' }}
                  onClick={() => {
                    try {
                      const stored = localStorage.getItem(STORAGE_KEY_INPUTS);
                      if (stored) setInputs(JSON.parse(stored));
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  Dashboard
                </button>
              )}
            </div>
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
