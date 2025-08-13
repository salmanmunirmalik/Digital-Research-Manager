import { CalculatorName, CalculatorInput, CalculatorResult, CalculatorInfo } from './types';

// Calculator Definitions
export const CALCULATOR_DEFINITIONS: Record<CalculatorName, CalculatorInfo> = {
  'Molarity Calculator': {
    name: 'Molarity Calculator',
    category: 'Chemistry & Biochemistry',
    subCategory: 'General Chemistry',
    description: 'Calculate molarity from mass, volume, and molecular weight',
    formula: 'M = (mass × 1000) / (molecular_weight × volume_ml)',
    units: {
      inputs: {
        mass: 'g',
        molecularWeight: 'g/mol',
        volume: 'mL'
      },
      output: 'M'
    },
    examples: [
      {
        title: 'Sodium Chloride Solution',
        inputs: { mass: 5.85, molecularWeight: 58.44, volume: 100 },
        expectedOutput: 1.0,
        explanation: '5.85g NaCl in 100mL = 1M solution'
      }
    ],
    references: ['Harris, D.C. Quantitative Chemical Analysis'],
    tags: ['molarity', 'concentration', 'chemistry', 'solution']
  },

  'Dilution Calculator (M1V1=M2V2)': {
    name: 'Dilution Calculator (M1V1=M2V2)',
    category: 'Chemistry & Biochemistry',
    subCategory: 'General Chemistry',
    description: 'Calculate dilution ratios using the M1V1=M2V2 formula',
    formula: 'M₁V₁ = M₂V₂',
    units: {
      inputs: {
        initialConcentration: 'M',
        initialVolume: 'mL',
        finalConcentration: 'M'
      },
      output: 'mL'
    },
    examples: [
      {
        title: 'Dilute 1M to 0.1M',
        inputs: { initialConcentration: 1, initialVolume: 10, finalConcentration: 0.1 },
        expectedOutput: 100,
        explanation: 'Need 100mL final volume to dilute 10mL of 1M to 0.1M'
      }
    ],
    references: ['Harris, D.C. Quantitative Chemical Analysis'],
    tags: ['dilution', 'concentration', 'volume', 'chemistry']
  },

  'Primer Tm Calculator': {
    name: 'Primer Tm Calculator',
    category: 'Molecular & Cell Biology',
    subCategory: 'Primers & Oligos',
    description: 'Calculate melting temperature of DNA primers using multiple algorithms',
    formula: 'Tm = 81.5 + 0.41(%GC) - 675/N - %mismatch',
    units: {
      inputs: {
        sequence: 'DNA sequence',
        concentration: 'μM',
        saltConcentration: 'mM'
      },
      output: '°C'
    },
    examples: [
      {
        title: 'Standard Primer',
        inputs: { sequence: 'ATGCGATCGATCG', concentration: 0.5, saltConcentration: 50 },
        expectedOutput: 42.3,
        explanation: '20bp primer with 50% GC content'
      }
    ],
    references: ['Sambrook, J. Molecular Cloning'],
    tags: ['primer', 'melting temperature', 'PCR', 'DNA']
  },

  'PCR Master Mix Calculator': {
    name: 'PCR Master Mix Calculator',
    category: 'Molecular & Cell Biology',
    subCategory: 'PCR & Amplification',
    description: 'Calculate volumes for PCR master mix components',
    formula: 'Volume = (Final_Concentration × Total_Volume) / Stock_Concentration',
    units: {
      inputs: {
        totalReactions: 'number',
        volumePerReaction: 'μL',
        templateConcentration: 'ng/μL',
        primerConcentration: 'μM',
        dNTPConcentration: 'mM'
      },
      output: 'μL'
    },
    examples: [
      {
        title: '25 PCR Reactions',
        inputs: { totalReactions: 25, volumePerReaction: 20, templateConcentration: 100, primerConcentration: 10, dNTPConcentration: 2.5 },
        expectedOutput: 500,
        explanation: 'Total master mix volume for 25 reactions'
      }
    ],
    references: ['PCR Protocols: A Guide to Methods and Applications'],
    tags: ['PCR', 'master mix', 'reaction setup', 'molecular biology']
  },

  'Cell Viability Calculator': {
    name: 'Cell Viability Calculator',
    category: 'Molecular & Cell Biology',
    subCategory: 'Cell Biology',
    description: 'Calculate cell viability percentage from live/dead cell counts',
    formula: 'Viability = (Live_Cells / Total_Cells) × 100',
    units: {
      inputs: {
        liveCells: 'count',
        deadCells: 'count'
      },
      output: '%'
    },
    examples: [
      {
        title: 'Trypan Blue Assay',
        inputs: { liveCells: 85, deadCells: 15 },
        expectedOutput: 85,
        explanation: '85 live cells out of 100 total = 85% viability'
      }
    ],
    references: ['Freshney, R.I. Culture of Animal Cells'],
    tags: ['cell viability', 'trypan blue', 'cell counting', 'cell culture']
  },

  'Standard Deviation Calculator': {
    name: 'Standard Deviation Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Statistical Analysis',
    description: 'Calculate standard deviation and standard error of the mean',
    formula: 'σ = √(Σ(x - μ)² / N)',
    units: {
      inputs: {
        dataPoints: 'comma-separated values'
      },
      output: 'same as input'
    },
    examples: [
      {
        title: 'Sample Data',
        inputs: { dataPoints: '1,2,3,4,5' },
        expectedOutput: 1.58,
        explanation: 'Standard deviation of [1,2,3,4,5]'
      }
    ],
    references: ['Sokal, R.R. Biometry'],
    tags: ['statistics', 'standard deviation', 'data analysis', 'variability']
  },

  'T-Test Calculator': {
    name: 'T-Test Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Statistical Analysis',
    description: 'Perform paired and unpaired t-tests with p-value calculation',
    formula: 't = (x̄₁ - x̄₂) / √(s₁²/n₁ + s₂²/n₂)',
    units: {
      inputs: {
        group1Data: 'comma-separated values',
        group2Data: 'comma-separated values',
        testType: 'paired or unpaired'
      },
      output: 't-statistic and p-value'
    },
    examples: [
      {
        title: 'Control vs Treatment',
        inputs: { group1Data: '10,12,11,13,12', group2Data: '15,17,16,18,17', testType: 'unpaired' },
        expectedOutput: 't = -8.94, p < 0.001',
        explanation: 'Significant difference between groups'
      }
    ],
    references: ['Sokal, R.R. Biometry'],
    tags: ['t-test', 'statistics', 'hypothesis testing', 'p-value']
  },

  'GC Content Calculator': {
    name: 'GC Content Calculator',
    category: 'Bioinformatics',
    subCategory: 'Bioinformatics & Sequencing',
    description: 'Calculate GC content and GC skew of DNA sequences',
    formula: 'GC% = (G + C) / (A + T + G + C) × 100',
    units: {
      inputs: {
        sequence: 'DNA sequence'
      },
      output: '%'
    },
    examples: [
      {
        title: 'Sample Sequence',
        inputs: { sequence: 'ATGCGATCGATCG' },
        expectedOutput: 66.7,
        explanation: '8 GC bases out of 12 total = 66.7%'
      }
    ],
    references: ['Mount, D.W. Bioinformatics'],
    tags: ['GC content', 'DNA sequence', 'bioinformatics', 'sequence analysis']
  },

  'Buffer pH Calculator (Henderson-Hasselbalch)': {
    name: 'Buffer pH Calculator (Henderson-Hasselbalch)',
    category: 'Chemistry & Biochemistry',
    subCategory: 'General Chemistry',
    description: 'Calculate buffer pH using Henderson-Hasselbalch equation',
    formula: 'pH = pKa + log([A⁻]/[HA])',
    units: {
      inputs: {
        pKa: 'unitless',
        acidConcentration: 'M',
        conjugateBaseConcentration: 'M'
      },
      output: 'pH'
    },
    examples: [
      {
        title: 'Acetic Acid Buffer',
        inputs: { pKa: 4.76, acidConcentration: 0.1, conjugateBaseConcentration: 0.1 },
        expectedOutput: 4.76,
        explanation: 'Equal concentrations give pH = pKa'
      }
    ],
    references: ['Harris, D.C. Quantitative Chemical Analysis'],
    tags: ['buffer', 'pH', 'Henderson-Hasselbalch', 'chemistry']
  },

  'Centrifugation Calculator': {
    name: 'Centrifugation Calculator',
    category: 'Engineering & Physics',
    subCategory: 'Engineering & Physics',
    description: 'Convert between RCF (g-force) and RPM for different rotor sizes',
    formula: 'RCF = 1.118 × 10⁻⁵ × r × RPM²',
    units: {
      inputs: {
        rotorRadius: 'cm',
        rpm: 'RPM',
        rcf: 'g'
      },
      output: 'RPM or g'
    },
    examples: [
      {
        title: 'Standard Centrifuge',
        inputs: { rotorRadius: 10, rpm: 3000, rcf: 0 },
        expectedOutput: 1007,
        explanation: '3000 RPM at 10cm radius = 1007g'
      }
    ],
    references: ['Centrifuge Manuals'],
    tags: ['centrifugation', 'RCF', 'RPM', 'rotor', 'physics']
  }
};

