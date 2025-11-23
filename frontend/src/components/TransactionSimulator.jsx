import React, { useState } from 'react';
import { FiPlay, FiRefreshCw, FiZap } from 'react-icons/fi';

export const TransactionSimulator = () => {
  const [scenario, setScenario] = useState('normal');
  const [results, setResults] = useState(null);
  const [animating, setAnimating] = useState(false);

  const scenarios = {
    normal: {
      name: 'Normal Shopping',
      icon: '🛒',
      transactions: [
        { desc: 'Grocery Store - $45', risk: 5, time: '10:30 AM' },
        { desc: 'Gas Station - $50', risk: 3, time: '2:15 PM' },
        { desc: 'Restaurant - $35', risk: 4, time: '7:45 PM' }
      ]
    },
    velocity: {
      name: 'Velocity Attack',
      icon: '⚡',
      transactions: [
        { desc: 'Online Store - $299', risk: 15, time: '10:00 AM' },
        { desc: 'Online Store - $450', risk: 35, time: '10:02 AM' },
        { desc: 'Online Store - $680', risk: 65, time: '10:03 AM' },
        { desc: 'Online Store - $920', risk: 85, time: '10:04 AM' },
        { desc: 'Online Store - $1200', risk: 95, time: '10:05 AM' }
      ]
    },
    geographic: {
      name: 'Location Anomaly',
      icon: '🌍',
      transactions: [
        { desc: 'NYC Coffee Shop - $5', risk: 2, time: '8:00 AM', location: 'New York' },
        { desc: 'LA Electronics - $1500', risk: 75, time: '8:30 AM', location: 'Los Angeles' },
        { desc: 'Miami Jewelry - $3000', risk: 90, time: '9:00 AM', location: 'Miami' }
      ]
    },
    unusual_time: {
      name: 'Late Night Activity',
      icon: '🌙',
      transactions: [
        { desc: 'Jewelry Store - $2500', risk: 85, time: '2:30 AM' },
        { desc: 'Electronics - $1800', risk: 80, time: '3:15 AM' },
        { desc: 'Luxury Goods - $3200', risk: 92, time: '3:45 AM' }
      ]
    },
    card_testing: {
      name: 'Card Testing',
      icon: '🧪',
      transactions: [
        { desc: 'Online - $1', risk: 20, time: '11:00 PM' },
        { desc: 'Online - $1', risk: 30, time: '11:01 PM' },
        { desc: 'Online - $5', risk: 45, time: '11:02 PM' },
        { desc: 'Online - $2500', risk: 95, time: '11:10 PM' }
      ]
    },
    hybrid: {
      name: 'Multi-Vector Attack',
      icon: '💥',
      transactions: [
        { desc: 'ATM Withdrawal - $500', risk: 25, time: '2:00 AM', location: 'NYC' },
        { desc: 'Online Purchase - $1200', risk: 65, time: '2:05 AM', location: 'London' },
        { desc: 'Gas Station - $800', risk: 45, time: '2:10 AM', location: 'NYC' },
        { desc: 'Jewelry - $5000', risk: 95, time: '2:15 AM', location: 'Tokyo' }
      ]
    }
  };

  const classifyRisk = (score) => {
    if (score >= 70) return { label: 'Critical', className: 'critical' };
    if (score >= 50) return { label: 'High', className: 'high' };
    if (score >= 25) return { label: 'Medium', className: 'medium' };
    return { label: 'Low', className: 'low' };
  };

  const runSimulation = () => {
    setAnimating(true);
    setResults(null);
    
    setTimeout(() => {
      const txns = scenarios[scenario].transactions;
      const avgRisk = txns.reduce((sum, t) => sum + t.risk, 0) / txns.length;
      const maxRisk = Math.max(...txns.map(t => t.risk));
      const flagged = txns.filter(t => t.risk > 60).length;
      
      setResults({
        avgRisk: avgRisk.toFixed(1),
        maxRisk,
        flagged,
        total: txns.length,
        verdict: avgRisk > 70 ? 'BLOCK IMMEDIATELY' : avgRisk > 50 ? 'REQUIRE VERIFICATION' : avgRisk > 25 ? 'MONITOR CLOSELY' : 'ALLOW'
      });
      setAnimating(false);
    }, 2000);
  };

  return (
    <div className="simulator-container">
      <div className="section-header">
        <FiPlay size={28} style={{ color: 'var(--primary)' }} />
        <h2>🎮 Transaction Simulator</h2>
        <p>Test fraud detection scenarios in real-time</p>
      </div>

      <div className="simulator-grid">
        <div className="scenario-selector">
          <div className="scenario-selector-header">
            <div>
              <p className="scenario-label">Planner</p>
              <h3>📋 Select Attack Scenario</h3>
            </div>
            <span className="scenario-chip">{Object.keys(scenarios).length} presets</span>
          </div>

          <div className="scenario-cards">
            {Object.keys(scenarios).map((key) => {
              const txns = scenarios[key].transactions;
              const avgRisk = txns.reduce((sum, t) => sum + t.risk, 0) / txns.length;
              const { label, className } = classifyRisk(avgRisk);

              return (
                <div
                  key={key}
                  className={`scenario-card ${scenario === key ? 'active' : ''}`}
                  onClick={() => setScenario(key)}
                >
                  <div className="scenario-icon-pill">{scenarios[key].icon}</div>
                  <div className="scenario-details">
                    <p className="scenario-name">{scenarios[key].name}</p>
                    <span className="scenario-subtext">{label} exposure pattern</span>
                  </div>
                  <div className="scenario-meta">
                    <span className="scenario-count">{txns.length} txns</span>
                    <span className={`scenario-risk ${className}`}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="scenario-footer">
            <div className="scenario-hint">
              <FiZap size={16} /> Choose a preset above to preview paths.
            </div>
            <button 
              className={`btn-simulate ${animating ? 'is-busy' : ''}`}
              onClick={runSimulation}
              disabled={animating}
            >
              <div className="btn-simulate-icon">
                {animating ? <FiRefreshCw className="spin-icon" /> : <FiZap />}
              </div>
              <div className="btn-simulate-copy">
                <span className="btn-simulate-title">{animating ? 'Simulating...' : 'Run Simulation'}</span>
                <span className="btn-simulate-subtitle">{animating ? 'Processing flow & scores' : 'Launch selected attack path'}</span>
              </div>
              <div className="btn-simulate-arrow">→</div>
            </button>
          </div>
        </div>

        <div className="simulation-display">
          <div className="simulation-header">
            <div>
              <p className="simulation-label">Flow Preview</p>
              <h3>📊 Transaction Flow</h3>
            </div>
            <span className={`simulation-status ${animating ? 'live' : 'idle'}`}>
              {animating ? 'Running scenario...' : 'Ready'}
            </span>
          </div>
          <div className="transaction-flow">
            {scenarios[scenario].transactions.map((txn, idx) => {
              const { label: txnRiskLabel, className: txnRiskClass } = classifyRisk(txn.risk);
              const action = txn.risk > 70 ? 'Block immediately' : txn.risk > 50 ? 'Require step-up auth' : txn.risk > 25 ? 'Monitor closely' : 'Allow';

              return (
                <div 
                  key={idx} 
                  className={`flow-card ${animating ? 'animating' : ''} risk-${txnRiskClass}`}
                  style={{ animationDelay: animating ? `${idx * 0.4}s` : '0s' }}
                >
                  <div className="flow-card-top">
                    <div>
                      <span className="flow-time-chip">{txn.time}</span>
                      <p className="flow-desc">{txn.desc}</p>
                      {txn.location && <p className="flow-location">📍 {txn.location}</p>}
                    </div>
                    <span className={`flow-risk-chip ${txnRiskClass}`}>{txnRiskLabel} Risk</span>
                  </div>
                  <div className="flow-card-bottom">
                    <div className="flow-meter">
                      <div 
                        className="flow-meter-fill" 
                        style={{ width: `${txn.risk}%` }}
                      ></div>
                    </div>
                    <div className="flow-meta">
                      <span className="flow-risk-value">{txn.risk}% probability</span>
                      <span className="flow-action">{action}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {results && (
            <div className="simulation-results">
              <h3>🎯 Simulation Results</h3>
              <div className="results-grid">
                <div className="result-box">
                  <div className="result-label">Average Risk</div>
                  <div className="result-value">{results.avgRisk}%</div>
                </div>
                <div className="result-box">
                  <div className="result-label">Peak Risk</div>
                  <div className="result-value">{results.maxRisk}%</div>
                </div>
                <div className="result-box">
                  <div className="result-label">Flagged</div>
                  <div className="result-value">{results.flagged}/{results.total}</div>
                </div>
              </div>
              <div 
                className="verdict-badge"
                style={{
                  background: results.verdict === 'BLOCK IMMEDIATELY' ? '#ff4757' :
                             results.verdict === 'REQUIRE VERIFICATION' ? '#ffa502' :
                             results.verdict === 'MONITOR CLOSELY' ? '#ffd93d' : '#2ed573'
                }}
              >
                {results.verdict}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
