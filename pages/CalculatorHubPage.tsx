import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  CALCULATOR_DEFINITIONS, 
  CALCULATOR_INPUTS, 
  CalculatorEngine
} from '../services/calculators';

// Define types locally since they're not exported
type CalculatorName = keyof typeof CALCULATOR_DEFINITIONS;

interface CalculatorResult {
  value: number;
  unit: string;
  confidence?: number;
  explanation?: string;
  warnings?: string[];
  suggestions?: string[];
}
import { 
  BeakerIcon, 
  CalculatorIcon, 
  BarChartIcon, 
  PipetteIcon,
  MessageSquareQuestionIcon,
  BookOpenIcon,
  BrainCircuitIcon,
  LightbulbIcon,
  StarIcon,
  ClockIcon,
  SaveIcon,
  ShareIcon,
  DownloadIcon,
  RefreshCwIcon
} from '../components/icons';

interface CalculatorState {
  selectedCalculator: CalculatorName | null;
  inputs: Record<string, any>;
  result: CalculatorResult | null;
  error: string | null;
  showHistory: boolean;
  favorites: CalculatorName[];
  recentCalculations: Array<{
    id: string;
    calculator: CalculatorName;
    inputs: Record<string, any>;
    result: CalculatorResult;
    timestamp: Date;
  }>;
  savedCalculations: Array<{
    id: string;
    name: string;
    calculator: CalculatorName;
    inputs: Record<string, any>;
    result: CalculatorResult;
    notes: string;
    timestamp: Date;
  }>;
}

