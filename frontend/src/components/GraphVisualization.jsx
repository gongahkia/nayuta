import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/graph-visualization.css';

export default function GraphVisualization({ onClose }) {
  const { t } = useTranslation();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState(null);
  const [pagerank, setPagerank] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [layout, setLayout] = useState('force');
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showPageRank, setShowPageRank] = useState(false);

  useEffect(() => {
    fetchGraphData();
    fetchGraphStats();

    // Update dimensions on resize
    const handleResize = () => {
      if (canvasRef.current) {
        setDimensions({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await fetch('http://localhost:8000/graph');
      const data = await response.json();
      setGraphData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
      setIsLoading(false);
    }
  };

  const fetchGraphStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/graph/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch graph stats:', error);
    }
  };

  const fetchPageRank = async () => {
    try {
      const response = await fetch('http://localhost:8000/graph/pagerank');
      const data = await response.json();

      // Convert array to object for quick lookup
      const pagerankMap = {};
      data.pagerank.forEach(item => {
        pagerankMap[item.url] = item.score;
      });

      setPagerank(pagerankMap);
      setShowPageRank(true);
    } catch (error) {
      console.error('Failed to fetch PageRank:', error);
    }
  };

  const getDomainColor = (domain) => {
    // Generate consistent color from domain string
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const exportAsSVG = () => {
    // Simple SVG export
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', dimensions.width);
    svg.setAttribute('height', dimensions.height);

    // This is a placeholder - full implementation would render the graph
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nayuta-graph.svg';
    a.click();
  };

  if (isLoading) {
    return (
      <div className="graph-modal-overlay">
        <div className="graph-modal-content">
          <div className="loader-container">
            <div className="loader"></div>
            <p>{t('loading_graph', { defaultValue: 'Loading graph...' })}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-modal-overlay" onClick={onClose}>
      <div className="graph-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="graph-modal-header">
          <h2>{t('crawl_graph', { defaultValue: 'Web Crawl Graph' })}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="graph-modal-body">
          <div className="graph-sidebar">
            {/* Graph Statistics */}
            {stats && (
              <div className="stats-panel">
                <h3>{t('graph_stats', { defaultValue: 'Statistics' })}</h3>
                <div className="stat-item">
                  <span className="stat-label">{t('total_nodes', { defaultValue: 'Total Nodes' })}:</span>
                  <span className="stat-value">{stats.total_nodes}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('total_edges', { defaultValue: 'Total Links' })}:</span>
                  <span className="stat-value">{stats.total_edges}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('avg_degree', { defaultValue: 'Avg Degree' })}:</span>
                  <span className="stat-value">{stats.avg_degree}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('density', { defaultValue: 'Density' })}:</span>
                  <span className="stat-value">{stats.density}</span>
                </div>

                <h4>{t('top_hubs', { defaultValue: 'Top Hubs' })}</h4>
                <ul className="hub-list">
                  {stats.top_hubs.slice(0, 5).map((hub, idx) => (
                    <li key={idx} title={hub.url}>
                      <span className="hub-url">{hub.url.substring(0, 30)}...</span>
                      <span className="hub-degree">{hub.out_degree}</span>
                    </li>
                  ))}
                </ul>

                <h4>{t('domains', { defaultValue: 'Domains' })}</h4>
                <ul className="domain-list">
                  {Object.entries(stats.domains || {}).slice(0, 10).map(([domain, count]) => (
                    <li key={domain}>
                      <span
                        className="domain-color"
                        style={{ backgroundColor: getDomainColor(domain) }}
                      ></span>
                      <span className="domain-name">{domain}</span>
                      <span className="domain-count">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Node Details */}
            {selectedNode && (
              <div className="node-details">
                <h3>{t('node_details', { defaultValue: 'Node Details' })}</h3>
                <div className="detail-item">
                  <strong>{t('title', { defaultValue: 'Title' })}:</strong>
                  <p>{selectedNode.title}</p>
                </div>
                <div className="detail-item">
                  <strong>{t('url', { defaultValue: 'URL' })}:</strong>
                  <p className="url-text">{selectedNode.url}</p>
                </div>
                <div className="detail-item">
                  <strong>{t('domain', { defaultValue: 'Domain' })}:</strong>
                  <p>{selectedNode.domain}</p>
                </div>
                <div className="detail-item">
                  <strong>{t('size', { defaultValue: 'Size' })}:</strong>
                  <p>{selectedNode.size} {t('words', { defaultValue: 'words' })}</p>
                </div>
                <button className="visit-button" onClick={() => window.open(selectedNode.url, '_blank')}>
                  {t('visit_page', { defaultValue: 'Visit Page' })}
                </button>
              </div>
            )}
          </div>

          <div className="graph-canvas-container">
            <div className="graph-controls">
              <button onClick={() => setLayout('force')}>
                {t('force_layout', { defaultValue: 'Force' })}
              </button>
              <button onClick={() => setLayout('circular')}>
                {t('circular_layout', { defaultValue: 'Circular' })}
              </button>
              <button onClick={fetchPageRank} disabled={showPageRank}>
                {t('calculate_pagerank', { defaultValue: 'PageRank' })}
              </button>
              <button onClick={exportAsSVG}>
                {t('export_svg', { defaultValue: 'Export SVG' })}
              </button>
            </div>

            <div className="graph-canvas" ref={canvasRef}>
              <SimpleForceGraph
                nodes={graphData.nodes}
                edges={graphData.edges}
                width={dimensions.width}
                height={dimensions.height}
                onNodeClick={handleNodeClick}
                getDomainColor={getDomainColor}
                layout={layout}
                pagerank={pagerank}
                showPageRank={showPageRank}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple force-directed graph using SVG (no external dependencies)
function SimpleForceGraph({ nodes, edges, width, height, onNodeClick, getDomainColor, layout, pagerank, showPageRank }) {
  const [positions, setPositions] = useState({});
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    // Initialize positions
    const newPositions = {};

    if (layout === 'circular') {
      // Circular layout
      const radius = Math.min(width, height) / 2 - 50;
      const centerX = width / 2;
      const centerY = height / 2;

      nodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / nodes.length;
        newPositions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      });
    } else {
      // Random initial positions for force layout
      nodes.forEach(node => {
        newPositions[node.id] = {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0
        };
      });

      // Run simple force simulation
      for (let i = 0; i < 100; i++) {
        // Repulsion between nodes
        nodes.forEach(node1 => {
          nodes.forEach(node2 => {
            if (node1.id !== node2.id) {
              const dx = newPositions[node2.id].x - newPositions[node1.id].x;
              const dy = newPositions[node2.id].y - newPositions[node1.id].y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = 50 / (dist * dist);

              newPositions[node1.id].vx -= (dx / dist) * force;
              newPositions[node1.id].vy -= (dy / dist) * force;
            }
          });
        });

        // Attraction along edges
        edges.forEach(edge => {
          const source = newPositions[edge.source];
          const target = newPositions[edge.target];

          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = dist * 0.01;

            source.vx += (dx / dist) * force;
            source.vy += (dy / dist) * force;
            target.vx -= (dx / dist) * force;
            target.vy -= (dy / dist) * force;
          }
        });

        // Update positions
        nodes.forEach(node => {
          const pos = newPositions[node.id];
          pos.x += pos.vx;
          pos.y += pos.vy;
          pos.vx *= 0.9; // Damping
          pos.vy *= 0.9;

          // Keep in bounds
          pos.x = Math.max(20, Math.min(width - 20, pos.x));
          pos.y = Math.max(20, Math.min(height - 20, pos.y));
        });
      }
    }

    setPositions(newPositions);
  }, [nodes, edges, width, height, layout]);

  const handleMouseDown = (nodeId) => {
    setDragging(nodeId);
  };

  const handleMouseMove = (e) => {
    if (dragging && positions[dragging]) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPositions(prev => ({
        ...prev,
        [dragging]: { ...prev[dragging], x, y }
      }));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  return (
    <svg
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ border: '1px solid #ddd', background: '#fafafa' }}
    >
      {/* Draw edges */}
      {edges.map((edge, i) => {
        const source = positions[edge.source];
        const target = positions[edge.target];

        if (!source || !target) return null;

        return (
          <line
            key={i}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke="#999"
            strokeWidth="1"
            opacity="0.3"
          />
        );
      })}

      {/* Draw nodes */}
      {nodes.map(node => {
        const pos = positions[node.id];
        if (!pos) return null;

        // Scale node size by PageRank if available
        let nodeSize = Math.max(5, Math.min(15, Math.log(node.size + 1) * 2));
        if (showPageRank && pagerank[node.id]) {
          nodeSize = Math.max(8, Math.min(25, pagerank[node.id] * 200));
        }

        return (
          <g
            key={node.id}
            transform={`translate(${pos.x},${pos.y})`}
            onMouseDown={() => handleMouseDown(node.id)}
            onClick={() => onNodeClick(node)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              r={nodeSize}
              fill={getDomainColor(node.domain)}
              stroke="#fff"
              strokeWidth="2"
              opacity={showPageRank ? 0.8 : 0.9}
            />
            {showPageRank && pagerank[node.id] && (
              <text
                y="-2"
                fontSize="9"
                fill="#fff"
                fontWeight="bold"
                textAnchor="middle"
                pointerEvents="none"
              >
                {(pagerank[node.id] * 100).toFixed(1)}
              </text>
            )}
            <text
              x={nodeSize + 5}
              y="4"
              fontSize="10"
              fill="#333"
              pointerEvents="none"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
