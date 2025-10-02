import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DocumentArrowUpIcon, 
  DocumentArrowDownIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CogIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  Bars3Icon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrendingDownIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  ClipboardDocumentIcon,
  ShareIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { LineChartIcon, ChartBarIcon, BarChartIcon, ChartPieIcon, ScatterPlotIcon, TableIcon, CpuChipIcon, BeakerIcon, Squares2X2Icon, TrendingUpIcon } from '../components/icons';

// Data Types
interface DataPoint {
  id: string;
  [key: string]: any;
}

interface StatisticalWidget {
  id: string;
  type: 'data_source' | 'preprocessing' | 'analysis' | 'visualization' | 'export';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  inputs: string[];
  outputs: string[];
  category: string;
}

interface WorkflowNode {
  id: string;
  widgetId: string;
  position: { x: number; y: number };
  inputs: { [key: string]: any };
  outputs: { [key: string]: any };
  status: 'idle' | 'running' | 'completed' | 'error';
}

interface WorkflowConnection {
  id: string;
  fromNode: string;
  fromOutput: string;
  toNode: string;
  toInput: string;
}

const StatisticalAnalysisToolsPage: React.FC = () => {
  // State Management
  const [viewMode, setViewMode] = useState<'widgets' | 'workflow' | 'results'>('widgets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [workflowConnections, setWorkflowConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>({});
  const [dataSets, setDataSets] = useState<DataPoint[]>([]);
  const [activeDataSet, setActiveDataSet] = useState<string | null>(null);
  
  // Enhanced Workflow State
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [connectingNode, setConnectingNode] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<{node: string, output: string} | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [workflowName, setWorkflowName] = useState<string>('Untitled Workflow');
  const [showNodeSettings, setShowNodeSettings] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Widget Categories
  const widgetCategories = [
    { id: 'all', name: 'All Widgets', color: 'gray' },
    { id: 'data_source', name: 'Data Sources', color: 'blue' },
    { id: 'preprocessing', name: 'Preprocessing', color: 'green' },
    { id: 'analysis', name: 'Analysis', color: 'purple' },
    { id: 'visualization', name: 'Visualization', color: 'orange' },
    { id: 'export', name: 'Export', color: 'red' }
  ];

  // Statistical Widgets (Orange3-inspired)
  const statisticalWidgets: StatisticalWidget[] = [
    // Data Sources
    {
      id: 'csv_file',
      type: 'data_source',
      name: 'CSV File',
      description: 'Load data from CSV files',
      icon: DocumentArrowUpIcon,
      color: 'blue',
      inputs: [],
      outputs: ['data'],
      category: 'data_source'
    },
    {
      id: 'excel_file',
      type: 'data_source',
      name: 'Excel File',
      description: 'Load data from Excel files',
      icon: DocumentArrowUpIcon,
      color: 'blue',
      inputs: [],
      outputs: ['data'],
      category: 'data_source'
    },
    {
      id: 'manual_data',
      type: 'data_source',
      name: 'Manual Data Entry',
      description: 'Enter data manually',
      icon: TableIcon,
      color: 'blue',
      inputs: [],
      outputs: ['data'],
      category: 'data_source'
    },

    // Preprocessing
    {
      id: 'data_info',
      type: 'preprocessing',
      name: 'Data Info',
      description: 'Display basic information about the dataset',
      icon: InformationCircleIcon,
      color: 'green',
      inputs: ['data'],
      outputs: ['info'],
      category: 'preprocessing'
    },
    {
      id: 'select_columns',
      type: 'preprocessing',
      name: 'Select Columns',
      description: 'Select specific columns from the dataset',
      icon: FunnelIcon,
      color: 'green',
      inputs: ['data'],
      outputs: ['data'],
      category: 'preprocessing'
    },
    {
      id: 'remove_duplicates',
      type: 'preprocessing',
      name: 'Remove Duplicates',
      description: 'Remove duplicate rows from the dataset',
      icon: TrashIcon,
      color: 'green',
      inputs: ['data'],
      outputs: ['data'],
      category: 'preprocessing'
    },
    {
      id: 'handle_missing',
      type: 'preprocessing',
      name: 'Handle Missing Values',
      description: 'Handle missing values in the dataset',
      icon: CogIcon,
      color: 'green',
      inputs: ['data'],
      outputs: ['data'],
      category: 'preprocessing'
    },

    // Analysis
    {
      id: 'descriptive_stats',
      type: 'analysis',
      name: 'Descriptive Statistics',
      description: 'Calculate descriptive statistics',
      icon: ChartBarIcon,
      color: 'purple',
      inputs: ['data'],
      outputs: ['stats'],
      category: 'analysis'
    },
    {
      id: 'correlation_analysis',
      type: 'analysis',
      name: 'Correlation Analysis',
      description: 'Calculate correlation matrix',
      icon: ScatterPlotIcon,
      color: 'purple',
      inputs: ['data'],
      outputs: ['correlation'],
      category: 'analysis'
    },
    {
      id: 'linear_regression',
      type: 'analysis',
      name: 'Linear Regression',
      description: 'Perform linear regression analysis',
      icon: TrendingUpIcon,
      color: 'purple',
      inputs: ['data'],
      outputs: ['model', 'predictions'],
      category: 'analysis'
    },
    {
      id: 'clustering',
      type: 'analysis',
      name: 'Clustering',
      description: 'Perform clustering analysis',
      icon: CpuChipIcon,
      color: 'purple',
      inputs: ['data'],
      outputs: ['clusters'],
      category: 'analysis'
    },
    {
      id: 'hypothesis_testing',
      type: 'analysis',
      name: 'Hypothesis Testing',
      description: 'Perform statistical hypothesis tests',
      icon: BeakerIcon,
      color: 'purple',
      inputs: ['data'],
      outputs: ['test_results'],
      category: 'analysis'
    },
    {
      id: 'anova',
      type: 'analysis',
      name: 'ANOVA',
      description: 'Analysis of Variance',
      icon: BarChartIcon,
      color: 'purple',
      inputs: ['data'],
      outputs: ['anova_results'],
      category: 'analysis'
    },

    // Visualization
    {
      id: 'scatter_plot',
      type: 'visualization',
      name: 'Scatter Plot',
      description: 'Create scatter plot visualization',
      icon: ScatterPlotIcon,
      color: 'orange',
      inputs: ['data'],
      outputs: ['plot'],
      category: 'visualization'
    },
    {
      id: 'histogram',
      type: 'visualization',
      name: 'Histogram',
      description: 'Create histogram visualization',
      icon: ChartBarIcon,
      color: 'orange',
      inputs: ['data'],
      outputs: ['plot'],
      category: 'visualization'
    },
    {
      id: 'box_plot',
      type: 'visualization',
      name: 'Box Plot',
      description: 'Create box plot visualization',
      icon: BarChartIcon,
      color: 'orange',
      inputs: ['data'],
      outputs: ['plot'],
      category: 'visualization'
    },
    {
      id: 'heatmap',
      type: 'visualization',
      name: 'Heatmap',
      description: 'Create correlation heatmap',
      icon: Squares2X2Icon,
      color: 'orange',
      inputs: ['data'],
      outputs: ['plot'],
      category: 'visualization'
    },
    {
      id: 'line_chart',
      type: 'visualization',
      name: 'Line Chart',
      description: 'Create line chart visualization',
      icon: LineChartIcon,
      color: 'orange',
      inputs: ['data'],
      outputs: ['plot'],
      category: 'visualization'
    },

    // Export
    {
      id: 'export_csv',
      type: 'export',
      name: 'Export to CSV',
      description: 'Export results to CSV file',
      icon: DocumentArrowDownIcon,
      color: 'red',
      inputs: ['data'],
      outputs: [],
      category: 'export'
    },
    {
      id: 'export_excel',
      type: 'export',
      name: 'Export to Excel',
      description: 'Export results to Excel file',
      icon: DocumentArrowDownIcon,
      color: 'red',
      inputs: ['data'],
      outputs: [],
      category: 'export'
    }
  ];

  // Filter widgets based on category and search
  const filteredWidgets = statisticalWidgets.filter(widget => {
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Enhanced Workflow Functions
  const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const addNodeToWorkflow = useCallback((widgetId: string, position: {x: number, y: number}) => {
    const widget = statisticalWidgets.find(w => w.id === widgetId);
    if (!widget) return;

    const newNode: WorkflowNode = {
      id: generateNodeId(),
      widgetId: widgetId,
      position: position,
      inputs: {},
      outputs: {},
      status: 'idle'
    };

    setWorkflowNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
    
    // Save to history
    setWorkflowHistory(prev => [...prev, {
      action: 'add_node',
      node: newNode,
      timestamp: Date.now()
    }]);
  }, []);

  const removeNodeFromWorkflow = useCallback((nodeId: string) => {
    setWorkflowNodes(prev => prev.filter(n => n.id !== nodeId));
    setWorkflowConnections(prev => prev.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
    
    // Save to history
    setWorkflowHistory(prev => [...prev, {
      action: 'remove_node',
      nodeId: nodeId,
      timestamp: Date.now()
    }]);
  }, [selectedNode]);

  const updateNodePosition = useCallback((nodeId: string, position: {x: number, y: number}) => {
    setWorkflowNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, position } : n
    ));
  }, []);

  const createConnection = useCallback((fromNode: string, fromOutput: string, toNode: string, toInput: string) => {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConnection: WorkflowConnection = {
      id: connectionId,
      fromNode,
      fromOutput,
      toNode,
      toInput
    };

    setWorkflowConnections(prev => [...prev, newConnection]);
    
    // Save to history
    setWorkflowHistory(prev => [...prev, {
      action: 'create_connection',
      connection: newConnection,
      timestamp: Date.now()
    }]);
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setWorkflowConnections(prev => prev.filter(c => c.id !== connectionId));
    
    // Save to history
    setWorkflowHistory(prev => [...prev, {
      action: 'remove_connection',
      connectionId: connectionId,
      timestamp: Date.now()
    }]);
  }, []);

  const executeWorkflow = useCallback(async () => {
    if (workflowNodes.length === 0) return;
    
    setIsExecuting(true);
    try {
      const response = await fetch('/api/advanced-stats/execute-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nodes: workflowNodes,
          connections: workflowConnections,
          dataSets: dataSets
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }

      const results = await response.json();
      setExecutionResults(results.results);
      setViewMode('results');
      
      // Update node statuses
      setWorkflowNodes(prev => prev.map(node => ({
        ...node,
        status: results.results[node.id]?.success ? 'completed' : 'error'
      })));
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      // Update node statuses to error
      setWorkflowNodes(prev => prev.map(node => ({ ...node, status: 'error' })));
    } finally {
      setIsExecuting(false);
    }
  }, [workflowNodes, workflowConnections, dataSets]);

  const saveWorkflow = useCallback(async () => {
    try {
      const response = await fetch('/api/advanced-stats/save-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: workflowName,
          nodes: workflowNodes,
          connections: workflowConnections,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      console.log('Workflow saved successfully');
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  }, [workflowName, workflowNodes, workflowConnections]);

  const loadWorkflow = useCallback(async (workflowId: string) => {
    try {
      const response = await fetch(`/api/advanced-stats/load-workflow/${workflowId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load workflow');
      }

      const workflow = await response.json();
      setWorkflowName(workflow.name);
      setWorkflowNodes(workflow.nodes);
      setWorkflowConnections(workflow.connections);
      setViewMode('workflow');
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  }, []);

  // Enhanced Workflow Canvas Component with Orange3-style features
  const WorkflowCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [connectionPreview, setConnectionPreview] = useState<{x: number, y: number} | null>(null);

    const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        setSelectedNode(null);
        setConnectionStart(null);
      }
    };

    const handleCanvasDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const widgetId = e.dataTransfer.getData('widget-id');
      if (!widgetId || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: (e.clientX - rect.left - panOffset.x) / zoomLevel,
        y: (e.clientY - rect.top - panOffset.y) / zoomLevel
      };

      addNodeToWorkflow(widgetId, position);
      setDraggedWidget(null);
    };

    const handleCanvasDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedNode(nodeId);
      setShowNodeSettings(nodeId);
    };

    const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
      setIsDragging(true);
      setSelectedNode(nodeId);
      
      const node = workflowNodes.find(n => n.id === nodeId);
      if (node) {
        setDragOffset({
          x: e.clientX - node.position.x * zoomLevel,
          y: e.clientY - node.position.y * zoomLevel
        });
      }
    };

    const handleNodeDragEnd = () => {
      setIsDragging(false);
    };

    const handleConnectionStart = (nodeId: string, outputName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConnectionStart({node: nodeId, output: outputName});
      setConnectingNode(nodeId);
    };

    const handleConnectionEnd = (nodeId: string, inputName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (connectionStart && connectionStart.node !== nodeId) {
        createConnection(connectionStart.node, connectionStart.output, nodeId, inputName);
      }
      setConnectionStart(null);
      setConnectingNode(null);
    };

    const renderConnections = () => {
      return workflowConnections.map(connection => {
        const fromNode = workflowNodes.find(n => n.id === connection.fromNode);
        const toNode = workflowNodes.find(n => n.id === connection.toNode);
        
        if (!fromNode || !toNode) return null;

        const startX = fromNode.position.x + 120;
        const startY = fromNode.position.y + 20;
        const endX = toNode.position.x;
        const endY = toNode.position.y + 20;

        return (
          <svg key={connection.id} className="absolute inset-0 pointer-events-none" style={{zIndex: 1}}>
            <path
              d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY - 20} ${endX} ${endY}`}
              stroke="#6B7280"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        );
      });
    };

    const renderConnectionPreview = () => {
      if (!connectionStart || !connectionPreview) return null;

      const fromNode = workflowNodes.find(n => n.id === connectionStart.node);
      if (!fromNode) return null;

      const startX = fromNode.position.x + 120;
      const startY = fromNode.position.y + 20;

      return (
        <svg className="absolute inset-0 pointer-events-none" style={{zIndex: 10}}>
          <path
            d={`M ${startX} ${startY} Q ${(startX + connectionPreview.x) / 2} ${startY - 20} ${connectionPreview.x} ${connectionPreview.y}`}
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,5"
          />
        </svg>
      );
    };

    return (
      <div className="flex flex-col h-full">
        {/* Canvas Toolbar */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Zoom:</span>
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={saveWorkflow}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                Save Workflow
              </button>
              <button
                onClick={() => {
                  setWorkflowNodes([]);
                  setWorkflowConnections([]);
                }}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                <TrashIcon className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Workflow name..."
            />
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 relative overflow-hidden"
          onClick={handleCanvasClick}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          onMouseMove={(e) => {
            if (connectionStart && canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              setConnectionPreview({
                x: (e.clientX - rect.left - panOffset.x) / zoomLevel,
                y: (e.clientY - rect.top - panOffset.y) / zoomLevel
              });
            }
          }}
          style={{ 
            minHeight: '600px',
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="1"/>
                </pattern>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Connections */}
          {renderConnections()}
          {renderConnectionPreview()}

          {/* Workflow Nodes */}
          {workflowNodes.map(node => {
            const widget = statisticalWidgets.find(w => w.id === node.widgetId);
            if (!widget) return null;

            const statusColors = {
              idle: 'bg-white border-gray-300',
              running: 'bg-yellow-50 border-yellow-400',
              completed: 'bg-green-50 border-green-400',
              error: 'bg-red-50 border-red-400'
            };

            const statusIcons = {
              idle: <CogIcon className="w-4 h-4" />,
              running: <ArrowPathIcon className="w-4 h-4 animate-spin" />,
              completed: <CheckCircleIcon className="w-4 h-4" />,
              error: <ExclamationTriangleIcon className="w-4 h-4" />
            };

            return (
              <div
                key={node.id}
                className={`absolute p-3 rounded-lg border-2 shadow-sm cursor-move min-w-[140px] ${statusColors[node.status]} ${
                  selectedNode === node.id ? 'ring-2 ring-blue-500' : ''
                } ${isDragging && selectedNode === node.id ? 'opacity-75' : ''}`}
                style={{ 
                  left: node.position.x, 
                  top: node.position.y,
                  zIndex: selectedNode === node.id ? 10 : 5
                }}
                onClick={(e) => handleNodeClick(node.id, e)}
                onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                onMouseUp={handleNodeDragEnd}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <widget.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{widget.name}</span>
                  </div>
                  {statusIcons[node.status]}
                </div>
                
                <div className="text-xs text-gray-600 mb-3">{widget.description}</div>
                
                {/* Input Ports */}
                {widget.inputs.length > 0 && (
                  <div className="space-y-1">
                    {widget.inputs.map((input, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="w-2 h-2 rounded-full bg-blue-500 cursor-pointer hover:bg-blue-600"
                          onMouseDown={(e) => handleConnectionEnd(node.id, input, e)}
                        />
                        <span className="text-gray-600">{input}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Output Ports */}
                {widget.outputs.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {widget.outputs.map((output, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-gray-600">{output}</span>
                        <div
                          className="w-2 h-2 rounded-full bg-green-500 cursor-pointer hover:bg-green-600"
                          onMouseDown={(e) => handleConnectionStart(node.id, output, e)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Node Actions */}
                {selectedNode === node.id && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNodeSettings(node.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Configure"
                    >
                      <CogIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNodeFromWorkflow(node.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {workflowNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Orange3-Style Workflow Canvas</h3>
                <p className="text-gray-600 mb-4">Drag widgets from the sidebar to create your statistical analysis workflow</p>
                <button
                  onClick={() => setViewMode('widgets')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Browse Widgets
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Widget Library Component with Orange3-style features
  const WidgetLibrary: React.FC = () => {
    const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);

    return (
      <div className="flex h-full">
        {/* Widget Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Widget Library</h2>
            <p className="text-sm text-gray-600">Orange3-style statistical widgets</p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-2">
              {widgetCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? `bg-${category.color}-100 text-${category.color}-800 border border-${category.color}-200`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Widgets List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {filteredWidgets.map(widget => (
                <div
                  key={widget.id}
                  className={`bg-white border border-gray-200 rounded-lg p-3 cursor-move transition-all ${
                    draggedWidgetId === widget.id ? 'opacity-50 scale-95' : 'hover:shadow-md hover:border-blue-300'
                  }`}
                  draggable
                  onDragStart={(e) => {
                    setDraggedWidgetId(widget.id);
                    e.dataTransfer.setData('widget-id', widget.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={() => setDraggedWidgetId(null)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-${widget.color}-100 flex-shrink-0`}>
                      <widget.icon className={`w-4 h-4 text-${widget.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{widget.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full bg-${widget.color}-100 text-${widget.color}-800`}>
                        {widget.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{widget.description}</p>
                  
                  {/* Ports Summary */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {widget.inputs.length > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {widget.inputs.length} in
                      </span>
                    )}
                    {widget.outputs.length > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        {widget.outputs.length} out
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredWidgets.length === 0 && (
              <div className="text-center py-8">
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No widgets found</h3>
                <p className="text-xs text-gray-600">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Quick Actions */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('workflow')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Bars3Icon className="w-4 h-4" />
                  Open Workflow Canvas
                </button>
                <button
                  onClick={() => setViewMode('results')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  View Results
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                {filteredWidgets.length} widgets available
              </div>
            </div>
          </div>

          {/* Widget Details */}
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Orange3-Style Statistical Analysis</h3>
                <p className="text-gray-600">
                  Build powerful data analysis workflows using drag-and-drop widgets. 
                  Connect data sources, preprocessing steps, statistical analyses, and visualizations 
                  to create comprehensive analysis pipelines.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TableIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Data Sources</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Load data from CSV, Excel files, or manual entry. Supports various data formats and preprocessing options.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CpuChipIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Statistical Analysis</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Comprehensive statistical tests, regression analysis, clustering, hypothesis testing, and ANOVA.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ChartBarIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Visualizations</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Create scatter plots, histograms, box plots, heatmaps, and line charts with customizable options.
                  </p>
                </div>
              </div>

              {/* Getting Started */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-medium text-blue-900 mb-3">Getting Started</h4>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <span>Drag a data source widget (CSV File, Excel File) to the workflow canvas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <span>Add preprocessing widgets (Data Info, Select Columns) to clean your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <span>Connect analysis widgets (Descriptive Statistics, Linear Regression) to perform analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">4</span>
                    <span>Add visualization widgets to create charts and plots of your results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">5</span>
                    <span>Execute the workflow and view your analysis results</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Results View Component
  const ResultsView: React.FC = () => {
    const [selectedResult, setSelectedResult] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json'>('csv');

    const exportResults = async () => {
      try {
        const response = await fetch('/api/advanced-stats/export-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            results: executionResults,
            format: exportFormat
          })
        });

        if (!response.ok) {
          throw new Error('Failed to export results');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis_results.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Export failed:', error);
      }
    };

    return (
      <div className="flex h-full">
        {/* Results Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Analysis Results</h2>
            <p className="text-sm text-gray-600">Workflow execution outcomes</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {Object.keys(executionResults).length === 0 ? (
              <div className="text-center py-8">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No Results</h3>
                <p className="text-xs text-gray-600">Execute a workflow to see results</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(executionResults).map(([nodeId, result]: [string, any]) => {
                  const node = workflowNodes.find(n => n.id === nodeId);
                  const widget = node ? statisticalWidgets.find(w => w.id === node.widgetId) : null;
                  
                  return (
                    <div
                      key={nodeId}
                      onClick={() => setSelectedResult(nodeId)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedResult === nodeId 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {widget && <widget.icon className="w-4 h-4" />}
                        <span className="text-sm font-medium text-gray-900">
                          {widget?.name || 'Unknown Widget'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          result.success ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs text-gray-600">
                          {result.success ? 'Completed' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export Options */}
          {Object.keys(executionResults).length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Export Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'json')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <button
                  onClick={exportResults}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Export Results
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Content */}
        <div className="flex-1 flex flex-col">
          {selectedResult ? (
            <div className="flex-1 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {(() => {
                        const node = workflowNodes.find(n => n.id === selectedResult);
                        const widget = node ? statisticalWidgets.find(w => w.id === node.widgetId) : null;
                        return widget?.name || 'Unknown Widget';
                      })()}
                    </h3>
                    <p className="text-gray-600">Analysis results and outputs</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="p-2 hover:bg-gray-100 rounded-md"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Result Content */}
              <div className="space-y-6">
                {(() => {
                  const result = executionResults[selectedResult];
                  if (!result) return null;

                  if (!result.success) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                          <h4 className="text-lg font-medium text-red-900">Execution Failed</h4>
                        </div>
                        <p className="text-red-800">{result.error}</p>
                      </div>
                    );
                  }

                  // Render different types of results
                  const node = workflowNodes.find(n => n.id === selectedResult);
                  const widget = node ? statisticalWidgets.find(w => w.id === node.widgetId) : null;

                  if (widget?.category === 'visualization' && result.outputs?.plot) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Visualization</h4>
                        <div className="text-center">
                          {result.outputs.plot.imageData ? (
                            <img 
                              src={`data:image/png;base64,${result.outputs.plot.imageData}`}
                              alt={result.outputs.plot.title}
                              className="max-w-full h-auto mx-auto"
                            />
                          ) : (
                            <div className="py-12 text-gray-500">
                              <ChartBarIcon className="w-16 h-16 mx-auto mb-4" />
                              <p>Visualization not available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (widget?.category === 'analysis') {
                    return (
                      <div className="space-y-4">
                        {result.outputs?.stats && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Descriptive Statistics</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistic</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {Object.entries(result.outputs.stats).map(([key, value]) => (
                                    <tr key={key}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {key}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {typeof value === 'number' ? value.toFixed(4) : String(value)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {result.outputs?.model && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Model Results</h4>
                            <div className="space-y-3">
                              {Object.entries(result.outputs.model).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium text-gray-700">{key}:</span>
                                  <span className="text-gray-900">
                                    {typeof value === 'number' ? value.toFixed(4) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Default result display
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Results</h4>
                      <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(result.outputs, null, 2)}
                      </pre>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Result</h3>
                <p className="text-gray-600">Choose a workflow result from the sidebar to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orange3-Style Statistical Analysis</h1>
              <p className="text-gray-600 mt-1">Visual workflow-based data mining and statistical analysis platform</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('widgets')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    viewMode === 'widgets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                  Widgets
                </button>
                <button
                  onClick={() => setViewMode('workflow')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    viewMode === 'workflow' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Bars3Icon className="w-4 h-4" />
                  Workflow
                </button>
                <button
                  onClick={() => setViewMode('results')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    viewMode === 'results' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ChartBarIcon className="w-4 h-4" />
                  Results
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {viewMode === 'workflow' && (
                  <>
                    <button
                      onClick={executeWorkflow}
                      disabled={workflowNodes.length === 0 || isExecuting}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <PlayIcon className="w-4 h-4" />
                      {isExecuting ? 'Executing...' : 'Execute'}
                    </button>
                    <button
                      onClick={saveWorkflow}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setWorkflowNodes([]);
                        setWorkflowConnections([]);
                        setExecutionResults({});
                        setWorkflowName('Untitled Workflow');
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2 text-sm"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-120px)]">
        {viewMode === 'widgets' && <WidgetLibrary />}
        {viewMode === 'workflow' && <WorkflowCanvas />}
        {viewMode === 'results' && <ResultsView />}
      </div>

      {/* Enhanced Execution Status */}
      {isExecuting && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center gap-3">
            <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Executing Workflow</div>
              <div className="text-xs text-gray-600">Processing {workflowNodes.length} nodes...</div>
            </div>
            <button
              onClick={() => setIsExecuting(false)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Workflow Status Bar */}
      {viewMode === 'workflow' && (
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-700">{workflowNodes.length} nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-700">{workflowConnections.length} connections</span>
            </div>
            {workflowNodes.length > 0 && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  workflowNodes.some(n => n.status === 'error') ? 'bg-red-500' :
                  workflowNodes.some(n => n.status === 'running') ? 'bg-yellow-500' :
                  workflowNodes.every(n => n.status === 'completed') ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-gray-700">
                  {workflowNodes.every(n => n.status === 'completed') ? 'Ready' :
                   workflowNodes.some(n => n.status === 'running') ? 'Running' :
                   workflowNodes.some(n => n.status === 'error') ? 'Errors' : 'Idle'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticalAnalysisToolsPage;
