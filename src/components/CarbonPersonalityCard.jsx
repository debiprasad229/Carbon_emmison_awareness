import { useState } from 'react';
import { Award, Compass, Zap, Leaf, AlertCircle, CheckCircle2, XCircle, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateOffsets } from '../utils/carbonCalculations';

const ICON_MAP = {
  warrior: Award,
  commuter: Compass,
  saver: Zap,
  minimalist: Leaf,
  intensive: AlertCircle
};

export default function CarbonPersonalityCard({ 
  personality, 
  xp,
  setXp,
  addNotification,
  netFootprint = 3400,
  offsets = { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 }
}) {
  const [challengeClaimed, setChallengeClaimed] = useState(() => {
    try {
      const stored = localStorage.getItem(`ecopulse_claimed_challenge_${personality?.key}`);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  if (!personality) return null;

  const totalOffset = calculateOffsets(offsets);
  const grossFootprint = netFootprint + totalOffset;
  const neutralityProgress = grossFootprint > 0 
    ? Math.round((totalOffset / grossFootprint) * 100) 
    : 0;

  const getGradeInfo = (footprint) => {
    if (footprint <= 2000) return { grade: 'A', color: 'linear-gradient(135deg, #10b981, #059669)', border: 'rgba(16, 185, 129, 0.2)' };
    if (footprint <= 3000) return { grade: 'B', color: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'rgba(59, 130, 246, 0.2)' };
    if (footprint <= 4500) return { grade: 'C', color: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'rgba(6, 182, 212, 0.2)' };
    if (footprint <= 6500) return { grade: 'D', color: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'rgba(245, 158, 11, 0.2)' };
    return { grade: 'F', color: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'rgba(239, 68, 68, 0.2)' };
  };

  const gradeInfo = getGradeInfo(netFootprint);

  const BadgeIcon = ICON_MAP[personality.key] || Leaf;

  const handleClaimChallenge = () => {
    if (challengeClaimed) return;

    // Trigger premium confetti explosion if motion is not reduced
    const isReducedMotion = document.body.classList.contains('reduced-motion');
    if (!isReducedMotion) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b']
      });
    }

    // Award XP
    const reward = personality.challenge.xpReward || 30;
    setXp(prev => prev + reward);

    // Persist claimed state
    try {
      localStorage.setItem(`ecopulse_claimed_challenge_${personality.key}`, 'true');
      setChallengeClaimed(true);
    } catch (e) {
      console.error("Failed to save challenge status:", e);
    }

    // Trigger notification
    if (addNotification) {
      addNotification('Achievements', 'Personality Challenge Completed', `${personality.challenge.text} completed (+${reward} XP)`);
    }
  };

  // Determine progress bar color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 50) return 'var(--accent-blue)';
    if (score >= 30) return 'var(--accent-orange)';
    return 'var(--danger)';
  };

  return (
    <div className="bento-card col-12 personality-card-container">
      
      {/* Header */}
      <div className="card-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div className="card-title-group">
          <div className="card-icon-wrapper" style={{ color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.05)' }}>
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="card-title">Carbon Personality Profile</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Behavioral analysis of your carbon footprint and green habits
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="personality-layout-grid">
        
        {/* Left Side: Badge Presentation & Sustainability Score */}
        <div className="personality-badge-section">
          
          {/* Animated Badge */}
          <div className={`personality-badge-glow ${personality.badgeClass}`}>
            <div className="personality-badge-icon-holder">
              <BadgeIcon size={48} className="personality-badge-icon-spin" />
            </div>
            <h4 className="personality-badge-title">{personality.name}</h4>
          </div>

          {/* Sustainability Score Gauge */}
          <div className="sustainability-score-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Sustainability Index</span>
              <span style={{ 
                fontSize: '0.9rem', 
                fontWeight: '900', 
                color: getScoreColor(personality.sustainabilityScore)
              }}>
                {personality.sustainabilityScore}%
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="personality-progress-container">
              <div 
                className="personality-progress-fill" 
                style={{ 
                  width: `${personality.sustainabilityScore}%`,
                  background: getScoreColor(personality.sustainabilityScore),
                  boxShadow: `0 0 10px ${getScoreColor(personality.sustainabilityScore)}`
                }}
              />
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.3' }}>
              Index increases as net footprint drops and XP rises. Complete the challenge to level up!
            </p>
          </div>

        </div>

        {/* Right Side: Detailed analysis (Strengths, Weaknesses, etc.) */}
        <div className="personality-info-section">
          
          <p className="personality-description">
            {personality.description}
          </p>

          <div className="personality-details-grid">
            
            {/* Strengths */}
            <div className="personality-detail-block">
              <div className="detail-block-header green">
                <CheckCircle2 size={15} />
                <span>Strengths</span>
              </div>
              <ul className="detail-list">
                {personality.strengths.map((str, i) => (
                  <li key={`str-${i}`}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="personality-detail-block">
              <div className="detail-block-header red">
                <XCircle size={15} />
                <span>Weaknesses</span>
              </div>
              <ul className="detail-list">
                {personality.weaknesses.map((weak, i) => (
                  <li key={`weak-${i}`}>{weak}</li>
                ))}
              </ul>
            </div>

            {/* Improvement Opportunities */}
            <div className="personality-detail-block">
              <div className="detail-block-header blue">
                <Sparkles size={15} />
                <span>Improvement Opportunities</span>
              </div>
              <ul className="detail-list opportunity-list">
                {personality.opportunities.map((opp, i) => (
                  <li key={`opp-${i}`}>{opp}</li>
                ))}
              </ul>
            </div>

            {/* Evolve Challenge (XP Integration) */}
            <div className="evolve-challenge-card" style={{ marginTop: 0 }}>
              <div className="challenge-header">
                <span className="challenge-tag">PERSONALITY CHALLENGE</span>
                <span className="challenge-xp">+{personality.challenge.xpReward} XP</span>
              </div>
              <p className="challenge-text">{personality.challenge.text}</p>
              <button 
                type="button" 
                className={`challenge-btn ${challengeClaimed ? 'claimed' : ''}`}
                onClick={handleClaimChallenge}
                disabled={challengeClaimed}
              >
                {challengeClaimed ? '✓ Challenge Completed' : 'Complete Challenge'}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Horizontal Divider */}
      <div style={{ borderTop: '1px solid var(--card-border)', margin: '20px 0 15px 0' }} />

      {/* Sustainability Grade Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Sustainability Grade</h4>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Your target is to reduce emissions under 2,000 kg/yr to align with global warming targets.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: '850', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Neutrality Progress</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '850', color: 'var(--text-primary)' }}>{neutralityProgress}% Reduced</div>
          </div>
          <div 
            style={{ 
              width: '46px', 
              height: '46px', 
              background: gradeInfo.color, 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.6rem', 
              fontWeight: '850', 
              color: '#060f1e', 
              boxShadow: `0 0 12px ${gradeInfo.border}`
            }}
          >
            {gradeInfo.grade}
          </div>
        </div>
      </div>

    </div>
  );
}
