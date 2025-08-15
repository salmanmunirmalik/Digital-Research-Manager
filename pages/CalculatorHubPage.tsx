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
  const [selectedCategory, setSelectedCategory] = useState<string>('length');
  const [fromUnit, setFromUnit] = useState<string>('');
  const [toUnit, setToUnit] = useState<string>('');
  const [fromValue, setFromValue] = useState<string>('1');
  const [toValue, setToValue] = useState<string>('');
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalcCategory, setSelectedCalcCategory] = useState<string>('all');

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
    const category = conversionCategories.find(cat => cat.name === selectedCategory);
    if (category && category.units.length > 0) {
      setFromUnit(category.units[0].name);
      setToUnit(category.units[1]?.name || category.units[0].name);
    }
  }, [selectedCategory]);

  // Handle unit conversion
  const handleConversion = () => {
    if (!fromUnit || !toUnit || !fromValue) return;

    const fromUnitObj = conversionCategories
      .find(cat => cat.name === selectedCategory)
      ?.units.find(unit => unit.name === fromUnit);
    
    const toUnitObj = conversionCategories
      .find(cat => cat.name === selectedCategory)
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
        category: selectedCategory,
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
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <CalculatorIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Calculator Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced scientific calculators and unit conversion tools for research and laboratory work
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
            <button
              onClick={() => setActiveTab('calculators')}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'calculators'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CalculatorIcon className="w-5 h-5 inline mr-2" />
              Scientific Calculators
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'converter'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <SettingsIcon className="w-5 h-5 inline mr-2" />
              Unit Converter
            </button>
          </div>
        </div>

        {/* Calculators Tab */}
        {activeTab === 'calculators' && (
          <div className="space-y-8">
            {/* Search and Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search calculators..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={selectedCalcCategory}
                    onChange={(e) => setSelectedCalcCategory(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(calculatorsByCategory).map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculator Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCalculators.map(([category, calcs]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">{category}</h3>
                  <div className="space-y-3">
                    {(calcs as Array<typeof CALCULATOR_DEFINITIONS[keyof typeof CALCULATOR_DEFINITIONS]>).map((calc) => (
                      <div
                        key={calc.name}
                        onClick={() => handleCalculatorSelect(calc.name as CalculatorName)}
                        className={`bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 ${
                          calcState.selectedCalculator === calc.name
                            ? 'border-blue-500 shadow-lg'
                            : 'border-gray-100 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{calc.name}</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toggle favorite logic here
                            }}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            <StarIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{calc.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {calc.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Calculator */}
            {calcState.selectedCalculator && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {CALCULATOR_DEFINITIONS[calcState.selectedCalculator].name}
                  </h3>
                  <button
                    onClick={() => setCalcState(prev => ({ ...prev, selectedCalculator: null }))}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Inputs */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Input Parameters</h4>
                    <div className="space-y-4">
                      {CALCULATOR_INPUTS[calcState.selectedCalculator]?.map((input) => (
                        <div key={input.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {input.label}
                          </label>
                          <input
                            type="number"
                            placeholder={input.placeholder}
                            value={calcState.inputs[input.name] || ''}
                            onChange={(e) => handleInputChange(input.name, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleCalculate}
                      className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Calculate
                    </button>
                  </div>

                  {/* Results */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Results</h4>
                    {calcState.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700">{calcState.error}</p>
                      </div>
                    ) : calcState.result ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-700 mb-2">
                            {calcState.result.value.toFixed(6)}
                          </div>
                          <div className="text-lg text-green-600 mb-4">
                            {calcState.result.unit}
                          </div>
                          {calcState.result.explanation && (
                            <p className="text-green-700">{calcState.result.explanation}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                        <p className="text-gray-500">Enter parameters and click Calculate to see results</p>
                      </div>
                    )}
                  </div>
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
                  onClick={() => setSelectedCategory(category.name)}
                  className={`p-4 rounded-2xl transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-lg scale-105'
                      : 'bg-white hover:shadow-lg hover:-translate-y-1 border border-gray-100'
                  }`}
                >
                  <div className="text-center">
                    <category.icon className={`w-8 h-8 mx-auto mb-2 ${
                      selectedCategory === category.name ? 'text-white' : 'text-gray-600'
                    }`} />
                    <p className={`text-sm font-medium capitalize ${
                      selectedCategory === category.name ? 'text-white' : 'text-gray-700'
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
                      .find(cat => cat.name === selectedCategory)
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
                      .find(cat => cat.name === selectedCategory)
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