const CalculatorHubPage: React.FC = () => {
  const [state, setState] = useState<CalculatorState>({
    selectedCalculator: null,
    inputs: {},
    result: null,
    error: null,
    showHistory: false,
    favorites: [],
    recentCalculations: [],
    savedCalculations: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group calculators by category
  const calculatorsByCategory = Object.values(CALCULATOR_DEFINITIONS).reduce((acc, calc) => {
    if (!acc[calc.category]) {
      acc[calc.category] = [];
    }
    acc[calc.category].push(calc);
    return acc;
  }, {} as Record<string, typeof CALCULATOR_DEFINITIONS[keyof typeof CALCULATOR_DEFINITIONS][]>);

  const filteredCalculators = Object.entries(calculatorsByCategory)
    .filter(([category]) => selectedCategory === 'all' || category === selectedCategory)
    .filter(([_, calcs]) => {
      const calcArray = calcs as Array<typeof CALCULATOR_DEFINITIONS[keyof typeof CALCULATOR_DEFINITIONS]>;
      return calcArray.some(calc => 
        calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        calc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        calc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

  const handleCalculatorSelect = (calculatorName: CalculatorName) => {
    setState(prev => ({
      ...prev,
      selectedCalculator: calculatorName,
      inputs: {},
      result: null,
      error: null
    }));
  };

  const handleInputChange = (name: string, value: any) => {
    setState(prev => ({
      ...prev,
      inputs: { ...prev.inputs, [name]: value }
    }));
  };

  const handleCalculate = () => {
    if (!state.selectedCalculator) return;

    try {
      const result = CalculatorEngine.calculate(state.selectedCalculator, state.inputs);
      const calculationRecord = {
        id: `calc-${Date.now()}`,
        calculator: state.selectedCalculator,
        inputs: { ...state.inputs },
        result,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        result,
        error: null,
        recentCalculations: [calculationRecord, ...prev.recentCalculations.slice(0, 9)] // Keep only 10 most recent
      }));

      // Save to scratchpad (you can implement this with your API)
      // saveToScratchpad(state.selectedCalculator, state.inputs, result);
    } catch (error) {
      setState(prev => ({
        ...prev,
        result: null,
        error: error instanceof Error ? error.message : 'Calculation failed'
      }));
    }
  };

  const toggleFavorite = (calculatorName: CalculatorName) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.includes(calculatorName)
        ? prev.favorites.filter(fav => fav !== calculatorName)
        : [...prev.favorites, calculatorName]
    }));
  };

  const saveCalculation = (name: string, notes: string = '') => {
    if (!state.selectedCalculator || !state.result) return;

    const savedRecord = {
      id: `saved-${Date.now()}`,
      name,
      calculator: state.selectedCalculator,
      inputs: { ...state.inputs },
      result: state.result,
      notes,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      savedCalculations: [savedRecord, ...prev.savedCalculations]
    }));
  };

  const loadCalculation = (inputs: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      inputs,
      result: null,
      error: null
    }));
  };

  const exportResults = () => {
    if (!state.result || !state.selectedCalculator) return;

    const exportData = {
      calculator: state.selectedCalculator,
      inputs: state.inputs,
      result: state.result,
      timestamp: new Date(),
      formula: CALCULATOR_DEFINITIONS[state.selectedCalculator].formula
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${state.selectedCalculator}_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const resetCalculator = () => {
    setState(prev => ({
      ...prev,
      inputs: {},
      result: null,
      error: null
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Chemistry & Biochemistry':
        return <BeakerIcon className="w-5 h-5" />;
      case 'Molecular & Cell Biology':
        return <PipetteIcon className="w-5 h-5" />;
      case 'Bioinformatics':
        return <BarChartIcon className="w-5 h-5" />;
      case 'Statistics & Data Analysis':
        return <BarChartIcon className="w-5 h-5" />;
      case 'Engineering & Physics':
        return <PipetteIcon className="w-5 h-5" />;
      default:
        return <CalculatorIcon className="w-5 h-5" />;
    }
  };

  const renderInputField = (input: any) => {
    switch (input.type) {
      case 'select':
    return (
          <Select
            value={state.inputs[input.name] || ''}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            required={input.required}
          >
            <option value="">Select...</option>
            {input.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
                    </Select>
        );
      case 'text':
        return (
          <Input
            type="text"
            value={state.inputs[input.name] || ''}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            placeholder={input.placeholder}
            required={input.required}
          />
        );
      default:
    return (
          <Input
            type="number"
            value={state.inputs[input.name] || ''}
            onChange={(e) => handleInputChange(input.name, parseFloat(e.target.value))}
            min={input.min}
            max={input.max}
            step={input.step}
            required={input.required}
          />
        );
    }
  };

    return (
    <div className="space-y-6">
            {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Scientific Calculator Hub
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-4">
          Advanced scientific calculators for molecular biology, chemistry, statistics, and more. 
          Built by scientists, for scientists.
        </p>
        
        {/* Quick Stats */}
        <div className="flex justify-center space-x-6 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <CalculatorIcon className="w-4 h-4" />
            <span>{Object.keys(CALCULATOR_DEFINITIONS).length} Calculators</span>
          </div>
          <div className="flex items-center space-x-1">
            <StarIcon className="w-4 h-4" />
            <span>{state.favorites.length} Favorites</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-4 h-4" />
            <span>{state.recentCalculations.length} Recent</span>
          </div>
          <div className="flex items-center space-x-1">
            <SaveIcon className="w-4 h-4" />
            <span>{state.savedCalculations.length} Saved</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search calculators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
                    </div>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="all">All Categories</option>
          {Object.keys(calculatorsByCategory).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
                        </Select>
                    </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CalculatorIcon className="w-5 h-5" />
              Available Calculators
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCalculators.map(([category, calculators]) => (
                <div key={category} className="space-y-2">
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category}
                  </h3>
                  <div className="space-y-1 ml-4">
                                        {(calculators as Array<typeof CALCULATOR_DEFINITIONS[keyof typeof CALCULATOR_DEFINITIONS]>).map(calc => (
                      <div key={calc.name} className={`relative group rounded-md border transition-colors ${
                        state.selectedCalculator === calc.name
                          ? 'bg-blue-100 border-blue-200'
                          : 'hover:bg-gray-50 border-transparent'
                      }`}>
                        <button
                          onClick={() => handleCalculatorSelect(calc.name)}
                          className="w-full text-left p-2 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{calc.name}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {calc.description}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(calc.name);
                              }}
                              className={`ml-2 p-1 rounded transition-colors ${
                                state.favorites.includes(calc.name)
                                  ? 'text-yellow-500 hover:text-yellow-600'
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              title={state.favorites.includes(calc.name) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <StarIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </button>
                      </div>
                    ))}
                        </div>
                    </div>
              ))}
                </div>
        </Card>
                </div>
                
        {/* Calculator Interface */}
        <div className="lg:col-span-2">
          {state.selectedCalculator ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                 <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {state.selectedCalculator}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {CALCULATOR_DEFINITIONS[state.selectedCalculator].description}
                  </p>
                    </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleFavorite(state.selectedCalculator)}
                    className={`p-2 rounded-lg border transition-colors ${
                      state.favorites.includes(state.selectedCalculator!)
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-600'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-yellow-50'
                    }`}
                    title={state.favorites.includes(state.selectedCalculator!) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <StarIcon className="w-4 h-4" />
                  </button>
                  <Button onClick={resetCalculator} variant="outline">
                    <RefreshCwIcon className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
                 </div>

              {/* Calculator Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MessageSquareQuestionIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Formula:</span>{' '}
                      <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                        {CALCULATOR_DEFINITIONS[state.selectedCalculator].formula}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>{' '}
                      {CALCULATOR_DEFINITIONS[state.selectedCalculator].category} → {' '}
                      {CALCULATOR_DEFINITIONS[state.selectedCalculator].subCategory}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CALCULATOR_DEFINITIONS[state.selectedCalculator].tags.map(tag => (
                        <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                </div>
                </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold">Input Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CALCULATOR_INPUTS[state.selectedCalculator].map(input => (
                    <div key={input.name} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {input.label}
                        {input.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderInputField(input)}
                      {input.helpText && (
                        <p className="text-xs text-gray-500">{input.helpText}</p>
                      )}
                </div>
                  ))}
                        </div>
                </div>

              {/* Calculate Button */}
              <div className="flex justify-center mb-6">
                <Button 
                  onClick={handleCalculate}
                  className="px-8 py-3 text-lg"
                  disabled={!state.selectedCalculator}
                >
                  <CalculatorIcon className="w-5 h-5 mr-2" />
                  Calculate
                </Button>
              </div>

              {/* Results */}
              {state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="text-red-800">
                    <strong>Error:</strong> {state.error}
                </div>
                </div>
              )}

              {state.result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-800">Results</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const name = prompt('Save this calculation as:');
                          if (name) {
                            const notes = prompt('Add notes (optional):') || '';
                            saveCalculation(name, notes);
                          }
                        }}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                        title="Save calculation"
                      >
                        <SaveIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={exportResults}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                        title="Export results"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `${state.selectedCalculator} Result`,
                              text: `Result: ${state.result?.value} ${state.result?.unit}`,
                            });
                          } else {
                            navigator.clipboard.writeText(`${state.selectedCalculator}: ${state.result?.value} ${state.result?.unit}`);
                          }
                        }}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                        title="Share results"
                      >
                        <ShareIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700">
                        {state.result.value} {state.result.unit}
                </div>
                      {state.result.confidence && (
                        <div className="text-sm text-green-600 mt-1">
                          Confidence: {(state.result.confidence * 100).toFixed(0)}%
                    </div>
                      )}
                    </div>
                    
                    {state.result.explanation && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="font-medium text-gray-700 mb-2">Calculation Details:</div>
                        <div className="text-sm text-gray-600">{state.result.explanation}</div>
                </div>
                    )}

                    {state.result.warnings && state.result.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="font-medium text-yellow-800 mb-2">Warnings:</div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {state.result.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                </div>
                    )}

                    {state.result.suggestions && state.result.suggestions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="font-medium text-blue-800 mb-2">Suggestions:</div>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {state.result.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                    </div>
                    )}
                </div>
            </div>
              )}

              {/* Examples */}
              {CALCULATOR_DEFINITIONS[state.selectedCalculator].examples.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5" />
                    Example Calculations
                  </h3>
                  <div className="space-y-3">
                    {CALCULATOR_DEFINITIONS[state.selectedCalculator].examples.map((example, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-800 mb-2">{example.title}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Inputs:</strong> {Object.entries(example.inputs).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Expected Output:</strong> {example.expectedOutput}
                </div>
                        <div className="text-sm text-gray-600">{example.explanation}</div>
                            </div>
                    ))}
                             </div>
                    </div>
              )}

              {/* References */}
              {CALCULATOR_DEFINITIONS[state.selectedCalculator].references.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BrainCircuitIcon className="w-5 h-5" />
                    References
                            </h3>
                  <div className="space-y-2">
                    {CALCULATOR_DEFINITIONS[state.selectedCalculator].references.map((ref, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        {ref}
                      </div>
                                ))}
                            </div>
                        </div>
                    )}
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <CalculatorIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Calculator
                            </h3>
              <p className="text-gray-500">
                Choose a calculator from the left panel to get started with your scientific calculations.
              </p>
            </Card>
          )}
                                        </div>
                                    </div>

      {/* Recent & Saved Calculations */}
      {(state.recentCalculations.length > 0 || state.savedCalculations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Calculations */}
          {state.recentCalculations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                Recent Calculations
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {state.recentCalculations.map((calc) => (
                  <div key={calc.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm text-gray-900">{calc.calculator}</div>
                      <div className="text-xs text-gray-500">
                        {calc.timestamp.toLocaleDateString()} {calc.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className="text-sm text-blue-600 font-medium mb-1">
                      Result: {calc.result.value} {calc.result.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Inputs: {Object.entries(calc.inputs).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => {
                          handleCalculatorSelect(calc.calculator);
                          loadCalculation(calc.inputs);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Saved Calculations */}
          {state.savedCalculations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SaveIcon className="w-5 h-5" />
                Saved Calculations
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {state.savedCalculations.map((calc) => (
                  <div key={calc.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm text-gray-900">{calc.name}</div>
                      <div className="text-xs text-gray-500">
                        {calc.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{calc.calculator}</div>
                    <div className="text-sm text-green-600 font-medium mb-1">
                      Result: {calc.result.value} {calc.result.unit}
                    </div>
                    {calc.notes && (
                      <div className="text-xs text-gray-500 mb-2 italic">
                        Notes: {calc.notes}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          handleCalculatorSelect(calc.calculator);
                          loadCalculation(calc.inputs);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          setState(prev => ({
                            ...prev,
                            savedCalculations: prev.savedCalculations.filter(s => s.id !== calc.id)
                          }));
                        }}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start gap-3">
          <LightbulbIcon className="w-6 h-6 text-yellow-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro Tips for Scientists</h3>
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>• Always verify calculator results with manual calculations for critical experiments</li>
              <li>• Use the examples provided to validate your inputs and expected outputs</li>
              <li>• Consider the confidence levels and warnings when interpreting results</li>
              <li>• Save frequently used calculations for quick access and collaboration</li>
              <li>• Export results in JSON format for integration with analysis software</li>
              <li>• Add calculators to favorites for faster access to your most-used tools</li>
              <li>• Check the references for detailed explanations of the underlying science</li>
            </ul>
                </div>
                                    </div>
                    </Card>
        </div>
    );
};

export default CalculatorHubPage;