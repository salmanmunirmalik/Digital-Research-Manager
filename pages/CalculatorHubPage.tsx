import React, { useState, useEffect } from 'react';
import { 
  CalculatorIcon, 
  ArrowRightIcon, 
  RefreshIcon, 
  BookmarkIcon, 
  HistoryIcon,
  BeakerIcon,
  BarChartIcon, 
  PipetteIcon,
  BrainCircuitIcon,
  LightbulbIcon,
  StarIcon,
  ClockIcon,
  SaveIcon,
  ShareIcon,
  DownloadIcon,
  RefreshCwIcon,
  SettingsIcon,
  SearchIcon,
  FilterIcon,
  DnaIcon,
  MicroscopeIcon,
  AtomIcon,
  FlaskIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  CopyIcon,
  PlusIcon,
  FolderIcon,
  TagIcon,
  UserIcon,
  GlobeIcon,
  LockIcon,
  PlayIcon,
  XMarkIcon,
  SparklesIcon
} from '../components/icons';
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

interface ConversionCategory {
  name: string;
  units: Unit[];
  icon: React.ComponentType<any>;
  color: string;
}

interface Unit {
  name: string;
  symbol: string;
  category: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

interface ConversionHistory {
  id: string;
  fromValue: number;
  fromUnit: string;
  toValue: number;
  toUnit: string;
  category: string;
  timestamp: Date;
}

const CalculatorHubPage: React.FC = () => {
  // Core state management
  const [activeTab, setActiveTab] = useState<'calculators' | 'converters'>('calculators');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalcCategory, setSelectedCalcCategory] = useState('all');
  
  // Calculator state
  const [calcState, setCalcState] = useState({
    selectedCalculator: null as CalculatorName | null,
    inputs: {} as Record<string, any>,
    result: null as CalculatorResult | null,
    error: null as string | null,
    recentCalculations: [] as Array<{
      id: string;
      calculator: CalculatorName;
      inputs: Record<string, any>;
      result: CalculatorResult;
      timestamp: Date;
    }>
  });

  // Converter state
  const [converterState, setConverterState] = useState({
    selectedCategory: 'length',
    fromValue: '',
    fromUnit: '',
    toUnit: '',
    toValue: '',
    conversionHistory: [] as ConversionHistory[]
  });

  // Cognitive enhancement states
  const [userContext, setUserContext] = useState({
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'expert',
    currentGoal: null as string | null,
    timeOfDay: 'morning' as 'morning' | 'afternoon' | 'evening'
  });

