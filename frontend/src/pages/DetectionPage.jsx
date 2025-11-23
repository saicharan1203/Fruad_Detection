import React from 'react';
import { FraudNetworkGraph } from '../components/FraudNetworkGraph';
import { FraudStoryline } from '../components/FraudStoryline';
import { AnomalyDetector } from '../components/AnomalyDetector';
import { ResultsTable } from '../components/ResultsTable';

export const DetectionPage = ({ predictions }) => {
  if (!predictions) {
    return (
      <div className="page-container">
        <div className="empty-state-page">
          <div className="empty-icon">🔍</div>
          <h2>No Detection Data Available</h2>
          <p>Please upload data and run fraud detection from the Dashboard first.</p>
          <a href="/" className="btn-primary">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="detectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ff4757', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ff6b81', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#detectionGradient)" opacity="0.2" />
            <circle cx="40" cy="40" r="25" fill="none" stroke="url(#detectionGradient)" strokeWidth="3" />
            <circle cx="40" cy="40" r="15" fill="none" stroke="url(#detectionGradient)" strokeWidth="3" />
            <circle cx="40" cy="40" r="5" fill="url(#detectionGradient)" />
            <path d="M 40 15 L 40 25" stroke="url(#detectionGradient)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 65 40 L 55 40" stroke="url(#detectionGradient)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div>
            <h1>🔍 Fraud Detection</h1>
            <p>Analyze detected fraud patterns and suspicious activities</p>
          </div>
        </div>
      </div>

      <FraudNetworkGraph predictions={predictions} />
      <FraudStoryline predictions={predictions} />
      <AnomalyDetector predictions={predictions} />
      <ResultsTable predictions={predictions} />
    </div>
  );
};
