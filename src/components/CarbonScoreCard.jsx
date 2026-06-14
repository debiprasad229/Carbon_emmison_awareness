import { Award, Zap, Trees } from 'lucide-react';
import { getUnlockedBadges } from '../utils/carbonCalculations';

export default function CarbonScoreCard({ netFootprint = 0, baseline = 8000, xp = 0, completedHabits = {} }) {
  const tons = (netFootprint / 1000).toFixed(1);
  const percentChange = baseline > 0 
    ? Math.round(((netFootprint - baseline) / baseline) * 100) 
    : 0;

  const unlockedBadges = getUnlockedBadges(xp, completedHabits).filter(b => b.unlocked);

  // Dynamic comparison statement
  const targetDiff = netFootprint - 2000; // 2,000 kg is standard target for 1.5C warming path
  const isTargetAchieved = targetDiff <= 0;

  return (
    <div className="bento-card col-8" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-wrapper">
              <Trees size={20} />
            </div>
            <h3 className="card-title">Carbon Scoreboard</h3>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '20px', color: 'var(--text-secondary)' }}>
            Annual Score
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', margin: '15px 0 25px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Net Footprint
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-heading)', lineHeight: '1', color: isTargetAchieved ? 'var(--success)' : 'var(--text-primary)' }}>
                {netFootprint.toLocaleString()}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                kg CO₂e/yr
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              ≈ {tons} metric tons per year
            </p>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status vs. Baseline
            </span>
            <div style={{ marginTop: '6px' }}>
              {percentChange < 0 ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
                  ↓ {Math.abs(percentChange)}% Reduction
                </div>
              ) : percentChange === 0 ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
                  Steady at Baseline
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
                  ↑ {percentChange}% Increase
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
              {isTargetAchieved ? (
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                  ✓ Under the 2,000 kg global sustainability limit!
                </span>
              ) : (
                <span>
                  Needs to reduce by <strong>{targetDiff.toLocaleString()} kg</strong> to hit the 1.5°C global target (2,000 kg/yr).
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Gamification Summary Inside the Score Bento Card */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 'var(--border-radius-md)', 
          padding: '12px 18px',
          marginTop: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={18} style={{ color: 'var(--accent-green)' }} />
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Eco XP Points</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Earned from actions</p>
          </div>
        </div>
        <span className="xp-indicator" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
          {xp} XP
        </span>

        <div style={{ height: '30px', width: '1px', background: 'var(--card-border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={18} style={{ color: 'var(--accent-purple)' }} />
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Badges Unlocked</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unlockedBadges.length} Active achievements</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {unlockedBadges.slice(0, 3).map(badge => (
            <div 
              key={badge.id}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--accent-purple-glow)',
                border: '1px solid var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                color: 'var(--accent-purple)',
                fontWeight: 'bold',
                cursor: 'help'
              }}
              title={`${badge.name}: ${badge.description}`}
            >
              ⭐
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