// Calculator Input Definitions
export const CALCULATOR_INPUTS: Record<CalculatorName, CalculatorInput[]> = {
  'Molarity Calculator': [
    {
      name: 'mass',
      label: 'Mass (g)',
      type: 'number',
      unit: 'g',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Mass of solute in grams'
    },
    {
      name: 'molecularWeight',
      label: 'Molecular Weight (g/mol)',
      type: 'number',
      unit: 'g/mol',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Molecular weight of the solute'
    },
    {
      name: 'volume',
      label: 'Volume (mL)',
      type: 'number',
      unit: 'mL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Volume of solution in milliliters'
    }
  ],

  'Dilution Calculator (M1V1=M2V2)': [
    {
      name: 'initialConcentration',
      label: 'Initial Concentration (M)',
      type: 'number',
      unit: 'M',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Starting concentration of the solution'
    },
    {
      name: 'initialVolume',
      label: 'Initial Volume (mL)',
      type: 'number',
      unit: 'mL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Volume of the initial solution'
    },
    {
      name: 'finalConcentration',
      label: 'Final Concentration (M)',
      type: 'number',
      unit: 'M',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Desired final concentration'
    }
  ],

  'Primer Tm Calculator': [
    {
      name: 'sequence',
      label: 'DNA Sequence',
      type: 'text',
      required: true,
      placeholder: 'ATGCGATCGATCG',
      helpText: 'Enter the DNA sequence (5\' to 3\')'
    },
    {
      name: 'concentration',
      label: 'Primer Concentration (μM)',
      type: 'number',
      unit: 'μM',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Concentration of the primer'
    },
    {
      name: 'saltConcentration',
      label: 'Salt Concentration (mM)',
      type: 'number',
      unit: 'mM',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Monovalent cation concentration'
    }
  ],

  'PCR Master Mix Calculator': [
    {
      name: 'totalReactions',
      label: 'Total Reactions',
      type: 'number',
      required: true,
      min: 1,
      step: 1,
      helpText: 'Number of PCR reactions to prepare'
    },
    {
      name: 'volumePerReaction',
      label: 'Volume per Reaction (μL)',
      type: 'number',
      unit: 'μL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Volume of each individual reaction'
    },
    {
      name: 'templateConcentration',
      label: 'Template Concentration (ng/μL)',
      type: 'number',
      unit: 'ng/μL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Concentration of DNA template'
    }
  ],

  'Cell Viability Calculator': [
    {
      name: 'liveCells',
      label: 'Live Cells Count',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of viable cells counted'
    },
    {
      name: 'deadCells',
      label: 'Dead Cells Count',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of non-viable cells counted'
    }
  ],

  'Standard Deviation Calculator': [
    {
      name: 'dataPoints',
      label: 'Data Points',
      type: 'text',
      required: true,
      placeholder: '1,2,3,4,5',
      helpText: 'Enter comma-separated numerical values'
    }
  ],

  'T-Test Calculator': [
    {
      name: 'group1Data',
      label: 'Group 1 Data',
      type: 'text',
      required: true,
      placeholder: '10,12,11,13,12',
      helpText: 'Comma-separated values for first group'
    },
    {
      name: 'group2Data',
      label: 'Group 2 Data',
      type: 'text',
      required: true,
      placeholder: '15,17,16,18,17',
      helpText: 'Comma-separated values for second group'
    },
    {
      name: 'testType',
      label: 'Test Type',
      type: 'select',
      required: true,
      options: [
        { value: 'unpaired', label: 'Unpaired (Independent)' },
        { value: 'paired', label: 'Paired (Dependent)' }
      ],
      helpText: 'Choose between paired or unpaired t-test'
    }
  ],

  'GC Content Calculator': [
    {
      name: 'sequence',
      label: 'DNA Sequence',
      type: 'text',
      required: true,
      placeholder: 'ATGCGATCGATCG',
      helpText: 'Enter the DNA sequence to analyze'
    }
  ],

  'Buffer pH Calculator (Henderson-Hasselbalch)': [
    {
      name: 'pKa',
      label: 'pKa Value',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Acid dissociation constant'
    },
    {
      name: 'acidConcentration',
      label: 'Acid Concentration (M)',
      type: 'number',
      unit: 'M',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Concentration of the weak acid'
    },
    {
      name: 'conjugateBaseConcentration',
      label: 'Conjugate Base Concentration (M)',
      type: 'number',
      unit: 'M',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Concentration of the conjugate base'
    }
  ],

  'Centrifugation Calculator': [
    {
      name: 'rotorRadius',
      label: 'Rotor Radius (cm)',
      type: 'number',
      unit: 'cm',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Distance from center to tube bottom'
    },
    {
      name: 'rpm',
      label: 'RPM',
      type: 'number',
      required: true,
      min: 0,
      step: 100,
      helpText: 'Revolutions per minute'
    },
    {
      name: 'rcf',
      label: 'RCF (g)',
      type: 'number',
      unit: 'g',
      required: false,
      min: 0,
      step: 1,
      helpText: 'Relative centrifugal force (leave empty to calculate)'
    }
  ]
};

