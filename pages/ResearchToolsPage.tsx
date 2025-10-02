import React, { useState, useMemo } from 'react';
import { 
  CalculatorIcon, 
  SearchIcon,
  FilterIcon,
  BeakerIcon,
  DnaIcon,
  MicroscopeIcon,
  AtomIcon,
  BrainCircuitIcon,
  ShieldIcon,
  TreeIcon,
  SettingsIcon,
  StarIcon,
  ArrowRightIcon,
  HeartIcon,
  GridIcon,
  ListIcon,
  ClockIcon,

  XMarkIcon,
  InformationCircleIcon,
  TrendingUpIcon
} from '../components/icons';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  type: 'calculator' | 'converter' | 'analyzer' | 'designer' | 'simulator';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  icon: React.ComponentType<any>;
  color: string;
  isNew?: boolean;
  isPopular?: boolean;
  rating?: number;
  usageCount?: number;
  lastUsed?: Date;
  formula?: string;
  inputs?: CalculatorInput[];
  calculate?: (inputs: Record<string, number>) => Record<string, number>;
}

interface CalculatorInput {
  id: string;
  label: string;
  unit: string;
  value: number;
  description?: string;
}

interface FilterState {
  search: string;
  category: string;
  type: string;
  complexity: string;
  sortBy: 'name' | 'popularity' | 'recent' | 'rating';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  showFavorites: boolean;
  showNew: boolean;
  showPopular: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  subcategories: string[];
}

