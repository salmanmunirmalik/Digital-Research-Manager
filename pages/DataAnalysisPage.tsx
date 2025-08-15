import React, { useState, useEffect } from 'react';
import { BarChart3Icon, UploadIcon, DownloadIcon, TrashIcon, EyeIcon, PlusIcon, CalculatorIcon, TrendingUpIcon } from '../components/icons';

interface DataPoint {
  id: string;
  value: number;
  label?: string;
  group?: string;
}

interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  mode: number[];
  variance: number;
  standardDeviation: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

const DataAnalysisPage: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [dataInput, setDataInput] = useState<string>('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('descriptive');
  const [chartType, setChartType] = useState<'bar' | 'histogram' | 'scatter' | 'line'>('bar');
  const [groupBy, setGroupBy] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for demonstration
  useEffect(() => {
    const sampleData: DataPoint[] = [
      { id: '1', value: 23.5, label: 'Sample A', group: 'Control' },
      { id: '2', value: 25.1, label: 'Sample B', group: 'Control' },
      { id: '3', value: 22.8, label: 'Sample C', group: 'Control' },
      { id: '4', value: 24.3, label: 'Sample D', group: 'Control' },
      { id: '5', value: 26.7, label: 'Sample E', group: 'Treatment' },
      { id: '6', value: 28.2, label: 'Sample F', group: 'Treatment' },
      { id: '7', value: 27.9, label: 'Sample G', group: 'Treatment' },
      { id: '8', value: 29.1, label: 'Sample H', group: 'Treatment' },
      { id: '9', value: 26.4, label: 'Sample I', group: 'Treatment' },
      { id: '10', value: 25.8, label: 'Sample J', group: 'Control' }
    ];
    setData(sampleData);
  }, []);

  // Calculate statistical summary
  const calculateStatistics = (): StatisticalSummary => {
    if (data.length === 0) {
      return {
        count: 0, mean: 0, median: 0, mode: [], variance: 0, standardDeviation: 0,
        min: 0, max: 0, range: 0, q1: 0, q3: 0, iqr: 0
      };
    }

    const values = data.map(d => d.value).sort((a, b) => a - b);
    const count = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / count;
    
    // Median
    const median = count % 2 === 0 
      ? (values[count/2 - 1] + values[count/2]) / 2 
      : values[Math.floor(count/2)];
    
    // Mode
    const frequency: { [key: number]: number } = {};
    values.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
    const maxFreq = Math.max(...Object.values(frequency));
    const mode = Object.keys(frequency)
      .filter(key => frequency[Number(key)] === maxFreq)
      .map(key => Number(key));
    
    // Variance and Standard Deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);
    
    // Quartiles
    const q1 = values[Math.floor(count * 0.25)];
    const q3 = values[Math.floor(count * 0.75)];
    
    return {
      count,
      mean: Number(mean.toFixed(4)),
      median: Number(median.toFixed(4)),
      mode,
      variance: Number(variance.toFixed(4)),
      standardDeviation: Number(standardDeviation.toFixed(4)),
      min: values[0],
      max: values[count - 1],
      range: values[count - 1] - values[0],
      q1: Number(q1.toFixed(4)),
      q3: Number(q3.toFixed(4)),
      iqr: Number((q3 - q1).toFixed(4))
    };
  };

  // Generate chart data
  const generateChartData = (): ChartData => {
    if (data.length === 0) return { labels: [], datasets: [] };

    if (chartType === 'histogram') {
      // Create histogram bins
      const stats = calculateStatistics();
      const binCount = Math.ceil(Math.sqrt(data.length));
      const binSize = (stats.max - stats.min) / binCount;
      const bins: { [key: string]: number } = {};
      
      for (let i = 0; i < binCount; i++) {
        const start = stats.min + i * binSize;
        const end = start + binSize;
        const label = `${start.toFixed(1)}-${end.toFixed(1)}`;
        bins[label] = 0;
      }
      
      data.forEach(point => {
        const binIndex = Math.floor((point.value - stats.min) / binSize);
        const start = stats.min + binIndex * binSize;
        const end = start + binSize;
        const label = `${start.toFixed(1)}-${end.toFixed(1)}`;
        bins[label]++;
      });
      
      return {
        labels: Object.keys(bins),
        datasets: [{
          label: 'Frequency',
          data: Object.values(bins),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      };
    } else if (chartType === 'scatter') {
      return {
        labels: data.map((_, index) => `Point ${index + 1}`),
        datasets: [{
          label: 'Data Points',
          data: data.map(d => d.value),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2
        }]
      };
    } else {
      // Bar chart
      const groupedData = groupBy 
        ? data.reduce((acc, point) => {
            const group = point.group || 'Unknown';
            if (!acc[group]) acc[group] = [];
            acc[group].push(point.value);
            return acc;
          }, {} as { [key: string]: number[] })
        : { 'All Data': data.map(d => d.value) };
      
      const labels = Object.keys(groupedData);
      const values = Object.values(groupedData).map(group => 
        group.reduce((sum, val) => sum + val, 0) / group.length
      );
      
      return {
        labels,
        datasets: [{
          label: groupBy ? 'Group Average' : 'Values',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2
        }]
      };
    }
  };

  // Add data point
  const addDataPoint = () => {
    if (!dataInput.trim()) return;
    
    const newPoint: DataPoint = {
      id: Date.now().toString(),
      value: parseFloat(dataInput),
      label: `Sample ${data.length + 1}`,
      group: groupBy ? 'Group A' : undefined
    };
    
    setData(prev => [...prev, newPoint]);
    setDataInput('');
  };

  // Remove data point
  const removeDataPoint = (id: string) => {
    setData(prev => prev.filter(point => point.id !== id));
  };

  // Clear all data
  const clearData = () => {
    setData([]);
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      'ID,Value,Label,Group',
      ...data.map(point => `${point.id},${point.value},${point.label || ''},${point.group || ''}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = calculateStatistics();
  const chartData = generateChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Analysis Tools</h1>
              <p className="text-gray-600">Statistical analysis, visualization, and data processing tools</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Input */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Input</h3>
              <div className="flex space-x-3 mb-4">
                <input
                  type="number"
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  placeholder="Enter numeric value"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={addDataPoint}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <label className="text-sm font-medium text-gray-700">Group by:</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">No grouping</option>
                  <option value="group">Group</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.length} data points</span>
                <div className="flex space-x-2">
                  <button
                    onClick={exportData}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={clearData}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            {data.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Table</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                        {groupBy && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((point) => (
                        <tr key={point.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{point.value}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{point.label}</td>
                          {groupBy && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{point.group}</td>}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => removeDataPoint(point.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Chart Visualization */}
            {data.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Chart Visualization</h3>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="histogram">Histogram</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="line">Line Chart</option>
                  </select>
                </div>
                
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUpIcon className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization would be rendered here</p>
                    <p className="text-sm text-gray-400">Using libraries like Chart.js or D3.js</p>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <strong>Chart Data:</strong> {chartData.labels.length} labels, {chartData.datasets[0]?.data.length || 0} data points
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Analysis Type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Type</h3>
              <div className="space-y-2">
                {[
                  { value: 'descriptive', label: 'Descriptive Statistics', icon: CalculatorIcon },
                  { value: 'inferential', label: 'Inferential Statistics', icon: TrendingUpIcon },
                  { value: 'correlation', label: 'Correlation Analysis', icon: BarChart3Icon }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedAnalysis(type.value)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      selectedAnalysis === type.value
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Statistical Summary */}
            {data.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Count:</span>
                    <span className="text-sm font-medium">{stats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mean:</span>
                    <span className="text-sm font-medium">{stats.mean}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Median:</span>
                    <span className="text-sm font-medium">{stats.median}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mode:</span>
                    <span className="text-sm font-medium">{stats.mode.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Std Dev:</span>
                    <span className="text-sm font-medium">{stats.standardDeviation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Variance:</span>
                    <span className="text-sm font-medium">{stats.variance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Range:</span>
                    <span className="text-sm font-medium">{stats.range}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Q1:</span>
                    <span className="text-sm font-medium">{stats.q1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Q3:</span>
                    <span className="text-sm font-medium">{stats.q3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IQR:</span>
                    <span className="text-sm font-medium">{stats.iqr}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                  Generate Report
                </button>
                <button className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                  Save Analysis
                </button>
                <button className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm">
                  Share Results
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Analysis Tips</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Use descriptive statistics to understand your data distribution</li>
                <li>• Histograms help visualize data patterns and outliers</li>
                <li>• Group data to compare different conditions or treatments</li>
                <li>• Export results for further analysis in other tools</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysisPage;
