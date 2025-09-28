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

const ResearchToolsPage: React.FC = () => {
  // Core state management
  const [activeTab, setActiveTab] = useState<'lab-prep' | 'molecular-bio' | 'bioinformatics'>('lab-prep');
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
            <BeakerIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Research Tools Hub
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive suite of calculators, designers, and analysis tools to streamline research workflows and reduce human errors
        </p>
                </div>

        {/* Main Interface */}
        <div className="max-w-6xl mx-auto">
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setActiveTab('lab-prep')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'lab-prep'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BeakerIcon className="w-4 h-4" />
                    Lab Prep
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('molecular-bio')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'molecular-bio'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DnaIcon className="w-4 h-4" />
                    Molecular Bio
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('bioinformatics')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'bioinformatics'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CodeIcon className="w-4 h-4" />
                    Bioinformatics
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Lab Preparation Tab */}
          {activeTab === 'lab-prep' && (
            <div className="space-y-8">

              {/* Lab Preparation Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Solution Preparation */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <PipetteIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Solution Preparation</h3>
                  </div>
                  <div className="space-y-3">
                    {['Molarity Calculator', 'Dilution Calculator (M1V1=M2V2)', 'Buffer pH Calculator (Henderson-Hasselbalch)'].map((calcName) => {
                      const calc = CALCULATOR_DEFINITIONS[calcName as CalculatorName];
                      if (!calc) return null;
                      return (
                        <button
                          key={calcName}
                          onClick={() => handleCalculatorSelect(calcName as CalculatorName)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-gray-900">{calc.name}</div>
                          <div className="text-sm text-gray-600">{calc.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Equipment Setup */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Equipment Setup</h3>
                  </div>
                  <div className="space-y-3">
                    {['Centrifugation Calculator', 'PCR Master Mix Calculator'].map((calcName) => {
                      const calc = CALCULATOR_DEFINITIONS[calcName as CalculatorName];
                      if (!calc) return null;
                      return (
                        <button
                          key={calcName}
                          onClick={() => handleCalculatorSelect(calcName as CalculatorName)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-gray-900">{calc.name}</div>
                          <div className="text-sm text-gray-600">{calc.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Unit Converters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <RefreshIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Unit Converters</h3>
                  </div>
                  <div className="space-y-3">
                    {conversionCategories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => setConverterState(prev => ({ ...prev, selectedCategory: category.name }))}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <div className="font-medium text-gray-900 capitalize">{category.name}</div>
                        <div className="text-sm text-gray-600">{category.units.length} units available</div>
                      </button>
                            ))}
                </div>
                </div>
                 </div>

              {/* Popular Lab Tools */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Popular Lab Tools</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Molarity Calculator', 'Dilution Calculator (M1V1=M2V2)', 'Buffer pH Calculator (Henderson-Hasselbalch)', 'Centrifugation Calculator'].map((calcName) => {
                    const calc = CALCULATOR_DEFINITIONS[calcName as CalculatorName];
                    if (!calc) return null;
                    return (
                      <button
                        key={calcName}
                        onClick={() => handleCalculatorSelect(calcName as CalculatorName)}
                        className="p-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 hover:text-yellow-800 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        {calc.name.split(' ')[0]}
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

          {/* Molecular Biology Tab */}
          {activeTab === 'molecular-bio' && (
            <div className="space-y-8">
              
              {/* Molecular Biology Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* PCR & Amplification */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DnaIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">PCR & Amplification</h3>
                  </div>
                  <div className="space-y-3">
                    {['PCR Master Mix Calculator', 'Primer Design Calculator', 'Annealing Temperature Calculator'].map((calcName) => {
                      const calc = CALCULATOR_DEFINITIONS[calcName as CalculatorName];
                      if (!calc) return null;
                      return (
                        <button
                          key={calcName}
                          onClick={() => handleCalculatorSelect(calcName as CalculatorName)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-gray-900">{calc.name}</div>
                          <div className="text-sm text-gray-600">{calc.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Protein Analysis */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Protein Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    {['Protein Concentration Calculator', 'Bradford Assay Calculator', 'Western Blot Calculator'].map((calcName) => {
                      const calc = CALCULATOR_DEFINITIONS[calcName as CalculatorName];
                      if (!calc) return null;
                      return (
                        <button
                          key={calcName}
                          onClick={() => handleCalculatorSelect(calcName as CalculatorName)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-gray-900">{calc.name}</div>
                          <div className="text-sm text-gray-600">{calc.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cell Culture */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MicroscopeIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Cell Culture</h3>
                  </div>
                  <div className="space-y-3">
                    {['Cell Counting Calculator', 'Passage Calculator', 'Viability Calculator'].map((calcName) => {
                      const calc = CALCULATOR_DEFINITIONS[calcName as CalculatorName];
                      if (!calc) return null;
                      return (
                        <button
                          key={calcName}
                          onClick={() => handleCalculatorSelect(calcName as CalculatorName)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <div className="font-medium text-gray-900">{calc.name}</div>
                          <div className="text-sm text-gray-600">{calc.description}</div>
                        </button>
                      );
                    })}
                  </div>
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

          {/* Bioinformatics Tab */}
          {activeTab === 'bioinformatics' && (
            <div className="space-y-8">
              
              {/* Bioinformatics Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sequence Analysis */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CodeIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Sequence Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">DNA Sequence Analyzer</div>
                      <div className="text-sm text-gray-600">Analyze DNA sequences for composition, motifs, and patterns</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Protein Sequence Analyzer</div>
                      <div className="text-sm text-gray-600">Analyze protein sequences for domains and properties</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">GC Content Calculator</div>
                      <div className="text-sm text-gray-600">Calculate GC content and melting temperature</div>
                    </button>
                  </div>
                </div>

                {/* Primer Design */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DnaIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Primer Design</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">PCR Primer Designer</div>
                      <div className="text-sm text-gray-600">Design optimal PCR primers with melting temperature analysis</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">qPCR Primer Designer</div>
                      <div className="text-sm text-gray-600">Design primers for quantitative PCR experiments</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Primer Validation</div>
                      <div className="text-sm text-gray-600">Validate existing primers for specificity and efficiency</div>
                    </button>
                  </div>
                </div>

                {/* Phylogenetic Analysis */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TreeIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Phylogenetic Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Multiple Sequence Alignment</div>
                      <div className="text-sm text-gray-600">Align multiple DNA or protein sequences</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Distance Matrix Calculator</div>
                      <div className="text-sm text-gray-600">Calculate evolutionary distances between sequences</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Phylogenetic Tree Builder</div>
                      <div className="text-sm text-gray-600">Build phylogenetic trees from sequence data</div>
                    </button>
                  </div>
                </div>

                {/* Genomic Analysis */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Genomic Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">ORF Finder</div>
                      <div className="text-sm text-gray-600">Find open reading frames in DNA sequences</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Restriction Site Mapper</div>
                      <div className="text-sm text-gray-600">Map restriction enzyme cutting sites</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Codon Usage Analyzer</div>
                      <div className="text-sm text-gray-600">Analyze codon usage patterns and bias</div>
                    </button>
                  </div>
                </div>

                {/* Protein Bioinformatics */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Protein Bioinformatics</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Protein Structure Predictor</div>
                      <div className="text-sm text-gray-600">Predict secondary structure from amino acid sequence</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Domain Finder</div>
                      <div className="text-sm text-gray-600">Identify functional domains in protein sequences</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Hydrophobicity Plot</div>
                      <div className="text-sm text-gray-600">Generate hydrophobicity plots for membrane proteins</div>
                    </button>
                  </div>
                </div>

                {/* Data Visualization */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-5 h-5 text-pink-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Data Visualization</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Sequence Logo Generator</div>
                      <div className="text-sm text-gray-600">Create sequence logos from multiple alignments</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Heatmap Generator</div>
                      <div className="text-sm text-gray-600">Generate heatmaps for expression data</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Phylogenetic Tree Viewer</div>
                      <div className="text-sm text-gray-600">Visualize and annotate phylogenetic trees</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Coming Soon Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <CodeIcon className="w-8 h-8 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Advanced Bioinformatics Tools</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  More powerful bioinformatics tools are coming soon, including machine learning-based predictions, 
                  advanced statistical analysis, and integration with major databases.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['BLAST Search', 'Genome Assembly', 'Variant Calling', 'Pathway Analysis', 'Network Analysis', 'Machine Learning Predictions'].map((tool) => (
                    <span key={tool} className="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-200">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
                                        </div>
                                    </div>
        </div>
    );
};

export default ResearchToolsPage;