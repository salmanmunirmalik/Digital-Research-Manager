import { CalculatorName, CalculatorInput, CalculatorResult, CalculatorInfo } from '../types';

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
  },

  'Protein Concentration Calculator (Bradford)': {
    name: 'Protein Concentration Calculator (Bradford)',
    category: 'Biochemistry',
    subCategory: 'Protein Analysis',
    description: 'Calculate protein concentration from Bradford assay absorbance',
    formula: 'Concentration = (Absorbance - Blank) / Slope × Dilution_Factor',
    units: {
      inputs: {
        absorbance: 'OD',
        blankAbsorbance: 'OD',
        slope: 'OD/μg/mL',
        dilutionFactor: 'unitless'
      },
      output: 'μg/mL'
    },
    examples: [
      {
        title: 'Standard Bradford Assay',
        inputs: { absorbance: 0.8, blankAbsorbance: 0.1, slope: 0.01, dilutionFactor: 10 },
        expectedOutput: 700,
        explanation: '0.7 OD difference / 0.01 × 10 = 700 μg/mL'
      }
    ],
    references: ['Bradford, M.M. Anal. Biochem. 72:248-254'],
    tags: ['protein', 'Bradford', 'concentration', 'absorbance', 'biochemistry']
  },

  'DNA Concentration Calculator (A260)': {
    name: 'DNA Concentration Calculator (A260)',
    category: 'Molecular Biology',
    subCategory: 'DNA Analysis',
    description: 'Calculate DNA concentration from A260 absorbance readings',
    formula: 'Concentration = A260 × 50 × Dilution_Factor',
    units: {
      inputs: {
        a260: 'OD',
        dilutionFactor: 'unitless'
      },
      output: 'ng/μL'
    },
    examples: [
      {
        title: 'DNA Sample',
        inputs: { a260: 0.5, dilutionFactor: 100 },
        expectedOutput: 2500,
        explanation: '0.5 × 50 × 100 = 2500 ng/μL'
      }
    ],
    references: ['Sambrook, J. Molecular Cloning'],
    tags: ['DNA', 'concentration', 'A260', 'spectrophotometry', 'molecular biology']
  },

  'RNA Concentration Calculator (A260)': {
    name: 'RNA Concentration Calculator (A260)',
    category: 'Molecular Biology',
    subCategory: 'RNA Analysis',
    description: 'Calculate RNA concentration from A260 absorbance readings',
    formula: 'Concentration = A260 × 40 × Dilution_Factor',
    units: {
      inputs: {
        a260: 'OD',
        dilutionFactor: 'unitless'
      },
      output: 'ng/μL'
    },
    examples: [
      {
        title: 'RNA Sample',
        inputs: { a260: 0.6, dilutionFactor: 50 },
        expectedOutput: 1200,
        explanation: '0.6 × 40 × 50 = 1200 ng/μL'
      }
    ],
    references: ['Sambrook, J. Molecular Cloning'],
    tags: ['RNA', 'concentration', 'A260', 'spectrophotometry', 'molecular biology']
  },

  'Cell Density Calculator': {
    name: 'Cell Density Calculator',
    category: 'Cell Biology',
    subCategory: 'Cell Culture',
    description: 'Calculate cell density from hemocytometer counts',
    formula: 'Density = (Count × Dilution_Factor × 10⁴) / Volume_Counted',
    units: {
      inputs: {
        cellCount: 'count',
        dilutionFactor: 'unitless',
        volumeCounted: 'μL'
      },
      output: 'cells/mL'
    },
    examples: [
      {
        title: 'Hemocytometer Count',
        inputs: { cellCount: 150, dilutionFactor: 10, volumeCounted: 0.1 },
        expectedOutput: 150000000,
        explanation: '(150 × 10 × 10⁴) / 0.1 = 150M cells/mL'
      }
    ],
    references: ['Freshney, R.I. Culture of Animal Cells'],
    tags: ['cell density', 'hemocytometer', 'cell counting', 'cell culture']
  },

  'Doubling Time Calculator': {
    name: 'Doubling Time Calculator',
    category: 'Cell Biology',
    subCategory: 'Cell Growth',
    description: 'Calculate cell doubling time from growth curve data',
    formula: 'Doubling_Time = ln(2) / Growth_Rate',
    units: {
      inputs: {
        initialCount: 'cells',
        finalCount: 'cells',
        timeElapsed: 'hours'
      },
      output: 'hours'
    },
    examples: [
      {
        title: 'Exponential Growth',
        inputs: { initialCount: 1000000, finalCount: 4000000, timeElapsed: 24 },
        expectedOutput: 12,
        explanation: '4-fold increase in 24h = 12h doubling time'
      }
    ],
    references: ['Freshney, R.I. Culture of Animal Cells'],
    tags: ['doubling time', 'cell growth', 'exponential growth', 'cell culture']
  },

  'Transformation Efficiency Calculator': {
    name: 'Transformation Efficiency Calculator',
    category: 'Molecular Biology',
    subCategory: 'Bacterial Transformation',
    description: 'Calculate transformation efficiency for bacterial transformations',
    formula: 'Efficiency = (Colonies × Dilution_Factor) / DNA_Amount',
    units: {
      inputs: {
        colonies: 'count',
        dilutionFactor: 'unitless',
        dnaAmount: 'ng'
      },
      output: 'CFU/μg'
    },
    examples: [
      {
        title: 'Standard Transformation',
        inputs: { colonies: 50, dilutionFactor: 1000, dnaAmount: 10 },
        expectedOutput: 5000000,
        explanation: '(50 × 1000) / 10 = 5M CFU/μg'
      }
    ],
    references: ['Sambrook, J. Molecular Cloning'],
    tags: ['transformation', 'efficiency', 'bacteria', 'DNA', 'molecular biology']
  },

  'Ligation Calculator': {
    name: 'Ligation Calculator',
    category: 'Molecular Biology',
    subCategory: 'DNA Ligation',
    description: 'Calculate optimal insert:vector ratios for DNA ligation',
    formula: 'Insert_ng = (Vector_ng × Insert_size_kb × Ratio) / Vector_size_kb',
    units: {
      inputs: {
        vectorAmount: 'ng',
        vectorSize: 'kb',
        insertSize: 'kb',
        insertVectorRatio: 'unitless'
      },
      output: 'ng'
    },
    examples: [
      {
        title: '3:1 Insert:Vector Ratio',
        inputs: { vectorAmount: 100, vectorSize: 3, insertSize: 1, insertVectorRatio: 3 },
        expectedOutput: 100,
        explanation: '(100 × 1 × 3) / 3 = 100 ng insert'
      }
    ],
    references: ['Sambrook, J. Molecular Cloning'],
    tags: ['ligation', 'insert:vector ratio', 'DNA', 'molecular biology']
  },

  'Restriction Enzyme Calculator': {
    name: 'Restriction Enzyme Calculator',
    category: 'Molecular Biology',
    subCategory: 'DNA Digestion',
    description: 'Calculate enzyme amounts and digestion times for DNA',
    formula: 'Enzyme_Units = (DNA_μg × 10) / Time_hours',
    units: {
      inputs: {
        dnaAmount: 'μg',
        digestionTime: 'hours',
        enzymeUnits: 'units'
      },
      output: 'units'
    },
    examples: [
      {
        title: 'Overnight Digestion',
        inputs: { dnaAmount: 5, digestionTime: 16, enzymeUnits: 0 },
        expectedOutput: 3.125,
        explanation: '(5 × 10) / 16 = 3.125 units needed'
      }
    ],
    references: ['Sambrook, J. Molecular Cloning'],
    tags: ['restriction enzyme', 'DNA digestion', 'molecular biology']
  },

  'Gel Electrophoresis Calculator': {
    name: 'Gel Electrophoresis Calculator',
    category: 'Molecular Biology',
    subCategory: 'Gel Analysis',
    description: 'Calculate DNA fragment sizes from gel migration distances',
    formula: 'Size = A × e^(-B × Distance)',
    units: {
      inputs: {
        migrationDistance: 'cm',
        gelConcentration: '%',
        voltage: 'V',
        time: 'minutes'
      },
      output: 'kb'
    },
    examples: [
      {
        title: '1% Agarose Gel',
        inputs: { migrationDistance: 3, gelConcentration: 1, voltage: 100, time: 60 },
        expectedOutput: 2.5,
        explanation: 'Approximate size based on standard curve'
      }
    ],
    references: ['Sambrook, J. Molecular Cloning'],
    tags: ['gel electrophoresis', 'DNA size', 'migration', 'molecular biology']
  },

  'Western Blot Calculator': {
    name: 'Western Blot Calculator',
    category: 'Protein Analysis',
    subCategory: 'Western Blotting',
    description: 'Calculate protein transfer conditions for Western blots',
    formula: 'Transfer_Time = (Gel_Thickness × 2) + (Protein_Size_kDa × 0.1)',
    units: {
      inputs: {
        gelThickness: 'mm',
        proteinSize: 'kDa',
        transferVoltage: 'V'
      },
      output: 'minutes'
    },
    examples: [
      {
        title: 'Standard Transfer',
        inputs: { gelThickness: 1, proteinSize: 50, transferVoltage: 100 },
        expectedOutput: 7,
        explanation: '(1 × 2) + (50 × 0.1) = 7 minutes'
      }
    ],
    references: ['Towbin, H. et al. PNAS 76:4350-4354'],
    tags: ['Western blot', 'protein transfer', 'electrophoresis', 'protein analysis']
  },

  'ELISA Calculator': {
    name: 'ELISA Calculator',
    category: 'Immunology',
    subCategory: 'ELISA Assays',
    description: 'Calculate antibody dilutions and concentrations for ELISA',
    formula: 'Final_Concentration = Stock_Concentration × (Volume_Stock / Total_Volume)',
    units: {
      inputs: {
        stockConcentration: 'μg/mL',
        volumeStock: 'μL',
        totalVolume: 'μL'
      },
      output: 'μg/mL'
    },
    examples: [
      {
        title: 'Antibody Dilution',
        inputs: { stockConcentration: 1000, volumeStock: 10, totalVolume: 1000 },
        expectedOutput: 10,
        explanation: '1000 × (10/1000) = 10 μg/mL final'
      }
    ],
    references: ['Harlow, E. Antibodies: A Laboratory Manual'],
    tags: ['ELISA', 'antibody', 'dilution', 'immunology', 'concentration']
  },

  'Flow Cytometry Calculator': {
    name: 'Flow Cytometry Calculator',
    category: 'Cell Biology',
    subCategory: 'Flow Cytometry',
    description: 'Calculate compensation and gating parameters for flow cytometry',
    formula: 'Compensation = (MFI_Spillover / MFI_Positive) × 100',
    units: {
      inputs: {
        mfiSpillover: 'MFI',
        mfiPositive: 'MFI',
        negativeControl: 'MFI'
      },
      output: '%'
    },
    examples: [
      {
        title: 'FITC Compensation',
        inputs: { mfiSpillover: 500, mfiPositive: 10000, negativeControl: 100 },
        expectedOutput: 5,
        explanation: '(500/10000) × 100 = 5% compensation needed'
      }
    ],
    references: ['Shapiro, H.M. Practical Flow Cytometry'],
    tags: ['flow cytometry', 'compensation', 'MFI', 'cell biology']
  },

  'Microscopy Calculator': {
    name: 'Microscopy Calculator',
    category: 'Imaging',
    subCategory: 'Microscopy',
    description: 'Calculate magnification, resolution, and field of view',
    formula: 'Resolution = 0.61 × λ / NA',
    units: {
      inputs: {
        wavelength: 'nm',
        numericalAperture: 'unitless',
        magnification: '×',
        pixelSize: 'μm'
      },
      output: 'nm'
    },
    examples: [
      {
        title: 'Fluorescence Microscopy',
        inputs: { wavelength: 500, numericalAperture: 1.4, magnification: 100, pixelSize: 6.45 },
        expectedOutput: 218,
        explanation: '0.61 × 500 / 1.4 = 218 nm resolution'
      }
    ],
    references: ['Murphy, D.B. Fundamentals of Light Microscopy'],
    tags: ['microscopy', 'resolution', 'magnification', 'imaging', 'NA']
  },

  'Image Analysis Calculator': {
    name: 'Image Analysis Calculator',
    category: 'Imaging',
    subCategory: 'Image Processing',
    description: 'Calculate pixel dimensions, areas, and intensities from images',
    formula: 'Area_μm² = (Pixels × Pixel_Size²) / Magnification²',
    units: {
      inputs: {
        pixelCount: 'pixels',
        pixelSize: 'μm',
        magnification: '×',
        intensity: 'gray value'
      },
      output: 'μm²'
    },
    examples: [
      {
        title: 'Cell Area Measurement',
        inputs: { pixelCount: 1000, pixelSize: 6.45, magnification: 100, intensity: 150 },
        expectedOutput: 0.416,
        explanation: '(1000 × 6.45²) / 100² = 0.416 μm²'
      }
    ],
    references: ['ImageJ Documentation'],
    tags: ['image analysis', 'pixels', 'area', 'intensity', 'imaging']
  },

  'Spectrophotometry Calculator': {
    name: 'Spectrophotometry Calculator',
    category: 'Analytical Chemistry',
    subCategory: 'Spectroscopy',
    description: 'Calculate concentration from absorbance using Beer-Lambert law',
    formula: 'A = ε × c × l',
    units: {
      inputs: {
        absorbance: 'OD',
        molarAbsorptivity: 'M⁻¹cm⁻¹',
        pathLength: 'cm'
      },
      output: 'M'
    },
    examples: [
      {
        title: 'Standard Curve',
        inputs: { absorbance: 0.5, molarAbsorptivity: 5000, pathLength: 1 },
        expectedOutput: 0.0001,
        explanation: '0.5 / (5000 × 1) = 0.0001 M'
      }
    ],
    references: ['Harris, D.C. Quantitative Chemical Analysis'],
    tags: ['spectrophotometry', 'Beer-Lambert', 'absorbance', 'concentration', 'chemistry']
  },

  'HPLC Calculator': {
    name: 'HPLC Calculator',
    category: 'Analytical Chemistry',
    subCategory: 'Chromatography',
    description: 'Calculate retention time, resolution, and peak area from HPLC data',
    formula: 'Resolution = 2(tR2 - tR1) / (w1 + w2)',
    units: {
      inputs: {
        retentionTime1: 'minutes',
        retentionTime2: 'minutes',
        peakWidth1: 'minutes',
        peakWidth2: 'minutes'
      },
      output: 'unitless'
    },
    examples: [
      {
        title: 'Peak Resolution',
        inputs: { retentionTime1: 5, retentionTime2: 6, peakWidth1: 0.5, peakWidth2: 0.6 },
        expectedOutput: 1.82,
        explanation: '2(6-5) / (0.5+0.6) = 1.82 resolution'
      }
    ],
    references: ['Skoog, D.A. Principles of Instrumental Analysis'],
    tags: ['HPLC', 'chromatography', 'retention time', 'resolution', 'analytical chemistry']
  },

  'Mass Spectrometry Calculator': {
    name: 'Mass Spectrometry Calculator',
    category: 'Analytical Chemistry',
    subCategory: 'Mass Spec',
    description: 'Calculate m/z ratios, isotopic distributions, and molecular weights',
    formula: 'm/z = (Mass + nH⁺) / Charge',
    units: {
      inputs: {
        molecularWeight: 'Da',
        charge: 'unitless',
        hydrogenIons: 'unitless'
      },
      output: 'm/z'
    },
    examples: [
      {
        title: 'Protonated Ion',
        inputs: { molecularWeight: 1000, charge: 1, hydrogenIons: 1 },
        expectedOutput: 1001,
        explanation: '(1000 + 1) / 1 = 1001 m/z'
      }
    ],
    references: ['Gross, J.H. Mass Spectrometry'],
    tags: ['mass spectrometry', 'm/z', 'molecular weight', 'isotopes', 'analytical chemistry']
  },

  'NMR Calculator': {
    name: 'NMR Calculator',
    category: 'Analytical Chemistry',
    subCategory: 'NMR Spectroscopy',
    description: 'Calculate chemical shifts, coupling constants, and relaxation times',
    formula: 'δ = (ν_sample - ν_reference) / ν_reference × 10⁶',
    units: {
      inputs: {
        sampleFrequency: 'MHz',
        referenceFrequency: 'MHz',
        couplingConstant: 'Hz'
      },
      output: 'ppm'
    },
    examples: [
      {
        title: 'Chemical Shift',
        inputs: { sampleFrequency: 500.123, referenceFrequency: 500.000, couplingConstant: 7.2 },
        expectedOutput: 246,
        explanation: '(500.123 - 500.000) / 500.000 × 10⁶ = 246 ppm'
      }
    ],
    references: ['Keeler, J. Understanding NMR Spectroscopy'],
    tags: ['NMR', 'chemical shift', 'coupling constant', 'spectroscopy', 'analytical chemistry']
  },

  'X-ray Crystallography Calculator': {
    name: 'X-ray Crystallography Calculator',
    category: 'Structural Biology',
    subCategory: 'X-ray Diffraction',
    description: 'Calculate resolution, unit cell parameters, and diffraction angles',
    formula: 'd = λ / (2 × sin(θ))',
    units: {
      inputs: {
        wavelength: 'Å',
        diffractionAngle: 'degrees',
        unitCellA: 'Å',
        unitCellB: 'Å',
        unitCellC: 'Å'
      },
      output: 'Å'
    },
    examples: [
      {
        title: 'Copper Kα Radiation',
        inputs: { wavelength: 1.54, diffractionAngle: 15, unitCellA: 10, unitCellB: 10, unitCellC: 10 },
        expectedOutput: 2.97,
        explanation: '1.54 / (2 × sin(15°)) = 2.97 Å resolution'
      }
    ],
    references: ['Drenth, J. Principles of Protein X-ray Crystallography'],
    tags: ['X-ray crystallography', 'diffraction', 'resolution', 'unit cell', 'structural biology']
  },

  'Cryo-EM Calculator': {
    name: 'Cryo-EM Calculator',
    category: 'Structural Biology',
    subCategory: 'Electron Microscopy',
    description: 'Calculate resolution, defocus, and particle sizes for cryo-EM',
    formula: 'Resolution = 0.43 × λ / (Defocus × 10⁻¹⁰)',
    units: {
      inputs: {
        electronWavelength: 'Å',
        defocus: 'μm',
        particleSize: 'nm',
        accelerationVoltage: 'kV'
      },
      output: 'Å'
    },
    examples: [
      {
        title: '300 kV Cryo-EM',
        inputs: { electronWavelength: 0.02, defocus: 2, particleSize: 100, accelerationVoltage: 300 },
        expectedOutput: 4.3,
        explanation: '0.43 × 0.02 / (2 × 10⁻¹⁰) = 4.3 Å resolution'
      }
    ],
    references: ['Frank, J. Three-Dimensional Electron Microscopy'],
    tags: ['cryo-EM', 'electron microscopy', 'resolution', 'defocus', 'structural biology']
  },

  'Bioinformatics Calculator': {
    name: 'Bioinformatics Calculator',
    category: 'Bioinformatics',
    subCategory: 'Sequence Analysis',
    description: 'Calculate sequence similarity, alignment scores, and evolutionary distances',
    formula: 'Similarity = (Identical_Positions / Total_Positions) × 100',
    units: {
      inputs: {
        identicalPositions: 'count',
        totalPositions: 'count',
        gapPenalty: 'unitless',
        mismatchPenalty: 'unitless'
      },
      output: '%'
    },
    examples: [
      {
        title: 'Sequence Alignment',
        inputs: { identicalPositions: 80, totalPositions: 100, gapPenalty: -10, mismatchPenalty: -1 },
        expectedOutput: 80,
        explanation: '(80/100) × 100 = 80% similarity'
      }
    ],
 references: ['Mount, D.W. Bioinformatics'],
    tags: ['bioinformatics', 'sequence similarity', 'alignment', 'evolution', 'sequence analysis']
  },

  'Machine Learning Calculator': {
    name: 'Machine Learning Calculator',
    category: 'Data Science',
    subCategory: 'Machine Learning',
    description: 'Calculate accuracy, precision, recall, and F1 score for ML models',
    formula: 'F1 = 2 × (Precision × Recall) / (Precision + Recall)',
    units: {
      inputs: {
        truePositives: 'count',
        falsePositives: 'count',
        trueNegatives: 'count',
        falseNegatives: 'count'
      },
      output: 'unitless'
    },
    examples: [
      {
        title: 'Classification Model',
        inputs: { truePositives: 80, falsePositives: 20, trueNegatives: 70, falseNegatives: 30 },
        expectedOutput: 0.8,
        explanation: 'Precision=0.8, Recall=0.73, F1=0.76'
      }
    ],
    references: ['Hastie, T. Elements of Statistical Learning'],
    tags: ['machine learning', 'accuracy', 'precision', 'recall', 'F1 score', 'data science']
  },

  'Statistical Power Calculator': {
    name: 'Statistical Power Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Power Analysis',
    description: 'Calculate statistical power and required sample sizes for studies',
    formula: 'Power = 1 - β = P(Reject H₀ | H₁ is true)',
    units: {
      inputs: {
        effectSize: 'unitless',
        sampleSize: 'count',
        alpha: 'unitless',
        standardDeviation: 'unitless'
      },
      output: 'unitless'
    },
    examples: [
      {
        title: 'T-Test Power',
        inputs: { effectSize: 0.5, sampleSize: 64, alpha: 0.05, standardDeviation: 1 },
        expectedOutput: 0.8,
        explanation: '80% power to detect medium effect size'
      }
    ],
    references: ['Cohen, J. Statistical Power Analysis'],
    tags: ['statistical power', 'sample size', 'effect size', 'statistics', 'power analysis']
  },

  'Correlation Calculator': {
    name: 'Correlation Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Correlation Analysis',
    description: 'Calculate Pearson, Spearman, and Kendall correlation coefficients',
    formula: 'r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² × Σ(y - ȳ)²)',
    units: {
      inputs: {
        xValues: 'comma-separated values',
        yValues: 'comma-separated values',
        correlationType: 'pearson, spearman, or kendall'
      },
      output: 'unitless'
    },
    examples: [
      {
        title: 'Pearson Correlation',
        inputs: { xValues: '1,2,3,4,5', yValues: '2,4,6,8,10', correlationType: 'pearson' },
        expectedOutput: 1,
        explanation: 'Perfect positive correlation = 1.0'
      }
    ],
    references: ['Sokal, R.R. Biometry'],
    tags: ['correlation', 'pearson', 'spearman', 'kendall', 'statistics', 'data analysis']
  },

  'ANOVA Calculator': {
    name: 'ANOVA Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Analysis of Variance',
    description: 'Perform one-way and two-way ANOVA with post-hoc tests',
    formula: 'F = MS_between / MS_within',
    units: {
      inputs: {
        groupData: 'comma-separated groups',
        alpha: 'unitless'
      },
      output: 'F-statistic and p-value'
    },
    examples: [
      {
        title: 'One-Way ANOVA',
        inputs: { groupData: '10,12,11;15,17,16;18,20,19', alpha: 0.05 },
        expectedOutput: 'F=25.2, p<0.001',
        explanation: 'Significant difference between groups'
      }
    ],
    references: ['Sokal, R.R. Biometry'],
    tags: ['ANOVA', 'analysis of variance', 'F-test', 'statistics', 'data analysis']
  },

  'Chi-Square Calculator': {
    name: 'Chi-Square Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Chi-Square Tests',
    description: 'Calculate chi-square statistic for goodness-of-fit and independence tests',
    formula: 'χ² = Σ((Observed - Expected)² / Expected)',
    units: {
      inputs: {
        observedValues: 'comma-separated values',
        expectedValues: 'comma-separated values',
        degreesOfFreedom: 'count'
      },
      output: 'χ² statistic and p-value'
    },
    examples: [
      {
        title: 'Goodness-of-Fit Test',
        inputs: { observedValues: '25,75', expectedValues: '20,80', degreesOfFreedom: 1 },
        expectedOutput: 'χ²=1.56, p>0.05',
        explanation: 'No significant deviation from expected'
      }
    ],
    references: ['Sokal, R.R. Biometry'],
    tags: ['chi-square', 'goodness-of-fit', 'independence', 'statistics', 'data analysis']
  },

  'Regression Calculator': {
    name: 'Regression Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Regression Analysis',
    description: 'Calculate linear and multiple regression coefficients and R²',
    formula: 'y = mx + b, R² = 1 - (SS_residual / SS_total)',
    units: {
      inputs: {
        xValues: 'comma-separated values',
        yValues: 'comma-separated values',
        regressionType: 'linear or multiple'
      },
      output: 'slope, intercept, R²'
    },
    examples: [
      {
        title: 'Linear Regression',
        inputs: { xValues: '1,2,3,4,5', yValues: '2,4,6,8,10', regressionType: 'linear' },
        expectedOutput: 'slope=2, intercept=0, R²=1',
        explanation: 'Perfect linear relationship'
      }
    ],
    references: ['Sokal, R.R. Biometry'],
    tags: ['regression', 'linear', 'multiple', 'R²', 'statistics', 'data analysis']
  },

  'Survival Analysis Calculator': {
    name: 'Survival Analysis Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Survival Analysis',
    description: 'Calculate Kaplan-Meier survival curves and log-rank test',
    formula: 'S(t) = ∏(1 - dᵢ/nᵢ)',
    units: {
      inputs: {
        timePoints: 'comma-separated values',
        events: 'comma-separated values',
        censored: 'comma-separated values'
      },
      output: 'survival probability'
    },
    examples: [
      {
        title: 'Kaplan-Meier',
        inputs: { timePoints: '1,2,3,4,5', events: '1,1,0,1,0', censored: '0,0,1,0,1' },
        expectedOutput: 'S(5)=0.4',
        explanation: '40% survival at 5 time units'
      }
    ],
    references: ['Klein, J.P. Survival Analysis'],
    tags: ['survival analysis', 'Kaplan-Meier', 'log-rank', 'statistics', 'data analysis']
  },

  'Meta-Analysis Calculator': {
    name: 'Meta-Analysis Calculator',
    category: 'Statistics & Data Analysis',
    subCategory: 'Meta-Analysis',
    description: 'Calculate effect sizes, heterogeneity, and publication bias',
    formula: 'Q = Σwᵢ(yᵢ - ȳ)², I² = (Q - df) / Q × 100',
    units: {
      inputs: {
        effectSizes: 'comma-separated values',
        standardErrors: 'comma-separated values',
        sampleSizes: 'comma-separated values'
      },
      output: 'overall effect size, heterogeneity'
    },
    examples: [
      {
        title: 'Fixed Effects Model',
        inputs: { effectSizes: '0.5,0.6,0.4', standardErrors: '0.1,0.1,0.1', sampleSizes: '100,100,100' },
        expectedOutput: 'effect=0.5, I²=0%',
        explanation: 'Homogeneous studies, fixed effects appropriate'
      }
    ],
    references: ['Borenstein, M. Introduction to Meta-Analysis'],
    tags: ['meta-analysis', 'effect size', 'heterogeneity', 'publication bias', 'statistics']
  },

  'Pharmacokinetics Calculator': {
    name: 'Pharmacokinetics Calculator',
    category: 'Pharmacology',
    subCategory: 'Drug Kinetics',
    description: 'Calculate drug half-life, clearance, and volume of distribution',
    formula: 't₁/₂ = ln(2) / k, Cl = Dose / AUC',
    units: {
      inputs: {
        eliminationRate: 'h⁻¹',
        dose: 'mg',
        areaUnderCurve: 'mg·h/L',
        volumeDistribution: 'L'
      },
      output: 'hours, L/h, L'
    },
    examples: [
      {
        title: 'Drug Elimination',
        inputs: { eliminationRate: 0.1, dose: 100, areaUnderCurve: 50, volumeDistribution: 10 },
        expectedOutput: 't₁/₂=6.93h, Cl=2L/h, Vd=10L',
        explanation: 'Standard pharmacokinetic parameters'
      }
    ],
    references: ['Rowland, M. Clinical Pharmacokinetics'],
    tags: ['pharmacokinetics', 'half-life', 'clearance', 'volume of distribution', 'pharmacology']
  },

  'Toxicology Calculator': {
    name: 'Toxicology Calculator',
    category: 'Toxicology',
    subCategory: 'Risk Assessment',
    description: 'Calculate LD50, NOAEL, and safety factors for toxicological studies',
    formula: 'Safety_Factor = NOAEL / Human_Exposure',
    units: {
      inputs: {
        noael: 'mg/kg/day',
        humanExposure: 'mg/kg/day',
        ld50: 'mg/kg',
        bodyWeight: 'kg'
      },
      output: 'unitless'
    },
    examples: [
      {
        title: 'Safety Assessment',
        inputs: { noael: 100, humanExposure: 1, ld50: 1000, bodyWeight: 70 },
        expectedOutput: 100,
        explanation: '100-fold safety factor (100/1)'
      }
    ],
    references: ['Klaassen, C.D. Casarett & Doull\'s Toxicology'],
    tags: ['toxicology', 'LD50', 'NOAEL', 'safety factor', 'risk assessment']
  },

  'Neuroscience Calculator': {
    name: 'Neuroscience Calculator',
    category: 'Neuroscience',
    subCategory: 'Neural Analysis',
    description: 'Calculate action potential parameters, synaptic strength, and neural connectivity',
    formula: 'V(t) = V₀ + (V_max - V₀)(1 - e^(-t/τ))',
    units: {
      inputs: {
        restingPotential: 'mV',
        thresholdPotential: 'mV',
        timeConstant: 'ms',
        membraneResistance: 'MΩ'
      },
      output: 'mV'
    },
    examples: [
      {
        title: 'Action Potential',
        inputs: { restingPotential: -70, thresholdPotential: -55, timeConstant: 10, membraneResistance: 100 },
        expectedOutput: -55,
        explanation: 'Threshold reached, action potential initiated'
      }
    ],
    references: ['Kandel, E.R. Principles of Neural Science'],
    tags: ['neuroscience', 'action potential', 'synaptic strength', 'neural connectivity', 'membrane potential']
  },

  'Immunology Calculator': {
    name: 'Immunology Calculator',
    category: 'Immunology',
    subCategory: 'Immune Response',
    description: 'Calculate antibody titers, cytokine concentrations, and immune cell counts',
    formula: 'Titer = 2^(Dilution_Factor)',
    units: {
      inputs: {
        dilutionFactor: 'unitless',
        antibodyConcentration: 'μg/mL',
        cytokineLevel: 'pg/mL',
        cellCount: 'cells/μL'
      },
      output: 'various units'
    },
    examples: [
      {
        title: 'Antibody Titer',
        inputs: { dilutionFactor: 8, antibodyConcentration: 100, cytokineLevel: 50, cellCount: 1000 },
        expectedOutput: 256,
        explanation: '2^8 = 256-fold dilution titer'
      }
    ],
    references: ['Abbas, A.K. Cellular and Molecular Immunology'],
    tags: ['immunology', 'antibody titer', 'cytokines', 'immune cells', 'immune response']
  },

  'Ecology Calculator': {
    name: 'Ecology Calculator',
    category: 'Ecology',
    subCategory: 'Population Dynamics',
    description: 'Calculate population growth, biodiversity indices, and species richness',
    formula: 'Shannon_H = -Σ(pᵢ × ln(pᵢ))',
    units: {
      inputs: {
        populationSize: 'individuals',
        growthRate: 'unitless',
        speciesCounts: 'comma-separated values',
        carryingCapacity: 'individuals'
      },
      output: 'various units'
    },
    examples: [
      {
        title: 'Biodiversity Index',
        inputs: { populationSize: 1000, growthRate: 0.1, speciesCounts: '50,30,20', carryingCapacity: 2000 },
        expectedOutput: 'H=1.1',
        explanation: 'Shannon diversity index for 3 species'
      }
    ],
    references: ['Krebs, C.J. Ecology'],
    tags: ['ecology', 'biodiversity', 'population dynamics', 'species richness', 'ecosystem']
  },

  'Climate Science Calculator': {
    name: 'Climate Science Calculator',
    category: 'Climate Science',
    subCategory: 'Climate Modeling',
    description: 'Calculate temperature anomalies, carbon budgets, and climate sensitivity',
    formula: 'ΔT = λ × ΔF, where λ is climate sensitivity',
    units: {
      inputs: {
        radiativeForcing: 'W/m²',
        climateSensitivity: '°C/(W/m²)',
        temperatureAnomaly: '°C',
        carbonConcentration: 'ppm'
      },
      output: '°C'
    },
    examples: [
      {
        title: 'Temperature Response',
        inputs: { radiativeForcing: 3.7, climateSensitivity: 0.8, temperatureAnomaly: 1.0, carbonConcentration: 400 },
        expectedOutput: 3.0,
        explanation: '3.7 × 0.8 = 3.0°C temperature increase'
      }
    ],
    references: ['IPCC Assessment Reports'],
    tags: ['climate science', 'temperature', 'carbon budget', 'climate sensitivity', 'global warming']
  },

  'Materials Science Calculator': {
    name: 'Materials Science Calculator',
    category: 'Materials Science',
    subCategory: 'Material Properties',
    description: 'Calculate Young\'s modulus, tensile strength, and material properties',
    formula: 'E = σ / ε, where E is Young\'s modulus',
    units: {
      inputs: {
        stress: 'MPa',
        strain: 'unitless',
        elasticModulus: 'GPa',
        poissonRatio: 'unitless'
      },
      output: 'GPa'
    },
    examples: [
      {
        title: 'Young\'s Modulus',
        inputs: { stress: 200, strain: 0.002, elasticModulus: 0, poissonRatio: 0.3 },
        expectedOutput: 100,
        explanation: '200 MPa / 0.002 = 100 GPa'
      }
    ],
    references: ['Callister, W.D. Materials Science and Engineering'],
    tags: ['materials science', 'Young\'s modulus', 'tensile strength', 'material properties', 'engineering']
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
  ],

  'Protein Concentration Calculator (Bradford)': [
    {
      name: 'absorbance',
      label: 'Sample Absorbance (OD)',
      type: 'number',
      unit: 'OD',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Absorbance reading of your sample'
    },
    {
      name: 'blankAbsorbance',
      label: 'Blank Absorbance (OD)',
      type: 'number',
      unit: 'OD',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Absorbance reading of blank/reference'
    },
    {
      name: 'slope',
      label: 'Standard Curve Slope (OD/μg/mL)',
      type: 'number',
      unit: 'OD/μg/mL',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Slope from your standard curve'
    },
    {
      name: 'dilutionFactor',
      label: 'Dilution Factor',
      type: 'number',
      required: true,
      min: 1,
      step: 1,
      helpText: 'How much you diluted your sample'
    }
  ],

  'DNA Concentration Calculator (A260)': [
    {
      name: 'a260',
      label: 'A260 Absorbance',
      type: 'number',
      unit: 'OD',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Absorbance reading at 260nm'
    },
    {
      name: 'dilutionFactor',
      label: 'Dilution Factor',
      type: 'number',
      required: true,
      min: 1,
      step: 1,
      helpText: 'How much you diluted your sample'
    }
  ],

  'RNA Concentration Calculator (A260)': [
    {
      name: 'a260',
      label: 'A260 Absorbance',
      type: 'number',
      unit: 'OD',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Absorbance reading at 260nm'
    },
    {
      name: 'dilutionFactor',
      label: 'Dilution Factor',
      type: 'number',
      required: true,
      min: 1,
      step: 1,
      helpText: 'How much you diluted your sample'
    }
  ],

  'Cell Density Calculator': [
    {
      name: 'cellCount',
      label: 'Cell Count',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of cells counted in hemocytometer'
    },
    {
      name: 'dilutionFactor',
      label: 'Dilution Factor',
      type: 'number',
      required: true,
      min: 1,
      step: 1,
      helpText: 'How much you diluted your sample'
    },
    {
      name: 'volumeCounted',
      label: 'Volume Counted (μL)',
      type: 'number',
      unit: 'μL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Volume of the counting chamber'
    }
  ],

  'Doubling Time Calculator': [
    {
      name: 'initialCount',
      label: 'Initial Cell Count',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Starting number of cells'
    },
    {
      name: 'finalCount',
      label: 'Final Cell Count',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Final number of cells'
    },
    {
      name: 'timeElapsed',
      label: 'Time Elapsed (hours)',
      type: 'number',
      unit: 'hours',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Time between measurements'
    }
  ],

  'Transformation Efficiency Calculator': [
    {
      name: 'colonies',
      label: 'Colonies Counted',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of colonies on the plate'
    },
    {
      name: 'dilutionFactor',
      label: 'Dilution Factor',
      type: 'number',
      required: true,
      min: 1,
      step: 1,
      helpText: 'How much you diluted before plating'
    },
    {
      name: 'dnaAmount',
      label: 'DNA Amount (ng)',
      type: 'number',
      unit: 'ng',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Amount of DNA used for transformation'
    }
  ],

  'Ligation Calculator': [
    {
      name: 'vectorAmount',
      label: 'Vector Amount (ng)',
      type: 'number',
      unit: 'ng',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Amount of vector DNA'
    },
    {
      name: 'vectorSize',
      label: 'Vector Size (kb)',
      type: 'number',
      unit: 'kb',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Size of vector in kilobases'
    },
    {
      name: 'insertSize',
      label: 'Insert Size (kb)',
      type: 'number',
      unit: 'kb',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Size of insert in kilobases'
    },
    {
      name: 'insertVectorRatio',
      label: 'Insert:Vector Ratio',
      type: 'number',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Desired molar ratio of insert to vector'
    }
  ],

  'Restriction Enzyme Calculator': [
    {
      name: 'dnaAmount',
      label: 'DNA Amount (μg)',
      type: 'number',
      unit: 'μg',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Amount of DNA to digest'
    },
    {
      name: 'digestionTime',
      label: 'Digestion Time (hours)',
      type: 'number',
      unit: 'hours',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'How long to digest'
    },
    {
      name: 'enzymeUnits',
      label: 'Enzyme Units',
      type: 'number',
      required: false,
      min: 0,
      step: 0.1,
      helpText: 'Leave empty to calculate required units'
    }
  ],

  'Gel Electrophoresis Calculator': [
    {
      name: 'migrationDistance',
      label: 'Migration Distance (cm)',
      type: 'number',
      unit: 'cm',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Distance migrated on gel'
    },
    {
      name: 'gelConcentration',
      label: 'Gel Concentration (%)',
      type: 'number',
      unit: '%',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Percentage of agarose in gel'
    },
    {
      name: 'voltage',
      label: 'Voltage (V)',
      type: 'number',
      unit: 'V',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Voltage applied during electrophoresis'
    },
    {
      name: 'time',
      label: 'Run Time (minutes)',
      type: 'number',
      unit: 'minutes',
      required: true,
      min: 0,
      step: 1,
      helpText: 'How long the gel ran'
    }
  ],

  'Western Blot Calculator': [
    {
      name: 'gelThickness',
      label: 'Gel Thickness (mm)',
      type: 'number',
      unit: 'mm',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Thickness of the gel'
    },
    {
      name: 'proteinSize',
      label: 'Protein Size (kDa)',
      type: 'number',
      unit: 'kDa',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Size of protein in kilodaltons'
    },
    {
      name: 'transferVoltage',
      label: 'Transfer Voltage (V)',
      type: 'number',
      unit: 'V',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Voltage for protein transfer'
    }
  ],

  'ELISA Calculator': [
    {
      name: 'stockConcentration',
      label: 'Stock Concentration (μg/mL)',
      type: 'number',
      unit: 'μg/mL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Concentration of stock antibody'
    },
    {
      name: 'volumeStock',
      label: 'Volume of Stock (μL)',
      type: 'number',
      unit: 'μL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Volume of stock to add'
    },
    {
      name: 'totalVolume',
      label: 'Total Volume (μL)',
      type: 'number',
      unit: 'μL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Final volume after dilution'
    }
  ],

  'Flow Cytometry Calculator': [
    {
      name: 'mfiSpillover',
      label: 'MFI Spillover',
      type: 'number',
      unit: 'MFI',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Mean fluorescence intensity in spillover channel'
    },
    {
      name: 'mfiPositive',
      label: 'MFI Positive',
      type: 'number',
      unit: 'MFI',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Mean fluorescence intensity in positive channel'
    },
    {
      name: 'negativeControl',
      label: 'Negative Control MFI',
      type: 'number',
      unit: 'MFI',
      required: true,
      min: 0,
      step: 1,
      helpText: 'MFI of negative control'
    }
  ],

  'Microscopy Calculator': [
    {
      name: 'wavelength',
      label: 'Wavelength (nm)',
      type: 'number',
      unit: 'nm',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Wavelength of light used'
    },
    {
      name: 'numericalAperture',
      label: 'Numerical Aperture',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'NA of the objective lens'
    },
    {
      name: 'magnification',
      label: 'Magnification (×)',
      type: 'number',
      unit: '×',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Total magnification'
    },
    {
      name: 'pixelSize',
      label: 'Pixel Size (μm)',
      type: 'number',
      unit: 'μm',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Size of camera pixels'
    }
  ],

  'Image Analysis Calculator': [
    {
      name: 'pixelCount',
      label: 'Pixel Count',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of pixels in region of interest'
    },
    {
      name: 'pixelSize',
      label: 'Pixel Size (μm)',
      type: 'number',
      unit: 'μm',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Physical size of each pixel'
    },
    {
      name: 'magnification',
      label: 'Magnification (×)',
      type: 'number',
      unit: '×',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Total magnification used'
    },
    {
      name: 'intensity',
      label: 'Intensity Value',
      type: 'number',
      required: false,
      min: 0,
      step: 1,
      helpText: 'Gray value or fluorescence intensity'
    }
  ],

  'Spectrophotometry Calculator': [
    {
      name: 'absorbance',
      label: 'Absorbance (OD)',
      type: 'number',
      unit: 'OD',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Absorbance reading'
    },
    {
      name: 'molarAbsorptivity',
      label: 'Molar Absorptivity (M⁻¹cm⁻¹)',
      type: 'number',
      unit: 'M⁻¹cm⁻¹',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Extinction coefficient'
    },
    {
      name: 'pathLength',
      label: 'Path Length (cm)',
      type: 'number',
      unit: 'cm',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Length of light path through sample'
    }
  ],

  'HPLC Calculator': [
    {
      name: 'retentionTime1',
      label: 'Retention Time 1 (min)',
      type: 'number',
      unit: 'minutes',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Retention time of first peak'
    },
    {
      name: 'retentionTime2',
      label: 'Retention Time 2 (min)',
      type: 'number',
      unit: 'minutes',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Retention time of second peak'
    },
    {
      name: 'peakWidth1',
      label: 'Peak Width 1 (min)',
      type: 'number',
      unit: 'minutes',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Width at base of first peak'
    },
    {
      name: 'peakWidth2',
      label: 'Peak Width 2 (min)',
      type: 'number',
      unit: 'minutes',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Width at base of second peak'
    }
  ],

  'Mass Spectrometry Calculator': [
    {
      name: 'molecularWeight',
      label: 'Molecular Weight (Da)',
      type: 'number',
      unit: 'Da',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Molecular weight of the compound'
    },
    {
      name: 'charge',
      label: 'Charge',
      type: 'number',
      required: true,
      min: -10,
      max: 10,
      step: 1,
      helpText: 'Charge state of the ion'
    },
    {
      name: 'hydrogenIons',
      label: 'Hydrogen Ions',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of protons added'
    }
  ],

  'NMR Calculator': [
    {
      name: 'sampleFrequency',
      label: 'Sample Frequency (MHz)',
      type: 'number',
      unit: 'MHz',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Frequency of sample signal'
    },
    {
      name: 'referenceFrequency',
      label: 'Reference Frequency (MHz)',
      type: 'number',
      unit: 'MHz',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Frequency of reference signal'
    },
    {
      name: 'couplingConstant',
      label: 'Coupling Constant (Hz)',
      type: 'number',
      unit: 'Hz',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'J-coupling constant'
    }
  ],

  'X-ray Crystallography Calculator': [
    {
      name: 'wavelength',
      label: 'Wavelength (Å)',
      type: 'number',
      unit: 'Å',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'X-ray wavelength'
    },
    {
      name: 'diffractionAngle',
      label: 'Diffraction Angle (degrees)',
      type: 'number',
      unit: 'degrees',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Bragg angle'
    },
    {
      name: 'unitCellA',
      label: 'Unit Cell A (Å)',
      type: 'number',
      unit: 'Å',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Unit cell parameter a'
    },
    {
      name: 'unitCellB',
      label: 'Unit Cell B (Å)',
      type: 'number',
      unit: 'Å',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Unit cell parameter b'
    },
    {
      name: 'unitCellC',
      label: 'Unit Cell C (Å)',
      type: 'number',
      unit: 'Å',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Unit cell parameter c'
    }
  ],

  'Cryo-EM Calculator': [
    {
      name: 'electronWavelength',
      label: 'Electron Wavelength (Å)',
      type: 'number',
      unit: 'Å',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'De Broglie wavelength of electrons'
    },
    {
      name: 'defocus',
      label: 'Defocus (μm)',
      type: 'number',
      unit: 'μm',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Defocus value'
    },
    {
      name: 'particleSize',
      label: 'Particle Size (nm)',
      type: 'number',
      unit: 'nm',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Size of particles being imaged'
    },
    {
      name: 'accelerationVoltage',
      label: 'Acceleration Voltage (kV)',
      type: 'number',
      unit: 'kV',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Electron acceleration voltage'
    }
  ],

  'Bioinformatics Calculator': [
    {
      name: 'identicalPositions',
      label: 'Identical Positions',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of identical positions'
    },
    {
      name: 'totalPositions',
      label: 'Total Positions',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Total number of positions compared'
    },
    {
      name: 'gapPenalty',
      label: 'Gap Penalty',
      type: 'number',
      required: true,
      min: -100,
      step: 1,
      helpText: 'Penalty for gaps in alignment'
    },
    {
      name: 'mismatchPenalty',
      label: 'Mismatch Penalty',
      type: 'number',
      required: true,
      min: -100,
      step: 1,
      helpText: 'Penalty for mismatches'
    }
  ],

  'Machine Learning Calculator': [
    {
      name: 'truePositives',
      label: 'True Positives',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of true positive predictions'
    },
    {
      name: 'falsePositives',
      label: 'False Positives',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of false positive predictions'
    },
    {
      name: 'trueNegatives',
      label: 'True Negatives',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of true negative predictions'
    },
    {
      name: 'falseNegatives',
      label: 'False Negatives',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of false negative predictions'
    }
  ],

  'Statistical Power Calculator': [
    {
      name: 'effectSize',
      label: 'Effect Size',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Cohen\'s d effect size'
    },
    {
      name: 'sampleSize',
      label: 'Sample Size',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of participants'
    },
    {
      name: 'alpha',
      label: 'Alpha Level',
      type: 'number',
      required: true,
      min: 0,
      max: 1,
      step: 0.01,
      helpText: 'Significance level (usually 0.05)'
    },
    {
      name: 'standardDeviation',
      label: 'Standard Deviation',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Standard deviation of the population'
    }
  ],

  'Correlation Calculator': [
    {
      name: 'xValues',
      label: 'X Values',
      type: 'text',
      required: true,
      placeholder: '1,2,3,4,5',
      helpText: 'Comma-separated X values'
    },
    {
      name: 'yValues',
      label: 'Y Values',
      type: 'text',
      required: true,
      placeholder: '2,4,6,8,10',
      helpText: 'Comma-separated Y values'
    },
    {
      name: 'correlationType',
      label: 'Correlation Type',
      type: 'select',
      options: ['pearson', 'spearman', 'kendall'],
      required: true,
      helpText: 'Type of correlation to calculate'
    }
  ],

  'ANOVA Calculator': [
    {
      name: 'groupData',
      label: 'Group Data',
      type: 'text',
      required: true,
      placeholder: '10,12,11;15,17,16;18,20,19',
      helpText: 'Semicolon-separated groups, comma-separated values within groups'
    },
    {
      name: 'alpha',
      label: 'Alpha Level',
      type: 'number',
      required: true,
      min: 0,
      max: 1,
      step: 0.01,
      helpText: 'Significance level (usually 0.05)'
    }
  ],

  'Chi-Square Calculator': [
    {
      name: 'observedValues',
      label: 'Observed Values',
      type: 'text',
      required: true,
      placeholder: '25,75',
      helpText: 'Comma-separated observed frequencies'
    },
    {
      name: 'expectedValues',
      label: 'Expected Values',
      type: 'text',
      required: true,
      placeholder: '20,80',
      helpText: 'Comma-separated expected frequencies'
    },
    {
      name: 'degreesOfFreedom',
      label: 'Degrees of Freedom',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Degrees of freedom for the test'
    }
  ],

  'Regression Calculator': [
    {
      name: 'xValues',
      label: 'X Values',
      type: 'text',
      required: true,
      placeholder: '1,2,3,4,5',
      helpText: 'Comma-separated X values'
    },
    {
      name: 'yValues',
      label: 'Y Values',
      type: 'text',
      required: true,
      placeholder: '2,4,6,8,10',
      helpText: 'Comma-separated Y values'
    },
    {
      name: 'regressionType',
      label: 'Regression Type',
      type: 'select',
      options: ['linear', 'multiple'],
      required: true,
      helpText: 'Type of regression to perform'
    }
  ],

  'Survival Analysis Calculator': [
    {
      name: 'timePoints',
      label: 'Time Points',
      type: 'text',
      required: true,
      placeholder: '1,2,3,4,5',
      helpText: 'Comma-separated time points'
    },
    {
      name: 'events',
      label: 'Events',
      type: 'text',
      required: true,
      placeholder: '1,1,0,1,0',
      helpText: 'Comma-separated event indicators (1=event, 0=censored)'
    },
    {
      name: 'censored',
      label: 'Censored',
      type: 'text',
      required: true,
      placeholder: '0,0,1,0,1',
      helpText: 'Comma-separated censoring indicators (1=censored, 0=event)'
    }
  ],

  'Meta-Analysis Calculator': [
    {
      name: 'effectSizes',
      label: 'Effect Sizes',
      type: 'text',
      required: true,
      placeholder: '0.5,0.6,0.4',
      helpText: 'Comma-separated effect sizes'
    },
    {
      name: 'standardErrors',
      label: 'Standard Errors',
      type: 'text',
      required: true,
      placeholder: '0.1,0.1,0.1',
      helpText: 'Comma-separated standard errors'
    },
    {
      name: 'sampleSizes',
      label: 'Sample Sizes',
      type: 'text',
      required: true,
      placeholder: '100,100,100',
      helpText: 'Comma-separated sample sizes'
    }
  ],

  'Pharmacokinetics Calculator': [
    {
      name: 'eliminationRate',
      label: 'Elimination Rate (h⁻¹)',
      type: 'number',
      unit: 'h⁻¹',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'First-order elimination rate constant'
    },
    {
      name: 'dose',
      label: 'Dose (mg)',
      type: 'number',
      unit: 'mg',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Administered dose'
    },
    {
      name: 'areaUnderCurve',
      label: 'AUC (mg·h/L)',
      type: 'number',
      unit: 'mg·h/L',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Area under the concentration-time curve'
    },
    {
      name: 'volumeDistribution',
      label: 'Volume of Distribution (L)',
      type: 'number',
      unit: 'L',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Apparent volume of distribution'
    }
  ],

  'Toxicology Calculator': [
    {
      name: 'noael',
      label: 'NOAEL (mg/kg/day)',
      type: 'number',
      unit: 'mg/kg/day',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'No Observed Adverse Effect Level'
    },
    {
      name: 'humanExposure',
      label: 'Human Exposure (mg/kg/day)',
      type: 'number',
      unit: 'mg/kg/day',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Estimated human exposure level'
    },
    {
      name: 'ld50',
      label: 'LD50 (mg/kg)',
      type: 'number',
      unit: 'mg/kg',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Lethal dose for 50% of population'
    },
    {
      name: 'bodyWeight',
      label: 'Body Weight (kg)',
      type: 'number',
      unit: 'kg',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Body weight for calculations'
    }
  ],

  'Neuroscience Calculator': [
    {
      name: 'restingPotential',
      label: 'Resting Potential (mV)',
      type: 'number',
      unit: 'mV',
      required: true,
      min: -100,
      max: 0,
      step: 1,
      helpText: 'Resting membrane potential'
    },
    {
      name: 'thresholdPotential',
      label: 'Threshold Potential (mV)',
      type: 'number',
      unit: 'mV',
      required: true,
      min: -100,
      max: 0,
      step: 1,
      helpText: 'Action potential threshold'
    },
    {
      name: 'timeConstant',
      label: 'Time Constant (ms)',
      type: 'number',
      unit: 'ms',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Membrane time constant'
    },
    {
      name: 'membraneResistance',
      label: 'Membrane Resistance (MΩ)',
      type: 'number',
      unit: 'MΩ',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Input resistance'
    }
  ],

  'Immunology Calculator': [
    {
      name: 'dilutionFactor',
      label: 'Dilution Factor',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Dilution factor used'
    },
    {
      name: 'antibodyConcentration',
      label: 'Antibody Concentration (μg/mL)',
      type: 'number',
      unit: 'μg/mL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Concentration of antibody'
    },
    {
      name: 'cytokineLevel',
      label: 'Cytokine Level (pg/mL)',
      type: 'number',
      unit: 'pg/mL',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Cytokine concentration'
    },
    {
      name: 'cellCount',
      label: 'Cell Count (cells/μL)',
      type: 'number',
      unit: 'cells/μL',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of immune cells'
    }
  ],

  'Ecology Calculator': [
    {
      name: 'populationSize',
      label: 'Population Size',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Number of individuals in population'
    },
    {
      name: 'growthRate',
      label: 'Growth Rate',
      type: 'number',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Population growth rate'
    },
    {
      name: 'speciesCounts',
      label: 'Species Counts',
      type: 'text',
      required: 'text',
      placeholder: '50,30,20',
      helpText: 'Comma-separated counts for each species'
    },
    {
      name: 'carryingCapacity',
      label: 'Carrying Capacity',
      type: 'number',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Maximum population size environment can support'
    }
  ],

  'Climate Science Calculator': [
    {
      name: 'radiativeForcing',
      label: 'Radiative Forcing (W/m²)',
      type: 'number',
      unit: 'W/m²',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Radiative forcing value'
    },
    {
      name: 'climateSensitivity',
      label: 'Climate Sensitivity (°C/(W/m²))',
      type: 'number',
      unit: '°C/(W/m²)',
      required: true,
      min: 0,
      step: 0.01,
      helpText: 'Climate sensitivity parameter'
    },
    {
      name: 'temperatureAnomaly',
      label: 'Temperature Anomaly (°C)',
      type: 'number',
      unit: '°C',
      required: true,
      min: -10,
      max: 10,
      step: 0.1,
      helpText: 'Temperature change from baseline'
    },
    {
      name: 'carbonConcentration',
      label: 'Carbon Concentration (ppm)',
      type: 'number',
      unit: 'ppm',
      required: true,
      min: 0,
      step: 1,
      helpText: 'Atmospheric CO2 concentration'
    }
  ],

  'Materials Science Calculator': [
    {
      name: 'stress',
      label: 'Stress (MPa)',
      type: 'number',
      unit: 'MPa',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Applied stress'
    },
    {
      name: 'strain',
      label: 'Strain',
      type: 'number',
      required: true,
      min: 0,
      step: 0.001,
      helpText: 'Applied strain'
    },
    {
      name: 'elasticModulus',
      label: 'Elastic Modulus (GPa)',
      type: 'number',
      unit: 'GPa',
      required: true,
      min: 0,
      step: 0.1,
      helpText: 'Young\'s modulus (leave empty to calculate)'
    },
    {
      name: 'poissonRatio',
      label: 'Poisson\'s Ratio',
      type: 'number',
      required: true,
      min: 0,
      max: 0.5,
      step: 0.01,
      helpText: 'Poisson\'s ratio of the material'
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