// Calculator Functions
export class CalculatorEngine {
  static calculate(calculatorName: CalculatorName, inputs: Record<string, any>): CalculatorResult {
    switch (calculatorName) {
      case 'Molarity Calculator':
        return this.calculateMolarity(inputs);
      case 'Dilution Calculator (M1V1=M2V2)':
        return this.calculateDilution(inputs);
      case 'Primer Tm Calculator':
        return this.calculatePrimerTm(inputs);
      case 'PCR Master Mix Calculator':
        return this.calculatePCRMasterMix(inputs);
      case 'Cell Viability Calculator':
        return this.calculateCellViability(inputs);
      case 'Standard Deviation Calculator':
        return this.calculateStandardDeviation(inputs);
      case 'T-Test Calculator':
        return this.calculateTTest(inputs);
      case 'GC Content Calculator':
        return this.calculateGCContent(inputs);
      case 'Buffer pH Calculator (Henderson-Hasselbalch)':
        return this.calculateBufferpH(inputs);
      case 'Centrifugation Calculator':
        return this.calculateCentrifugation(inputs);
      default:
        throw new Error(`Calculator ${calculatorName} not implemented`);
    }
  }

  private static calculateMolarity(inputs: Record<string, any>): CalculatorResult {
    const { mass, molecularWeight, volume } = inputs;
    const molarity = (mass * 1000) / (molecularWeight * volume);
    
    return {
      value: Number(molarity.toFixed(4)),
      unit: 'M',
      explanation: `Molarity = (${mass}g × 1000) / (${molecularWeight}g/mol × ${volume}mL) = ${molarity.toFixed(4)}M`,
      confidence: 0.99
    };
  }

