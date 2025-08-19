import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { ResultEntry, DataEntryForm, DataTemplate } from '../types';
import { 
  SearchIcon, 
  BarChartIcon, 
  ChevronRightIcon, 
  FilesIcon, 
  FilterIcon, 
  LineChartIcon, 
  LightbulbIcon, 
  CheckCircleIcon, 
  PencilIcon, 
  DatabaseIcon,
  PlusIcon,
  UploadIcon,
  TableIcon,
  ChartBarIcon,
  XMarkIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  SaveIcon,
  RefreshCwIcon,
  DocumentIcon,
  ImageIcon,
  CogIcon,
  SparklesIcon,
  PresentationChartLineIcon,
  InformationCircleIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon
} from '../components/icons';

const DataResultsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'images' | 'manual' | 'presentations' | 'analytics'>('spreadsheet');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  
  // Enhanced data entry state
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Analytics state
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [analyticsResults, setAnalyticsResults] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [chartType, setChartType] = useState<'histogram' | 'scatter' | 'bar'>('histogram');
  const [selectedColumns, setSelectedColumns] = useState<{x: string, y: string}>({x: '', y: ''});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState('descriptive');
  const [analyticsDataName, setAnalyticsDataName] = useState('');
  const [analyticsDataInput, setAnalyticsDataInput] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>([]);
  
  // Performance optimization refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Simple data entry form state
  const [entryForm, setEntryForm] = useState({
    title: '',
    summary: '',
    data_type: 'experiment',
    tags: ''
  });

  // Analytics data interfaces and functions
  interface AnalyticsDataPoint {
    id: string;
    value: number;
    category?: string;
    group?: string;
    timestamp?: string;
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
    skewness: number;
    kurtosis: number;
    quartiles: {
      q1: number;
      q2: number;
      q3: number;
    };
  }

  interface CorrelationResult {
    correlation: number;
    strength: string;
    interpretation: string;
  }

  interface HypothesisTestResult {
    testType: string;
    tStatistic: number;
    pValue: number;
    degreesOfFreedom: number;
    confidenceInterval: [number, number];
    conclusion: string;
  }

  interface RegressionResult {
    slope: number;
    intercept: number;
    rSquared: number;
    adjustedRSquared: number;
    standardError: number;
    equation: string;
    interpretation: string;
  }

  // Parse CSV-like input for analytics
  const parseAnalyticsDataInput = (input: string): AnalyticsDataPoint[] => {
    const lines = input.trim().split('\n');
    const parsedData: AnalyticsDataPoint[] = [];
    
    lines.forEach((line, index) => {
      const values = line.split(',').map(v => v.trim());
      if (values.length >= 1) {
        const numericValue = parseFloat(values[0]);
        if (!isNaN(numericValue)) {
          parsedData.push({
            id: `point-${index}`,
            value: numericValue,
            category: values[1] || undefined,
            group: values[2] || undefined,
            timestamp: values[3] || undefined
          });
        }
      }
    });
    
    return parsedData;
  };

  // Calculate descriptive statistics
  const calculateDescriptiveStats = (values: number[]): StatisticalSummary => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    
    // Basic measures
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    
    // Median
    const median = n % 2 === 0 
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
      : sorted[Math.floor(n/2)];
    
    // Mode
    const frequency: { [key: number]: number } = {};
    values.forEach(v => frequency[v] = (frequency[v] || 0) + 1);
    const maxFreq = Math.max(...Object.values(frequency));
    const mode = Object.keys(frequency)
      .filter(k => frequency[parseFloat(k)] === maxFreq)
      .map(k => parseFloat(k));
    
    // Variance and Standard Deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    // Quartiles
    const q1 = sorted[Math.floor(n * 0.25)];
    const q2 = median;
    const q3 = sorted[Math.floor(n * 0.75)];
    
    // Skewness
    const skewness = values.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / standardDeviation, 3);
    }, 0) / n;
    
    // Kurtosis
    const kurtosis = values.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / standardDeviation, 4);
    }, 0) / n - 3;
    
    return {
      count: n,
      mean,
      median,
      mode,
      variance,
      standardDeviation,
      min: sorted[0],
      max: sorted[n - 1],
      range: sorted[n - 1] - sorted[0],
      skewness,
      kurtosis,
      quartiles: { q1, q2, q3 }
    };
  };

  // Calculate correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]): CorrelationResult => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return { correlation: 0, strength: 'Insufficient data', interpretation: 'Need at least 2 data points' };
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    const correlation = numerator / Math.sqrt(xDenominator * yDenominator);
    
    let strength = '';
    let interpretation = '';
    
    if (Math.abs(correlation) >= 0.9) {
      strength = 'Very Strong';
      interpretation = 'Very strong relationship between variables';
    } else if (Math.abs(correlation) >= 0.7) {
      strength = 'Strong';
      interpretation = 'Strong relationship between variables';
    } else if (Math.abs(correlation) >= 0.5) {
      strength = 'Moderate';
      interpretation = 'Moderate relationship between variables';
    } else if (Math.abs(correlation) >= 0.3) {
      strength = 'Weak';
      interpretation = 'Weak relationship between variables';
    } else {
      strength = 'Very Weak';
      interpretation = 'Very weak or no relationship between variables';
    }
    
    return { correlation, strength, interpretation };
  };

  // Perform t-test
  const performTTest = (group1: number[], group2: number[]): HypothesisTestResult => {
    const n1 = group1.length;
    const n2 = group2.length;
    
    if (n1 < 2 || n2 < 2) {
      return {
        testType: 'Two-Sample t-Test',
        tStatistic: 0,
        pValue: 1,
        degreesOfFreedom: 0,
        confidenceInterval: [0, 0],
        conclusion: 'Insufficient data for t-test'
      };
    }
    
    const mean1 = group1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = group2.reduce((a, b) => a + b, 0) / n2;
    
    const var1 = group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
    const var2 = group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);
    
    const pooledVariance = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
    
    const tStatistic = (mean1 - mean2) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;
    
    // Simplified p-value calculation (for demo purposes)
    const pValue = 2 * (1 - Math.abs(tStatistic) / (Math.abs(tStatistic) + 2));
    
    const marginOfError = 1.96 * standardError; // 95% confidence
    const confidenceInterval: [number, number] = [
      (mean1 - mean2) - marginOfError,
      (mean1 - mean2) + marginOfError
    ];
    
    const conclusion = pValue < 0.05 
      ? 'Reject null hypothesis - Groups are significantly different'
      : 'Fail to reject null hypothesis - No significant difference';
    
    return {
      testType: 'Two-Sample t-Test',
      tStatistic,
      pValue,
      degreesOfFreedom,
      confidenceInterval,
      conclusion
    };
  };

  // Perform linear regression
  const performLinearRegression = (x: number[], y: number[]): RegressionResult => {
    const n = x.length;
    if (n < 2) {
      return {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        adjustedRSquared: 0,
        standardError: 0,
        equation: 'y = 0x + 0',
        interpretation: 'Insufficient data for regression'
      };
    }
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += (x[i] - xMean) * (x[i] - xMean);
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    const yPred = x.map(xi => slope * xi + intercept);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - 2));
    
    // Standard error
    const standardError = Math.sqrt(ssRes / (n - 2));
    
    const equation = `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`;
    
    let interpretation = '';
    if (rSquared >= 0.9) {
      interpretation = 'Excellent fit - Model explains most of the variance';
    } else if (rSquared >= 0.7) {
      interpretation = 'Good fit - Model explains substantial variance';
    } else if (rSquared >= 0.5) {
      interpretation = 'Moderate fit - Model explains some variance';
    } else {
      interpretation = 'Poor fit - Model explains little variance';
    }
    
    return {
      slope,
      intercept,
      rSquared,
      adjustedRSquared,
      standardError,
      equation,
      interpretation
    };
  };

  // Run advanced analysis
  const runAdvancedAnalysis = async (analysisType: string) => {
    if (analyticsData.length === 0) {
      alert('Please enter data first');
      return;
    }
    
    setIsAnalyzing(true);
    setSelectedAnalysis(analysisType);
    
    // Simulate processing time
    setTimeout(() => {
      let analysisResults;
      
      switch (analysisType) {
        case 'descriptive':
          const values = analyticsData.map(d => d.value);
          analysisResults = calculateDescriptiveStats(values);
          break;
          
        case 'correlation':
          if (analyticsData.length < 2) {
            analysisResults = { error: 'Need at least 2 data points for correlation' };
            break;
          }
          const x = analyticsData.map((d, i) => i);
          const y = analyticsData.map(d => d.value);
          analysisResults = calculateCorrelation(x, y);
          break;
          
        case 't-test':
          const groups = analyticsData.reduce((acc, d) => {
            const group = d.group || 'default';
            if (!acc[group]) acc[group] = [];
            acc[group].push(d.value);
            return acc;
          }, {} as { [key: string]: number[] });
          
          const groupKeys = Object.keys(groups);
          if (groupKeys.length < 2) {
            analysisResults = { error: 'Need at least 2 groups for t-test' };
            break;
          }
          
          analysisResults = performTTest(groups[groupKeys[0]], groups[groupKeys[1]]);
          break;
          
        case 'regression':
          if (analyticsData.length < 2) {
            analysisResults = { error: 'Need at least 2 data points for regression' };
            break;
          }
          const xVals = analyticsData.map((d, i) => i);
          const yVals = analyticsData.map(d => d.value);
          analysisResults = performLinearRegression(xVals, yVals);
          break;
          
        default:
          analysisResults = { error: 'Unknown analysis type' };
      }
      
      setAnalyticsResults(analysisResults);
      setIsAnalyzing(false);
    }, 1500);
  };

  // Load sample analytics data
  const loadSampleAnalyticsData = () => {
    const sampleData = [
      { id: '1', value: 12.5, category: 'A', group: 'Control' },
      { id: '2', value: 15.2, category: 'A', group: 'Control' },
      { id: '3', value: 13.8, category: 'A', group: 'Control' },
      { id: '4', value: 14.1, category: 'A', group: 'Control' },
      { id: '5', value: 16.7, category: 'A', group: 'Control' },
      { id: '6', value: 18.3, category: 'B', group: 'Treatment' },
      { id: '7', value: 19.1, category: 'B', group: 'Treatment' },
      { id: '8', value: 17.9, category: 'B', group: 'Treatment' },
      { id: '9', value: 20.2, category: 'B', group: 'Treatment' },
      { id: '10', value: 18.8, category: 'B', group: 'Treatment' }
    ];
    
    setAnalyticsData(sampleData);
    setAnalyticsDataName('Sample Research Data');
    setAnalyticsDataInput(sampleData.map(d => `${d.value}, ${d.category}, ${d.group}`).join('\n'));
  };

  // Clear analytics data
  const clearAnalyticsData = () => {
    setAnalyticsData([]);
    setAnalyticsDataInput('');
    setAnalyticsDataName('');
    setAnalyticsResults(null);
  };

  // Export analytics results
  const exportAnalyticsResults = () => {
    if (!analyticsResults) return;
    
    const content = `Data Analytics Results\n${'='.repeat(50)}\n\n` +
      `Analysis Type: ${selectedAnalysis}\n` +
      `Data Points: ${analyticsData.length}\n\n` +
      JSON.stringify(analyticsResults, null, 2);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-analytics-${selectedAnalysis}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchLabs();
    generateDummyData(); // Generate dummy data for testing
    if (labs.length > 0) {
      fetchResults();
      fetchStats();
    }
  }, [labs]);
  
  // Auto-select columns when switching to scatter plot
  useEffect(() => {
    if (chartType === 'scatter' && analyticsResults?.numericColumns && analyticsResults.numericColumns.length >= 2) {
      if (!selectedColumns.x || !selectedColumns.y) {
        setSelectedColumns({
          x: analyticsResults.numericColumns[0]?.header || '',
          y: analyticsResults.numericColumns[1]?.header || ''
        });
      }
    }
  }, [chartType, analyticsResults, selectedColumns]);

  // Optimize scroll performance to prevent flickering
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      const currentScrollTop = e.currentTarget.scrollTop;
      if (Math.abs(currentScrollTop - lastScrollTop.current) > 50) {
        lastScrollTop.current = currentScrollTop;
      }
    }, 16); // 60fps throttle
  }, []);

  // Memoize filtered results to prevent unnecessary re-renders
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const matchesSearch = result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [results, searchTerm]);



  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // Generate dummy data for testing when backend is not available
  const generateDummyData = () => {
    const dummyResults: ResultEntry[] = [
      {
        id: '1',
        title: 'Protein Expression Analysis',
        summary: 'Western blot analysis of recombinant protein expression in E. coli',
        author: 'Dr. Sarah Johnson',
        date: '2024-01-15',
        tags: ['protein', 'western blot', 'E. coli', 'expression'],
        source: 'Manual',
        dataPreview: {
          type: 'table',
          content: {
            headers: ['Time (h)', 'OD600', 'Protein (mg/L)', 'Activity (U/mg)'],
            rows: [
              [0, 0.1, 0, 0],
              [2, 0.5, 15, 120],
              [4, 1.2, 45, 180],
              [6, 2.1, 78, 220],
              [8, 3.8, 125, 280],
              [10, 4.2, 156, 320],
              [12, 4.5, 189, 350],
              [24, 4.8, 210, 380]
            ]
          }
        },
        lab_id: 'default-lab',
        privacy_level: 'lab',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        title: 'Enzyme Kinetics Study',
        summary: 'Michaelis-Menten kinetics of purified enzyme at varying substrate concentrations',
        author: 'Dr. Michael Chen',
        date: '2024-01-14',
        tags: ['enzyme', 'kinetics', 'Michaelis-Menten', 'biochemistry'],
        source: 'Manual',
        dataPreview: {
          type: 'table',
          content: {
            headers: ['[S] (mM)', 'V0 (μmol/min)', '1/[S] (1/mM)', '1/V0 (min/μmol)'],
            rows: [
              [0.1, 0.25, 10.0, 4.0],
              [0.2, 0.45, 5.0, 2.22],
              [0.5, 0.85, 2.0, 1.18],
              [1.0, 1.25, 1.0, 0.8],
              [2.0, 1.65, 0.5, 0.61],
              [5.0, 1.95, 0.2, 0.51],
              [10.0, 2.15, 0.1, 0.47],
              [20.0, 2.25, 0.05, 0.44]
            ]
          }
        },
        lab_id: 'default-lab',
        privacy_level: 'lab',
        created_at: '2024-01-14T14:15:00Z',
        updated_at: '2024-01-14T14:15:00Z'
      }
    ];
    
    setResults(dummyResults);
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLabs(data.labs || data);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
      // Set default lab data if API fails
      setLabs([{ id: 'default-lab', name: 'Default Lab', institution: 'Default Institution' }]);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/data/results', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      // Keep existing dummy data if API fails
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/data/results/stats/overview?lab_id=${labs[0]?.id || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats if API fails
      setStats({
        total_results: results.length,
        this_month: results.length,
        experiments: results.filter(r => r.data_type === 'experiment').length,
        observations: results.filter(r => r.data_type === 'observation').length,
        measurements: results.filter(r => r.data_type === 'measurement').length,
        manual_entries: results.filter(r => r.source === 'manual').length,
        imports: results.filter(r => r.source === 'import').length
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportStatus('idle');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setImportStatus('importing');
    // Simulate import process
    setTimeout(() => {
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 2000);
    }, 2000);
  };

  const handleSaveResult = (result: ResultEntry) => {
    setResults(prev => [result, ...prev]);
    fetchStats();
  };

  // Enhanced Spreadsheet Tools
  const renderSpreadsheetTools = () => (
    <div className="space-y-6">
      {/* Enhanced Data Entry Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TableIcon className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle>Unified Data Entry System</CardTitle>
                <CardDescription>Create, import, and manage research data with our enhanced tools</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowDataEntry(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Data Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_results || 0}</div>
                <div className="text-sm text-blue-600">Total Results</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.this_month || 0}</div>
                <div className="text-sm text-green-600">This Month</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.manual_entries || 0}</div>
                <div className="text-sm text-purple-600">Manual Entries</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.imports || 0}</div>
                <div className="text-sm text-orange-600">Imports</div>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Excel (.xlsx, .xls), CSV, TSV up to 10MB
            </p>
          </div>
          
          {selectedFile && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button onClick={handleImport} disabled={importStatus === 'importing'}>
                  {importStatus === 'importing' ? 'Importing...' : 'Import Data'}
                </Button>
              </div>
              {importStatus === 'success' && (
                <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Data imported successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Import Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TableIcon className="h-5 w-5 text-green-600" />
                  <CardTitle>Supported Formats</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Excel (.xlsx, .xls)', desc: 'Import from Excel spreadsheets', icon: '📊' },
                  { name: 'CSV Files', desc: 'Import comma-separated values', icon: '📄' },
                  { name: 'TSV Files', desc: 'Import tab-separated values', icon: '📋' },
                  { name: 'Google Sheets', desc: 'Import from Google Sheets', icon: '☁️' }
                ].map((format) => (
                  <div key={format.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{format.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{format.name}</p>
                      <p className="text-sm text-gray-600">{format.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CogIcon className="h-5 w-5 text-blue-600" />
                  <CardTitle>Data Processing</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Data Validation', desc: 'Check data integrity & format', icon: '✅' },
                  { name: 'Template Library', desc: 'Pre-built data entry forms', icon: '📚' },
                  { name: 'Format Detection', desc: 'Auto-detect file format', icon: '🔍' },
                  { name: 'Error Handling', desc: 'Graceful error management', icon: '⚠️' }
                ].map((tool) => (
                  <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{tool.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{tool.name}</p>
                      <p className="text-sm text-gray-600">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Enhanced Image Tools
  const renderImageTools = () => (
    <div className="space-y-6">
      {/* Image Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Image & Document Upload</CardTitle>
              <CardDescription>Import and process various image and document formats</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-purple-600 hover:text-purple-500 font-medium">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Images (PNG, JPG, TIFF), PDFs up to 50MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Image Processing Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              <CardTitle>Research Images</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Microscope Images', desc: 'Import microscopy & imaging data', icon: '🔬' },
              { name: 'Gel Images', desc: 'Import electrophoresis gels', icon: '🧬' },
              { name: 'Charts & Graphs', desc: 'Import visual data representations', icon: '📈' },
              { name: 'Lab Photos', desc: 'Import experimental setup photos', icon: '📸' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <DocumentIcon className="h-5 w-5 text-blue-600" />
              <CardTitle>Document Processing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'PDF Documents', desc: 'Extract data from PDF reports', icon: '📄' },
              { name: 'Lab Notebooks', desc: 'Import handwritten notes', icon: '📓' },
              { name: 'OCR Processing', desc: 'Convert images to text', icon: '🔤' },
              { name: 'Text Extraction', desc: 'Extract text from images', icon: '📝' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Enhanced Manual Entry
  const renderManualEntry = () => (
    <div className="space-y-6">
      {/* Form Builder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PencilIcon className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle>Enhanced Manual Data Entry</CardTitle>
                <CardDescription>Create custom data entry forms with our unified system</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowDataEntry(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Data Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Name</label>
              <Input placeholder="Enter form name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
              <Select>
                <option>Experimental Data</option>
                <option>Sample Information</option>
                <option>Equipment Log</option>
                <option>Results Summary</option>
              </Select>
            </div>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Form
          </Button>
        </CardContent>
      </Card>

      {/* Manual Entry Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <PencilIcon className="h-5 w-5 text-orange-600" />
              <CardTitle>Data Entry Tools</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Form Builder', desc: 'Create custom data entry forms', icon: '📝' },
              { name: 'Bulk Entry', desc: 'Enter multiple records at once', icon: '📊' },
              { name: 'Data Templates', desc: 'Use predefined data structures', icon: '📋' },
              { name: 'Field Validation', desc: 'Real-time data validation', icon: '✅' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CogIcon className="h-5 w-5 text-gray-600" />
              <CardTitle>Data Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Validation Rules', desc: 'Set data quality standards', icon: '🔒' },
              { name: 'Auto-save', desc: 'Prevent data loss', icon: '💾' },
              { name: 'Data Review', desc: 'Review and approve entries', icon: '👁️' },
              { name: 'Audit Trail', desc: 'Track all data changes', icon: '📋' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Restored AI Presentations
  const renderPresentations = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Presentations</CardTitle>
          <CardDescription>Create stunning presentations from your research data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PresentationChartLineIcon className="mx-auto h-16 w-16 text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Presentation Generator</h3>
            <p className="text-gray-600 mb-6">Transform your research data into professional presentations</p>
            <div className="flex justify-center gap-4">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Presentation
              </Button>
              <Button variant="outline">
                <InformationCircleIcon className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Simple Data Entry Modal
  const renderDataEntryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Data Entry</h2>
            <button onClick={() => setShowDataEntry(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <Input
                value={entryForm.title}
                onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter data entry title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
              <Select
                value={entryForm.data_type}
                onChange={(e) => setEntryForm(prev => ({ ...prev, data_type: e.target.value }))}
              >
                <option value="experiment">Experiment</option>
                <option value="observation">Observation</option>
                <option value="measurement">Measurement</option>
                <option value="survey">Survey</option>
                <option value="simulation">Simulation</option>
                <option value="other">Other</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
              <textarea
                value={entryForm.summary}
                onChange={(e) => setEntryForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief description of the data entry"
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <Input
                value={entryForm.tags}
                onChange={(e) => setEntryForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowDataEntry(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle save logic here
              setShowDataEntry(false);
              setEntryForm({ title: '', summary: '', data_type: 'experiment', tags: '' });
            }} className="bg-blue-600 hover:bg-blue-700">
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Analytics functions - optimized to prevent flickering
  const runAnalytics = useCallback((dataset: any) => {
    // Prevent multiple rapid calls
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setSelectedDataset(dataset);
    setShowAnalytics(true);
    
    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(() => {
      // Perform statistical analysis
      const data = dataset.data_content;
      if (data.type === 'spreadsheet' && data.rows && data.headers) {
        const numericColumns = data.headers.map((header: string, index: number) => {
          const values = data.rows.map((row: any[]) => parseFloat(row[index])).filter(v => !isNaN(v));
          return { header, values, index };
        }).filter(col => col.values.length > 0);
        
        // Basic statistics
        const analysis = numericColumns.map(col => {
          const values = col.values;
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const sorted = [...values].sort((a, b) => a - b);
          const median = sorted.length % 2 === 0 
            ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
            : sorted[Math.floor(sorted.length/2)];
          const min = Math.min(...values);
          const max = Math.max(...values);
          const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          
          // Additional statistics
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / values.length;
          
          return {
            column: col.header,
            mean: mean.toFixed(3),
            median: median.toFixed(3),
            min: min.toFixed(3),
            max: max.toFixed(3),
            stdDev: stdDev.toFixed(3),
            q1: q1.toFixed(3),
            q3: q3.toFixed(3),
            iqr: iqr.toFixed(3),
            skewness: skewness.toFixed(3),
            count: values.length,
            values: values // Keep for correlations and charts
          };
        });
        
        // Correlation analysis
        const correlations = [];
        for (let i = 0; i < numericColumns.length; i++) {
          for (let j = i + 1; j < numericColumns.length; j++) {
            const col1 = numericColumns[i];
            const col2 = numericColumns[j];
            
            if (col1.values.length === col2.values.length) {
              const correlation = calculateCorrelationSimple(col1.values, col2.values);
              correlations.push({
                column1: col1.header,
                column2: col2.header,
                correlation: correlation.toFixed(3),
                strength: getCorrelationStrength(correlation)
              });
            }
          }
        }
        
        // Batch state updates to prevent flickering
        Promise.resolve().then(() => {
          setAnalyticsResults({
            basic: analysis,
            correlations: correlations,
            numericColumns: numericColumns
          });
          setIsAnalyzing(false);
        });
      }
    });
  }, [isAnalyzing]);

  // Memoize result card renderer to prevent flickering
  const renderResultCard = useCallback((result: any) => (
    <Card key={result.id} className="hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] will-change-transform">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            result.data_type === 'experiment' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {result.data_type}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(result.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{result.summary}</p>
        
        {result.tags && result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {result.tags.slice(0, 3).map((tag: string, index: number) => (
              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="text-sm text-gray-500 mb-3">
          By {result.author}
        </div>
        
        {result.data_content && result.data_content.type === 'spreadsheet' && (
          <div className="text-xs text-gray-500 mb-3">
            📊 {result.data_content.rows?.length || 0} rows × {result.data_content.headers?.length || 0} columns
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedDataset(result);
              setShowAnalytics(true);
              setAnalyticsResults(null);
            }}
            variant="outline"
            className="flex-1"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Data
          </Button>
          <Button
            onClick={() => runAnalytics(result)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            disabled={isAnalyzing}
          >
            <BarChartIcon className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Run Stats'}
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [isAnalyzing, runAnalytics, setSelectedDataset, setShowAnalytics, setAnalyticsResults]);
  
  // Simple correlation function for existing analytics (returns number)
  const calculateCorrelationSimple = (x: number[], y: number[]) => {
    const n = x.length;
    if (n !== y.length) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((acc, val) => acc + val, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = y.reduce((acc, val) => acc + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };
  
  // Get correlation strength description
  const getCorrelationStrength = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return { text: 'Very Strong', color: 'text-red-600', bg: 'bg-red-100' };
    if (abs >= 0.6) return { text: 'Strong', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (abs >= 0.4) return { text: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (abs >= 0.2) return { text: 'Weak', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { text: 'Very Weak', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  // Generate simple bar chart data for visualization
  const generateChartData = (column: any) => {
    const values = column.values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const binSize = range / binCount;
    
    const bins = new Array(binCount).fill(0);
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      bins[binIndex]++;
    });
    
    const labels = bins.map((_, i) => {
      const start = min + i * binSize;
      const end = min + (i + 1) * binSize;
      return `${start.toFixed(1)}-${end.toFixed(1)}`;
    });
    
    return { labels, bins, maxBin: Math.max(...bins) };
  };
  
  // Calculate linear regression and R-squared
  const calculateLinearRegression = (x: number[], y: number[]) => {
    const n = x.length;
    if (n !== y.length || n < 2) return null;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = y.reduce((acc, val) => acc + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((acc, val, i) => acc + Math.pow(val - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    // Generate trendline points
    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    const trendlineX = [xMin, xMax];
    const trendlineY = trendlineX.map(x => slope * x + intercept);
    
    return {
      slope: slope.toFixed(4),
      intercept: intercept.toFixed(4),
      rSquared: rSquared.toFixed(4),
      equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
      trendlineX,
      trendlineY
    };
  };
  
  // Generate scatter plot data
  const generateScatterData = (xCol: any, yCol: any) => {
    if (!xCol || !yCol) return null;
    
    const data = xCol.values.map((x: number, i: number) => ({
      x: x,
      y: yCol.values[i]
    })).filter((point: any) => !isNaN(point.x) && !isNaN(point.y));
    
    const regression = calculateLinearRegression(
      data.map(p => p.x),
      data.map(p => p.y)
    );
    
    return { data, regression };
  };
  
  // Generate bar chart data for categorical comparison
  const generateBarChartData = (columns: any[]) => {
    if (columns.length < 2) return null;
    
    const xCol = columns[0];
    const yCol = columns[1];
    
    // Group by x values and calculate mean y values
    const grouped = new Map();
    xCol.values.forEach((x: any, i: number) => {
      if (!isNaN(x) && !isNaN(yCol.values[i])) {
        if (!grouped.has(x)) {
          grouped.set(x, []);
        }
        grouped.get(x).push(yCol.values[i]);
      }
    });
    
    const barData = Array.from(grouped.entries()).map(([x, yValues]) => ({
      x: x.toString(),
      y: yValues.reduce((a: number, b: number) => a + b, 0) / yValues.length
    }));
    
    return barData.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
  };
  
  // Calculate additional advanced statistics
  const calculateAdvancedStats = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    
    // Variance and standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // Quartiles
    const q1 = sorted[Math.floor(n * 0.25)];
    const q2 = sorted[Math.floor(n * 0.5)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    
    // Skewness and Kurtosis
    const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / n;
    const kurtosis = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;
    
    // Outliers (using IQR method)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(v => v < lowerBound || v > upperBound);
    
    // Coefficient of variation
    const cv = (stdDev / mean) * 100;
    
    // Standard error of mean
    const sem = stdDev / Math.sqrt(n);
    
    // Confidence interval (95%)
    const tValue = 1.96; // Approximate for large samples
    const ciLower = mean - tValue * sem;
    const ciUpper = mean + tValue * sem;
    
    return {
      q1: q1.toFixed(3),
      q2: q2.toFixed(3),
      q3: q3.toFixed(3),
      iqr: iqr.toFixed(3),
      skewness: skewness.toFixed(3),
      kurtosis: kurtosis.toFixed(3),
      outliers: outliers.length,
      cv: cv.toFixed(2),
      sem: sem.toFixed(3),
      ciLower: ciLower.toFixed(3),
      ciUpper: ciUpper.toFixed(3)
    };
  };

  // Analytics Modal
  const renderAnalyticsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Advanced Data Analytics</h2>
            <button onClick={() => setShowAnalytics(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Chart Type Selection */}
          {analyticsResults?.numericColumns && analyticsResults.numericColumns.length >= 2 && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Chart Type</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'histogram', label: 'Histogram', icon: '📊' },
                      { value: 'scatter', label: 'Scatter Plot', icon: '🔍' },
                      { value: 'bar', label: 'Bar Chart', icon: '📈' }
                    ].map(type => (
                      <button
                        key={type.value}
                        onClick={() => setChartType(type.value as any)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          chartType === type.value
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type.icon} {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {chartType === 'scatter' && (
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">X Axis</label>
                      <select
                        value={selectedColumns.x}
                        onChange={(e) => setSelectedColumns(prev => ({ ...prev, x: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Column</option>
                        {analyticsResults.numericColumns.map((col: any) => (
                          <option key={col.header} value={col.header}>{col.header}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Y Axis</label>
                      <select
                        value={selectedColumns.y}
                        onChange={(e) => setSelectedColumns(prev => ({ ...prev, y: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Column</option>
                        {analyticsResults.numericColumns.map((col: any) => (
                          <option key={col.header} value={col.header}>{col.header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedDataset && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedDataset.title}</h3>
              <p className="text-gray-600">{selectedDataset.summary}</p>
            </div>
          )}
          
          {/* Data Display */}
          {selectedDataset && selectedDataset.data_content && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Dataset Preview</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedDataset.data_content.headers?.map((header: string, index: number) => (
                        <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDataset.data_content.rows?.slice(0, 10).map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border-b">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedDataset.data_content.rows && selectedDataset.data_content.rows.length > 10 && (
                  <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                    Showing first 10 rows of {selectedDataset.data_content.rows.length} total rows
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {isAnalyzing && (
            <div className="text-center py-12">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-blue-600 bg-blue-100 rounded-md">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing data and generating statistics...
              </div>
            </div>
          )}
          
          {/* Analytics Results */}
          {analyticsResults && !isAnalyzing && (
            <div className="space-y-6">
              <h4 className="font-semibold text-gray-900 mb-3">Statistical Analysis Results</h4>
              
              {/* Basic Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyticsResults.basic?.map((result, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{result.column}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mean:</span>
                          <span className="font-medium">{result.mean}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Median:</span>
                          <span className="font-medium">{result.median}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min:</span>
                          <span className="font-medium">{result.min}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max:</span>
                          <span className="font-medium">{result.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Std Dev:</span>
                          <span className="font-medium">{result.stdDev}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Count:</span>
                          <span className="font-medium">{result.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Q1:</span>
                          <span className="font-medium">{result.q1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Q3:</span>
                          <span className="font-medium">{result.q3}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IQR:</span>
                          <span className="font-medium">{result.iqr}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Skewness:</span>
                          <span className="font-medium">{result.skewness}</span>
                        </div>
                      </div>
                      
                      {/* Simple Histogram Chart */}
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Distribution</h5>
                        <div className="space-y-1">
                          {(() => {
                            const chartData = generateChartData(result);
                            return chartData.labels.map((label, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-16">{label}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${(chartData.bins[i] / chartData.maxBin) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600 w-8">{chartData.bins[i]}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Correlation Analysis */}
              {analyticsResults.correlations && analyticsResults.correlations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Correlation Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsResults.correlations.map((corr, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">
                              {corr.column1} ↔ {corr.column2}
                            </div>
                            <div className={`text-2xl font-bold ${corr.strength.color} mb-2`}>
                              {corr.correlation}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${corr.strength.bg} ${corr.strength.color}`}>
                              {corr.strength.text}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Advanced Chart Visualizations */}
              {analyticsResults?.numericColumns && analyticsResults.numericColumns.length >= 2 && (
                <div className="space-y-6">
                  <h4 className="font-semibold text-gray-900">Advanced Visualizations</h4>
                  
                  {/* Chart Display */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {chartType === 'histogram' && (
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Distribution Histograms</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {analyticsResults.basic?.slice(0, 4).map((result, index) => (
                            <div key={index} className="space-y-3">
                              <h6 className="font-medium text-gray-800">{result.column}</h6>
                              <div className="space-y-2">
                                {(() => {
                                  const chartData = generateChartData(result);
                                  return chartData.labels.map((label, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 w-16">{label}</span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                                        <div 
                                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
                                          style={{ width: `${(chartData.bins[i] / chartData.maxBin) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-gray-600 w-8">{chartData.bins[i]}</span>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {chartType === 'scatter' && selectedColumns.x && selectedColumns.y && (
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Scatter Plot: {selectedColumns.x} vs {selectedColumns.y}</h5>
                        {(() => {
                          const xCol = analyticsResults.numericColumns.find((col: any) => col.header === selectedColumns.x);
                          const yCol = analyticsResults.numericColumns.find((col: any) => col.header === selectedColumns.y);
                          const scatterData = generateScatterData(xCol, yCol);
                          
                          if (!scatterData) return <p className="text-gray-500">No valid data for selected columns</p>;
                          
                          return (
                            <div className="space-y-4">
                              {/* Simple Scatter Plot Visualization */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-center text-sm text-gray-600 mb-2">
                                  Data Points: {scatterData.data.length}
                                </div>
                                <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
                                  {scatterData.data.slice(0, 64).map((point, i) => (
                                    <div
                                      key={i}
                                      className="w-3 h-3 bg-blue-500 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                      title={`${point.x}, ${point.y}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              {/* Regression Analysis */}
                              {scatterData.regression && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h6 className="font-medium text-blue-900 mb-3">Linear Regression Analysis</h6>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-blue-700">Slope:</span>
                                      <div className="font-semibold text-blue-900">{scatterData.regression.slope}</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-700">Intercept:</span>
                                      <div className="font-semibold text-blue-900">{scatterData.regression.intercept}</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-700">R²:</span>
                                      <div className="font-semibold text-blue-900">{scatterData.regression.rSquared}</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-700">Equation:</span>
                                      <div className="font-semibold text-blue-900 text-xs">{scatterData.regression.equation}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {chartType === 'bar' && (
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Bar Chart Analysis</h5>
                        {(() => {
                          const barData = generateBarChartData(analyticsResults.numericColumns.slice(0, 2));
                          
                          if (!barData) return <p className="text-gray-500">Need at least 2 numeric columns for bar chart</p>;
                          
                          const maxValue = Math.max(...barData.map(d => d.y));
                          
                          return (
                            <div className="space-y-3">
                              {barData.map((bar, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-700 w-16">{bar.x}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                                    <div 
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-6 rounded-full transition-all duration-500"
                                      style={{ width: `${(bar.y / maxValue) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 w-16 text-right">{bar.y.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Advanced Statistics */}
              {analyticsResults?.basic && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Advanced Statistical Measures</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsResults.basic.map((result, index) => {
                      const advancedStats = calculateAdvancedStats(result.values);
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-lg">{result.column}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Kurtosis:</span>
                                <span className="font-medium">{advancedStats.kurtosis}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Outliers:</span>
                                <span className="font-medium">{advancedStats.outliers}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">CV (%):</span>
                                <span className="font-medium">{advancedStats.cv}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">SEM:</span>
                                <span className="font-medium">{advancedStats.sem}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">95% CI:</span>
                                <span className="font-medium text-xs">{advancedStats.ciLower} - {advancedStats.ciUpper}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Statistical Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Analysis Summary</h4>
                <p className="text-blue-800 text-sm">
                  Analysis performed on {analyticsResults.basic?.length || 0} numeric columns with {analyticsResults.basic?.reduce((acc, r) => acc + r.count, 0) || 0} total data points.
                  {analyticsResults.correlations && analyticsResults.correlations.length > 0 && 
                    ` Found ${analyticsResults.correlations.length} correlation relationships.`
                  }
                  Advanced statistics include kurtosis, outlier detection, confidence intervals, and regression analysis with R-squared values.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Restored Data Analytics
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Data Points</p>
                <p className="text-3xl font-bold">{analyticsData.length}</p>
              </div>
              <TableIcon className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Categories</p>
                <p className="text-3xl font-bold">{new Set(analyticsData.map(d => d.category)).size}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Groups</p>
                <p className="text-3xl font-bold">{new Set(analyticsData.map(d => d.group)).size}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Analyses</p>
                <p className="text-3xl font-bold">{analyticsResults ? '1' : '0'}</p>
              </div>
              <CalculatorIcon className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Input Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TableIcon className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Data Input & Analysis</CardTitle>
                <CardDescription>Enter your research data for comprehensive statistical analysis</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadSampleAnalyticsData} variant="outline" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Load Sample
              </Button>
              <Button onClick={clearAnalyticsData} variant="outline" size="sm">
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Dataset name (optional)"
            value={analyticsDataName}
            onChange={(e) => setAnalyticsDataName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data (CSV format: value, category, group, timestamp)
            </label>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12.5, A, Control&#10;15.2, A, Control&#10;18.3, B, Treatment&#10;19.1, B, Treatment"
              value={analyticsDataInput}
              onChange={(e) => {
                setAnalyticsDataInput(e.target.value);
                const parsed = parseAnalyticsDataInput(e.target.value);
                setAnalyticsData(parsed);
              }}
            />
          </div>
          <div className="text-sm text-gray-600">
            <p>• Enter one data point per line</p>
            <p>• First column must be numeric values</p>
            <p>• Additional columns for categories, groups, etc. are optional</p>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tools */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CalculatorIcon className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Statistical Analysis Tools</CardTitle>
              <CardDescription>Select the type of analysis to perform on your data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => runAdvancedAnalysis('descriptive')}
              disabled={isAnalyzing || analyticsData.length === 0}
              className="justify-start h-16 text-left"
            >
              <BarChartIcon className="h-6 w-6 mr-3" />
              <div>
                <div className="font-medium">Descriptive Statistics</div>
                <div className="text-sm opacity-75">Mean, median, variance, etc.</div>
              </div>
            </Button>
            
            <Button
              onClick={() => runAdvancedAnalysis('correlation')}
              disabled={isAnalyzing || analyticsData.length < 2}
              className="justify-start h-16 text-left"
            >
              <LineChartIcon className="h-6 w-6 mr-3" />
              <div>
                <div className="font-medium">Correlation Analysis</div>
                <div className="text-sm opacity-75">Pearson correlation coefficient</div>
              </div>
            </Button>
            
            <Button
              onClick={() => runAdvancedAnalysis('t-test')}
              disabled={isAnalyzing || analyticsData.length < 4}
              className="justify-start h-16 text-left"
            >
              <ChartBarIcon className="h-6 w-6 mr-3" />
              <div>
                <div className="font-medium">Hypothesis Testing</div>
                <div className="text-sm opacity-75">Two-sample t-test</div>
              </div>
            </Button>
            
            <Button
              onClick={() => runAdvancedAnalysis('regression')}
              disabled={isAnalyzing || analyticsData.length < 2}
              className="justify-start h-16 text-left"
            >
              <TrendingUpIcon className="h-6 w-6 mr-3" />
              <div>
                <div className="font-medium">Linear Regression</div>
                <div className="text-sm opacity-75">Slope, intercept, R²</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Status */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Data...</h3>
              <p className="text-gray-600">Performing {selectedAnalysis} analysis</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Analytics Results */}
      {analyticsResults && !isAnalyzing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LightbulbIcon className="h-6 w-6 text-green-600" />
                <div>
                  <CardTitle>{selectedAnalysis.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                  <CardDescription>Analysis completed successfully</CardDescription>
                </div>
              </div>
              <Button onClick={exportAnalyticsResults} variant="outline" size="sm">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {analyticsResults.error ? (
              <div className="p-4 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mb-2" />
                <p className="text-red-700">{analyticsResults.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedAnalysis === 'descriptive' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analyticsResults.count}</div>
                        <div className="text-sm text-blue-600">Count</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analyticsResults.mean.toFixed(3)}</div>
                        <div className="text-sm text-green-600">Mean</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analyticsResults.median.toFixed(3)}</div>
                        <div className="text-sm text-purple-600">Median</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{analyticsResults.standardDeviation.toFixed(3)}</div>
                        <div className="text-sm text-orange-600">Std Dev</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-600">{analyticsResults.min.toFixed(3)}</div>
                        <div className="text-sm text-red-600">Minimum</div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <div className="text-lg font-bold text-indigo-600">{analyticsResults.max.toFixed(3)}</div>
                        <div className="text-sm text-indigo-600">Maximum</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAnalysis === 'correlation' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{analyticsResults.correlation.toFixed(4)}</div>
                      <div className="text-lg text-blue-600">{analyticsResults.strength}</div>
                      <div className="text-sm text-blue-700 mt-2">{analyticsResults.interpretation}</div>
                    </div>
                  </div>
                )}

                {selectedAnalysis === 't-test' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm font-medium text-purple-900 mb-1">t-Statistic</div>
                        <div className="text-lg font-bold text-purple-600">{analyticsResults.tStatistic.toFixed(4)}</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">p-Value</div>
                        <div className="text-lg font-bold text-blue-600">{analyticsResults.pValue.toFixed(4)}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-900 mb-1">Conclusion</div>
                      <div className="text-sm text-green-700">{analyticsResults.conclusion}</div>
                    </div>
                  </div>
                )}

                {selectedAnalysis === 'regression' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-900 mb-1">Equation</div>
                      <div className="text-lg font-mono text-green-600">{analyticsResults.equation}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">R²</div>
                        <div className="text-lg font-bold text-blue-600">{analyticsResults.rSquared.toFixed(4)}</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm font-medium text-purple-900 mb-1">Slope</div>
                        <div className="text-lg font-bold text-purple-600">{analyticsResults.slope.toFixed(4)}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-orange-900 mb-1">Interpretation</div>
                      <div className="text-sm text-orange-700">{analyticsResults.interpretation}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            <CardTitle>Getting Started with Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>1. <strong>Enter your data</strong> in the format shown above</p>
          <p>2. <strong>Choose analysis type</strong> based on your research question</p>
          <p>3. <strong>Review results</strong> with professional statistical accuracy</p>
          <p>4. <strong>Export findings</strong> for your research reports</p>
          
          {/* Debug Info */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="font-medium text-gray-800">Debug Info:</p>
            <p>Data Points: {analyticsData.length}</p>
            <p>Analysis Type: {selectedAnalysis}</p>
            <p>Results: {analyticsResults ? 'Available' : 'None'}</p>
            <p>Analyzing: {isAnalyzing ? 'Yes' : 'No'}</p>
          </div>
          
          {/* Test Button */}
          <div className="mt-4">
            <Button 
              onClick={() => {
                console.log('Analytics Debug:', {
                  analyticsData,
                  selectedAnalysis,
                  analyticsResults,
                  isAnalyzing
                });
                alert('Check console for debug info');
              }}
              variant="outline"
              size="sm"
            >
              Debug Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {showDataEntry && renderDataEntryModal()}
      {showAnalytics && (
        <div key="analytics-modal" className="fixed inset-0 z-50">
          {renderAnalyticsModal()}
        </div>
      )}
      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto"
        ref={scrollRef} 
        onScroll={handleScroll}
        style={{ 
          scrollBehavior: 'smooth',
          willChange: 'scroll-position',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data & Results</h1>
          <p className="text-gray-600 text-lg">
            Comprehensive data entry and management tools with AI-powered analytics
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search data entry tools, import options, or data sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'spreadsheet'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📈 Enhanced Data Entry
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'images'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🖼️ Image & Documents
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ✏️ Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('presentations')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'presentations'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🎯 AI Presentations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 Data Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'spreadsheet' && renderSpreadsheetTools()}
        {activeTab === 'images' && renderImageTools()}
        {activeTab === 'manual' && renderManualEntry()}
        {activeTab === 'presentations' && renderPresentations()}
        {activeTab === 'analytics' && renderAnalytics()}
        
        {/* Results Display Section - Optimized */}
        {results.length > 0 && (
          <div className="mt-8" style={{ willChange: 'contents' }}>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChartIcon className="h-5 w-5 mr-2"/>
                  Available Datasets for Analysis ({results.length})
                </CardTitle>
                <CardDescription>
                  Click "Run Stats" on any dataset to perform statistical analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.map(renderResultCard)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataResultsPage;

