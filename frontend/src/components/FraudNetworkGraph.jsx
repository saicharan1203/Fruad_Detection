import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiInfo } from 'react-icons/fi';
import '../styles/dashboard.css';

export const FraudNetworkGraph = ({ predictions }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const fgRef = useRef();

  useEffect(() => {
    if (predictions && predictions.results) {
      buildNetworkGraph(predictions.results);
    }
  }, [predictions]);

  const buildNetworkGraph = (results) => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    // Sample up to 100 transactions for performance
    const sampleSize = Math.min(results.length, 100);
    const sampledResults = results
      .sort((a, b) => (b.fraud_probability || 0) - (a.fraud_probability || 0))
      .slice(0, sampleSize);

    // Also include some low-risk for context if mostly low-risk
    const highRiskCount = sampledResults.filter(r => parseFloat(r.fraud_probability || 0) > 0.5).length;
    const needsMoreData = highRiskCount < 5 && results.length > 50;
    
    if (needsMoreData) {
      // Add some medium/low risk for visualization
      const mediumRisk = results
        .filter(r => parseFloat(r.fraud_probability || 0) > 0.3 && parseFloat(r.fraud_probability || 0) <= 0.5)
        .slice(0, 10);
      sampledResults.push(...mediumRisk);
    }

    sampledResults.forEach((txn, idx) => {
      const customerId = `C${txn.customer_id}`;
      const merchantId = `M${txn.merchant_id || 'Unknown'}`;
      const txnId = `T${idx}`;
      const fraudProb = parseFloat(txn.fraud_probability || 0);
      const amount = parseFloat(txn.amount || 0);
      const riskLevel = (txn.risk_level || 'low').toLowerCase();

      // Add customer node
      if (!nodeMap.has(customerId)) {
        nodeMap.set(customerId, {
          id: customerId,
          name: `Customer ${txn.customer_id}`,
          type: 'customer',
          group: 1,
          val: 8,
          color: '#6a11cb',
          transactions: 0,
          totalAmount: 0,
          fraudCount: 0
        });
      }
      const customerNode = nodeMap.get(customerId);
      customerNode.transactions++;
      customerNode.totalAmount += amount;
      if (fraudProb > 0.5) customerNode.fraudCount++;

      // Add merchant node
      if (!nodeMap.has(merchantId)) {
        nodeMap.set(merchantId, {
          id: merchantId,
          name: `Merchant ${txn.merchant_id || 'Unknown'}`,
          type: 'merchant',
          group: 2,
          val: 6,
          color: '#2575fc',
          transactions: 0,
          totalAmount: 0,
          fraudCount: 0,
          category: txn.merchant_category || 'Unknown'
        });
      }
      const merchantNode = nodeMap.get(merchantId);
      merchantNode.transactions++;
      merchantNode.totalAmount += amount;
      if (fraudProb > 0.5) merchantNode.fraudCount++;

      // Add transaction node (show high and medium risk)
      if (fraudProb > 0.3) {
        nodes.push({
          id: txnId,
          name: `Transaction ₹${amount.toFixed(0)}`,
          type: 'transaction',
          group: 3,
          val: Math.min(amount / 1000, 15) + 3,
          color: riskLevel === 'critical' ? '#ff4757' : 
                 riskLevel === 'high' ? '#ffa502' : '#ffd93d',
          fraudProb: fraudProb,
          amount: amount,
          riskLevel: riskLevel,
          timestamp: txn.timestamp,
          category: txn.merchant_category
        });

        // Link customer to transaction
        links.push({
          source: customerId,
          target: txnId,
          value: fraudProb * 5,
          color: fraudProb > 0.8 ? '#ff4757' : 
                 fraudProb > 0.6 ? '#ffa502' : '#ffd93d'
        });

        // Link transaction to merchant
        links.push({
          source: txnId,
          target: merchantId,
          value: fraudProb * 5,
          color: fraudProb > 0.8 ? '#ff4757' : 
                 fraudProb > 0.6 ? '#ffa502' : '#ffd93d'
        });
      } else {
        // Direct link for low-risk transactions
        const existingLink = links.find(l => 
          l.source === customerId && l.target === merchantId
        );
        if (existingLink) {
          existingLink.value += 1;
          existingLink.count++;
        } else {
          links.push({
            source: customerId,
            target: merchantId,
            value: 1,
            count: 1,
            color: 'rgba(108, 117, 125, 0.3)'
          });
        }
      }
    });

    // Add customer and merchant nodes
    nodeMap.forEach(node => {
      // Adjust node size based on fraud activity
      if (node.fraudCount > 0) {
        node.val = node.val + (node.fraudCount * 2);
        if (node.fraudCount > 3) {
          node.color = '#ff4757'; // Red for high fraud
        } else if (node.fraudCount > 1) {
          node.color = '#ffa502'; // Orange for medium fraud
        }
      }
      nodes.push(node);
    });

    setGraphData({ nodes, links });
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3, 1000);
    }
  };

  const resetGraph = () => {
    setGraphKey(prev => prev + 1);
    setSelectedNode(null);
    setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(400);
      }
    }, 100);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!predictions || graphData.nodes.length === 0) {
    return (
      <div className="network-graph-container">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <h2>🕸️ Fraud Network Graph - Detective View</h2>
          <p style={{ fontSize: '0.9em', color: 'var(--gray)', marginTop: 10 }}>
            Interactive network showing relationships between customers, merchants, and fraudulent transactions
          </p>
        </div>
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'rgba(106, 17, 203, 0.05)',
          borderRadius: '10px',
          color: 'var(--gray)'
        }}>
          <p style={{ fontSize: '1.2em', marginBottom: 10 }}>📊 No network data to display</p>
          <p>Run fraud predictions to visualize the transaction network</p>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length < 3) {
    return (
      <div className="network-graph-container">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <h2>🕸️ Fraud Network Graph - Detective View</h2>
          <p style={{ fontSize: '0.9em', color: 'var(--gray)', marginTop: 10 }}>
            Interactive network showing relationships between customers, merchants, and fraudulent transactions
          </p>
        </div>
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'rgba(255, 165, 2, 0.05)',
          borderRadius: '10px',
          color: 'var(--gray)'
        }}>
          <p style={{ fontSize: '1.2em', marginBottom: 10 }}>⚠️ Insufficient network data</p>
          <p>Need more medium/high-risk transactions to create meaningful network visualization</p>
          <p style={{ marginTop: 10, fontSize: '0.9em' }}>Found {graphData.nodes.length} nodes - at least 3 required</p>
        </div>
      </div>
    );
  }

  const graphHeight = isFullscreen ? 700 : 500;

  return (
    <div className={`network-graph-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <h2>🕸️ Fraud Network Graph - Detective View</h2>
          <div className="button-group" style={{ marginLeft: 'auto' }}>
            <button onClick={resetGraph} className="btn btn-secondary btn-sm" title="Reset View">
              <FiRefreshCw />
            </button>
            <button onClick={toggleFullscreen} className="btn btn-secondary btn-sm" title="Toggle Fullscreen">
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.9em', color: 'var(--gray)', marginTop: 10 }}>
          Interactive network showing relationships between customers, merchants, and fraudulent transactions
        </p>
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#6a11cb' }}></div>
          <span>Customer</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#2575fc' }}></div>
          <span>Merchant</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ff4757' }}></div>
          <span>Critical Fraud</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffa502' }}></div>
          <span>High Risk</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffd93d' }}></div>
          <span>Medium Risk</span>
        </div>
      </div>

      <div className="graph-wrapper" style={{ height: graphHeight, position: 'relative', border: '2px solid rgba(106, 17, 203, 0.3)', borderRadius: '10px', overflow: 'hidden' }}>
        <ForceGraph2D
          key={graphKey}
          ref={fgRef}
          graphData={graphData}
          width={isFullscreen ? window.innerWidth - 100 : undefined}
          height={graphHeight}
          nodeLabel={node => node.name}
          nodeColor={node => node.color}
          nodeVal={node => node.val}
          nodeRelSize={8}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Add white border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add selection highlight
            if (selectedNode && selectedNode.id === node.id) {
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 3;
              ctx.stroke();
            }
            
            // Draw icon/symbol
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${node.val * 1.2}px Arial`;
            const symbol = node.type === 'customer' ? '👤' : 
                          node.type === 'merchant' ? '🏪' : '💳';
            ctx.fillText(symbol, node.x, node.y);
            
            // Draw label
            const fontSize = Math.max(10, 12 / globalScale);
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = '#2c3e50';
            const label = node.name.substring(0, 15);
            ctx.fillText(label, node.x, node.y + node.val + fontSize + 2);
          }}
          linkColor={link => link.color}
          linkWidth={link => Math.max(1, link.value)}
          linkDirectionalParticles={link => link.value > 3 ? 3 : 0}
          linkDirectionalParticleWidth={3}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={link => link.color}
          onNodeClick={handleNodeClick}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={100}
          onEngineStop={() => {
            setTimeout(() => {
              if (fgRef.current) {
                fgRef.current.zoomToFit(400, 50);
              }
            }, 500);
          }}
          backgroundColor="#f8f9fa"
        />
      </div>

      {selectedNode && (
        <div className="node-details-panel">
          <div className="panel-header">
            <h3>{selectedNode.name}</h3>
            <button onClick={() => setSelectedNode(null)} className="btn btn-sm">✕</button>
          </div>
          <div className="panel-content">
            <div className="detail-item">
              <strong>Type:</strong> {selectedNode.type}
            </div>
            {selectedNode.type === 'transaction' && (
              <>
                <div className="detail-item">
                  <strong>Amount:</strong> ₹{selectedNode.amount.toFixed(2)}
                </div>
                <div className="detail-item">
                  <strong>Fraud Probability:</strong> {(selectedNode.fraudProb * 100).toFixed(1)}%
                </div>
                <div className="detail-item">
                  <strong>Risk Level:</strong> 
                  <span className={`risk-badge risk-${selectedNode.riskLevel}`}>
                    {selectedNode.riskLevel}
                  </span>
                </div>
                {selectedNode.category && (
                  <div className="detail-item">
                    <strong>Category:</strong> {selectedNode.category}
                  </div>
                )}
              </>
            )}
            {(selectedNode.type === 'customer' || selectedNode.type === 'merchant') && (
              <>
                <div className="detail-item">
                  <strong>Total Transactions:</strong> {selectedNode.transactions}
                </div>
                <div className="detail-item">
                  <strong>Total Amount:</strong> ₹{selectedNode.totalAmount.toFixed(2)}
                </div>
                <div className="detail-item">
                  <strong>Fraud Count:</strong> 
                  <span style={{ color: selectedNode.fraudCount > 0 ? '#ff4757' : '#2ed573', fontWeight: 'bold' }}>
                    {selectedNode.fraudCount}
                  </span>
                </div>
                {selectedNode.category && (
                  <div className="detail-item">
                    <strong>Category:</strong> {selectedNode.category}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="graph-info">
        <FiInfo size={14} />
        <span>Click nodes to explore • Drag to pan • Scroll to zoom • Red links = high fraud risk</span>
      </div>

      <div className="graph-stats">
        <div className="stat-box">
          <strong>{graphData.nodes.filter(n => n.type === 'customer').length}</strong>
          <span>Customers</span>
        </div>
        <div className="stat-box">
          <strong>{graphData.nodes.filter(n => n.type === 'merchant').length}</strong>
          <span>Merchants</span>
        </div>
        <div className="stat-box">
          <strong>{graphData.nodes.filter(n => n.type === 'transaction').length}</strong>
          <span>High-Risk Txns</span>
        </div>
        <div className="stat-box">
          <strong>{graphData.links.length}</strong>
          <span>Connections</span>
        </div>
      </div>
    </div>
  );
};
