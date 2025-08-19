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
  FilterIcon
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
  const [activeTab, setActiveTab] = useState<'calculators' | 'converter'>('calculators');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalcCategory, setSelectedCalcCategory] = useState<string>('all');
  
  // Calculator state
  const [calcState, setCalcState] = useState<CalculatorState>({
    selectedCalculator: null,
    inputs: {},
    result: null,
    error: null,
    showHistory: false,
    favorites: [],
    recentCalculations: [],
    savedCalculations: []
  });

  // Unit converter state
  const [selectedConverterCategory, setSelectedConverterCategory] = useState<string>('length');
  const [fromUnit, setFromUnit] = useState<string>('');
  const [toUnit, setToUnit] = useState<string>('');
  const [fromValue, setFromValue] = useState<string>('1');
  const [toValue, setToValue] = useState<string>('');
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [converterFavorites, setConverterFavorites] = useState<string[]>([]);

  // Group calculators by category, excluding specified categories
  const excludedCategories = ['Molecular & Cell Biology', 'Statistics & Data Analysis', 'Bioinformatics', 'Engineering & Physics'];
  
  const calculatorsByCategory = Object.values(CALCULATOR_DEFINITIONS)
    .filter(calc => !excludedCategories.includes(calc.category))
    .reduce((acc, calc) => {
      if (!acc[calc.category]) {
        acc[calc.category] = [];
      }
      acc[calc.category].push(calc);
      return acc;
    }, {} as Record<string, typeof CALCULATOR_DEFINITIONS[keyof typeof CALCULATOR_DEFINITIONS][]>);

  const filteredCalculators = Object.entries(calculatorsByCategory)
    .filter(([category]) => selectedCalcCategory === 'all' || category === selectedCalcCategory)
    .filter(([_, calcs]) => {
      const calcArray = calcs as Array<typeof CALCULATOR_DEFINITIONS[keyof typeof CALCULATOR_DEFINITIONS]>;
      return calcArray.some(calc => 
        calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        calc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        calc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

  // Define conversion categories and units
  const conversionCategories: ConversionCategory[] = [
    {
      name: 'length',
      units: [
        { name: 'Meter', symbol: 'm', category: 'length', toBase: (v) => v, fromBase: (v) => v },
        { name: 'Kilometer', symbol: 'km', category: 'length', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { name: 'Centimeter', symbol: 'cm', category: 'length', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
        { name: 'Millimeter', symbol: 'mm', category: 'length', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { name: 'Mile', symbol: 'mi', category: 'length', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
        { name: 'Yard', symbol: 'yd', category: 'length', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
        { name: 'Foot', symbol: 'ft', category: 'length', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
        { name: 'Inch', symbol: 'in', category: 'length', toBase: (v) => v * 0.0254, fromBase: (v) => v * 0.0254 },
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
    const category = conversionCategories.find(cat => cat.name === selectedConverterCategory);
    if (category && category.units.length > 0) {
      setFromUnit(category.units[0].name);
      setToUnit(category.units[1]?.name || category.units[0].name);
    }
  }, [selectedConverterCategory]);

  // Handle unit conversion
  const handleConversion = () => {
    if (!fromUnit || !toUnit || !fromValue) return;

    const fromUnitObj = conversionCategories
      .find(cat => cat.name === selectedConverterCategory)
      ?.units.find(unit => unit.name === fromUnit);
    
    const toUnitObj = conversionCategories
      .find(cat => cat.name === selectedConverterCategory)
      ?.units.find(unit => unit.name === toUnit);

    if (fromUnitObj && toUnitObj) {
      const baseValue = fromUnitObj.toBase(parseFloat(fromValue));
      const convertedValue = toUnitObj.fromBase(baseValue);
      setToValue(convertedValue.toFixed(6));

      // Add to history
      const newHistory: ConversionHistory = {
        id: Date.now().toString(),
        fromValue: parseFloat(fromValue),
        fromUnit,
        toValue: convertedValue,
        toUnit,
        category: selectedConverterCategory,
        timestamp: new Date()
      };
      setConversionHistory(prev => [newHistory, ...prev.slice(0, 9)]);
    }
  };

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

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setConverterFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-xl mb-6 transform hover:scale-105 transition-transform duration-200">
            <CalculatorIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            🧮 Calculator Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Advanced scientific calculators and unit conversion tools for research, laboratory work, and academic studies
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{Object.keys(CALCULATOR_DEFINITIONS).length}+</div>
              <div className="text-sm text-gray-500">Scientific Calculators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">20+</div>
              <div className="text-sm text-gray-500">Unit Conversions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">∞</div>
              <div className="text-sm text-gray-500">Calculations</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search calculators (e.g., molarity, dilution, pH, statistics)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-xl border border-gray-100">
            <button
              onClick={() => setActiveTab('calculators')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'calculators'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CalculatorIcon className="w-5 h-5 inline mr-2" />
              Basic Calculators
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'converter'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <SettingsIcon className="w-5 h-5 inline mr-2" />
              Unit Converter
            </button>
          </div>
        </div>

        {/* Basic Calculators Tab */}
        {activeTab === 'calculators' && (
          <div className="space-y-8">
            {/* Category Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <button
                onClick={() => setSelectedCalcCategory('all')}
                className={`p-4 rounded-2xl transition-all duration-200 ${
                  selectedCalcCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white hover:shadow-lg hover:-translate-y-1 border border-gray-100'
                }`}
              >
                <div className="text-center">
                  <CalculatorIcon className={`w-8 h-8 mx-auto mb-2 ${
                    selectedCalcCategory === 'all' ? 'text-white' : 'text-gray-600'
                  }`} />
                  <p className={`text-sm font-medium ${
                    selectedCalcCategory === 'all' ? 'text-white' : 'text-gray-700'
                  }`}>
                    All Categories
                  </p>
                </div>
              </button>
              
              {Array.from(new Set(Object.values(CALCULATOR_DEFINITIONS).map(calc => calc.category)))
                .filter(category => !excludedCategories.includes(category))
                .map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCalcCategory(category)}
                    className={`p-4 rounded-2xl transition-all duration-200 ${
                      selectedCalcCategory === category
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'bg-white hover:shadow-lg hover:-translate-y-1 border border-gray-100'
                    }`}
                  >
                    <div className="text-center">
                      <BeakerIcon className={`w-8 h-8 mx-auto mb-2 ${
                        selectedCalcCategory === category ? 'text-white' : 'text-gray-600'
                      }`} />
                      <p className={`text-sm font-medium capitalize ${
                        selectedCalcCategory === category ? 'text-white' : 'text-gray-700'
                      }`}>
                        {category}
                      </p>
                    </div>
                  </button>
                ))}
            </div>

            {/* Calculator Interface */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calculator Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Calculator</label>
                  <select
                    value={calcState.selectedCalculator || ''}
                    onChange={(e) => handleCalculatorSelect(e.target.value as CalculatorName)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Choose a calculator...</option>
                    {filteredCalculators.map(([category, calcs]) => (
                      <optgroup key={category} label={category}>
                        {(calcs as Array<typeof CALCULATOR_DEFINITIONS[keyof typeof CALCULATOR_DEFINITIONS]>).map((calc) => (
                          <option key={calc.name} value={calc.name}>
                            {calc.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  
                  {calcState.selectedCalculator && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-medium text-blue-900 mb-2">
                        {CALCULATOR_DEFINITIONS[calcState.selectedCalculator].name}
                      </h4>
                      <p className="text-sm text-blue-700 mb-3">
                        {CALCULATOR_DEFINITIONS[calcState.selectedCalculator].description}
                      </p>
                      <div className="text-xs text-blue-600">
                        <strong>Formula:</strong> {CALCULATOR_DEFINITIONS[calcState.selectedCalculator].formula}
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculator Inputs */}
                {calcState.selectedCalculator && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Input Values</label>
                    <div className="space-y-4">
                      {CALCULATOR_INPUTS[calcState.selectedCalculator]?.map((input) => (
                        <div key={input.name}>
                          <label className="block text-sm text-gray-600 mb-1">{input.label}</label>
                          <input
                            type="number"
                            value={calcState.inputs[input.name] || ''}
                            onChange={(e) => handleInputChange(input.name, parseFloat(e.target.value) || '')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder={`Enter ${input.label.toLowerCase()}`}
                            step={input.step || 'any'}
                          />
                          <div className="text-xs text-gray-500 mt-1">Unit: {input.unit}</div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleCalculate}
                      className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Calculate
                    </button>
                  </div>
                )}
              </div>

              {/* Results */}
              {calcState.result && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Calculation Result</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {calcState.result.value}
                      </div>
                      <div className="text-xl text-gray-600">
                        {calcState.result.unit}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {calcState.result.explanation && (
                        <div className="p-3 bg-white rounded-lg">
                          <div className="text-sm font-medium text-gray-700">Explanation</div>
                          <div className="text-sm text-gray-600">{calcState.result.explanation}</div>
                        </div>
                      )}
                      {calcState.result.warnings && calcState.result.warnings.length > 0 && (
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <div className="text-sm font-medium text-yellow-800">Warnings</div>
                          <div className="text-sm text-yellow-700">{calcState.result.warnings.join(', ')}</div>
                        </div>
                      )}
                      {calcState.result.suggestions && calcState.result.suggestions.length > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-800">Suggestions</div>
                          <div className="text-sm text-blue-700">{calcState.result.suggestions.join(', ')}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {calcState.error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-red-800">
                    <strong>Error:</strong> {calcState.error}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Calculations */}
            {calcState.recentCalculations.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Calculations</h3>
                <div className="space-y-3">
                  {calcState.recentCalculations.slice(0, 5).map((calc) => (
                    <div
                      key={calc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-medium text-gray-900">
                          {calc.calculator}
                        </span>
                        <span className="text-sm text-gray-500">
                          {calc.result.value} {calc.result.unit}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(calc.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unit Converter Tab */}
        {activeTab === 'converter' && (
          <div className="space-y-8">
            {/* Category Selection */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {conversionCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedConverterCategory(category.name)}
                  className={`p-4 rounded-2xl transition-all duration-200 ${
                    selectedConverterCategory === category.name
                      ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-lg scale-105'
                      : 'bg-white hover:shadow-lg hover:-translate-y-1 border border-gray-100'
                  }`}
                >
                  <div className="text-center">
                    <category.icon className={`w-8 h-8 mx-auto mb-2 ${
                      selectedConverterCategory === category.name ? 'text-white' : 'text-gray-600'
                    }`} />
                    <p className={`text-sm font-medium capitalize ${
                      selectedConverterCategory === category.name ? 'text-white' : 'text-gray-700'
                    }`}>
                      {category.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Converter Interface */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                {/* From Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {conversionCategories
                      .find(cat => cat.name === selectedConverterCategory)
                      ?.units.map((unit) => (
                        <option key={unit.name} value={unit.name}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Value Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                  <input
                    type="number"
                    value={fromValue}
                    onChange={(e) => setFromValue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter value"
                  />
                </div>

                {/* To Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {conversionCategories
                      .find(cat => cat.name === selectedConverterCategory)
                      ?.units.map((unit) => (
                        <option key={unit.name} value={unit.name}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Convert Button */}
              <div className="text-center mt-6">
                <button
                  onClick={handleConversion}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Convert
                </button>
              </div>

              {/* Result */}
              {toValue && (
                <div className="mt-8 text-center">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-8">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {toValue}
                    </div>
                    <div className="text-xl text-gray-600">
                      {toUnit}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Conversion History */}
            {conversionHistory.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Conversions</h3>
                <div className="space-y-3">
                  {conversionHistory.slice(0, 5).map((conversion) => (
                    <div
                      key={conversion.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-medium text-gray-900">
                          {conversion.fromValue} {conversion.fromUnit}
                        </span>
                        <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-lg font-medium text-gray-900">
                          {conversion.toValue.toFixed(4)} {conversion.toUnit}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 capitalize">
                        {conversion.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorHubPage;