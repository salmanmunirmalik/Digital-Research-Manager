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
  SparklesIcon,
  TreeIcon,
  ShieldIcon
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
  const [activeTab, setActiveTab] = useState<'molecular-bio' | 'biochemistry' | 'cell-biology' | 'analytical-chem' | 'neuroscience' | 'immunology' | 'ecology' | 'engineering'>('molecular-bio');
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
                  onClick={() => setActiveTab('molecular-bio')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeTab === 'molecular-bio'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <DnaIcon className="w-3 h-3" />
                    Molecular Bio
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('biochemistry')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeTab === 'biochemistry'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <BeakerIcon className="w-3 h-3" />
                    Biochemistry
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('cell-biology')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeTab === 'cell-biology'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <MicroscopeIcon className="w-3 h-3" />
                    Cell Biology
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('analytical-chem')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeTab === 'analytical-chem'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <BarChartIcon className="w-3 h-3" />
                    Analytical Chem
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('neuroscience')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeTab === 'neuroscience'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <BrainCircuitIcon className="w-3 h-3" />
                    Neuroscience
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('immunology')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeTab === 'immunology'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <ShieldIcon className="w-3 h-3" />
                    Immunology
              </div>
                </button>
                <button
                  onClick={() => setActiveTab('ecology')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeTab === 'ecology'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <TreeIcon className="w-3 h-3" />
                    Ecology
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('engineering')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeTab === 'engineering'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <SettingsIcon className="w-3 h-3" />
                    Engineering
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Molecular Biology Tab */}
          {activeTab === 'molecular-bio' && (
            <div className="space-y-8">
              
              {/* DNA/RNA Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* DNA/RNA Analysis */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DnaIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">DNA/RNA Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Reverse Complement Tool</div>
                      <div className="text-sm text-gray-600">Generate reverse complement of DNA/RNA sequences</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Transcription/Translation Tool</div>
                      <div className="text-sm text-gray-600">Convert DNA to RNA and translate to protein</div>
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
                      <CodeIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Primer Design</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">PCR Primer Designer</div>
                      <div className="text-sm text-gray-600">Design optimal PCR primers with melting temperature</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">qPCR Primer Designer</div>
                      <div className="text-sm text-gray-600">Design primers for quantitative PCR experiments</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Sequencing Primer Designer</div>
                      <div className="text-sm text-gray-600">Design primers for Sanger sequencing</div>
                    </button>
                  </div>
                </div>

                {/* Restriction & Cloning */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Restriction & Cloning</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Restriction Enzyme Mapper</div>
                      <div className="text-sm text-gray-600">Map restriction enzyme cutting sites</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Codon Optimization Tool</div>
                      <div className="text-sm text-gray-600">Optimize codons for expression in different organisms</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Plasmid Map Visualizer</div>
                      <div className="text-sm text-gray-600">Visualize plasmid maps and features</div>
                    </button>
                  </div>
                </div>

                {/* PCR & Amplification */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">PCR & Amplification</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">PCR Cycle Time Estimator</div>
                      <div className="text-sm text-gray-600">Estimate PCR cycle times and conditions</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Master Mix Calculator</div>
                      <div className="text-sm text-gray-600">Calculate PCR master mix components</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">qPCR Efficiency Calculator</div>
                      <div className="text-sm text-gray-600">Calculate qPCR amplification efficiency</div>
                    </button>
                  </div>
                </div>

                {/* CRISPR & Cloning */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <MicroscopeIcon className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">CRISPR & Cloning</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">CRISPR gRNA Designer</div>
                      <div className="text-sm text-gray-600">Design guide RNAs for CRISPR experiments</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Gibson Assembly Assistant</div>
                      <div className="text-sm text-gray-600">Design Gibson assembly strategies</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Golden Gate Assistant</div>
                      <div className="text-sm text-gray-600">Design Golden Gate cloning strategies</div>
                    </button>
                  </div>
                </div>

                {/* Melting Temperature */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-pink-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Melting Temperature</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Tm Calculator</div>
                      <div className="text-sm text-gray-600">Calculate melting temperature for primers</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Annealing Temperature</div>
                      <div className="text-sm text-gray-600">Calculate optimal annealing temperature</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Salt Correction</div>
                      <div className="text-sm text-gray-600">Correct Tm for salt concentration</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Biochemistry Tab */}
          {activeTab === 'biochemistry' && (
            <div className="space-y-8">
              
              {/* Biochemistry Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Enzymes & Kinetics */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Enzymes & Kinetics</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Michaelis-Menten Calculator</div>
                      <div className="text-sm text-gray-600">Calculate Km, Vmax, and enzyme kinetics parameters</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Lineweaver-Burk Plot Generator</div>
                      <div className="text-sm text-gray-600">Generate Lineweaver-Burk plots for enzyme analysis</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Eadie-Hofstee Plot Generator</div>
                      <div className="text-sm text-gray-600">Generate Eadie-Hofstee plots for kinetic analysis</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Enzyme Inhibition Models</div>
                      <div className="text-sm text-gray-600">Analyze competitive, non-competitive, and uncompetitive inhibition</div>
                    </button>
                  </div>
                </div>

                {/* Protein Chemistry */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DnaIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Protein Chemistry</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Amino Acid Composition & MW</div>
                      <div className="text-sm text-gray-600">Calculate amino acid composition and molecular weight</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Isoelectric Point (pI) Calculator</div>
                      <div className="text-sm text-gray-600">Calculate isoelectric point of proteins</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Extinction Coefficient Calculator</div>
                      <div className="text-sm text-gray-600">Calculate protein concentration from absorbance</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Hydropathy Plots</div>
                      <div className="text-sm text-gray-600">Generate hydrophobicity analysis plots</div>
                    </button>
                  </div>
                </div>

                {/* Metabolism */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Metabolism</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Gibbs Free Energy Calculator</div>
                      <div className="text-sm text-gray-600">Calculate Gibbs free energy changes</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">ATP Yield Estimator</div>
                      <div className="text-sm text-gray-600">Estimate ATP yield from glycolysis, TCA cycle, and oxidative phosphorylation</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Redox Potential Calculator</div>
                      <div className="text-sm text-gray-600">Calculate standard reduction potentials</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cell Biology Tab */}
          {activeTab === 'cell-biology' && (
            <div className="space-y-8">
              
              {/* Cell Biology Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Cell Culture */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MicroscopeIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Cell Culture</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Cell Doubling Time Calculator</div>
                      <div className="text-sm text-gray-600">Calculate cell doubling time from growth curves</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Cell Density Converter</div>
                      <div className="text-sm text-gray-600">Convert between cell density and seeding density</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Viability Calculator</div>
                      <div className="text-sm text-gray-600">Calculate cell viability from Trypan blue counting</div>
                    </button>
                  </div>
                </div>

                {/* Microscopy */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Microscopy</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Resolution Limit Calculator</div>
                      <div className="text-sm text-gray-600">Calculate theoretical resolution limits for different microscopes</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Fluorescent Dye Overlap Checker</div>
                      <div className="text-sm text-gray-600">Check for spectral overlap between fluorescent dyes</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Image Scale/Bar Generator</div>
                      <div className="text-sm text-gray-600">Generate scale bars for microscopy images</div>
                    </button>
                  </div>
                </div>

                {/* Flow Cytometry */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Flow Cytometry</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Compensation Matrix Calculator</div>
                      <div className="text-sm text-gray-600">Calculate compensation matrices for flow cytometry</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Gating Strategy Helper</div>
                      <div className="text-sm text-gray-600">Design optimal gating strategies for flow cytometry</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Fluorescence Spillover Predictor</div>
                      <div className="text-sm text-gray-600">Predict fluorescence spillover between channels</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytical Chemistry Tab */}
          {activeTab === 'analytical-chem' && (
            <div className="space-y-8">
              
              {/* Analytical Chemistry Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Spectroscopy */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Spectroscopy</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Beer-Lambert Law Calculator</div>
                      <div className="text-sm text-gray-600">Calculate concentration from absorbance using Beer-Lambert law</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Absorbance to Concentration Converter</div>
                      <div className="text-sm text-gray-600">Convert absorbance values to concentration</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">NMR Chemical Shift Predictor</div>
                      <div className="text-sm text-gray-600">Predict NMR chemical shifts for organic molecules</div>
                    </button>
                  </div>
                </div>

                {/* Chromatography */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Chromatography</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Retention Factor (Rf) Calculator</div>
                      <div className="text-sm text-gray-600">Calculate retention factors for TLC analysis</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">HPLC Gradient Design Tool</div>
                      <div className="text-sm text-gray-600">Design optimal HPLC gradient programs</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Resolution & Peak Capacity Calculator</div>
                      <div className="text-sm text-gray-600">Calculate chromatographic resolution and peak capacity</div>
                    </button>
                  </div>
                </div>

                {/* Mass Spectrometry */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Mass Spectrometry</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Isotope Pattern Generator</div>
                      <div className="text-sm text-gray-600">Generate theoretical isotope patterns for molecules</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">m/z Calculator for Peptides</div>
                      <div className="text-sm text-gray-600">Calculate m/z values for peptides and small molecules</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Mass Accuracy Calculator</div>
                      <div className="text-sm text-gray-600">Calculate mass accuracy and ppm error</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Neuroscience Tab */}
          {activeTab === 'neuroscience' && (
            <div className="space-y-8">
              
              {/* Neuroscience Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Neural Analysis */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BrainCircuitIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Neural Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Neural Firing Rate Analysis</div>
                      <div className="text-sm text-gray-600">Analyze neural firing rates and patterns</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Spike Train Analysis</div>
                      <div className="text-sm text-gray-600">Analyze spike trains and generate raster plots</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">EEG Frequency Band Calculator</div>
                      <div className="text-sm text-gray-600">Calculate EEG frequency bands and power spectra</div>
                    </button>
                  </div>
                </div>

                {/* Neuropharmacology */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Neuropharmacology</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Dose-Response Curve Fitter</div>
                      <div className="text-sm text-gray-600">Fit dose-response curves for neuropharmacological data</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">IC50/EC50 Calculator</div>
                      <div className="text-sm text-gray-600">Calculate IC50 and EC50 values from dose-response data</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Hill Slope Calculator</div>
                      <div className="text-sm text-gray-600">Calculate Hill slope for dose-response curves</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Immunology Tab */}
          {activeTab === 'immunology' && (
            <div className="space-y-8">
              
              {/* Immunology Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Antibody Analysis */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShieldIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Antibody Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Antibody Dilution Calculator</div>
                      <div className="text-sm text-gray-600">Calculate antibody dilutions for optimal staining</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">ELISA Standard Curve Fitting</div>
                      <div className="text-sm text-gray-600">Fit standard curves for ELISA analysis</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Cytokine Concentration Estimator</div>
                      <div className="text-sm text-gray-600">Estimate cytokine concentrations from assay data</div>
                    </button>
                  </div>
                </div>

                {/* Immune Repertoire */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DnaIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Immune Repertoire</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">VDJ Recombination Analysis</div>
                      <div className="text-sm text-gray-600">Analyze VDJ recombination patterns in immune cells</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Clonality Analysis</div>
                      <div className="text-sm text-gray-600">Analyze clonality and diversity in immune repertoires</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Somatic Hypermutation Analysis</div>
                      <div className="text-sm text-gray-600">Analyze somatic hypermutation patterns</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ecology Tab */}
          {activeTab === 'ecology' && (
            <div className="space-y-8">
              
              {/* Ecology Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Population Dynamics */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TreeIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Population Dynamics</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Population Growth Models</div>
                      <div className="text-sm text-gray-600">Model logistic and exponential population growth</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Carrying Capacity Calculator</div>
                      <div className="text-sm text-gray-600">Calculate carrying capacity for populations</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Biodiversity Indices</div>
                      <div className="text-sm text-gray-600">Calculate Shannon, Simpson, and other diversity indices</div>
                    </button>
                  </div>
                </div>

                {/* Environmental Science */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Environmental Science</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Climate Modeling Calculator</div>
                      <div className="text-sm text-gray-600">Basic CO₂ impact and climate modeling tools</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Environmental Toxicology</div>
                      <div className="text-sm text-gray-600">LC50, risk assessment, and toxicity calculations</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Carbon Footprint Calculator</div>
                      <div className="text-sm text-gray-600">Calculate carbon footprint and environmental impact</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engineering Tab */}
          {activeTab === 'engineering' && (
            <div className="space-y-8">
              
              {/* Engineering Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Materials Science */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Materials Science</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Nanomaterial Surface Area Calculator</div>
                      <div className="text-sm text-gray-600">Calculate surface area for nanomaterials</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Crystallography Calculator</div>
                      <div className="text-sm text-gray-600">Calculate unit cell volume and lattice spacing</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Mechanical Property Estimator</div>
                      <div className="text-sm text-gray-600">Estimate Young's modulus and tensile strength</div>
                    </button>
                  </div>
                </div>

                {/* Heat Transfer */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Heat Transfer</h3>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Heat Transfer Calculator</div>
                      <div className="text-sm text-gray-600">Calculate heat transfer rates and coefficients</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Diffusion Calculator</div>
                      <div className="text-sm text-gray-600">Calculate diffusion rates and coefficients</div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                      <div className="font-medium text-gray-900">Thermal Conductivity Calculator</div>
                      <div className="text-sm text-gray-600">Calculate thermal conductivity of materials</div>
                    </button>
                  </div>
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