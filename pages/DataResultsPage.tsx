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
  TrendingUpIcon,
  CheckIcon
} from '../components/icons';

const DataResultsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'images' | 'manual' | 'presentations' | 'analytics'>('spreadsheet');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  

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

  // Datasheet state
  const [datasheetData, setDatasheetData] = useState<{ [key: string]: string }[][]>([
    [{ 'A1': '' }, { 'B1': '' }, { 'C1': '' }, { 'D1': '' }, { 'E1': '' }],
    [{ 'A2': '' }, { 'B2': '' }, { 'C2': '' }, { 'D2': '' }, { 'E2': '' }],
    [{ 'A3': '' }, { 'B3': '' }, { 'C3': '' }, { 'D3': '' }, { 'E3': '' }],
    [{ 'A4': '' }, { 'B4': '' }, { 'C4': '' }, { 'D4': '' }, { 'E4': '' }],
    [{ 'A5': '' }, { 'B5': '' }, { 'C5': '' }, { 'D5': '' }, { 'E5': '' }]
  ]);
  const [datasheetTitle, setDatasheetTitle] = useState('Untitled Datasheet');
  const [isEditing, setIsEditing] = useState(false);

  // Datasheet functions
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...datasheetData];
    const cellKey = String.fromCharCode(65 + colIndex) + (rowIndex + 1);
    newData[rowIndex][colIndex] = { [cellKey]: value };
    setDatasheetData(newData);
  };

  const addRow = () => {
    const newRow = [];
    for (let i = 0; i < 5; i++) {
      const colKey = String.fromCharCode(65 + i);
      const rowNum = datasheetData.length + 1;
      newRow.push({ [`${colKey}${rowNum}`]: '' });
    }
    setDatasheetData([...datasheetData, newRow]);
  };

  const addColumn = () => {
    const newColKey = String.fromCharCode(65 + datasheetData[0].length);
    const newData = datasheetData.map((row, rowIndex) => {
      const newRow = [...row];
      newRow.push({ [`${newColKey}${rowIndex + 1}`]: '' });
      return newRow;
    });
    setDatasheetData(newData);
  };

  const saveDatasheet = () => {
    // Create a new result entry from the datasheet
    const newResult: ResultEntry = {
      id: Date.now().toString(),
      title: datasheetTitle,
      summary: `Datasheet with ${datasheetData.length} rows and ${datasheetData[0].length} columns`,
      author: 'Current User',
      date: new Date().toISOString().split('T')[0],
      dataPreview: {
        type: 'table',
        content: {
          headers: Array.from({ length: datasheetData[0].length }, (_, i) => String.fromCharCode(65 + i)),
          rows: datasheetData.map(row => row.map(cell => Object.values(cell)[0]))
        }
      },
      source: 'Manual',
      tags: ['datasheet', 'manual-entry'],
      privacy_level: 'personal',
      lab_id: 'demo-lab-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to results
    setResults(prev => [newResult, ...prev]);
    
    // Update stats
    if (stats) {
      setStats(prev => ({
        ...prev,
        total_results: (prev.total_results || 0) + 1,
        manual_entries: (prev.manual_entries || 0) + 1
      }));
    }

    setIsEditing(false);
    // Reset datasheet
    setDatasheetData([
      [{ 'A1': '' }, { 'B1': '' }, { 'C1': '' }, { 'D1': '' }, { 'E1': '' }],
      [{ 'A2': '' }, { 'B2': '' }, { 'C2': '' }, { 'D2': '' }, { 'E2': '' }],
      [{ 'A3': '' }, { 'B3': '' }, { 'C3': '' }, { 'D3': '' }, { 'E3': '' }],
      [{ 'A4': '' }, { 'B4': '' }, { 'C4': '' }, { 'D4': '' }, { 'E4': '' }],
      [{ 'A5': '' }, { 'B5': '' }, { 'C5': '' }, { 'D5': '' }, { 'E5': '' }]
    ]);
    setDatasheetTitle('Untitled Datasheet');
  };

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
    // Generate dummy data immediately for testing
    generateDummyData();
    
    // Fetch labs and other data
    fetchLabs();
    
    // Fetch results and stats after a short delay to ensure labs are loaded
    const timer = setTimeout(() => {
      fetchResults();
      fetchStats();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Remove labs dependency to prevent race condition
  
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

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/data/results/stats/overview', {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Error fetching stats:', response.statusText);
        // Set default stats if API fails (based on current results state)
        setStats({
          total_results: results.length,
          this_month: results.length,
          experiments: results.filter(r => r.data_type === 'experiment').length,
          observations: results.filter(r => r.data_type === 'observation').length,
          measurements: results.filter(r => r.data_type === 'measurement').length,
          manual_entries: results.filter(r => r.source === 'Manual').length,
          imports: results.filter(r => r.source === 'Import').length
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats if API fails (based on current results state)
      setStats({
        total_results: results.length,
        this_month: results.length,
        experiments: results.filter(r => r.data_type === 'experiment').length,
        observations: results.filter(r => r.data_type === 'observation').length,
        measurements: results.filter(r => r.data_type === 'measurement').length,
        manual_entries: results.filter(r => r.source === 'Manual').length,
        imports: results.filter(r => r.source === 'Import').length
      });
    }
  };

  // Fetch results from backend
  const fetchResults = async () => {
    try {
      const response = await fetch('/api/data/results', {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setResults(data.results);
        }
        // Keep existing dummy data if API returns empty results
      } else {
        console.error('Error fetching results:', response.statusText);
        // Keep existing dummy data if API fails (already set by generateDummyData)
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      // Keep existing dummy data if API fails (already set by generateDummyData)
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
    
    // Simulate import process and create a result entry
    setTimeout(() => {
      // Create a new result entry from the imported file
      const newResult: ResultEntry = {
        id: Date.now().toString(),
        title: selectedFile.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        summary: `Imported data from ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
        author: 'Current User',
        date: new Date().toISOString().split('T')[0],
        dataPreview: {
          type: 'table',
          content: {
            headers: ['Column A', 'Column B', 'Column C', 'Column D', 'Column E'],
            rows: [
              ['Sample data 1', 'Sample data 2', 'Sample data 3', 'Sample data 4', 'Sample data 5'],
              ['Sample data 6', 'Sample data 7', 'Sample data 8', 'Sample data 9', 'Sample data 10'],
              ['Sample data 11', 'Sample data 12', 'Sample data 13', 'Sample data 14', 'Sample data 15']
            ]
          }
        },
        source: 'Import',
        tags: ['imported', selectedFile.name.split('.').pop() || 'data'],
        privacy_level: 'personal',
        lab_id: 'demo-lab-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to results
      setResults(prev => [newResult, ...prev]);
      
      // Update stats
      if (stats) {
        setStats(prev => ({
          ...prev,
          total_results: (prev.total_results || 0) + 1,
          imports: (prev.imports || 0) + 1
        }));
      }

      setImportStatus('success');
      setSelectedFile(null); // Clear the selected file
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
                <CardTitle>Import Data</CardTitle>
                <CardDescription>Import and manage your research data files</CardDescription>
            </div>
            </div>

          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Research Data Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_results || 0}</div>
                <div className="text-sm text-blue-600">Research Projects</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.this_month || 0}</div>
                <div className="text-sm text-green-600">Active Studies</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.manual_entries || 0}</div>
                <div className="text-sm text-purple-600">Data Entries</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.imports || 0}</div>
                <div className="text-sm text-orange-600">Data Imports</div>
              </div>
            </div>
          )}

          {/* Research Data Import Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">Import Research Data</span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt,.dat"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Excel, CSV, TSV, Text files, Instrument data up to 50MB
            </p>
            <div className="mt-3 text-xs text-gray-400">
              Supports: Experimental data, instrument outputs, survey results, time series data
            </div>
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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">



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
              <CardTitle>Research Image & Document Management</CardTitle>
              <CardDescription>Advanced tools for managing research images, documents, and data extraction</CardDescription>
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
              { name: 'Microscopy & Imaging', desc: 'Advanced microscopy, SEM, TEM, fluorescence', icon: '🔬' },
              { name: 'Electrophoresis Gels', desc: 'DNA/RNA gels, protein gels, Western blots', icon: '🧬' },
              { name: 'Spectroscopy Data', desc: 'NMR, IR, UV-Vis, mass spectrometry', icon: '📊' },
              { name: 'Chromatography', desc: 'HPLC, GC, TLC chromatograms', icon: '📈' },
              { name: 'Flow Cytometry', desc: 'Cell analysis and sorting data', icon: '🔬' },
              { name: 'Imaging Analysis', desc: 'Quantitative image analysis tools', icon: '📸' }
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
              { name: 'Research Papers', desc: 'Extract data from scientific publications', icon: '📄' },
              { name: 'Lab Notebooks', desc: 'Digital lab notebook integration', icon: '📓' },
              { name: 'Data Sheets', desc: 'Import instrument data sheets', icon: '📋' },
              { name: 'Protocol Documents', desc: 'Research protocol and SOP management', icon: '📝' },
              { name: 'OCR Processing', desc: 'Convert handwritten notes to text', icon: '🔤' },
              { name: 'Data Extraction', desc: 'Extract numerical data from images', icon: '📊' }
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

  // Datasheet Interface
  const renderManualEntry = () => {
    
    return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
                <TableIcon className="h-6 w-6 text-orange-600" />
            <div>
                  <CardTitle>Datasheets</CardTitle>
                  <CardDescription>Create and edit data tables like Microsoft Excel</CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={addRow} variant="outline" className="w-full sm:w-auto">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Row
                    </Button>
                    <Button onClick={addColumn} variant="outline" className="w-full sm:w-auto">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Column
                    </Button>
                    <Button onClick={saveDatasheet} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Save Datasheet
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Datasheet
                  </Button>
                )}
            </div>
          </div>
        </CardHeader>
          <CardContent>
            {/* Debug info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Debug Info:</strong> Active Tab: {activeTab} | Datasheet Rows: {datasheetData.length} | Is Editing: {isEditing.toString()}
              </p>
            </div>

            {isEditing && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Datasheet Title</label>
                <Input
                  value={datasheetTitle}
                  onChange={(e) => setDatasheetTitle(e.target.value)}
                  placeholder="Enter datasheet title"
                  className="w-full max-w-md"
                />
              </div>
            )}
            
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                          #
                        </th>
                        {datasheetData[0]?.map((_, colIndex) => (
                          <th key={colIndex} className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] sm:min-w-[120px]">
                            {String.fromCharCode(65 + colIndex)}
                          </th>
                        )) || <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">A</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {datasheetData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 sm:px-3 py-2 text-xs text-gray-500 font-medium border-r border-gray-200">
                            {rowIndex + 1}
                          </td>
                          {row.map((cell, colIndex) => (
                            <td key={colIndex} className="px-2 sm:px-3 py-2 border-r border-gray-200">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={Object.values(cell)[0] || ''}
                                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                  placeholder="Enter data"
                                />
                              ) : (
                                <span className="text-sm text-gray-900 break-words">
                                  {Object.values(cell)[0] || '-'}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {!isEditing && (
              <div className="mt-4 text-center text-sm text-gray-500">
                <div className="hidden sm:block">Click "Edit Datasheet" to modify the data</div>
                <div className="sm:hidden">Tap "Edit Datasheet" to modify the data</div>
              </div>
            )}
            
            {/* Mobile-friendly table info */}
            <div className="mt-4 sm:hidden text-center text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
              <p>💡 <strong>Tip:</strong> Scroll horizontally to view all columns on mobile devices</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
              <Button 
                onClick={() => alert('AI Presentation generation coming soon! (Demo)')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
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

  // Enhanced Research Data Entry Modal
  const renderDataEntryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Research Data Entry</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Research Title *</label>
                <Input
                  value={entryForm.title}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter research title"
                />
            </div>
              
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Research Type *</label>
                <Select
                  value={entryForm.data_type}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, data_type: e.target.value }))}
                >
                  <option value="">Select research type...</option>
                  <option value="experimental">Experimental Research</option>
                  <option value="observational">Observational Study</option>
                  <option value="clinical">Clinical Trial</option>
                  <option value="survey">Survey Research</option>
                  <option value="case_study">Case Study</option>
                  <option value="meta_analysis">Meta Analysis</option>
                  <option value="systematic_review">Systematic Review</option>
                  <option value="laboratory">Laboratory Analysis</option>
                  <option value="field_study">Field Study</option>
                  <option value="simulation">Computer Simulation</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
              <Select>
                  <option value="">Select field...</option>
                  <option value="biology">Biology</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="physics">Physics</option>
                  <option value="medicine">Medicine</option>
                  <option value="engineering">Engineering</option>
                  <option value="psychology">Psychology</option>
                  <option value="environmental">Environmental Science</option>
                  <option value="computer_science">Computer Science</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="geology">Geology</option>
              </Select>
            </div>
          </div>

            {/* Research Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Research Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Category</label>
                <Select>
                  <option value="">Select category...</option>
                  <option value="quantitative">Quantitative Data</option>
                  <option value="qualitative">Qualitative Data</option>
                  <option value="mixed">Mixed Methods</option>
                  <option value="time_series">Time Series</option>
                  <option value="cross_sectional">Cross-Sectional</option>
                  <option value="longitudinal">Longitudinal</option>
                  <option value="categorical">Categorical Data</option>
                  <option value="continuous">Continuous Data</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sample Size</label>
                <Input
                  type="number"
                  placeholder="Number of samples/participants"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Study Duration</label>
                <Input
                  placeholder="e.g., 6 months, 2 years"
                />
              </div>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Research Summary *</label>
              <textarea
                value={entryForm.summary}
                onChange={(e) => setEntryForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Detailed description of the research, methodology, and objectives"
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords/Tags</label>
              <Input
                value={entryForm.tags}
                onChange={(e) => setEntryForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter keywords separated by commas"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Research Objectives</label>
              <textarea
                placeholder="List the main research objectives and hypotheses"
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Methodology Notes</label>
              <textarea
                placeholder="Brief description of the research methodology and experimental design"
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="ghost">
              Cancel
          </Button>
                          <Button className="bg-blue-600 hover:bg-blue-700">
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Research Entry
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
      const data = dataset.dataPreview;
      if (data.type === 'table' && data.content?.rows && data.content?.headers) {
        const numericColumns = data.content.headers.map((header: string, index: number) => {
          const values = data.content.rows.map((row: any[]) => parseFloat(row[index])).filter(v => !isNaN(v));
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
            result.source === 'Manual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {result.source}
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
        
        {result.dataPreview && result.dataPreview.type === 'table' && (
          <div className="text-xs text-gray-500 mb-3">
            📊 {result.dataPreview.content?.rows?.length || 0} rows × {result.dataPreview.content?.headers?.length || 0} columns
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
            <EyeIcon className="w-4 w-4 mr-2" />
            View Data
          </Button>
          <Button
            onClick={() => {
              setSelectedDataset(result);
              setActiveTab('analytics');
              // Auto-run analytics when switching to analytics tab
              setTimeout(() => runAnalytics(result), 100);
            }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <BarChartIcon className="w-4 h-4 mr-2" />
            Run Stats
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
          {selectedDataset && selectedDataset.dataPreview && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Dataset Preview</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedDataset.dataPreview.content?.headers?.map((header: string, index: number) => (
                        <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDataset.dataPreview.content?.rows?.slice(0, 10).map((row: any[], rowIndex: number) => (
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
                {selectedDataset.dataPreview.content?.rows && selectedDataset.dataPreview.content.rows.length > 10 && (
                  <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                    Showing first 10 rows of {selectedDataset.dataPreview.content.rows.length} total rows
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

  return (
    <div className="min-h-screen bg-gray-50">
      
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Data & Results</h1>
          <p className="text-gray-600 text-base sm:text-lg">
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
            <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'spreadsheet'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">📈 Enhanced Data Entry</span>
              <span className="sm:hidden">📈 Import Data</span>
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'images'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">🖼️ Image & Documents</span>
              <span className="sm:hidden">🖼️ Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">📊 Datasheets</span>
              <span className="sm:hidden">📊 Sheets</span>
            </button>
            <button
              onClick={() => setActiveTab('presentations')}
              className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'presentations'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">🎯 AI Presentations</span>
              <span className="sm:hidden">🎯 AI</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
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
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Data Directory Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <DatabaseIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Data Directory</CardTitle>
                    <CardDescription>All available datasets from Enhanced Data Entry, Image & Documents, and Datasheets</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((result) => (
                      <div
                        key={result.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          setSelectedDataset(result);
                          // Auto-run analytics when dataset is selected
                          setTimeout(() => runAnalytics(result), 100);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            result.source === 'Manual' ? 'bg-blue-100 text-blue-800' : 
                            result.source === 'Import' ? 'bg-green-100 text-green-800' : 
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {result.source}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(result.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{result.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{result.summary}</p>
                        
                        {result.dataPreview && result.dataPreview.type === 'table' && (
                          <div className="text-xs text-gray-500 mb-3">
                            📊 {result.dataPreview.content?.rows?.length || 0} rows × {result.dataPreview.content?.headers?.length || 0} columns
                          </div>
                        )}
                        
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {result.tags.slice(0, 3).map((tag: string, index: number) => (
                              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          By {result.author}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DatabaseIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No datasets available yet.</p>
                    <p className="text-sm">Create data in Enhanced Data Entry, Image & Documents, or Datasheets tabs.</p>
                  </div>
                )}
                
                {/* Selected Dataset Info */}
                {selectedDataset && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Selected Dataset: {selectedDataset.title}</h4>
                        <p className="text-sm text-blue-700">{selectedDataset.summary}</p>
                      </div>
                      {isAnalyzing && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Running Analytics...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Datasets</p>
                      <p className="text-3xl font-bold">{results.length}</p>
                    </div>
                    <TableIcon className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Manual Entries</p>
                      <p className="text-3xl font-bold">{results.filter(r => r.source === 'Manual').length}</p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Imported Data</p>
                      <p className="text-3xl font-bold">{results.filter(r => r.source === 'Import').length}</p>
                    </div>
                    <TrendingUpIcon className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Analyses Run</p>
                      <p className="text-3xl font-bold">{analyticsResults ? '1' : '0'}</p>
                    </div>
                    <CalculatorIcon className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
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

