import React, { useState, useEffect, useRef } from 'react';

import { FiBell, FiX, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';

export const AlertSystem = ({ predictions }) => {
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimeoutRef = useRef(null);

  // Initialize notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Load existing alerts from localStorage
    const savedAlerts = localStorage.getItem('fraudAlerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('fraudAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Process new predictions and generate alerts
  useEffect(() => {
    if (!predictions?.results) return;
    
    const highRiskTransactions = predictions.results.filter(
      item => item.risk_level === 'Critical' || item.risk_level === 'High'
    );
    
    if (highRiskTransactions.length > 0) {
      const newAlerts = highRiskTransactions.slice(0, 5).map((transaction, index) => ({
        id: Date.now() + index,
        type: transaction.risk_level === 'Critical' ? 'critical' : 'warning',
        title: `${transaction.risk_level} Risk Transaction Detected`,
        message: `Transaction ID: ${transaction.customer_id} - Amount: $${parseFloat(transaction.amount).toFixed(2)}`,
        timestamp: new Date().toLocaleTimeString(),
        read: false
      }));
      
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 15)]); // Keep only last 20 alerts

      setIsShaking(true);
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
      shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), 700);
      
      // Show browser notification if permission granted
      if (notificationPermission === 'granted' && newAlerts.length > 0) {
        const criticalAlert = newAlerts.find(alert => alert.type === 'critical');
        const title = criticalAlert ? 'Critical Fraud Alert!' : 'High Risk Transaction Detected';
        const message = criticalAlert ? criticalAlert.message : newAlerts[0].message;
        
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      }
    }
  }, [predictions, notificationPermission]);

  useEffect(() => () => {
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
  }, []);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

  const markAsRead = (id) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const clearAll = () => {
    setAlerts([]);
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  if (!isVisible) {
    return (
      <div className="alert-hidden-toggle">
        <button onClick={() => setIsVisible(true)}>
          🔔 Show Alerts
        </button>
      </div>
    );
  }

  return (
    <div className="alert-system">
      <button 
        className={`alert-button ${unreadCount > 0 ? 'has-unread' : ''} ${isShaking ? 'shake' : ''}`}
        onClick={() => setShowAlerts(!showAlerts)}
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </button>

      {showAlerts && (
        <div className={`alert-panel ${isShaking ? 'shake' : ''}`}>
          <div className="alert-header">
            <h3><FiBell /> Fraud Alerts</h3>
            <div className="alert-actions">
              {notificationPermission !== 'granted' && (
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={requestNotificationPermission}
                >
                  Enable Notifications
                </button>
              )}
              <button 
                className="btn btn-sm btn-secondary"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={clearAll}
                disabled={alerts.length === 0}
              >
                Clear All
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowAlerts(false);
                  setIsVisible(false);
                }}
              >
                Hide Widget
              </button>
              <button 
                className="close-button"
                onClick={() => setShowAlerts(false)}
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="alert-list">
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <FiCheckCircle size={48} />
                <p>No fraud alerts at this time</p>
                <small>System monitoring transactions for suspicious activity</small>
              </div>
            ) : (
              alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`alert-item ${alert.type} ${alert.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(alert.id)}
                >
                  <div className="alert-icon">
                    {alert.type === 'critical' ? (
                      <FiAlertTriangle className="critical-icon" />
                    ) : (
                      <FiInfo className="warning-icon" />
                    )}
                  </div>
                  <div className="alert-content">
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-time">{alert.timestamp}</div>
                  </div>
                  {!alert.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};