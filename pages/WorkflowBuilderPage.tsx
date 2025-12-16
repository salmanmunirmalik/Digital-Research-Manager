/**
 * Visual Workflow Builder Page
 * Make.com-style visual workflow creation with drag-and-drop nodes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  PlusIcon,
  PlayIcon,
  SaveIcon,
  TrashIcon,
  CogIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  KeyIcon,
  FilterIcon,
  DocumentTextIcon
} from '../components/icons';

interface Node {
  id: string;
  type: 'input' | 'api_call' | 'transform' | 'condition' | 'output';
  position: { x: number; y: number };
  config: any;
  label?: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  fromOutput?: string;
  toInput?: string;
}

interface Workflow {
  id?: string;
  name: string;
  description?: string;
  is_active: boolean;
  config: {
    nodes: Node[];
    connections: Connection[];
  };
}

const WorkflowBuilderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workflow, setWorkflow] = useState<Workflow>({
    name: 'New Workflow',
    description: '',
    is_active: true,
    config: { nodes: [], connections: [] }
  });
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (id) {
      fetchWorkflow();
    } else {
      // Create initial input and output nodes
      const inputNode: Node = {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        config: { label: 'Input' },
        label: 'Input'
      };
      const outputNode: Node = {
        id: 'output-1',
        type: 'output',
        position: { x: 800, y: 200 },
        config: { label: 'Output' },
        label: 'Output'
      };
      setNodes([inputNode, outputNode]);
    }
    fetchApiKeys();
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const wf = response.data.workflow;
      setWorkflow(wf);
      setNodes(wf.config.nodes || []);
      setConnections(wf.config.connections || []);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      setMessage({ type: 'error', text: 'Failed to load workflow' });
    }
  };

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/api-task-assignments/api-keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(response.data.apiKeys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const addNode = (type: Node['type']) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 400 + Math.random() * 200, y: 200 + Math.random() * 200 },
      config: getDefaultConfig(type),
      label: getNodeLabel(type)
    };
    setNodes([...nodes, newNode]);
  };

  const getDefaultConfig = (type: Node['type']): any => {
    switch (type) {
      case 'input':
        return { label: 'Input', fields: [] };
      case 'api_call':
        return { api_key_id: '', provider: '', endpoint: '', method: 'POST', headers: {}, body_template: {} };
      case 'transform':
        return { mapping: {} };
      case 'condition':
        return { condition: { field: '', operator: 'equals', value: '' }, true_path: 'yes', false_path: 'no' };
      case 'output':
        return { label: 'Output' };
      default:
        return {};
    }
  };

  const getNodeLabel = (type: Node['type']): string => {
    const labels: Record<Node['type'], string> = {
      input: 'Input',
      api_call: 'API Call',
      transform: 'Transform',
      condition: 'Condition',
      output: 'Output'
    };
    return labels[type] || type;
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleNodeDrag = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (draggingNode !== nodeId) {
      setDraggingNode(nodeId);
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom;
    
    setNodes(nodes.map(n => 
      n.id === nodeId ? { ...n, position: { x, y } } : n
    ));
  }, [draggingNode, canvasOffset, zoom, nodes]);

  const handleMouseUp = () => {
    setDraggingNode(null);
    setConnectingFrom(null);
  };

  const startConnection = (nodeId: string) => {
    setConnectingFrom(nodeId);
  };

  const completeConnection = (toNodeId: string) => {
    if (connectingFrom && connectingFrom !== toNodeId) {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        from: connectingFrom,
        to: toNodeId
      };
      setConnections([...connections, newConnection]);
    }
    setConnectingFrom(null);
  };

  const deleteConnection = (connId: string) => {
    setConnections(connections.filter(c => c.id !== connId));
  };

  const saveWorkflow = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const workflowData = {
        ...workflow,
        config: { nodes, connections }
      };
      
      const url = id ? `/api/workflows/${id}` : '/api/workflows';
      const method = id ? 'put' : 'post';
      
      await axios[method](url, workflowData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Workflow saved successfully!' });
      if (!id) {
        // Navigate to edit page
        setTimeout(() => {
          window.location.reload(); // Reload to get the ID
        }, 1000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save workflow' });
    } finally {
      setSaving(false);
    }
  };

  const executeWorkflow = async () => {
    try {
      setExecuting(true);
      setExecutionResult(null);
      
      const token = localStorage.getItem('token');
      const workflowId = id || workflow.id;
      
      if (!workflowId) {
        setMessage({ type: 'error', text: 'Please save the workflow first' });
        return;
      }
      
      const response = await axios.post(
        `/api/workflows/${workflowId}/execute`,
        { input_data: {} },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setExecutionResult(response.data);
      setMessage({ type: 'success', text: 'Workflow executed successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to execute workflow' });
    } finally {
      setExecuting(false);
    }
  };

  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'input':
        return <ArrowRightIcon className="w-5 h-5" />;
      case 'api_call':
        return <KeyIcon className="w-5 h-5" />;
      case 'transform':
        return <FilterIcon className="w-5 h-5" />;
      case 'condition':
        return <CogIcon className="w-5 h-5" />;
      case 'output':
        return <DocumentTextIcon className="w-5 h-5" />;
      default:
        return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getNodeColor = (type: Node['type']) => {
    const colors: Record<Node['type'], string> = {
      input: 'bg-blue-500',
      api_call: 'bg-purple-500',
      transform: 'bg-green-500',
      condition: 'bg-yellow-500',
      output: 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/api-management"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to API Management
            </Link>
            <div>
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder="Workflow Name"
              />
              <input
                type="text"
                value={workflow.description || ''}
                onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                className="text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                placeholder="Description (optional)"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={executeWorkflow}
              disabled={executing || nodes.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon className="w-5 h-5" />
              <span>{executing ? 'Executing...' : 'Run'}</span>
            </button>
            <button
              onClick={saveWorkflow}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <SaveIcon className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mx-6 mt-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </span>
              <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Add Node</h3>
          <div className="space-y-2">
            {[
              { type: 'input' as const, label: 'Input', icon: ArrowRightIcon },
              { type: 'api_call' as const, label: 'API Call', icon: KeyIcon },
              { type: 'transform' as const, label: 'Transform', icon: FilterIcon },
              { type: 'condition' as const, label: 'Condition', icon: CogIcon },
              { type: 'output' as const, label: 'Output', icon: DocumentTextIcon }
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-100" ref={canvasRef}>
          <svg className="absolute inset-0 w-full h-full" style={{ transform: `scale(${zoom})` }}>
            {/* Grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Connections */}
            {connections.map((conn) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              
              const x1 = fromNode.position.x + 150;
              const y1 = fromNode.position.y + 40;
              const x2 = toNode.position.x;
              const y2 = toNode.position.y + 40;
              
              return (
                <g key={conn.id}>
                  <path
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    stroke="#6366f1"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="cursor-pointer hover:stroke-blue-600"
                    onClick={() => deleteConnection(conn.id)}
                  />
                </g>
              );
            })}
            
            {/* Arrow marker */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          <div className="absolute inset-0" style={{ transform: `scale(${zoom})` }}>
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`absolute bg-white border-2 rounded-lg shadow-lg cursor-move ${
                  selectedNode?.id === node.id ? 'border-blue-500' : 'border-gray-300'
                } ${connectingFrom === node.id ? 'ring-2 ring-blue-400' : ''}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: '150px'
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    handleNodeDrag(node.id, e);
                  }
                }}
                onClick={() => setSelectedNode(node)}
              >
                <div className={`${getNodeColor(node.type)} text-white px-3 py-2 rounded-t-lg flex items-center justify-between`}>
                  <div className="flex items-center space-x-2">
                    {getNodeIcon(node.type)}
                    <span className="text-sm font-medium">{node.label || node.type}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="text-white hover:text-red-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConnectingFrom(node.id);
                      }}
                      className="w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-600"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (connectingFrom) {
                          completeConnection(node.id);
                        } else {
                          startConnection(node.id);
                        }
                      }}
                      className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Node Configuration Panel */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Configure Node</h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                <input
                  type="text"
                  value={selectedNode.label || ''}
                  onChange={(e) => {
                    const updated = nodes.map(n => 
                      n.id === selectedNode.id ? { ...n, label: e.target.value } : n
                    );
                    setNodes(updated);
                    setSelectedNode({ ...selectedNode, label: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {selectedNode.type === 'api_call' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API</label>
                    <select
                      value={selectedNode.config.api_key_id || ''}
                      onChange={(e) => {
                        const apiKey = apiKeys.find(k => k.id === e.target.value);
                        const updated = nodes.map(n => 
                          n.id === selectedNode.id ? { 
                            ...n, 
                            config: { ...n.config, api_key_id: e.target.value, provider: apiKey?.provider || '' }
                          } : n
                        );
                        setNodes(updated);
                        setSelectedNode({ ...selectedNode, config: updated.find(n => n.id === selectedNode.id)!.config });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select API...</option>
                      {apiKeys.filter(k => k.is_active).map((key) => (
                        <option key={key.id} value={key.id}>{key.provider_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                    <input
                      type="text"
                      value={selectedNode.config.endpoint || ''}
                      onChange={(e) => {
                        const updated = nodes.map(n => 
                          n.id === selectedNode.id ? { 
                            ...n, 
                            config: { ...n.config, endpoint: e.target.value }
                          } : n
                        );
                        setNodes(updated);
                        setSelectedNode({ ...selectedNode, config: updated.find(n => n.id === selectedNode.id)!.config });
                      }}
                      placeholder="https://api.example.com/endpoint"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                    <select
                      value={selectedNode.config.method || 'POST'}
                      onChange={(e) => {
                        const updated = nodes.map(n => 
                          n.id === selectedNode.id ? { 
                            ...n, 
                            config: { ...n.config, method: e.target.value }
                          } : n
                        );
                        setNodes(updated);
                        setSelectedNode({ ...selectedNode, config: updated.find(n => n.id === selectedNode.id)!.config });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNode.type === 'transform' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field Mapping</label>
                  <textarea
                    value={JSON.stringify(selectedNode.config.mapping || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const mapping = JSON.parse(e.target.value);
                        const updated = nodes.map(n => 
                          n.id === selectedNode.id ? { 
                            ...n, 
                            config: { ...n.config, mapping }
                          } : n
                        );
                        setNodes(updated);
                        setSelectedNode({ ...selectedNode, config: updated.find(n => n.id === selectedNode.id)!.config });
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder='{\n  "output_field": "input_field"\n}'
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Execution Result */}
      {executionResult && (
        <div className="bg-white border-t border-gray-200 p-4 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-2">Execution Result</h3>
          <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(executionResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilderPage;

