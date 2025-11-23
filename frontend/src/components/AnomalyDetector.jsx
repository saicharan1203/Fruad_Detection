import React, { useMemo } from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import '../styles/dashboard.css';

export const AnomalyDetector = ({ predictions }) => {
  const anomalies = useMemo(() => {
    return (predictions.results || [])
      .filter(tx => tx.is_anomaly === 1)
      .sort((a, b) => (b.anomaly_score || 0) - (a.anomaly_score || 0))
      .slice(0, 10);
  }, [predictions]);

  return (
    <div className="anomaly-section">
      <h2>🔮 Top Anomalies Detected</h2>
      <p className="section-subtitle">Unusual transactions that deviate from normal patterns</p>

      {anomalies.length === 0 ? (
        <div className="empty-state">
          <FiCheckCircle className="icon-success" />
          <p>No significant anomalies detected</p>
        </div>
      ) : (
        <div className="anomaly-list">
          {anomalies.map((tx, idx) => (
            <div key={idx} className="anomaly-item">
              <div className="anomaly-rank">#{idx + 1}</div>
              <div className="anomaly-details">
                <p>
                  <strong>Customer:</strong> {tx.customer_id || 'N/A'} | 
                  <strong> Amount:</strong> ${(tx.amount || 0)?.toFixed(2)} | 
                  <strong> Category:</strong> {tx.merchant_category || 'N/A'}
                </p>
                <p className="anomaly-timestamp">{tx.timestamp || 'N/A'}</p>
              </div>
              <div className="anomaly-score">
                <span className="score-value">{((tx.anomaly_score || 0) * 100).toFixed(1)}</span>
                <span className="score-label">Anomaly %</span>
              </div>
              <FiAlertTriangle className="icon-warning" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};