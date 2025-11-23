import React, { useState } from 'react';
import { FiFileText, FiDownload, FiCalendar } from 'react-icons/fi';

export const ReportsPage = ({ predictions }) => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('today');
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const generateReport = () => {
    console.log('=== GENERATE REPORT CALLED ===');
    console.log('Predictions:', predictions);
    console.log('Report Type:', reportType);
    console.log('Date Range:', dateRange);
    
    if (!predictions || predictions.length === 0) {
      alert('No data available. Please run fraud detection from the Dashboard first.');
      return;
    }

    setGenerating(true);
    setDownloadSuccess(false);
    
    try {
      console.log('Generating report data...');
      const reportData = generateReportData();
      console.log('Report data generated:', reportData);
      
      console.log('Starting download...');
      downloadReport(reportData);
      
      setGenerating(false);
      setDownloadSuccess(true);
      
      // Hide success message after 4 seconds
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (error) {
      console.error('=== ERROR GENERATING REPORT ===');
      console.error('Error details:', error);
      console.error('Stack:', error.stack);
      setGenerating(false);
      alert('Failed to generate report: ' + error.message);
    }
  };

  const generateReportData = () => {
    console.log('Predictions data:', predictions);
    console.log('Predictions type:', typeof predictions);
    console.log('Is array:', Array.isArray(predictions));
    
    // Handle if predictions is an object with a predictions property
    let predictionsArray = predictions;
    if (predictions && !Array.isArray(predictions)) {
      if (predictions.predictions && Array.isArray(predictions.predictions)) {
        predictionsArray = predictions.predictions;
        console.log('Using predictions.predictions array');
      } else if (predictions.results && Array.isArray(predictions.results)) {
        predictionsArray = predictions.results;
        console.log('Using predictions.results array');
      } else {
        console.error('Predictions is not an array and has no array property');
        throw new Error('Invalid predictions data structure');
      }
    }
    
    if (!predictionsArray || !Array.isArray(predictionsArray) || predictionsArray.length === 0) {
      return {
        title: 'Fraud Detection Report',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        summary: 'No data available',
        transactions: 0,
        fraudDetected: 0,
        highRiskCases: 0,
        mediumRiskCases: 0,
        lowRiskCases: 0,
        totalAmount: '0.00',
        fraudAmount: '0.00',
        averageTransaction: '0.00',
        fraudRate: '0.00',
        topTransactions: [],
        riskDistribution: { low: 0, medium: 0, high: 0 }
      };
    }

    try {
      // Categorize by risk levels
      const lowRisk = predictionsArray.filter(p => (p.fraud_probability || 0) <= 0.3);
      const mediumRisk = predictionsArray.filter(p => (p.fraud_probability || 0) > 0.3 && (p.fraud_probability || 0) <= 0.7);
      const highRisk = predictionsArray.filter(p => (p.fraud_probability || 0) > 0.7);
      const fraudCases = predictionsArray.filter(p => (p.fraud_probability || 0) > 0.5);
      
      // Calculate amounts
      const totalAmount = predictionsArray.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const fraudAmount = fraudCases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const averageTransaction = predictionsArray.length > 0 ? totalAmount / predictionsArray.length : 0;
      
      // Risk distribution
      const riskDistribution = {
        low: lowRisk.length,
        medium: mediumRisk.length,
        high: highRisk.length
      };

      return {
        title: `Fraud Detection Report - ${reportType.toUpperCase()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        dateRange: dateRange,
        totalTransactions: predictionsArray.length,
        fraudDetected: fraudCases.length,
        highRiskCases: highRisk.length,
        mediumRiskCases: mediumRisk.length,
        lowRiskCases: lowRisk.length,
        totalAmount: totalAmount.toFixed(2),
        fraudAmount: fraudAmount.toFixed(2),
        averageTransaction: averageTransaction.toFixed(2),
        fraudRate: predictionsArray.length > 0 ? ((fraudCases.length / predictionsArray.length) * 100).toFixed(2) : '0.00',
        topTransactions: fraudCases.slice(0, 20), // Increased to 20
        riskDistribution: riskDistribution
      };
    } catch (error) {
      console.error('Error in generateReportData:', error);
      throw error;
    }
  };

  const downloadReport = (data) => {
    try {
      let content = '';
      let filename = '';
      let mimeType = 'text/plain';

      // Get predictions array
      let predictionsArray = predictions;
      if (predictions && !Array.isArray(predictions)) {
        if (predictions.predictions && Array.isArray(predictions.predictions)) {
          predictionsArray = predictions.predictions;
        } else if (predictions.results && Array.isArray(predictions.results)) {
          predictionsArray = predictions.results;
        }
      }

      if (reportType === 'summary') {
        content = `FRAUD DETECTION SUMMARY REPORT\n`;
        content += `==============================================\n`;
        content += `Generated: ${data.date} at ${data.time}\n`;
        content += `Analysis Period: ${dateRange}\n`;
        content += `==============================================\n\n`;
        
        content += `📊 OVERVIEW STATISTICS\n`;
        content += `=====================\n`;
        content += `Total Transactions:     ${data.totalTransactions}\n`;
        content += `Fraud Detected:         ${data.fraudDetected} (${data.fraudRate}%)\n`;
        content += `High Risk Cases:        ${data.highRiskCases}\n`;
        content += `Medium Risk Cases:      ${data.mediumRiskCases}\n`;
        content += `Low Risk Cases:         ${data.lowRiskCases}\n\n`;
        
        content += `💰 FINANCIAL IMPACT\n`;
        content += `==================\n`;
        content += `Total Transaction Volume: Rs ${data.totalAmount}\n`;
        content += `Fraud Amount:             Rs ${data.fraudAmount}\n`;
        content += `Average Transaction:      Rs ${data.averageTransaction}\n\n`;
        
        content += `📈 RISK DISTRIBUTION\n`;
        content += `==================\n`;
        content += `Low Risk (0-30%):         ${data.riskDistribution.low} (${data.totalTransactions > 0 ? ((data.riskDistribution.low / data.totalTransactions) * 100).toFixed(1) : '0.0'}%)\n`;
        content += `Medium Risk (31-70%):     ${data.riskDistribution.medium} (${data.totalTransactions > 0 ? ((data.riskDistribution.medium / data.totalTransactions) * 100).toFixed(1) : '0.0'}%)\n`;
        content += `High Risk (71-100%):      ${data.riskDistribution.high} (${data.totalTransactions > 0 ? ((data.riskDistribution.high / data.totalTransactions) * 100).toFixed(1) : '0.0'}%)\n\n`;
        
        content += `⚠️  TOP 10 HIGH-RISK TRANSACTIONS\n`;
        content += `==============================\n`;
        if (data.topTransactions && data.topTransactions.length > 0) {
          data.topTransactions.slice(0, 10).forEach((txn, idx) => {
            const probability = ((txn.fraud_probability || 0) * 100).toFixed(1);
            content += `${idx + 1}. Amount: Rs ${txn.amount || 0} | Risk: ${probability}%\n`;
            content += `   Customer: ${txn.customer_id || 'N/A'} | Merchant: ${txn.merchant_id || 'N/A'}\n`;
            content += `   Time: ${txn.time || 'N/A'} | Location: ${txn.location || 'N/A'}\n\n`;
          });
        } else {
          content += `No high-risk transactions detected.\n`;
        }
        
        content += `\nReport Generated by FinFraudX AI System\n`;
        filename = `fraud_summary_${Date.now()}.txt`;
      } else if (reportType === 'detailed') {
        content = `DETAILED FRAUD REPORT\n`;
        content += `============================================================\n`;
        content += `Generated: ${data.date} at ${data.time}\n`;
        content += `Analysis Period: ${dateRange}\n`;
        content += `============================================================\n\n`;
        
        content += `📊 EXECUTIVE SUMMARY\n`;
        content += `==================\n`;
        content += `Total Transactions Analyzed: ${data.totalTransactions}\n`;
        content += `Fraud Cases Detected:        ${data.fraudDetected} (${data.fraudRate}%)\n`;
        content += `High Risk Transactions:      ${data.highRiskCases}\n`;
        content += `Medium Risk Transactions:    ${data.mediumRiskCases}\n`;
        content += `Low Risk Transactions:       ${data.lowRiskCases}\n\n`;
        
        content += `💰 FINANCIAL ANALYSIS\n`;
        content += `===================\n`;
        content += `Total Transaction Volume: Rs ${data.totalAmount}\n`;
        content += `Total Fraud Amount:       Rs ${data.fraudAmount}\n`;
        content += `Average Transaction Size: Rs ${data.averageTransaction}\n`;
        content += `Fraud Loss Ratio:         ${data.totalAmount > 0 ? ((parseFloat(data.fraudAmount) / parseFloat(data.totalAmount)) * 100).toFixed(2) : '0.00'}%\n\n`;
        
        content += `📈 RISK DISTRIBUTION ANALYSIS\n`;
        content += `==========================\n`;
        content += `Risk Level    | Count    | Percentage\n`;
        content += `-------------|----------|-----------\n`;
        content += `Low Risk     | ${data.riskDistribution.low.toString().padStart(8)} | ${data.totalTransactions > 0 ? ((data.riskDistribution.low / data.totalTransactions) * 100).toFixed(1) : '0.0'}%\n`;
        content += `Medium Risk  | ${data.riskDistribution.medium.toString().padStart(8)} | ${data.totalTransactions > 0 ? ((data.riskDistribution.medium / data.totalTransactions) * 100).toFixed(1) : '0.0'}%\n`;
        content += `High Risk    | ${data.riskDistribution.high.toString().padStart(8)} | ${data.totalTransactions > 0 ? ((data.riskDistribution.high / data.totalTransactions) * 100).toFixed(1) : '0.0'}%\n\n`;
        
        content += `⚠️  TOP 20 HIGH-RISK TRANSACTIONS\n`;
        content += `==============================\n`;
        if (data.topTransactions && data.topTransactions.length > 0) {
          data.topTransactions.forEach((txn, idx) => {
            const probability = ((txn.fraud_probability || 0) * 100).toFixed(1);
            const riskLevel = probability > 70 ? 'HIGH' : probability > 30 ? 'MEDIUM' : 'LOW';
            
            content += `${(idx + 1).toString().padStart(2)}. Transaction ID: ${txn.transaction_id || `TXN${idx + 1}`}\n`;
            content += `    Amount:      Rs ${txn.amount || 0}\n`;
            content += `    Risk Score:  ${probability}% (${riskLevel})\n`;
            content += `    Customer ID: ${txn.customer_id || 'N/A'}\n`;
            content += `    Merchant ID: ${txn.merchant_id || 'N/A'}\n`;
            content += `    Category:    ${txn.category || 'N/A'}\n`;
            content += `    Location:    ${txn.location || 'N/A'}\n`;
            content += `    Time:        ${txn.time || 'N/A'}\n`;
            
            // Additional fraud indicators
            if (txn.velocity_flag) content += `    ⚠️  Velocity Alert\n`;
            if (txn.geographic_anomaly) content += `    🌍 Geographic Anomaly\n`;
            if (txn.late_night) content += `    🌙 Late Night Activity\n`;
            if (txn.card_testing) content += `    🧪 Card Testing Pattern\n`;
            
            content += `\n`;
          });
        } else {
          content += `No high-risk transactions detected.\n`;
        }
        
        content += `\n📊 STATISTICAL INSIGHTS\n`;
        content += `====================\n`;
        content += `Fraud Detection Rate:     ${data.fraudRate}%\n`;
        content += `Average Fraud Amount:     Rs ${data.fraudDetected > 0 ? (parseFloat(data.fraudAmount) / data.fraudDetected).toFixed(2) : '0.00'}\n`;
        content += `High Risk Percentage:     ${data.totalTransactions > 0 ? ((data.highRiskCases / data.totalTransactions) * 100).toFixed(2) : '0.00'}%\n\n`;
        
        content += `Report Generated by FinFraudX AI System\n`;
        content += `Powered by Machine Learning Algorithms\n`;
        filename = `fraud_detailed_${Date.now()}.txt`;
      } else if (reportType === 'csv') {
        content = `Transaction ID,Amount,Fraud Probability,Risk Level,Customer ID,Merchant ID,Category,Location,Time,Velocity Flag,Geographic Anomaly,Late Night,Card Testing\n`;
        if (predictionsArray && Array.isArray(predictionsArray) && predictionsArray.length > 0) {
          predictionsArray.forEach((p, idx) => {
            const txnId = p.transaction_id || `TXN${idx + 1}`;
            const amount = p.amount || 0;
            const probability = ((p.fraud_probability || 0) * 100).toFixed(2);
            const riskLevel = probability > 70 ? 'High' : probability > 30 ? 'Medium' : 'Low';
            const customerId = p.customer_id || 'N/A';
            const merchantId = p.merchant_id || 'N/A';
            const category = p.category || 'N/A';
            const location = p.location || 'N/A';
            const time = p.time || 'N/A';
            const velocityFlag = p.velocity_flag ? 'Yes' : 'No';
            const geoAnomaly = p.geographic_anomaly ? 'Yes' : 'No';
            const lateNight = p.late_night ? 'Yes' : 'No';
            const cardTesting = p.card_testing ? 'Yes' : 'No';
            content += `${txnId},${amount},${probability},${riskLevel},${customerId},${merchantId},${category},${location},${time},${velocityFlag},${geoAnomaly},${lateNight},${cardTesting}\n`;
          });
        }
        filename = `fraud_data_${Date.now()}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      }

      if (!content || !filename) {
        throw new Error('Failed to generate report content');
      }

      // Add BOM for UTF-8 encoding (helps with Excel)
      if (reportType === 'csv') {
        content = '\uFEFF' + content;
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.setAttribute('download', filename); // Extra assurance
      
      // Force download by clicking
      document.body.appendChild(link);
      link.click();
      
      // Cleanup with slight delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 200);

      console.log('Report downloaded successfully:', filename);
      console.log('Content length:', content.length, 'bytes');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report: ' + error.message);
      throw error;
    }
  };

  if (!predictions) {
    return (
      <div className="page-container">
        <div className="empty-state-page">
          <div className="empty-icon">📄</div>
          <h2>No Data for Reports</h2>
          <p>Please run fraud detection from the Dashboard first.</p>
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
              <linearGradient id="reportsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#00d2d3', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#1dd1a1', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#reportsGradient)" opacity="0.2" />
            <rect x="20" y="20" width="40" height="50" rx="3" fill="none" stroke="url(#reportsGradient)" strokeWidth="3" />
            <line x1="28" y1="32" x2="52" y2="32" stroke="url(#reportsGradient)" strokeWidth="2" />
            <line x1="28" y1="42" x2="52" y2="42" stroke="url(#reportsGradient)" strokeWidth="2" />
            <line x1="28" y1="52" x2="45" y2="52" stroke="url(#reportsGradient)" strokeWidth="2" />
            <circle cx="52" cy="58" r="8" fill="url(#reportsGradient)" />
            <path d="M 49 58 L 51 60 L 55 56" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h1>📊 Reports & Export</h1>
            <p>Generate comprehensive fraud detection reports</p>
          </div>
        </div>
      </div>

      <div className="reports-config-section">
        {downloadSuccess && (
          <div className="success-banner">
            <div className="success-icon">✅</div>
            <strong>Report downloaded successfully!</strong>
            <p>Check your downloads folder for the file.</p>
          </div>
        )}
        
        <div className="config-card">
          <div className="config-group">
            <label><FiFileText /> Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="csv">CSV Export</option>
            </select>
          </div>

          <div className="config-group">
            <label><FiCalendar /> Date Range</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <button 
            className="btn-generate-report" 
            onClick={generateReport}
            disabled={generating}
          >
            {generating ? (
              <>⏳ Generating...</>
            ) : (
              <><FiDownload /> Generate & Download</>
            )}
          </button>
        </div>
      </div>

      <div className="report-preview-section">
        <h3>📋 Report Preview</h3>
        <div className="preview-cards">
          <div className="preview-card">
            <div className="preview-icon">📈</div>
            <h4>Summary Report</h4>
            <p>Overview of fraud detection metrics, rates, and financial impact</p>
            <ul>
              <li>Total transactions analyzed</li>
              <li>Fraud detection statistics</li>
              <li>Financial impact summary</li>
              <li>Risk level breakdown</li>
            </ul>
          </div>

          <div className="preview-card">
            <div className="preview-icon">📑</div>
            <h4>Detailed Report</h4>
            <p>In-depth analysis of top fraud cases with complete transaction details</p>
            <ul>
              <li>Top fraud transactions</li>
              <li>Customer & merchant info</li>
              <li>Probability scores</li>
              <li>Detailed narratives</li>
            </ul>
          </div>

          <div className="preview-card">
            <div className="preview-icon">💾</div>
            <h4>CSV Export</h4>
            <p>Raw data export for external analysis and integration</p>
            <ul>
              <li>All transaction data</li>
              <li>Comma-separated format</li>
              <li>Excel compatible</li>
              <li>Easy data import</li>
            </ul>
          </div>
        </div>
      </div>

      {(() => {
        // Get predictions array for display
        let predictionsArray = predictions;
        if (predictions && !Array.isArray(predictions)) {
          if (predictions.predictions && Array.isArray(predictions.predictions)) {
            predictionsArray = predictions.predictions;
          } else if (predictions.results && Array.isArray(predictions.results)) {
            predictionsArray = predictions.results;
          }
        }
        
        return predictionsArray && Array.isArray(predictionsArray) && predictionsArray.length > 0 && (
          <div className="report-stats-quick">
            <h3>📊 Quick Stats</h3>
            <div className="quick-stats-grid">
              <div className="quick-stat">
                <strong>{predictionsArray.length}</strong>
                <span>Total Records</span>
              </div>
              <div className="quick-stat">
                <strong>{predictionsArray.filter(p => (p.fraud_probability || 0) > 0.5).length}</strong>
                <span>Fraud Cases</span>
              </div>
              <div className="quick-stat">
                <strong>₹{(predictionsArray.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / 1000).toFixed(1)}K</strong>
                <span>Total Value</span>
              </div>
              <div className="quick-stat">
                <strong>{((predictionsArray.filter(p => (p.fraud_probability || 0) > 0.5).length / predictionsArray.length) * 100).toFixed(1)}%</strong>
                <span>Fraud Rate</span>
              </div>
            </div>
            <div style={{ marginTop: '15px', padding: '10px', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.85em' }}>
              <strong>Debug Info:</strong> {predictionsArray.length} predictions loaded | 
              Sample keys: {predictionsArray[0] ? Object.keys(predictionsArray[0]).join(', ') : 'N/A'}
            </div>
          </div>
        );
      })()}

      {(!predictions || predictions.length === 0) && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#fff3cd', 
          borderRadius: '15px', 
          border: '2px dashed #ffc107',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#856404' }}>⚠️ No Data Available</h3>
          <p style={{ color: '#856404' }}>Please go to the Dashboard and run fraud detection first.</p>
          <p style={{ fontSize: '0.85em', color: '#666' }}>Debug: predictions = {predictions === null ? 'null' : predictions === undefined ? 'undefined' : 'empty array'}</p>
        </div>
      )}
    </div>
  );
};
