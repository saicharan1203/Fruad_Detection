import React, { useState, useEffect } from 'react';
import { FiClock, FiUser, FiFilter, FiSearch } from 'react-icons/fi';

export const ActivityLogPage = () => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Generate sample activity log
    const sampleActivities = [
      {
        id: 1,
        type: 'detection',
        action: 'Fraud Alert Triggered',
        details: 'High-risk transaction detected - ₹45,000',
        user: 'System',
        timestamp: new Date(Date.now() - 3600000).toLocaleString(),
        severity: 'critical'
      },
      {
        id: 2,
        type: 'user',
        action: 'Profile Updated',
        details: 'Changed role to Security Analyst',
        user: 'Koka Venkata Sai Charan',
        timestamp: new Date(Date.now() - 7200000).toLocaleString(),
        severity: 'info'
      },
      {
        id: 3,
        type: 'system',
        action: 'Model Training Completed',
        details: 'Random Forest model trained with 95% accuracy',
        user: 'System',
        timestamp: new Date(Date.now() - 10800000).toLocaleString(),
        severity: 'success'
      },
      {
        id: 4,
        type: 'detection',
        action: 'Investigation Started',
        details: 'Transaction ID: TXN-12345 marked for investigation',
        user: 'Koka Venkata Sai Charan',
        timestamp: new Date(Date.now() - 14400000).toLocaleString(),
        severity: 'warning'
      },
      {
        id: 5,
        type: 'security',
        action: 'Login Attempt',
        details: 'Successful login from IP: 192.168.1.1',
        user: 'Koka Venkata Sai Charan',
        timestamp: new Date(Date.now() - 18000000).toLocaleString(),
        severity: 'info'
      },
      {
        id: 6,
        type: 'data',
        action: 'Sample Data Generated',
        details: '1000 rows of transaction data created',
        user: 'System',
        timestamp: new Date(Date.now() - 21600000).toLocaleString(),
        severity: 'success'
      },
      {
        id: 7,
        type: 'detection',
        action: 'Fraud Pattern Detected',
        details: 'Velocity attack pattern identified in 5 transactions',
        user: 'System',
        timestamp: new Date(Date.now() - 25200000).toLocaleString(),
        severity: 'critical'
      },
      {
        id: 8,
        type: 'user',
        action: 'Settings Modified',
        details: 'Notification preferences updated',
        user: 'Koka Venkata Sai Charan',
        timestamp: new Date(Date.now() - 28800000).toLocaleString(),
        severity: 'info'
      }
    ];

    setActivities(sampleActivities);
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.type === filter;
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActivityIcon = (type) => {
    switch(type) {
      case 'detection': return '🚨';
      case 'user': return '👤';
      case 'system': return '⚙️';
      case 'security': return '🔒';
      case 'data': return '📊';
      default: return '📝';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-with-logo">
          <svg className="page-logo" viewBox="0 0 80 80" width="50" height="50">
            <defs>
              <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#a29bfe', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#6c5ce7', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="35" fill="url(#activityGradient)" opacity="0.2" />
            <circle cx="20" cy="25" r="5" fill="url(#activityGradient)" />
            <circle cx="20" cy="40" r="5" fill="url(#activityGradient)" />
            <circle cx="20" cy="55" r="5" fill="url(#activityGradient)" />
            <line x1="28" y1="25" x2="60" y2="25" stroke="url(#activityGradient)" strokeWidth="3" strokeLinecap="round" />
            <line x1="28" y1="40" x2="55" y2="40" stroke="url(#activityGradient)" strokeWidth="3" strokeLinecap="round" />
            <line x1="28" y1="55" x2="50" y2="55" stroke="url(#activityGradient)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div>
            <h1>📋 Activity Log</h1>
            <p>Track all system activities and user actions</p>
          </div>
        </div>
      </div>

      <div className="activity-controls">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FiFilter />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Activities</option>
            <option value="detection">Fraud Detection</option>
            <option value="user">User Actions</option>
            <option value="system">System Events</option>
            <option value="security">Security</option>
            <option value="data">Data Operations</option>
          </select>
        </div>
      </div>

      <div className="activity-stats-row">
        <div className="stat-card-activity">
          <div className="stat-value">{activities.length}</div>
          <div className="stat-label">Total Activities</div>
        </div>
        <div className="stat-card-activity">
          <div className="stat-value">{activities.filter(a => a.severity === 'critical').length}</div>
          <div className="stat-label">Critical Events</div>
        </div>
        <div className="stat-card-activity">
          <div className="stat-value">{activities.filter(a => a.type === 'detection').length}</div>
          <div className="stat-label">Detections</div>
        </div>
        <div className="stat-card-activity">
          <div className="stat-value">{activities.filter(a => a.type === 'user').length}</div>
          <div className="stat-label">User Actions</div>
        </div>
      </div>

      <div className="activity-timeline">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div key={activity.id} className={`activity-item severity-${activity.severity}`}>
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-header">
                  <h3>{activity.action}</h3>
                  <span className={`severity-badge ${activity.severity}`}>
                    {activity.severity}
                  </span>
                </div>
                <p className="activity-details">{activity.details}</p>
                <div className="activity-meta">
                  <span className="meta-item">
                    <FiUser size={14} /> {activity.user}
                  </span>
                  <span className="meta-item">
                    <FiClock size={14} /> {activity.timestamp}
                  </span>
                  <span className="meta-item type-badge">
                    {activity.type}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-activity">
            <div className="empty-icon">🔍</div>
            <h3>No activities found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};