  // Unit conversion categories
  const conversionCategories: ConversionCategory[] = [
    {
      name: 'length',
      units: [
        { name: 'Meter', symbol: 'm', category: 'length', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Centimeter', symbol: 'cm', category: 'length', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
        { name: 'Millimeter', symbol: 'mm', category: 'length', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Kilometer', symbol: 'km', category: 'length', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { name: 'Inch', symbol: 'in', category: 'length', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
        { name: 'Foot', symbol: 'ft', category: 'length', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
        { name: 'Yard', symbol: 'yd', category: 'length', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
        { name: 'Mile', symbol: 'mi', category: 'length', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
        { name: 'Micrometer', symbol: 'μm', category: 'length', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
        { name: 'Nanometer', symbol: 'nm', category: 'length', toBase: (v) => v / 1000000000, fromBase: (v) => v * 1000000000 },
        { name: 'Angstrom', symbol: 'Å', category: 'length', toBase: (v) => v / 10000000000, fromBase: (v) => v * 10000000000 }
      ],
      icon: BarChartIcon,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'mass',
      units: [
        { name: 'Kilogram', symbol: 'kg', category: 'mass', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Gram', symbol: 'g', category: 'mass', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Milligram', symbol: 'mg', category: 'mass', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
        { name: 'Microgram', symbol: 'μg', category: 'mass', toBase: (v) => v / 1000000000, fromBase: (v) => v * 1000000000 },
        { name: 'Pound', symbol: 'lb', category: 'mass', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
        { name: 'Ounce', symbol: 'oz', category: 'mass', toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 },
        { name: 'Ton', symbol: 't', category: 'mass', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 }
      ],
      icon: BeakerIcon,
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'volume',
      units: [
        { name: 'Liter', symbol: 'L', category: 'volume', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Milliliter', symbol: 'mL', category: 'volume', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Microliter', symbol: 'μL', category: 'volume', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
        { name: 'Cubic Meter', symbol: 'm³', category: 'volume', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { name: 'Cubic Centimeter', symbol: 'cm³', category: 'volume', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Gallon', symbol: 'gal', category: 'volume', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
        { name: 'Quart', symbol: 'qt', category: 'volume', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
        { name: 'Pint', symbol: 'pt', category: 'volume', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
        { name: 'Cup', symbol: 'cup', category: 'volume', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 }
      ],
      icon: PipetteIcon,
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'temperature',
      units: [
        { name: 'Celsius', symbol: '°C', category: 'temperature', toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
        { name: 'Fahrenheit', symbol: '°F', category: 'temperature', toBase: (v) => (v - 32) * 5/9 + 273.15, fromBase: (v) => (v - 273.15) * 9/5 + 32 },
        { name: 'Kelvin', symbol: 'K', category: 'temperature', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Rankine', symbol: '°R', category: 'temperature', toBase: (v) => v * 5/9, fromBase: (v) => v * 9/5 }
      ],
      icon: BrainCircuitIcon,
      color: 'from-orange-500 to-red-500'
    },
    {
      name: 'pressure',
      units: [
        { name: 'Pascal', symbol: 'Pa', category: 'pressure', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Kilopascal', symbol: 'kPa', category: 'pressure', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { name: 'Megapascal', symbol: 'MPa', category: 'pressure', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
        { name: 'Bar', symbol: 'bar', category: 'pressure', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
        { name: 'Atmosphere', symbol: 'atm', category: 'pressure', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
        { name: 'PSI', symbol: 'psi', category: 'pressure', toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
        { name: 'Torr', symbol: 'Torr', category: 'pressure', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 }
      ],
      icon: SettingsIcon,
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  // Initialize units when category changes
  useEffect(() => {
    const category = conversionCategories.find(cat => cat.name === converterState.selectedCategory);
    if (category && category.units.length > 0) {
      setConverterState(prev => ({
        ...prev,
        fromUnit: category.units[0].name,
        toUnit: category.units[1]?.name || category.units[0].name
      }));
    }
  }, [converterState.selectedCategory]);

  // Handle calculator selection
  const handleCalculatorSelect = (calculatorName: CalculatorName) => {
    setCalcState(prev => ({
      ...prev,
      selectedCalculator: calculatorName,
      inputs: {},
      result: null,
      error: null
    }));
  };

  // Handle calculator input change
  const handleInputChange = (field: string, value: any) => {
    setCalcState(prev => ({
      ...prev,
      inputs: { ...prev.inputs, [field]: value }
    }));
  };

  // Handle calculator calculation
  // Load mock data on component mount and handle URL parameters
  useEffect(() => {
    // Check for calculator parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const calculatorParam = urlParams.get('calculator');
    
    if (calculatorParam && CALCULATOR_DEFINITIONS[calculatorParam as CalculatorName]) {
      setCalcState(prev => ({
        ...prev,
        selectedCalculator: calculatorParam as CalculatorName,
        inputs: {},
        result: null,
        error: null
      }));
      // Switch to calculators tab when a calculator is pre-selected
      setActiveTab('calculators');
    }
  }, []);

  const handleCalculate = () => {
    if (!calcState.selectedCalculator) return;

    try {
      const result = CalculatorEngine.calculate(calcState.selectedCalculator, calcState.inputs);
      
      setCalcState(prev => ({
        ...prev,
        result,
        error: null
      }));

      // Add to recent calculations
      const newCalculation = {
        id: Date.now().toString(),
        calculator: calcState.selectedCalculator,
        inputs: { ...calcState.inputs },
        result,
        timestamp: new Date()
      };
      setCalcState(prev => ({
        ...prev,
        recentCalculations: [newCalculation, ...prev.recentCalculations.slice(0, 9)]
      }));
    } catch (error) {
      setCalcState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Calculation failed',
        result: null
      }));
    }
  };

  // Handle unit conversion
  const handleConversion = () => {
    if (!converterState.fromUnit || !converterState.toUnit || !converterState.fromValue) return;

    const fromUnitObj = conversionCategories
      .find(cat => cat.name === converterState.selectedCategory)
      ?.units.find(unit => unit.name === converterState.fromUnit);
    
    const toUnitObj = conversionCategories
      .find(cat => cat.name === converterState.selectedCategory)
      ?.units.find(unit => unit.name === converterState.toUnit);

    if (fromUnitObj && toUnitObj) {
      const baseValue = fromUnitObj.toBase(parseFloat(converterState.fromValue));
      const convertedValue = toUnitObj.fromBase(baseValue);
      
      setConverterState(prev => ({
      ...prev,
        toValue: convertedValue.toFixed(6)
      }));

      // Add to history
      const newHistory: ConversionHistory = {
        id: Date.now().toString(),
        fromValue: parseFloat(converterState.fromValue),
        fromUnit: converterState.fromUnit,
        toValue: convertedValue,
        toUnit: converterState.toUnit,
        category: converterState.selectedCategory,
        timestamp: new Date()
      };
      setConverterState(prev => ({
        ...prev,
        conversionHistory: [newHistory, ...prev.conversionHistory.slice(0, 9)]
      }));
    }
  };

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
      {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-xl mb-4">
            <CalculatorIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Scientific Calculators
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
            Professional-grade calculators for research, laboratory work, and academic studies
        </p>
                </div>

        {/* Main Interface */}
        <div className="max-w-6xl mx-auto">
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('calculators')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'calculators'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalculatorIcon className="w-4 h-4" />
                    Calculators
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('converters')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'converters'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RefreshIcon className="w-4 h-4" />
                    Unit Converters
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Calculators Tab */}
          {activeTab === 'calculators' && (
            <div className="space-y-8">

              {/* Calculator Selection */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Calculator</label>
                    <div className="relative">
                      <select
                        value={calcState.selectedCalculator || ''}
                        onChange={(e) => handleCalculatorSelect(e.target.value as CalculatorName)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Choose a calculator...</option>
                        {Object.entries(CALCULATOR_DEFINITIONS)
                          .filter(([name, calc]) => {
                            const matchesSearch = calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 calc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 calc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
                            
                            const matchesCategory = selectedCalcCategory === 'all' || 
                                                   calc.category === selectedCalcCategory;
                            
                            return matchesSearch && matchesCategory;
                          })
                          .map(([name, calc]) => (
                            <option key={name} value={name}>
                              {calc.name} ({calc.category})
                            </option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {['all', 'basic', 'chemistry', 'biology', 'physics', 'statistics'].map((category) => (
                      <button
                          key={category}
                          onClick={() => setSelectedCalcCategory(category)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedCalcCategory === category
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                            ))}
                        </div>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                </div>
                </div>
                 </div>

              {/* Quick Access */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Quick Access</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['molarity', 'dilution', 'ph', 'concentration', 'molecular_weight', 'buffer'].map((calcName) => {
                    const calc = CALCULATOR_DEFINITIONS[calcName as CalculatorName];
                    if (!calc) return null;
                    return (
                      <button
                        key={calcName}
                        onClick={() => handleCalculatorSelect(calcName as CalculatorName)}
                        className="px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 hover:text-yellow-800 rounded-lg text-sm font-medium transition-colors"
                      >
                        {calc.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Calculator */}
              {calcState.selectedCalculator && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <CalculatorIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {CALCULATOR_DEFINITIONS[calcState.selectedCalculator].name}
                        </h3>
                      </div>
                      <p className="text-gray-600">
                        {CALCULATOR_DEFINITIONS[calcState.selectedCalculator].description}
                      </p>
                    </div>
                  </div>

                  {/* Formula */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Formula:</h4>
                    <p className="font-mono text-sm bg-white border border-gray-200 px-3 py-2 rounded text-gray-800">
                      {CALCULATOR_DEFINITIONS[calcState.selectedCalculator].formula}
                    </p>
              </div>

              {/* Input Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.entries(CALCULATOR_INPUTS[calcState.selectedCalculator]).map(([field, input]) => (
                      <div key={field} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {input.label}
                        {input.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                        <input
                          type={input.type === 'number' ? 'number' : 'text'}
                          value={calcState.inputs[field] || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder={input.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={input.required}
                        />
                      {input.helpText && (
                        <p className="text-xs text-gray-500">{input.helpText}</p>
                      )}
                </div>
                  ))}
                </div>

              {/* Calculate Button */}
              <div className="flex justify-center mb-6">
                    <button
                  onClick={handleCalculate}
                      className="px-8 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Calculate
                    </button>
              </div>

              {/* Results */}
                  {calcState.result && (
                    <div className="space-y-4">
                      {/* Main Result */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-900">Result:</h4>
                </div>
                        <div className="text-2xl font-bold text-green-800">
                          {calcState.result.value} {calcState.result.unit}
                </div>
                        {calcState.result.explanation && (
                          <p className="text-sm text-green-700 mt-2">{calcState.result.explanation}</p>
                        )}
                        {calcState.result.confidence && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-600">Confidence:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${calcState.result.confidence * 100}%` }}
                              ></div>
                </div>
                            <span className="text-xs text-gray-600">{(calcState.result.confidence * 100).toFixed(0)}%</span>
                    </div>
                      )}
                    </div>
                    
                      {/* Warnings */}
                      {calcState.result.warnings && calcState.result.warnings.length > 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                            <h4 className="font-semibold text-yellow-900">Warnings:</h4>
                </div>
                          <ul className="space-y-1">
                            {calcState.result.warnings.map((warning, index) => (
                              <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                                <span className="text-yellow-600 mt-0.5">•</span>
                                {warning}
                              </li>
                          ))}
                        </ul>
                </div>
                    )}

                      {/* Suggestions */}
                      {calcState.result.suggestions && calcState.result.suggestions.length > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <LightbulbIcon className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-900">Suggestions:</h4>
                          </div>
                          <ul className="space-y-1">
                            {calcState.result.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">💡</span>
                                {suggestion}
                              </li>
                          ))}
                        </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {calcState.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-red-900">Error:</h4>
                </div>
                      <p className="text-red-700">{calcState.error}</p>
                    </div>
                    )}
                </div>
              )}
            </div>
              )}

          {/* Converters Tab */}
          {activeTab === 'converters' && (
            <div className="space-y-8">
              
              {/* Category Selection */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Conversion Type</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {conversionCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setConverterState(prev => ({ ...prev, selectedCategory: category.name }))}
                      className={`p-4 rounded-xl text-center transition-all duration-200 ${
                        converterState.selectedCategory === category.name
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          converterState.selectedCategory === category.name
                            ? 'bg-white/20'
                            : 'bg-blue-100'
                        }`}>
                          <category.icon className={`w-4 h-4 ${
                            converterState.selectedCategory === category.name ? 'text-white' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="text-sm font-medium capitalize">
                          {category.name}
                        </div>
                    </div>
                    </button>
                  ))}
                </div>
                            </div>

              {/* Conversion Interface */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {conversionCategories.find(cat => cat.name === converterState.selectedCategory)?.name.charAt(0).toUpperCase()}
                  {conversionCategories.find(cat => cat.name === converterState.selectedCategory)?.name.slice(1)} Conversion
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={converterState.fromValue}
                          onChange={(e) => setConverterState(prev => ({ ...prev, fromValue: e.target.value }))}
                          placeholder="Enter value"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                          value={converterState.fromUnit}
                          onChange={(e) => setConverterState(prev => ({ ...prev, fromUnit: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {conversionCategories
                            .find(cat => cat.name === converterState.selectedCategory)
                            ?.units.map(unit => (
                              <option key={unit.name} value={unit.name}>
                                {unit.name} ({unit.symbol})
                              </option>
                            ))}
                        </select>
                             </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <div className="space-y-2">
                        <input
                          type="text"
                          value={converterState.toValue}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <select
                          value={converterState.toUnit}
                          onChange={(e) => setConverterState(prev => ({ ...prev, toUnit: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {conversionCategories
                            .find(cat => cat.name === converterState.selectedCategory)
                            ?.units.map(unit => (
                              <option key={unit.name} value={unit.name}>
                                {unit.name} ({unit.symbol})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleConversion}
                    className="px-8 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Convert
                  </button>
                </div>
              </div>

              {/* Conversion History */}
              {converterState.conversionHistory.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <HistoryIcon className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Recent Conversions</h3>
                  </div>
                  <div className="space-y-3">
                    {converterState.conversionHistory.slice(0, 5).map((conversion) => (
                      <div key={conversion.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {conversion.fromValue} {conversion.fromUnit} = {conversion.toValue} {conversion.toUnit}
                          </span>
                          <span className="text-xs text-gray-500">
                            {conversion.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                                ))}
                            </div>
                        </div>
                    )}
            </div>
          )}
                                        </div>
                                    </div>
        </div>
    );
};

export default CalculatorHubPage;