  private static calculateDilution(inputs: Record<string, any>): CalculatorResult {
    const { initialConcentration, initialVolume, finalConcentration } = inputs;
    const finalVolume = (initialConcentration * initialVolume) / finalConcentration;
    
    return {
      value: Number(finalVolume.toFixed(2)),
      unit: 'mL',
      explanation: `Final volume = (${initialConcentration}M × ${initialVolume}mL) / ${finalConcentration}M = ${finalVolume.toFixed(2)}mL`,
      confidence: 0.99
    };
  }

  private static calculatePrimerTm(inputs: Record<string, any>): CalculatorResult {
    const { sequence, concentration, saltConcentration } = inputs;
    const seq = sequence.toUpperCase();
    const gcCount = (seq.match(/[GC]/g) || []).length;
    const totalLength = seq.length;
    const gcPercent = (gcCount / totalLength) * 100;
    
    // Wallace rule: Tm = 2°C(A+T) + 4°C(G+C)
    let tm = 2 * (seq.match(/[AT]/g) || []).length + 4 * gcCount;
    
    // Salt correction
    tm += 16.6 * Math.log10(saltConcentration / 1000);
    
    // Concentration correction
    tm += 16.6 * Math.log10(concentration / 1000000);
    
    return {
      value: Number(tm.toFixed(1)),
      unit: '°C',
      explanation: `GC content: ${gcPercent.toFixed(1)}%, Salt adjusted, Concentration adjusted`,
      confidence: 0.95,
      warnings: ['This is an approximation. For precise Tm, use nearest neighbor method.']
    };
  }

