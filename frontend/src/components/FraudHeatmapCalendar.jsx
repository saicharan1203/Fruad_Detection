import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { scaleLinear } from 'd3-scale';
import { FiCalendar, FiTrendingUp } from 'react-icons/fi';
import '../styles/dashboard.css';

export const FraudHeatmapCalendar = ({ predictions }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [stats, setStats] = useState({ peak: null, total: 0, avgPerDay: 0 });

  useEffect(() => {
    if (predictions && predictions.results) {
      generateHeatmapData(predictions.results);
    }
  }, [predictions]);

  const generateHeatmapData = (results) => {
    const dateCounts = {};
    let minDate = null;
    let maxDate = null;

    results.forEach(txn => {
      if (txn.timestamp) {
        try {
          const date = new Date(txn.timestamp);
          const dateStr = date.toISOString().split('T')[0];
          
          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;

          if (!dateCounts[dateStr]) {
            dateCounts[dateStr] = { date: dateStr, count: 0, fraudCount: 0, totalAmount: 0 };
          }
          
          dateCounts[dateStr].count++;
          dateCounts[dateStr].totalAmount += parseFloat(txn.amount || 0);
          
          if (parseFloat(txn.fraud_probability || 0) > 0.5) {
            dateCounts[dateStr].fraudCount++;
          }
        } catch (e) {
          // Skip invalid timestamps
        }
      }
    });

    // Fill in missing dates
    if (minDate && maxDate) {
      const currentDate = new Date(minDate);
      while (currentDate <= maxDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!dateCounts[dateStr]) {
          dateCounts[dateStr] = { date: dateStr, count: 0, fraudCount: 0, totalAmount: 0 };
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const heatmapArray = Object.values(dateCounts).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate stats
    const totalFrauds = heatmapArray.reduce((sum, d) => sum + d.fraudCount, 0);
    const peakDay = heatmapArray.reduce((max, d) => 
      d.fraudCount > max.fraudCount ? d : max
    , { fraudCount: 0 });
    const avgPerDay = totalFrauds / heatmapArray.length;

    setHeatmapData(heatmapArray);
    setDateRange({ 
      start: minDate || new Date(), 
      end: maxDate || new Date() 
    });
    setStats({
      peak: peakDay.fraudCount > 0 ? peakDay : null,
      total: totalFrauds,
      avgPerDay: avgPerDay.toFixed(1)
    });
  };

  const getColorScale = () => {
    const maxFraud = Math.max(...heatmapData.map(d => d.fraudCount), 1);
    return scaleLinear()
      .domain([0, maxFraud / 4, maxFraud / 2, maxFraud])
      .range(['#e0f7e0', '#ffd93d', '#ffa502', '#ff4757']);
  };

  if (!predictions || heatmapData.length === 0) {
    return null;
  }

  const colorScale = getColorScale();

  return (
    <div className="heatmap-container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <FiCalendar size={28} style={{ color: 'var(--primary)' }} />
        <h2>🔥 Fraud Activity Heatmap - Temporal Analysis</h2>
        <p style={{ fontSize: '0.95em', color: 'var(--gray)', marginTop: 10 }}>
          GitHub-style calendar showing fraud detection patterns over time
        </p>
      </div>

      <div className="heatmap-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ff4757' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <strong>{stats.total}</strong>
            <span>Total Frauds Detected</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffa502' }}>
            <FiCalendar />
          </div>
          <div className="stat-content">
            <strong>{stats.avgPerDay}</strong>
            <span>Avg Frauds Per Day</span>
          </div>
        </div>
        {stats.peak && (
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#6a11cb' }}>
              🔥
            </div>
            <div className="stat-content">
              <strong>{stats.peak.fraudCount}</strong>
              <span>Peak Day ({new Date(stats.peak.date).toLocaleDateString()})</span>
            </div>
          </div>
        )}
      </div>

      <div className="calendar-wrapper" style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
        <CalendarHeatmap
          startDate={dateRange.start}
          endDate={dateRange.end}
          values={heatmapData.map(d => ({
            date: d.date,
            count: d.fraudCount
          }))}
          classForValue={(value) => {
            if (!value || value.count === 0) return 'color-empty';
            const maxFraud = Math.max(...heatmapData.map(d => d.fraudCount));
            if (value.count > maxFraud * 0.75) return 'color-scale-4';
            if (value.count > maxFraud * 0.5) return 'color-scale-3';
            if (value.count > maxFraud * 0.25) return 'color-scale-2';
            return 'color-scale-1';
          }}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) return {};
            const dayData = heatmapData.find(d => d.date === value.date);
            return {
              'data-tip': `${new Date(value.date).toLocaleDateString()}<br/>
                Frauds: ${value.count || 0}<br/>
                Total Txns: ${dayData?.count || 0}<br/>
                Amount: ₹${(dayData?.totalAmount || 0).toFixed(2)}`
            };
          }}
          showWeekdayLabels={true}
          gutterSize={2}
        />
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-squares">
          <div className="legend-square color-empty"></div>
          <div className="legend-square color-scale-1"></div>
          <div className="legend-square color-scale-2"></div>
          <div className="legend-square color-scale-3"></div>
          <div className="legend-square color-scale-4"></div>
        </div>
        <span>More</span>
      </div>

      <div className="heatmap-insights">
        <h3>📊 Temporal Insights</h3>
        <div className="insights-grid">
          {generateInsights(heatmapData).map((insight, idx) => (
            <div key={idx} className="insight-card">
              <div className="insight-icon">{insight.icon}</div>
              <p>{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const generateInsights = (data) => {
  const insights = [];

  // Find days with highest fraud
  const sortedByFraud = [...data].sort((a, b) => b.fraudCount - a.fraudCount).slice(0, 3);
  if (sortedByFraud[0]?.fraudCount > 0) {
    insights.push({
      icon: '🔴',
      text: `Highest fraud activity on ${new Date(sortedByFraud[0].date).toLocaleDateString()} with ${sortedByFraud[0].fraudCount} frauds`
    });
  }

  // Find weekend vs weekday pattern
  const weekendData = data.filter(d => {
    const day = new Date(d.date).getDay();
    return day === 0 || day === 6;
  });
  const weekdayData = data.filter(d => {
    const day = new Date(d.date).getDay();
    return day !== 0 && day !== 6;
  });

  const weekendAvg = weekendData.reduce((sum, d) => sum + d.fraudCount, 0) / (weekendData.length || 1);
  const weekdayAvg = weekdayData.reduce((sum, d) => sum + d.fraudCount, 0) / (weekdayData.length || 1);

  if (weekendAvg > weekdayAvg * 1.3) {
    insights.push({
      icon: '📅',
      text: `Weekend fraud rate ${((weekendAvg / weekdayAvg) * 100 - 100).toFixed(0)}% higher than weekdays`
    });
  } else if (weekdayAvg > weekendAvg * 1.3) {
    insights.push({
      icon: '📅',
      text: `Weekday fraud rate ${((weekdayAvg / weekendAvg) * 100 - 100).toFixed(0)}% higher than weekends`
    });
  }

  // Find consecutive high-fraud days
  let maxStreak = 0;
  let currentStreak = 0;
  const avgFraud = data.reduce((sum, d) => sum + d.fraudCount, 0) / data.length;
  
  data.forEach(d => {
    if (d.fraudCount > avgFraud * 1.5) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  if (maxStreak >= 3) {
    insights.push({
      icon: '⚠️',
      text: `Detected ${maxStreak} consecutive days of elevated fraud activity`
    });
  }

  // Trend analysis
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.fraudCount, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.fraudCount, 0) / (secondHalf.length || 1);

  if (secondAvg > firstAvg * 1.2) {
    insights.push({
      icon: '📈',
      text: `Fraud activity trending upward - recent period ${((secondAvg / firstAvg) * 100 - 100).toFixed(0)}% higher`
    });
  } else if (firstAvg > secondAvg * 1.2) {
    insights.push({
      icon: '📉',
      text: `Fraud activity trending downward - recent period ${((1 - secondAvg / firstAvg) * 100).toFixed(0)}% lower`
    });
  }

  return insights.length > 0 ? insights : [
    { icon: '✅', text: 'Fraud activity shows consistent patterns across the time period' }
  ];
};
