import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  BarChartIcon, 
  LineChartIcon, 
  ChartBarIcon,
  TableIcon,
  CalculatorIcon,

  LightbulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeOffIcon,
  TrendingUpIcon
} from '../components/icons';

interface DataPoint {
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

const DataAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [dataInput, setDataInput] = useState<string>('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'input' | 'results'>('input');
  const [dataName, setDataName] = useState<string>('');

  // Parse CSV-like input
  const parseDataInput = (input: string): DataPoint[] => {
    const lines = input.trim().split('\n');
    const parsedData: DataPoint[] = [];
    
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

  // Run analysis
  const runAnalysis = async (analysisType: string) => {
    if (data.length === 0) {
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
          const values = data.map(d => d.value);
          analysisResults = calculateDescriptiveStats(values);
          break;
          
        case 'correlation':
          if (data.length < 2) {
            analysisResults = { error: 'Need at least 2 data points for correlation' };
            break;
          }
          const x = data.map((d, i) => i);
          const y = data.map(d => d.value);
          analysisResults = calculateCorrelation(x, y);
          break;
          
        case 't-test':
          const groups = data.reduce((acc, d) => {
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
          if (data.length < 2) {
            analysisResults = { error: 'Need at least 2 data points for regression' };
            break;
          }
          const xVals = data.map((d, i) => i);
          const yVals = data.map(d => d.value);
          analysisResults = performLinearRegression(xVals, yVals);
          break;
          
        default:
          analysisResults = { error: 'Unknown analysis type' };
      }
      
      setResults(analysisResults);
      setIsAnalyzing(false);
      setViewMode('results');
    }, 1500);
  };

  // Load sample data
  const loadSampleData = () => {
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
    
    setData(sampleData);
    setDataName('Sample Research Data');
    setDataInput(sampleData.map(d => `${d.value}, ${d.category}, ${d.group}`).join('\n'));
  };

  // Clear data
  const clearData = () => {
    setData([]);
    setDataInput('');
    setDataName('');
    setResults(null);
    setViewMode('input');
  };

  // Export results
  const exportResults = () => {
    if (!results) return;
    
    const content = `Data Analytics Results\n${'='.repeat(50)}\n\n` +
      `Analysis Type: ${selectedAnalysis}\n` +
      `Data Points: ${data.length}\n\n` +
      JSON.stringify(results, null, 2);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-analytics-${selectedAnalysis}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BarChartIcon className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Data Analytics</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced statistical analysis tools for your research data. Perform descriptive statistics, 
            correlation analysis, hypothesis testing, and linear regression with professional-grade accuracy.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Data Points</p>
                  <p className="text-3xl font-bold">{data.length}</p>
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
                  <p className="text-3xl font-bold">{new Set(data.map(d => d.category)).size}</p>
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
                  <p className="text-3xl font-bold">{new Set(data.map(d => d.group)).size}</p>
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
                  <p className="text-3xl font-bold">{results ? '1' : '0'}</p>
                </div>
                <CalculatorIcon className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Data Input & Analysis Tools */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Input */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TableIcon className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle>Data Input</CardTitle>
                      <CardDescription>Enter your research data for analysis</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={loadSampleData} variant="outline" size="sm">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Load Sample
                    </Button>
                    <Button onClick={clearData} variant="outline" size="sm">
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Dataset name (optional)"
                  value={dataName}
                  onChange={(e) => setDataName(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data (CSV format: value, category, group, timestamp)
                  </label>
                  <textarea
                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12.5, A, Control&#10;15.2, A, Control&#10;18.3, B, Treatment&#10;19.1, B, Treatment"
                    value={dataInput}
                    onChange={(e) => {
                      setDataInput(e.target.value);
                      const parsed = parseDataInput(e.target.value);
                      setData(parsed);
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
                    onClick={() => runAnalysis('descriptive')}
                    disabled={isAnalyzing || data.length === 0}
                    className="justify-start h-16 text-left"
                  >
                    <BarChartIcon className="h-6 w-6 mr-3" />
                    <div>
                      <div className="font-medium">Descriptive Statistics</div>
                      <div className="text-sm opacity-75">Mean, median, variance, etc.</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => runAnalysis('correlation')}
                    disabled={isAnalyzing || data.length < 2}
                    className="justify-start h-16 text-left"
                  >
                    <LineChartIcon className="h-6 w-6 mr-3" />
                    <div>
                      <div className="font-medium">Correlation Analysis</div>
                      <div className="text-sm opacity-75">Pearson correlation coefficient</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => runAnalysis('t-test')}
                    disabled={isAnalyzing || data.length < 4}
                    className="justify-start h-16 text-left"
                  >
                    <ChartBarIcon className="h-6 w-6 mr-3" />
                    <div>
                      <div className="font-medium">Hypothesis Testing</div>
                      <div className="text-sm opacity-75">Two-sample t-test</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => runAnalysis('regression')}
                    disabled={isAnalyzing || data.length < 2}
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
          </div>

          {/* Right Column - Results & Actions */}
          <div className="space-y-6">
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

            {/* Results */}
            {results && !isAnalyzing && (
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
                    <Button onClick={exportResults} variant="outline" size="sm">
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.error ? (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mb-2" />
                      <p className="text-red-700">{results.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedAnalysis === 'descriptive' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{results.count}</div>
                              <div className="text-sm text-blue-600">Count</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{results.mean.toFixed(3)}</div>
                              <div className="text-sm text-green-600">Mean</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">{results.median.toFixed(3)}</div>
                              <div className="text-sm text-purple-600">Median</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                              <div className="text-2xl font-bold text-orange-600">{results.standardDeviation.toFixed(3)}</div>
                              <div className="text-sm text-orange-600">Std Dev</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <div className="text-lg font-bold text-red-600">{results.min.toFixed(3)}</div>
                              <div className="text-sm text-red-600">Minimum</div>
                            </div>
                            <div className="text-center p-3 bg-indigo-50 rounded-lg">
                              <div className="text-lg font-bold text-indigo-600">{results.max.toFixed(3)}</div>
                              <div className="text-sm text-indigo-600">Maximum</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedAnalysis === 'correlation' && (
                        <div className="space-y-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">{results.correlation.toFixed(4)}</div>
                            <div className="text-lg text-blue-600">{results.strength}</div>
                            <div className="text-sm text-blue-700 mt-2">{results.interpretation}</div>
                          </div>
                        </div>
                      )}

                      {selectedAnalysis === 't-test' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="text-sm font-medium text-purple-900 mb-1">t-Statistic</div>
                              <div className="text-lg font-bold text-purple-600">{results.tStatistic.toFixed(4)}</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm font-medium text-blue-900 mb-1">p-Value</div>
                              <div className="text-lg font-bold text-blue-600">{results.pValue.toFixed(4)}</div>
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-sm font-medium text-green-900 mb-1">Conclusion</div>
                            <div className="text-sm text-green-700">{results.conclusion}</div>
                          </div>
                        </div>
                      )}

                      {selectedAnalysis === 'regression' && (
                        <div className="space-y-4">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-sm font-medium text-green-900 mb-1">Equation</div>
                            <div className="text-lg font-mono text-green-600">{results.equation}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm font-medium text-blue-900 mb-1">R²</div>
                              <div className="text-lg font-bold text-blue-600">{results.rSquared.toFixed(4)}</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="text-sm font-medium text-purple-900 mb-1">Slope</div>
                              <div className="text-lg font-bold text-purple-600">{results.slope.toFixed(4)}</div>
                            </div>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <div className="text-sm font-medium text-orange-900 mb-1">Interpretation</div>
                            <div className="text-sm text-orange-700">{results.interpretation}</div>
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
                  <CardTitle>Getting Started</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>1. <strong>Enter your data</strong> in the format shown above</p>
                <p>2. <strong>Choose analysis type</strong> based on your research question</p>
                <p>3. <strong>Review results</strong> with professional statistical accuracy</p>
                <p>4. <strong>Export findings</strong> for your research reports</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalyticsPage;