const ResearchToolsPage: React.FC = () => {
  // Filter and view state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    type: 'all',
    complexity: 'all',
    sortBy: 'popularity',
    sortOrder: 'desc',
    viewMode: 'grid',
    showFavorites: false,
    showNew: false,
    showPopular: false
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentTools, setRecentTools] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [calculatorInputs, setCalculatorInputs] = useState<Record<string, number | string>>({});

  // Categories definition
  const categories: Category[] = [
    {
      id: 'molecular-bio',
      name: 'Molecular Biology',
      description: 'DNA, RNA, PCR, and genetic analysis tools',
      icon: DnaIcon,
      color: 'blue',
      subcategories: ['DNA/RNA Analysis', 'PCR & Amplification', 'Primer Design', 'Cloning & CRISPR']
    },
    {
      id: 'biochemistry',
      name: 'Biochemistry',
      description: 'Protein analysis, enzyme kinetics, and metabolic tools',
      icon: BeakerIcon,
      color: 'green',
      subcategories: ['Protein Analysis', 'Enzyme Kinetics', 'Metabolism', 'Solution Chemistry']
    },
    {
      id: 'cell-biology',
      name: 'Cell Biology',
      description: 'Cell culture, microscopy, and cellular analysis',
      icon: MicroscopeIcon,
      color: 'purple',
      subcategories: ['Cell Culture', 'Microscopy', 'Flow Cytometry', 'Cell Analysis']
    },
    {
      id: 'analytical-chem',
      name: 'Analytical Chemistry',
      description: 'Spectroscopy, chromatography, and analytical methods',
      icon: AtomIcon,
      color: 'orange',
      subcategories: ['Spectroscopy', 'Chromatography', 'Mass Spectrometry', 'Electrochemistry']
    },
    {
      id: 'neuroscience',
      name: 'Neuroscience',
      description: 'Neural analysis, electrophysiology, and brain research',
      icon: BrainCircuitIcon,
      color: 'indigo',
      subcategories: ['Electrophysiology', 'Neural Analysis', 'Behavioral Studies', 'Brain Imaging']
    },
    {
      id: 'immunology',
      name: 'Immunology',
      description: 'Immune system analysis and immunological assays',
      icon: ShieldIcon,
      color: 'red',
      subcategories: ['Antibody Analysis', 'ELISA', 'Flow Cytometry', 'Immunoassays']
    },
    {
      id: 'ecology',
      name: 'Ecology & Environment',
      description: 'Environmental analysis and ecological modeling',
      icon: TreeIcon,
      color: 'emerald',
      subcategories: ['Population Dynamics', 'Environmental Analysis', 'Biodiversity', 'Climate Modeling']
    },
    {
      id: 'engineering',
      name: 'Engineering & Materials',
      description: 'Materials science and engineering calculations',
      icon: SettingsIcon,
      color: 'gray',
      subcategories: ['Materials Science', 'Mechanical Properties', 'Thermodynamics', 'Fluid Dynamics']
    }
  ];

  // Define tools with calculator functionality
  const allTools: Tool[] = useMemo(() => [
    {
      id: 'molar-solution',
      name: 'Molar Solution Calculator',
      description: 'Calculate molar concentration, mass, volume, or molecular weight',
      category: 'biochemistry',
      subcategory: 'Solution Chemistry',
      type: 'calculator',
      complexity: 'beginner',
      tags: ['molarity', 'concentration', 'solution'],
      icon: BeakerIcon,
      color: 'green',
      isNew: false,
      isPopular: true,
      rating: 4.8,
      usageCount: 1250,
      formula: 'C = n/V = m/(MW × V)',
      inputs: [
        { id: 'concentration', label: 'Molar Concentration (M)', unit: 'mol/L', value: 0 },
        { id: 'mass', label: 'Mass of Solute', unit: 'g', value: 0 },
        { id: 'volume', label: 'Volume of Solution', unit: 'L', value: 0 },
        { id: 'molecularWeight', label: 'Molecular Weight', unit: 'g/mol', value: 0 }
      ],
      calculate: (inputs) => {
        const { concentration, mass, volume, molecularWeight } = inputs;
        const results: Record<string, number> = {};
        
        if (concentration && volume && molecularWeight && !mass) {
          results.mass = concentration * volume * molecularWeight;
        } else if (mass && volume && molecularWeight && !concentration) {
          results.concentration = mass / (molecularWeight * volume);
        } else if (mass && concentration && molecularWeight && !volume) {
          results.volume = mass / (concentration * molecularWeight);
        }
        
        return results;
      }
    },
    {
      id: 'dilution',
      name: 'Enhanced Dilution Calculator',
      description: 'Comprehensive dilution calculator with unit conversions and scenarios',
      category: 'biochemistry',
      subcategory: 'Solution Chemistry',
        type: 'calculator',
      complexity: 'intermediate',
      tags: ['dilution', 'concentration', 'factor', 'C1V1=C2V2', 'molarity', 'volume'],
      icon: BeakerIcon,
      color: 'green',
      isNew: false,
      isPopular: true,
      rating: 4.9,
      usageCount: 2150,
      formula: 'C₁V₁ = C₂V₂ (Conservation of Mass)',
      inputs: [
        { id: 'stockConcentration', label: 'Stock Concentration', unit: 'mg/mL', value: 0, description: 'Concentration of your stock solution' },
        { id: 'stockVolume', label: 'Volume to Use', unit: 'mL', value: 0, description: 'How much stock solution to use' },
        { id: 'finalConcentration', label: 'Final Concentration', unit: 'mg/mL', value: 0, description: 'Desired concentration after dilution' },
        { id: 'finalVolume', label: 'Final Volume', unit: 'mL', value: 0, description: 'Total volume of diluted solution' },
        { id: 'dilutionFactor', label: 'Dilution Factor', unit: 'x', value: 0, description: 'How many times to dilute (e.g., 10 for 1:10 dilution)' }
      ],
      calculate: (inputs) => {
        const { stockConcentration, stockVolume, finalConcentration, finalVolume, dilutionFactor } = inputs;
        
        const results: Record<string, any> = {};
        
        // Simple dilution calculations using C1V1 = C2V2
        if (stockConcentration && stockVolume && finalConcentration && !finalVolume) {
          // Calculate final volume needed
          const calculatedFinalVolume = (stockConcentration * stockVolume) / finalConcentration;
          results.finalVolume = calculatedFinalVolume;
          results.diluentToAdd = calculatedFinalVolume - stockVolume;
          results.dilutionFactor = stockConcentration / finalConcentration;
          
        } else if (stockConcentration && stockVolume && finalVolume && !finalConcentration) {
          // Calculate final concentration
          const calculatedFinalConcentration = (stockConcentration * stockVolume) / finalVolume;
          results.finalConcentration = calculatedFinalConcentration;
          results.diluentToAdd = finalVolume - stockVolume;
          results.dilutionFactor = stockConcentration / calculatedFinalConcentration;
          
        } else if (stockConcentration && finalConcentration && finalVolume && !stockVolume) {
          // Calculate how much stock to use
          const calculatedStockVolume = (finalConcentration * finalVolume) / stockConcentration;
          results.stockVolume = calculatedStockVolume;
          results.diluentToAdd = finalVolume - calculatedStockVolume;
          results.dilutionFactor = stockConcentration / finalConcentration;
          
        } else if (stockConcentration && dilutionFactor && stockVolume && !finalConcentration) {
          // Calculate using dilution factor
          const calculatedFinalConcentration = stockConcentration / dilutionFactor;
          const calculatedFinalVolume = stockVolume * dilutionFactor;
          results.finalConcentration = calculatedFinalConcentration;
          results.finalVolume = calculatedFinalVolume;
          results.diluentToAdd = calculatedFinalVolume - stockVolume;
          results.dilutionFactor = dilutionFactor;
          
        } else if (stockConcentration && dilutionFactor && finalVolume && !stockVolume) {
          // Calculate stock volume needed for given dilution factor
          const calculatedStockVolume = finalVolume / dilutionFactor;
          const calculatedFinalConcentration = stockConcentration / dilutionFactor;
          results.stockVolume = calculatedStockVolume;
          results.finalConcentration = calculatedFinalConcentration;
          results.diluentToAdd = finalVolume - calculatedStockVolume;
          results.dilutionFactor = dilutionFactor;
        }
        
        // Common dilution scenarios
        if (stockConcentration) {
          results.commonScenarios = {
            '1:10': { factor: 10, finalConc: stockConcentration / 10, volume: stockVolume ? stockVolume * 10 : null },
            '1:100': { factor: 100, finalConc: stockConcentration / 100, volume: stockVolume ? stockVolume * 100 : null },
            '1:1000': { factor: 1000, finalConc: stockConcentration / 1000, volume: stockVolume ? stockVolume * 1000 : null },
            '1:10000': { factor: 10000, finalConc: stockConcentration / 10000, volume: stockVolume ? stockVolume * 10000 : null }
          };
        }
        
        return results;
      }
    },
    {
      id: 'pcr-primer',
      name: 'PCR Primer Designer',
      description: 'Comprehensive PCR primer design with validation and optimization',
        category: 'molecular-bio',
      subcategory: 'Primer Design',
        type: 'designer',
        complexity: 'advanced',
      tags: ['PCR', 'primer', 'DNA', 'Tm', 'GC content', 'validation'],
        icon: DnaIcon,
        color: 'blue',
        isNew: true,
        isPopular: true,
        rating: 4.8,
      usageCount: 1250,
      formula: 'Tm = 81.5 + 0.41(%GC) - 675/N (Wallace Rule)',
      inputs: [
        { id: 'targetSequence', label: 'Target DNA Sequence', unit: 'bp', value: 0, description: 'Enter the target DNA sequence (5\' to 3\')' },
        { id: 'forwardPrimer', label: 'Forward Primer Sequence', unit: 'bp', value: 0, description: 'Enter forward primer sequence (5\' to 3\')' },
        { id: 'reversePrimer', label: 'Reverse Primer Sequence', unit: 'bp', value: 0, description: 'Enter reverse primer sequence (5\' to 3\')' },
        { id: 'primerLength', label: 'Optimal Primer Length', unit: 'bp', value: 20, description: 'Recommended: 18-25 bp' },
        { id: 'gcContent', label: 'Optimal GC Content', unit: '%', value: 50, description: 'Recommended: 40-60%' },
        { id: 'tmDifference', label: 'Max Tm Difference', unit: '°C', value: 5, description: 'Max difference between forward and reverse primers' }
      ],
      calculate: (inputs) => {
        const { targetSequence, forwardPrimer, reversePrimer, primerLength, gcContent, tmDifference } = inputs;
        const results: Record<string, any> = {};
        
        // Helper function to calculate GC content
        const calculateGCContent = (sequence: string) => {
          if (!sequence) return 0;
          const gcCount = (sequence.match(/[GC]/gi) || []).length;
          return (gcCount / sequence.length) * 100;
        };
        
        // Helper function to calculate melting temperature (Wallace Rule)
        const calculateTm = (sequence: string) => {
          if (!sequence) return 0;
          const gc = calculateGCContent(sequence);
          return 81.5 + (0.41 * gc) - (675 / sequence.length);
        };
        
        // Helper function to validate DNA sequence
        const isValidDNASequence = (sequence: string) => {
          if (!sequence) return false;
          return /^[ATCGatcg]+$/.test(sequence);
        };
        
        // Helper function to check for secondary structures
        const checkSecondaryStructures = (sequence: string) => {
          if (!sequence) return { hairpin: false, dimer: false };
          const seq = sequence.toUpperCase();
          
          // Simple hairpin check (4+ bp complementarity)
          let hairpin = false;
          for (let i = 0; i < seq.length - 7; i++) {
            for (let j = i + 7; j < seq.length; j++) {
              const subseq = seq.substring(i, j);
              const complement = subseq.split('').reverse().map(base => {
                switch(base) {
                  case 'A': return 'T';
                  case 'T': return 'A';
                  case 'C': return 'G';
                  case 'G': return 'C';
                  default: return base;
                }
              }).join('');
              
              if (subseq.includes(complement.substring(0, 4))) {
                hairpin = true;
                break;
              }
            }
            if (hairpin) break;
          }
          
          return { hairpin, dimer: false }; // Simplified dimer check
        };
        
        if (targetSequence && isValidDNASequence(targetSequence)) {
          results.targetGCContent = calculateGCContent(targetSequence);
          results.targetLength = targetSequence.length;
          
          // Generate primer suggestions if target is provided
          if (targetSequence.length >= 40) {
            const forwardStart = targetSequence.substring(0, 20);
            const reverseStart = targetSequence.substring(targetSequence.length - 20);
            const reverseComplement = reverseStart.split('').reverse().map(base => {
              switch(base.toUpperCase()) {
                case 'A': return 'T';
                case 'T': return 'A';
                case 'C': return 'G';
                case 'G': return 'C';
                default: return base;
              }
            }).join('');
            
            results.suggestedForwardPrimer = forwardStart;
            results.suggestedReversePrimer = reverseComplement;
            results.suggestedForwardTm = calculateTm(forwardStart);
            results.suggestedReverseTm = calculateTm(reverseComplement);
            results.suggestedTmDifference = Math.abs(results.suggestedForwardTm - results.suggestedReverseTm);
          }
        }
        
        if (forwardPrimer && isValidDNASequence(forwardPrimer)) {
          results.forwardGCContent = calculateGCContent(forwardPrimer);
          results.forwardTm = calculateTm(forwardPrimer);
          results.forwardLength = forwardPrimer.length;
          results.forwardValidation = checkSecondaryStructures(forwardPrimer);
          
          // Validation checks
          results.forwardValidations = {
            length: forwardPrimer.length >= 18 && forwardPrimer.length <= 25,
            gcContent: results.forwardGCContent >= 40 && results.forwardGCContent <= 60,
            tm: results.forwardTm >= 55 && results.forwardTm <= 65,
            structure: !results.forwardValidation.hairpin
          };
        }
        
        if (reversePrimer && isValidDNASequence(reversePrimer)) {
          results.reverseGCContent = calculateGCContent(reversePrimer);
          results.reverseTm = calculateTm(reversePrimer);
          results.reverseLength = reversePrimer.length;
          results.reverseValidation = checkSecondaryStructures(reversePrimer);
          
          // Validation checks
          results.reverseValidations = {
            length: reversePrimer.length >= 18 && reversePrimer.length <= 25,
            gcContent: results.reverseGCContent >= 40 && results.reverseGCContent <= 60,
            tm: results.reverseTm >= 55 && results.reverseTm <= 65,
            structure: !results.reverseValidation.hairpin
          };
        }
        
        // Compare forward and reverse primers
        if (forwardPrimer && reversePrimer && isValidDNASequence(forwardPrimer) && isValidDNASequence(reversePrimer)) {
          results.tmDifference = Math.abs(results.forwardTm - results.reverseTm);
          results.primerPairValidation = {
            tmDifference: results.tmDifference <= (tmDifference || 5),
            bothValid: results.forwardValidations && results.reverseValidations &&
                      Object.values(results.forwardValidations).every(Boolean) &&
                      Object.values(results.reverseValidations).every(Boolean)
          };
        }
        
        return results;
      }
    },
    {
      id: 'cell-count',
      name: 'Cell Counting Calculator',
      description: 'Calculate cell density and viability',
      category: 'cell-biology',
      subcategory: 'Cell Analysis',
      type: 'calculator',
      complexity: 'beginner',
      tags: ['cell count', 'viability', 'density'],
      icon: MicroscopeIcon,
      color: 'purple',
      isNew: false,
      isPopular: true,
      rating: 4.5,
      usageCount: 750,
      formula: 'Cell Density = (Cell Count × Dilution Factor) / Volume',
      inputs: [
        { id: 'cellCount', label: 'Cell Count', unit: 'cells', value: 0 },
        { id: 'dilutionFactor', label: 'Dilution Factor', unit: 'x', value: 0 },
        { id: 'volume', label: 'Volume Counted', unit: 'μL', value: 0 },
        { id: 'viability', label: 'Viability (%)', unit: '%', value: 0 }
      ],
      calculate: (inputs) => {
        const { cellCount, dilutionFactor, volume } = inputs;
        const results: Record<string, number> = {};
        
        if (cellCount && dilutionFactor && volume) {
          results.cellDensity = (cellCount * dilutionFactor) / volume;
        }
        
        return results;
      }
    },
    {
      id: 'ph-buffer',
      name: 'pH Buffer Calculator',
      description: 'Calculate pH and buffer capacity',
        category: 'biochemistry',
      subcategory: 'Solution Chemistry',
      type: 'calculator',
      complexity: 'intermediate',
      tags: ['pH', 'buffer', 'Henderson-Hasselbalch'],
      icon: BeakerIcon,
      color: 'green',
      isNew: false,
      isPopular: false,
      rating: 4.2,
      usageCount: 450,
      formula: 'pH = pKa + log([A⁻]/[HA])',
      inputs: [
        { id: 'pka', label: 'pKa', unit: '', value: 0 },
        { id: 'conjugateBase', label: '[A⁻]', unit: 'M', value: 0 },
        { id: 'weakAcid', label: '[HA]', unit: 'M', value: 0 },
        { id: 'ph', label: 'pH', unit: '', value: 0 }
      ],
      calculate: (inputs) => {
        const { pka, conjugateBase, weakAcid } = inputs;
        const results: Record<string, number> = {};
        
        if (pka && conjugateBase && weakAcid) {
          results.ph = pka + Math.log10(conjugateBase / weakAcid);
        }
        
        return results;
      }
    },
    {
      id: 'enzyme-kinetics',
      name: 'Enzyme Kinetics Calculator',
      description: 'Calculate Michaelis-Menten parameters',
      category: 'biochemistry',
      subcategory: 'Enzyme Kinetics',
      type: 'calculator',
        complexity: 'advanced',
      tags: ['enzyme', 'kinetics', 'Km', 'Vmax'],
        icon: BeakerIcon,
        color: 'green',
        isNew: false,
        isPopular: true,
      rating: 4.7,
      usageCount: 680,
      formula: 'v = (Vmax × [S]) / (Km + [S])',
      inputs: [
        { id: 'substrateConcentration', label: '[S]', unit: 'μM', value: 0 },
        { id: 'maxVelocity', label: 'Vmax', unit: 'μmol/min', value: 0 },
        { id: 'michaelisConstant', label: 'Km', unit: 'μM', value: 0 },
        { id: 'initialVelocity', label: 'v₀', unit: 'μmol/min', value: 0 }
      ],
      calculate: (inputs) => {
        const { substrateConcentration, maxVelocity, michaelisConstant } = inputs;
        const results: Record<string, number> = {};
        
        if (substrateConcentration && maxVelocity && michaelisConstant) {
          results.initialVelocity = (maxVelocity * substrateConcentration) / (michaelisConstant + substrateConcentration);
        }
        
        return results;
      }
    },
    {
      id: 'protein-concentration',
      name: 'Protein Concentration Calculator',
      description: 'Calculate protein concentration from absorbance',
      category: 'biochemistry',
      subcategory: 'Protein Analysis',
      type: 'calculator',
      complexity: 'beginner',
      tags: ['protein', 'Bradford', 'BCA', 'absorbance'],
      icon: BeakerIcon,
      color: 'green',
      isNew: false,
      isPopular: true,
      rating: 4.6,
      usageCount: 920,
      formula: '[Protein] = (Absorbance - y-intercept) / slope',
      inputs: [
        { id: 'absorbance', label: 'Absorbance', unit: '', value: 0 },
        { id: 'slope', label: 'Slope', unit: 'mg/mL', value: 0 },
        { id: 'yIntercept', label: 'Y-intercept', unit: '', value: 0 },
        { id: 'dilutionFactor', label: 'Dilution Factor', unit: 'x', value: 1 }
      ],
      calculate: (inputs) => {
        const { absorbance, slope, yIntercept, dilutionFactor } = inputs;
        const results: Record<string, number> = {};
        
        if (absorbance && slope && yIntercept) {
          const concentration = (absorbance - yIntercept) / slope;
          results.proteinConcentration = concentration * (dilutionFactor || 1);
        }
        
        return results;
      }
    },
    {
      id: 'spectrophotometry',
      name: 'Beer-Lambert Law Calculator',
      description: 'Calculate concentration from absorbance',
      category: 'analytical-chem',
      subcategory: 'Spectroscopy',
      type: 'calculator',
      complexity: 'beginner',
      tags: ['absorbance', 'concentration', 'molar absorptivity'],
      icon: AtomIcon,
      color: 'orange',
      isNew: false,
      isPopular: true,
      rating: 4.5,
      usageCount: 1100,
      formula: 'A = ε × l × c',
      inputs: [
        { id: 'absorbance', label: 'Absorbance (A)', unit: '', value: 0 },
        { id: 'molarAbsorptivity', label: 'Molar Absorptivity (ε)', unit: 'L/mol·cm', value: 0 },
        { id: 'pathLength', label: 'Path Length (l)', unit: 'cm', value: 1 },
        { id: 'concentration', label: 'Concentration (c)', unit: 'M', value: 0 }
      ],
      calculate: (inputs) => {
        const { absorbance, molarAbsorptivity, pathLength, concentration } = inputs;
        const results: Record<string, number> = {};
        
        if (absorbance && molarAbsorptivity && pathLength && !concentration) {
          results.concentration = absorbance / (molarAbsorptivity * pathLength);
        } else if (concentration && molarAbsorptivity && pathLength && !absorbance) {
          results.absorbance = molarAbsorptivity * pathLength * concentration;
        }
        
        return results;
      }
    }
  ], []);

  // Filter and sort tools
  const filteredTools = useMemo(() => {
    let filtered = allTools.filter(tool => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!tool.name.toLowerCase().includes(searchLower) &&
            !tool.description.toLowerCase().includes(searchLower) &&
            !tool.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all' && tool.category !== filters.category) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && tool.type !== filters.type) {
        return false;
      }

      // Complexity filter
      if (filters.complexity !== 'all' && tool.complexity !== filters.complexity) {
        return false;
      }

      // Favorites filter
      if (filters.showFavorites && !favorites.has(tool.id)) {
        return false;
      }

      // New filter
      if (filters.showNew && !tool.isNew) {
        return false;
      }

      // Popular filter
      if (filters.showPopular && !tool.isPopular) {
        return false;
      }

      return true;
    });

    // Sort tools
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'popularity':
          comparison = (b.usageCount || 0) - (a.usageCount || 0);
          break;
        case 'recent':
          comparison = (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0);
          break;
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allTools, filters, favorites]);

  // Handle tool selection - open modal
  const handleToolSelect = (tool: Tool) => {
    setRecentTools(prev => [tool.id, ...prev.filter(id => id !== tool.id)].slice(0, 10));
    setSelectedTool(tool);
    
    // Initialize calculator inputs
    const initialInputs: Record<string, number | string> = {};
    tool.inputs?.forEach(input => {
      if (input.id.includes('Sequence') || input.id.includes('Primer')) {
        initialInputs[input.id] = '';
      } else if (input.id.includes('Unit')) {
        initialInputs[input.id] = input.value;
      } else {
        initialInputs[input.id] = input.value;
      }
    });
    setCalculatorInputs(initialInputs);
  };

  // Toggle favorite
  const toggleFavorite = (toolId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(toolId)) {
        newFavorites.delete(toolId);
      } else {
        newFavorites.add(toolId);
      }
      return newFavorites;
    });
  };

  // Update filter
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters(prev => ({
        ...prev,
      search: '',
      category: 'all',
      type: 'all',
      complexity: 'all',
      showFavorites: false,
      showNew: false,
      showPopular: false
    }));
  };

  // Handle calculator input changes
  const handleInputChange = (inputId: string, value: string) => {
    // Check if this is a sequence input (text), unit input (string), or numeric input
    if (inputId.includes('Sequence') || inputId.includes('Primer') || inputId.includes('Unit')) {
      // For DNA sequences and unit selections, store as string
      if (inputId.includes('Sequence') || inputId.includes('Primer')) {
        // Convert DNA sequences to uppercase
        setCalculatorInputs(prev => ({
          ...prev,
          [inputId]: value.toUpperCase()
        }));
      } else {
        // Store unit selections as-is
        setCalculatorInputs(prev => ({
          ...prev,
          [inputId]: value
        }));
      }
    } else {
      // For numeric inputs
      const numValue = parseFloat(value) || 0;
      setCalculatorInputs(prev => ({
        ...prev,
        [inputId]: numValue
      }));
    }
  };

  // Calculate results
  const calculateResults = () => {
    if (selectedTool?.calculate) {
      return selectedTool.calculate(calculatorInputs);
    }
    return {};
  };

  const results = calculateResults();

    return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
      {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <BeakerIcon className="w-6 h-6 text-white" />
          </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Research Tools
        </h1>
              <p className="text-gray-600 mt-1">
                Professional calculators and analysis tools for research
        </p>
            </div>
                </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <CalculatorIcon className="w-4 h-4" />
              <span>{allTools.length} Tools</span>
            </div>
            <div className="flex items-center space-x-2">
              <StarIcon className="w-4 h-4" />
              <span>8 Categories</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="w-4 h-4" />
              <span>Popular & New</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {/* Search Bar */}
          <div className="relative mb-6">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tools, calculators, and converters..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
                  </div>

          {/* Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Quick Filters */}
                <button
                    onClick={() => updateFilter('showNew', !filters.showNew)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.showNew 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                New Tools
                </button>
                <button
                    onClick={() => updateFilter('showPopular', !filters.showPopular)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.showPopular 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Popular
                </button>
                <button
                    onClick={() => updateFilter('showFavorites', !filters.showFavorites)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.showFavorites 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Favorites
              </button>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FilterIcon className="w-4 h-4" />
                More Filters
                </button>
          </div>

              {/* View Controls */}
              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    updateFilter('sortBy', sortBy);
                    updateFilter('sortOrder', sortOrder);
                  }}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popularity-desc">Most Popular</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="recent-desc">Recently Used</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                    onClick={() => updateFilter('viewMode', 'grid')}
                    className={`p-2 ${filters.viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                    <GridIcon className="w-4 h-4" />
                        </button>
                        <button
                    onClick={() => updateFilter('viewMode', 'list')}
                    className={`p-2 ${filters.viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                    <ListIcon className="w-4 h-4" />
                        </button>
                  </div>
                </div>
                    </div>

            {/* Advanced Filters */}
            {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => updateFilter('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                 </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => updateFilter('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="calculator">Calculators</option>
                      <option value="converter">Converters</option>
                      <option value="analyzer">Analyzers</option>
                      <option value="designer">Designers</option>
                      <option value="simulator">Simulators</option>
                    </select>
              </div>

                  {/* Complexity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
                    <select
                      value={filters.complexity}
                      onChange={(e) => updateFilter('complexity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                </div>
                  </div>

              <div className="mt-4">
                    <button
                      onClick={clearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Clear All Filters
                    </button>
                          </div>
                        </div>
                      )}
                    </div>

          {/* Results Summary */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredTools.length} of {allTools.length} tools
                {filters.search && ` for "${filters.search}"`}
                </div>
              <div className="text-sm text-gray-500">
                {favorites.size} favorites • {recentTools.length} recently used
                    </div>
                </div>
            </div>

          {/* Tools Grid/List */}
          <div className={`${
            filters.viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
          }`}>
            {filteredTools.map(tool => {
              const IconComponent = tool.icon;
              const isFavorite = favorites.has(tool.id);
              const isRecent = recentTools.includes(tool.id);

              if (filters.viewMode === 'list') {
                      return (
                  <div
                    key={tool.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => handleToolSelect(tool)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-${tool.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-6 h-6 text-${tool.color}-600`} />
                  </div>
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{tool.name}</h3>
                          {tool.isNew && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">New</span>}
                          {tool.isPopular && <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Popular</span>}
                          {isRecent && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Recent</span>}
                             </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{tool.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="capitalize">{tool.type}</span>
                          <span className="capitalize">{tool.complexity}</span>
                          {tool.rating && (
                            <div className="flex items-center gap-1">
                              <StarIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {tool.rating.toFixed(1)}
                    </div>
                          )}
                          {tool.usageCount && <span>{tool.usageCount} uses</span>}
                  </div>
                </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isFavorite 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <HeartIcon className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
                    </div>
                );
              }

                      return (
                <div
                  key={tool.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => handleToolSelect(tool)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${tool.color}-100 rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 text-${tool.color}-600`} />
                  </div>
                    <div className="flex items-center gap-2">
                      {tool.isNew && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">New</span>}
                      {tool.isPopular && <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Popular</span>}
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.id);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isFavorite 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <HeartIcon className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
              </div>
                    </div>
                    
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{tool.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 bg-${tool.color}-100 text-${tool.color}-800 text-xs rounded-full capitalize`}>
                        {tool.type}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                        {tool.complexity}
                      </span>
                          </div>
                    {tool.rating && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <StarIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {tool.rating.toFixed(1)}
                        </div>
                      )}
                    </div>

                  {tool.usageCount && (
                    <div className="mt-3 text-xs text-gray-500">
                      {tool.usageCount.toLocaleString()} uses
                        </div>
                    )}
                </div>
                      );
                    })}
            </div>

          {/* No Results */}
          {filteredTools.length === 0 && (
              <div className="text-center py-12">
              <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
                        <button
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                Clear All Filters
                        </button>
            </div>
          )}
              </div>
                
      {/* Calculator Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-${selectedTool.color}-100 rounded-lg flex items-center justify-center`}>
                    <selectedTool.icon className={`w-6 h-6 text-${selectedTool.color}-600`} />
                                    </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTool.name}</h2>
                    <p className="text-gray-600">{selectedTool.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calculator Interface */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculator</h3>
                  
                  {/* Formula Display */}
                  {selectedTool.formula && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Formula</span>
                      </div>
                      <code className="text-lg font-mono text-blue-800 bg-white px-3 py-2 rounded border">
                        {selectedTool.formula}
                      </code>
                    </div>
                  )}

                  {/* Input Fields */}
                  <div className="space-y-4">
                    {selectedTool.inputs?.map((input) => (
                      <div key={input.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {input.label}
                          {input.unit && !input.id.includes('Unit') && <span className="text-gray-500 ml-1">({input.unit})</span>}
                        </label>
                        
                        {input.id.includes('Sequence') || input.id.includes('Primer') ? (
                          /* DNA Sequence Input */
                          <textarea
                            value={calculatorInputs[input.id] || ''}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            placeholder={`Enter ${input.label.toLowerCase()}`}
                            rows={3}
                          />
                        ) : (
                          /* Numeric Input */
                          <input
                            type="number"
                            step="any"
                            value={calculatorInputs[input.id] || ''}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`Enter ${input.label.toLowerCase()}`}
                          />
                        )}
                        
                        {input.description && (
                          <p className="text-xs text-gray-500 mt-1">{input.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
                  
                  {Object.keys(results).length > 0 ? (
                    <div className="space-y-4">
                      {/* Simple Dilution Calculator Results */}
                      {selectedTool.id === 'dilution' ? (
                        <>
                          {/* Main Results */}
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-3">Dilution Results</h4>
                            <div className="space-y-2">
                              {results.finalVolume && (
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-700">Final Volume:</span>
                                  <span className="font-bold text-blue-900">
                                    {results.finalVolume.toFixed(2)} mL
                                  </span>
                                </div>
                              )}
                              {results.finalConcentration && (
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-700">Final Concentration:</span>
                                  <span className="font-bold text-blue-900">
                                    {results.finalConcentration.toFixed(2)} mg/mL
                                  </span>
                                </div>
                              )}
                              {results.stockVolume && (
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-700">Stock Volume to Use:</span>
                                  <span className="font-bold text-blue-900">
                                    {results.stockVolume.toFixed(2)} mL
                                  </span>
                                </div>
                              )}
                              {results.diluentToAdd && (
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-700">Diluent to Add:</span>
                                  <span className="font-bold text-blue-900">
                                    {results.diluentToAdd.toFixed(2)} mL
                                  </span>
                                </div>
                              )}
                              {results.dilutionFactor && (
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-700">Dilution Factor:</span>
                                  <span className="font-bold text-blue-900">
                                    1:{results.dilutionFactor.toFixed(2)}x
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Reference */}
                          {results.commonScenarios && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3">Quick Reference</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {Object.entries(results.commonScenarios).map(([ratio, data]: [string, any]) => (
                                  <div key={ratio} className="bg-white p-2 rounded border">
                                    <div className="font-medium text-gray-900">{ratio}</div>
                                    <div className="text-gray-600">
                                      {data.finalConc?.toFixed(3)} mg/mL
                                    </div>
                                    {data.volume && (
                                      <div className="text-gray-600">
                                        {data.volume.toFixed(1)} mL total
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : selectedTool.id === 'pcr-primer' ? (
                        <>
                          {/* Target Sequence Analysis */}
                          {results.targetLength && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="font-semibold text-blue-900 mb-2">Target Sequence Analysis</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-blue-700">Length:</span>
                                  <span className="font-bold ml-2">{results.targetLength} bp</span>
                                </div>
                                <div>
                                  <span className="text-blue-700">GC Content:</span>
                                  <span className="font-bold ml-2">{results.targetGCContent?.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Suggested Primers */}
                          {results.suggestedForwardPrimer && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <h4 className="font-semibold text-green-900 mb-3">Suggested Primers</h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-green-700 font-medium">Forward:</span>
                                  <div className="font-mono text-sm bg-white p-2 rounded border mt-1">
                                    5'-{results.suggestedForwardPrimer}-3'
                                  </div>
                                  <div className="text-xs text-green-600 mt-1">
                                    Tm: {results.suggestedForwardTm?.toFixed(1)}°C
                                  </div>
                                </div>
                                <div>
                                  <span className="text-green-700 font-medium">Reverse:</span>
                                  <div className="font-mono text-sm bg-white p-2 rounded border mt-1">
                                    5'-{results.suggestedReversePrimer}-3'
                                  </div>
                                  <div className="text-xs text-green-600 mt-1">
                                    Tm: {results.suggestedReverseTm?.toFixed(1)}°C
                                  </div>
                                </div>
                                <div className="text-xs text-green-600">
                                  Tm Difference: {results.suggestedTmDifference?.toFixed(1)}°C
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Forward Primer Analysis */}
                          {results.forwardTm && (
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                              <h4 className="font-semibold text-purple-900 mb-3">Forward Primer Analysis</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-purple-700">Tm:</span>
                                  <span className="font-bold ml-2">{results.forwardTm?.toFixed(1)}°C</span>
                                </div>
                                <div>
                                  <span className="text-purple-700">GC Content:</span>
                                  <span className="font-bold ml-2">{results.forwardGCContent?.toFixed(1)}%</span>
                                </div>
                                <div>
                                  <span className="text-purple-700">Length:</span>
                                  <span className="font-bold ml-2">{results.forwardLength} bp</span>
                                </div>
                                <div>
                                  <span className="text-purple-700">Hairpin:</span>
                                  <span className={`font-bold ml-2 ${results.forwardValidation?.hairpin ? 'text-red-600' : 'text-green-600'}`}>
                                    {results.forwardValidation?.hairpin ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                              {results.forwardValidations && (
                                <div className="space-y-1">
                                  <div className={`text-xs flex items-center ${results.forwardValidations.length ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                    Length: {results.forwardValidations.length ? 'Optimal' : 'Outside range (18-25 bp)'}
                                  </div>
                                  <div className={`text-xs flex items-center ${results.forwardValidations.gcContent ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                    GC Content: {results.forwardValidations.gcContent ? 'Optimal' : 'Outside range (40-60%)'}
                                  </div>
                                  <div className={`text-xs flex items-center ${results.forwardValidations.tm ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                    Tm: {results.forwardValidations.tm ? 'Optimal' : 'Outside range (55-65°C)'}
                                  </div>
                                  <div className={`text-xs flex items-center ${results.forwardValidations.structure ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                    Structure: {results.forwardValidations.structure ? 'No hairpins' : 'Hairpin detected'}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Reverse Primer Analysis */}
                          {results.reverseTm && (
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                              <h4 className="font-semibold text-orange-900 mb-3">Reverse Primer Analysis</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-orange-700">Tm:</span>
                                  <span className="font-bold ml-2">{results.reverseTm?.toFixed(1)}°C</span>
                                </div>
                                <div>
                                  <span className="text-orange-700">GC Content:</span>
                                  <span className="font-bold ml-2">{results.reverseGCContent?.toFixed(1)}%</span>
                                </div>
                                <div>
                                  <span className="text-orange-700">Length:</span>
                                  <span className="font-bold ml-2">{results.reverseLength} bp</span>
                                </div>
                                <div>
                                  <span className="text-orange-700">Hairpin:</span>
                                  <span className={`font-bold ml-2 ${results.reverseValidation?.hairpin ? 'text-red-600' : 'text-green-600'}`}>
                                    {results.reverseValidation?.hairpin ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                              {results.reverseValidations && (
                                <div className="space-y-1">
                                  <div className={`text-xs flex items-center ${results.reverseValidations.length ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                    Length: {results.reverseValidations.length ? 'Optimal' : 'Outside range (18-25 bp)'}
                                  </div>
                                  <div className={`text-xs flex items-center ${results.reverseValidations.gcContent ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                    GC Content: {results.reverseValidations.gcContent ? 'Optimal' : 'Outside range (40-60%)'}
                                  </div>
                                  <div className={`text-xs flex items-center ${results.reverseValidations.tm ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                    Tm: {results.reverseValidations.tm ? 'Optimal' : 'Outside range (55-65°C)'}
                                  </div>
                                  <div className={`text-xs flex items-center ${results.reverseValidations.structure ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                    Structure: {results.reverseValidations.structure ? 'No hairpins' : 'Hairpin detected'}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Primer Pair Validation */}
                          {results.primerPairValidation && (
                            <div className={`p-4 rounded-lg border ${results.primerPairValidation.bothValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <h4 className={`font-semibold mb-2 ${results.primerPairValidation.bothValid ? 'text-green-900' : 'text-red-900'}`}>
                                Primer Pair Validation
                              </h4>
                              <div className="space-y-1">
                                <div className={`text-sm flex items-center ${results.primerPairValidation.tmDifference ? 'text-green-600' : 'text-red-600'}`}>
                                  <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                  Tm Difference: {results.tmDifference?.toFixed(1)}°C {results.primerPairValidation.tmDifference ? '(Optimal)' : '(Too high)'}
                                </div>
                                <div className={`text-sm flex items-center ${results.primerPairValidation.bothValid ? 'text-green-600' : 'text-red-600'}`}>
                                  <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                  Overall: {results.primerPairValidation.bothValid ? 'Valid primer pair' : 'Issues detected'}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Standard Results Display */
                        Object.entries(results).map(([key, value]) => (
                          <div key={key} className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-green-900 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-lg font-bold text-green-800">
                                {typeof value === 'number' ? value.toFixed(4) : value}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <CalculatorIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Enter values in the calculator to see results
                      </p>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">Instructions</h4>
                    {selectedTool.id === 'dilution' ? (
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Enter any 3 of the 4 main values to calculate the 4th</li>
                        <li>• Use dilution factor for quick 1:X dilutions (e.g., 10 for 1:10)</li>
                        <li>• All concentrations in mg/mL, volumes in mL</li>
                        <li>• The calculator will tell you exactly how much diluent to add</li>
                        <li>• Check Quick Reference for common dilution scenarios</li>
                      </ul>
                    ) : selectedTool.id === 'pcr-primer' ? (
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Enter target DNA sequence to get primer suggestions</li>
                        <li>• Input your own primers for validation and analysis</li>
                        <li>• Check validation results for optimal primer design</li>
                        <li>• Aim for Tm difference &lt; 5°C between primers</li>
                        <li>• Avoid hairpin structures and ensure proper GC content</li>
                      </ul>
                    ) : (
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Enter values for all known parameters</li>
                        <li>• Leave one field blank to calculate it</li>
                        <li>• Results will appear automatically</li>
                        <li>• Use appropriate units as specified</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
    );
};

export default ResearchToolsPage;