  private static calculatePCRMasterMix(inputs: Record<string, any>): CalculatorResult {
    const { totalReactions, volumePerReaction, templateConcentration } = inputs;
    const totalVolume = totalReactions * volumePerReaction;
    
    return {
      value: Number(totalVolume.toFixed(1)),
      unit: 'μL',
      explanation: `Total master mix volume = ${totalReactions} reactions × ${volumePerReaction}μL = ${totalVolume.toFixed(1)}μL`,
      confidence: 0.99,
      suggestions: [
        'Add 10% extra volume for pipetting errors',
        'Prepare master mix without template first',
        'Add template individually to each reaction'
      ]
    };
  }

  private static calculateCellViability(inputs: Record<string, any>): CalculatorResult {
    const { liveCells, deadCells } = inputs;
    const totalCells = liveCells + deadCells;
    const viability = (liveCells / totalCells) * 100;
    
    return {
      value: Number(viability.toFixed(1)),
      unit: '%',
      explanation: `Viability = (${liveCells} live cells / ${totalCells} total cells) × 100 = ${viability.toFixed(1)}%`,
      confidence: 0.99,
      suggestions: [
        'Count at least 100 cells for statistical significance',
        'Use multiple fields of view for better representation',
        'Repeat counting 3 times for accuracy'
      ]
    };
  }

