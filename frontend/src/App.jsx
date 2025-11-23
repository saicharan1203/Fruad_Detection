import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';

import { DashboardPage } from './pages/DashboardPage';
import { DetectionPage } from './pages/DetectionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { ReportsPage } from './pages/ReportsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { FraudPatternsPage } from './pages/FraudPatternsPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { AlertSystem } from './components/AlertSystem';
import { BehaviorMonitor } from './components/BehaviorMonitor';

import './styles/dashboard.css';

function App() {
  const [fileInfo, setFileInfo] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.remove('dark-theme');
  }, []);

  return (
    <Router>
      <div className="app-layout">
        <Navigation isCollapsed={isNavCollapsed} setIsCollapsed={setIsNavCollapsed} />
        <main className={`main-content ${isNavCollapsed ? 'expanded' : ''}`}>
          <div className="page-transition">
            <AlertSystem predictions={predictions} />

            <BehaviorMonitor />
          </div>
          <Routes>
            <Route 
              path="/" 
              element={
                <div className="page-transition">
                  <DashboardPage 
                    fileInfo={fileInfo}
                    predictions={predictions}
                    setFileInfo={setFileInfo}
                    setPredictions={setPredictions}
                  />
                </div>
              } 
            />
            <Route path="/detection" element={<div className="page-transition"><DetectionPage predictions={predictions} /></div>} />
            <Route path="/analytics" element={<div className="page-transition"><AnalyticsPage predictions={predictions} /></div>} />
            <Route path="/simulator" element={<div className="page-transition"><SimulatorPage /></div>} />
            <Route path="/monitoring" element={<div className="page-transition"><MonitoringPage predictions={predictions} /></div>} />
            <Route path="/reports" element={<div className="page-transition"><ReportsPage predictions={predictions} /></div>} />
            <Route path="/activity" element={<div className="page-transition"><ActivityLogPage /></div>} />
            <Route path="/settings" element={<div className="page-transition"><SettingsPage /></div>} />
            <Route path="/model-performance" element={<div className="page-transition"><ModelPerformancePage predictions={predictions} /></div>} />
            <Route path="/fraud-patterns" element={<div className="page-transition"><FraudPatternsPage predictions={predictions} /></div>} />
            <Route path="/data-explorer" element={<div className="page-transition"><DataExplorerPage predictions={predictions} /></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;