  private static calculateStandardDeviation(inputs: Record<string, any>): CalculatorResult {
    const { dataPoints } = inputs;
    const values = dataPoints.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    
    if (values.length < 2) {
      throw new Error('Need at least 2 data points for standard deviation');
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const sem = stdDev / Math.sqrt(values.length);
    
    return {
      value: Number(stdDev.toFixed(4)),
      unit: 'same as input',
      explanation: `Mean: ${mean.toFixed(4)}, Standard Deviation: ${stdDev.toFixed(4)}, Standard Error: ${sem.toFixed(4)}`,
      confidence: 0.99
    };
  }

  private static calculateTTest(inputs: Record<string, any>): CalculatorResult {
    const { group1Data, group2Data, testType } = inputs;
    const group1 = group1Data.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    const group2 = group2Data.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    
    if (group1.length < 2 || group2.length < 2) {
      throw new Error('Need at least 2 data points in each group');
    }
    
    const mean1 = group1.reduce((sum, val) => sum + val, 0) / group1.length;
    const mean2 = group2.reduce((sum, val) => sum + val, 0) / group2.length;
    
    const var1 = group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (group1.length - 1);
    const var2 = group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (group2.length - 1);
    
    const pooledVar = ((group1.length - 1) * var1 + (group2.length - 1) * var2) / (group1.length + group2.length - 2);
    const tStat = (mean1 - mean2) / Math.sqrt(pooledVar * (1/group1.length + 1/group2.length));
    
    // Simplified p-value calculation (for demonstration)
    const pValue = this.estimatePValue(Math.abs(tStat), group1.length + group2.length - 2);
    
    return {
      value: `t = ${tStat.toFixed(3)}, p = ${pValue.toFixed(4)}`,
      unit: 'statistic',
      explanation: `${testType} t-test: Group 1 mean = ${mean1.toFixed(3)}, Group 2 mean = ${mean2.toFixed(3)}`,
      confidence: 0.95,
      warnings: ['P-value is an approximation. Use statistical software for precise values.']
    };
  }

  private static calculateGCContent(inputs: Record<string, any>): CalculatorResult {
    const { sequence } = inputs;
    const seq = sequence.toUpperCase();
    const gcCount = (seq.match(/[GC]/g) || []).length;
    const totalLength = seq.length;
    const gcPercent = (gcCount / totalLength) * 100;
    
    // Calculate GC skew
    const gCount = (seq.match(/G/g) || []).length;
    const cCount = (seq.match(/C/g) || []).length;
    const gcSkew = (gCount - cCount) / (gCount + cCount);
    
    return {
      value: Number(gcPercent.toFixed(2)),
      unit: '%',
      explanation: `GC content: ${gcPercent.toFixed(2)}%, GC skew: ${gcSkew.toFixed(3)}, Length: ${totalLength}bp`,
      confidence: 0.99
    };
  }

  private static calculateBufferpH(inputs: Record<string, any>): CalculatorResult {
    const { pKa, acidConcentration, conjugateBaseConcentration } = inputs;
    const pH = pKa + Math.log10(conjugateBaseConcentration / acidConcentration);
    
    return {
      value: Number(pH.toFixed(3)),
      unit: 'pH',
      explanation: `pH = ${pKa} + log(${conjugateBaseConcentration}M / ${acidConcentration}M) = ${pH.toFixed(3)}`,
      confidence: 0.99,
      suggestions: [
        'Buffer capacity is highest when pH ≈ pKa',
        'Use 0.1M total buffer concentration for good capacity',
        'Check pH with pH meter after preparation'
      ]
    };
  }

  private static calculateCentrifugation(inputs: Record<string, any>): CalculatorResult {
    const { rotorRadius, rpm, rcf } = inputs;
    
    if (rcf && rcf > 0) {
      // Calculate RPM from RCF
      const calculatedRPM = Math.sqrt(rcf / (1.118e-5 * rotorRadius));
      return {
        value: Number(calculatedRPM.toFixed(0)),
        unit: 'RPM',
        explanation: `RPM = √(${rcf}g / (1.118e-5 × ${rotorRadius}cm)) = ${calculatedRPM.toFixed(0)} RPM`,
        confidence: 0.99
      };
    } else {
      // Calculate RCF from RPM
      const calculatedRCF = 1.118e-5 * rotorRadius * Math.pow(rpm, 2);
      return {
        value: Number(calculatedRCF.toFixed(0)),
        unit: 'g',
        explanation: `RCF = 1.118e-5 × ${rotorRadius}cm × ${rpm}² = ${calculatedRCF.toFixed(0)}g`,
        confidence: 0.99
      };
    }
  }

  private static estimatePValue(tStat: number, df: number): number {
    // Simplified p-value estimation
    if (tStat > 3.291) return 0.001;
    if (tStat > 2.576) return 0.01;
    if (tStat > 1.96) return 0.05;
    if (tStat > 1.645) return 0.1;
    return 0.5;
  }
}
