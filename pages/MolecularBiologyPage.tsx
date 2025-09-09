import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  BeakerIcon, 
  PipetteIcon, 
  TestTubeIcon, 
  MicroscopeIcon, 
  DnaIcon, 
  FlaskIcon,
  CalculatorIcon,
  ClockIcon,
  StarIcon,
  BookOpenIcon,
  LightbulbIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  DownloadIcon,
  ShareIcon,
  BookmarkIcon,
  HistoryIcon,
  TargetIcon,
  PuzzleIcon,
  ChartBarIcon,
  CogIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  TrashIcon,
  EditIcon,
  CopyIcon,
  TrendingUpIcon,
  ZapIcon,
  RocketIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  LockOpenIcon,
  HeartIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  RefreshCwIcon
} from '../components/icons';

// PCR Master Mix Calculator State
interface PCRMasterMix {
  reactionVolume: number;
  templateConcentration: number;
  primerConcentration: number;
  dNTPConcentration: number;
  bufferConcentration: number;
  enzymeConcentration: number;
  templateVolume: number;
  primerVolume: number;
  dNTPVolume: number;
  bufferVolume: number;
  enzymeVolume: number;
  waterVolume: number;
}

// Cell Culture State
interface CellCulture {
  cellCount: number;
  viability: number;
  targetDensity: number;
  dilutionFactor: number;
  finalVolume: number;
  seedingDensity: number;
  passagingRatio: number;
  growthRate: number;
  nextPassage: string;
}

// Protein Analysis State
interface ProteinAnalysis {
  absorbance: number;
  pathLength: number;
  extinctionCoefficient: number;
  concentration: number;
  molecularWeight: number;
  molarity: number;
  gelPercentage: number;
  runningBuffer: string;
  voltage: number;
  runTime: number;
}

// Molecular Cloning State
interface MolecularCloning {
  insertSize: number;
  vectorSize: number;
  insertConcentration: number;
  vectorConcentration: number;
  insertVectorRatio: number;
  insertVolume: number;
  vectorVolume: number;
  ligationVolume: number;
  transformationEfficiency: number;
  colonyCount: number;
}

const MolecularBiologyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pcr' | 'cell-culture' | 'cloning' | 'protein' | 'analysis'>('pcr');
  
  // PCR Master Mix Calculator State
  const [pcrState, setPcrState] = useState<PCRMasterMix>({
    reactionVolume: 50,
    templateConcentration: 100,
    primerConcentration: 10,
    dNTPConcentration: 2.5,
    bufferConcentration: 10,
    enzymeConcentration: 5,
    templateVolume: 0,
    primerVolume: 0,
    dNTPVolume: 0,
    bufferVolume: 0,
    enzymeVolume: 0,
    waterVolume: 0
  });

  // Cell Culture State
  const [cellCultureState, setCellCultureState] = useState<CellCulture>({
    cellCount: 1000000,
    viability: 95,
    targetDensity: 500000,
    dilutionFactor: 1,
    finalVolume: 10,
    seedingDensity: 0,
    passagingRatio: 1,
    growthRate: 24,
    nextPassage: ''
  });

  // Protein Analysis State
  const [proteinState, setProteinState] = useState<ProteinAnalysis>({
    absorbance: 0.5,
    pathLength: 1,
    extinctionCoefficient: 1.4,
    concentration: 0,
    molecularWeight: 50000,
    molarity: 0,
    gelPercentage: 12,
    runningBuffer: 'Tris-Glycine',
    voltage: 120,
    runTime: 60
  });

  // Molecular Cloning State
  const [cloningState, setCloningState] = useState<MolecularCloning>({
    insertSize: 1000,
    vectorSize: 3000,
    insertConcentration: 50,
    vectorConcentration: 100,
    insertVectorRatio: 0,
    insertVolume: 0,
    vectorVolume: 0,
    ligationVolume: 20,
    transformationEfficiency: 1000000,
    colonyCount: 0
  });

  // Results and UI State
  const [pcrResults, setPcrResults] = useState<any>(null);
  const [cellResults, setCellResults] = useState<any>(null);
  const [proteinResults, setProteinResults] = useState<any>(null);
  const [cloningResults, setCloningResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculation Functions
  const calculatePCRMasterMix = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const templateVol = (pcrState.reactionVolume * 0.1) / pcrState.templateConcentration;
      const primerVol = (pcrState.reactionVolume * 0.2) / pcrState.primerConcentration;
      const dNTPVol = (pcrState.reactionVolume * 0.2) / pcrState.dNTPConcentration;
      const bufferVol = (pcrState.reactionVolume * 0.1) / pcrState.bufferConcentration;
      const enzymeVol = (pcrState.reactionVolume * 0.1) / pcrState.enzymeConcentration;
      const waterVol = pcrState.reactionVolume - templateVol - primerVol - dNTPVol - bufferVol - enzymeVol;

      setPcrResults({
        templateVolume: templateVol.toFixed(2),
        primerVolume: primerVol.toFixed(2),
        dNTPVolume: dNTPVol.toFixed(2),
        bufferVolume: bufferVol.toFixed(2),
        enzymeVolume: enzymeVol.toFixed(2),
        waterVolume: waterVol.toFixed(2),
        totalVolume: pcrState.reactionVolume
      });
      setIsCalculating(false);
    }, 1000);
  };

  const calculateCellCulture = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const viableCells = (cellCultureState.cellCount * cellCultureState.viability) / 100;
      const seedingDensity = viableCells / cellCultureState.finalVolume;
      const nextPassage = new Date(Date.now() + cellCultureState.growthRate * 60 * 60 * 1000).toLocaleDateString();

      setCellResults({
        viableCells: viableCells.toLocaleString(),
        seedingDensity: seedingDensity.toLocaleString(),
        nextPassage,
        growthRate: cellCultureState.growthRate
      });
      setIsCalculating(false);
    }, 1000);
  };

  const calculateProteinConcentration = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const concentration = proteinState.absorbance / (proteinState.extinctionCoefficient * proteinState.pathLength);
      const molarity = (concentration * 1000) / proteinState.molecularWeight;

      setProteinResults({
        concentration: concentration.toFixed(3),
        molarity: molarity.toFixed(6),
        absorbance: proteinState.absorbance,
        extinctionCoefficient: proteinState.extinctionCoefficient
      });
      setIsCalculating(false);
    }, 1000);
  };

  const calculateCloning = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const insertVectorRatio = 3; // Optimal ratio
      const insertVolume = (cloningState.ligationVolume * 0.8 * insertVectorRatio) / (insertVectorRatio + 1);
      const vectorVolume = (cloningState.ligationVolume * 0.8) / (insertVectorRatio + 1);
      const expectedColonies = (cloningState.insertConcentration * insertVolume * cloningState.transformationEfficiency) / 1000000;

      setCloningResults({
        insertVolume: insertVolume.toFixed(2),
        vectorVolume: vectorVolume.toFixed(2),
        insertVectorRatio,
        expectedColonies: expectedColonies.toFixed(0),
        ligationVolume: cloningState.ligationVolume
      });
      setIsCalculating(false);
    }, 1000);
  };

  const clearResults = () => {
    setPcrResults(null);
    setCellResults(null);
    setProteinResults(null);
    setCloningResults(null);
  };

  const exportResults = () => {
    const data = {
      pcr: pcrResults,
      cellCulture: cellResults,
      protein: proteinResults,
      cloning: cloningResults,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'molecular-biology-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-teal-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl flex items-center justify-center">
              <BeakerIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Molecular & Cell Biology Tools</h1>
              <p className="text-xl text-gray-600 mt-2">Professional-grade tools for PCR, cell culture, cloning, and protein analysis</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex justify-center space-x-8 text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-2">
              <DnaIcon className="w-5 h-5" />
              <span>PCR Tools</span>
            </div>
            <div className="flex items-center space-x-2">
              <MicroscopeIcon className="w-5 h-5" />
              <span>Cell Culture</span>
            </div>
            <div className="flex items-center space-x-2">
              <PipetteIcon className="w-5 h-5" />
              <span>Molecular Cloning</span>
            </div>
            <div className="flex items-center space-x-2">
              <BeakerIcon className="w-5 h-5" />
              <span>Protein Analysis</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            <div className="flex space-x-1">
              {[
                { id: 'pcr', name: 'PCR Master Mix', icon: DnaIcon },
                { id: 'cell-culture', name: 'Cell Culture', icon: MicroscopeIcon },
                { id: 'cloning', name: 'Molecular Cloning', icon: PipetteIcon },
                { id: 'protein', name: 'Protein Analysis', icon: BeakerIcon },
                { id: 'analysis', name: 'Advanced Analysis', icon: ChartBarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {activeTab === 'pcr' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <LightbulbIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">PCR Master Mix Calculator</h4>
                    <p className="text-sm text-blue-700">
                      Calculate optimal volumes for PCR master mix components including template, primers, dNTPs, buffer, and enzyme.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Reaction Parameters</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Reaction Volume (μL)</label>
                      <Input
                        type="number"
                        value={pcrState.reactionVolume}
                        onChange={(e) => setPcrState({...pcrState, reactionVolume: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Template Conc. (ng/μL)</label>
                      <Input
                        type="number"
                        value={pcrState.templateConcentration}
                        onChange={(e) => setPcrState({...pcrState, templateConcentration: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Primer Conc. (μM)</label>
                      <Input
                        type="number"
                        value={pcrState.primerConcentration}
                        onChange={(e) => setPcrState({...pcrState, primerConcentration: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">dNTP Conc. (mM)</label>
                      <Input
                        type="number"
                        value={pcrState.dNTPConcentration}
                        onChange={(e) => setPcrState({...pcrState, dNTPConcentration: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Buffer Conc. (X)</label>
                      <Input
                        type="number"
                        value={pcrState.bufferConcentration}
                        onChange={(e) => setPcrState({...pcrState, bufferConcentration: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Enzyme Conc. (U/μL)</label>
                      <Input
                        type="number"
                        value={pcrState.enzymeConcentration}
                        onChange={(e) => setPcrState({...pcrState, enzymeConcentration: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculatePCRMasterMix}
                    disabled={isCalculating}
                    className="w-full"
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <CalculatorIcon className="w-4 h-4 mr-2" />
                        Calculate Master Mix
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Results</h4>
                  {pcrResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{pcrResults.templateVolume}</div>
                          <div className="text-sm text-gray-600">Template (μL)</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{pcrResults.primerVolume}</div>
                          <div className="text-sm text-gray-600">Primers (μL)</div>
                        </Card>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{pcrResults.dNTPVolume}</div>
                          <div className="text-sm text-gray-600">dNTPs (μL)</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{pcrResults.bufferVolume}</div>
                          <div className="text-sm text-gray-600">Buffer (μL)</div>
                        </Card>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">{pcrResults.enzymeVolume}</div>
                          <div className="text-sm text-gray-600">Enzyme (μL)</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-teal-600">{pcrResults.waterVolume}</div>
                          <div className="text-sm text-gray-600">Water (μL)</div>
                        </Card>
                      </div>
                      <Card className="p-4 text-center bg-gradient-to-r from-blue-50 to-teal-50">
                        <div className="text-2xl font-bold text-gray-900">{pcrResults.totalVolume}</div>
                        <div className="text-sm text-gray-600">Total Volume (μL)</div>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <CalculatorIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Enter parameters and calculate to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cell-culture' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <LightbulbIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Cell Culture Calculator</h4>
                    <p className="text-sm text-purple-700">
                      Calculate cell density, viability, seeding density, and plan optimal passaging schedules.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Cell Parameters</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cell Count</label>
                      <Input
                        type="number"
                        value={cellCultureState.cellCount}
                        onChange={(e) => setCellCultureState({...cellCultureState, cellCount: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Viability (%)</label>
                      <Input
                        type="number"
                        value={cellCultureState.viability}
                        onChange={(e) => setCellCultureState({...cellCultureState, viability: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Target Density</label>
                      <Input
                        type="number"
                        value={cellCultureState.targetDensity}
                        onChange={(e) => setCellCultureState({...cellCultureState, targetDensity: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Final Volume (mL)</label>
                      <Input
                        type="number"
                        value={cellCultureState.finalVolume}
                        onChange={(e) => setCellCultureState({...cellCultureState, finalVolume: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Growth Rate (hrs)</label>
                      <Input
                        type="number"
                        value={cellCultureState.growthRate}
                        onChange={(e) => setCellCultureState({...cellCultureState, growthRate: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Passaging Ratio</label>
                      <Input
                        type="number"
                        value={cellCultureState.passagingRatio}
                        onChange={(e) => setCellCultureState({...cellCultureState, passagingRatio: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculateCellCulture}
                    disabled={isCalculating}
                    className="w-full"
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <MicroscopeIcon className="w-4 h-4 mr-2" />
                        Calculate Cell Culture
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Results</h4>
                  {cellResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{cellResults.viableCells}</div>
                          <div className="text-sm text-gray-600">Viable Cells</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{cellResults.seedingDensity}</div>
                          <div className="text-sm text-gray-600">Seeding Density</div>
                        </Card>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{cellResults.growthRate}</div>
                          <div className="text-sm text-gray-600">Growth Rate (hrs)</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{cellResults.nextPassage}</div>
                          <div className="text-sm text-gray-600">Next Passage</div>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <MicroscopeIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Enter parameters and calculate to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cloning' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <LightbulbIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Molecular Cloning Calculator</h4>
                    <p className="text-sm text-green-700">
                      Calculate optimal insert:vector ratios, volumes for ligation, and expected transformation efficiency.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Cloning Parameters</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Insert Size (bp)</label>
                      <Input
                        type="number"
                        value={cloningState.insertSize}
                        onChange={(e) => setCloningState({...cloningState, insertSize: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Vector Size (bp)</label>
                      <Input
                        type="number"
                        value={cloningState.vectorSize}
                        onChange={(e) => setCloningState({...cloningState, vectorSize: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Insert Conc. (ng/μL)</label>
                      <Input
                        type="number"
                        value={cloningState.insertConcentration}
                        onChange={(e) => setCloningState({...cloningState, insertConcentration: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Vector Conc. (ng/μL)</label>
                      <Input
                        type="number"
                        value={cloningState.vectorConcentration}
                        onChange={(e) => setCloningState({...cloningState, vectorConcentration: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Ligation Volume (μL)</label>
                      <Input
                        type="number"
                        value={cloningState.ligationVolume}
                        onChange={(e) => setCloningState({...cloningState, ligationVolume: parseFloat(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Transformation Efficiency</label>
                      <Input
                        type="number"
                        value={cloningState.transformationEfficiency}
                        onChange={(e) => setCloningState({...cloningState, transformationEfficiency: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculateCloning}
                    disabled={isCalculating}
                    className="w-full"
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <PipetteIcon className="w-4 h-4 mr-2" />
                        Calculate Cloning
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Results</h4>
                  {cloningResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{cloningResults.insertVolume}</div>
                          <div className="text-sm text-gray-600">Insert Volume (μL)</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{cloningResults.vectorVolume}</div>
                          <div className="text-sm text-gray-600">Vector Volume (μL)</div>
                        </Card>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{cloningResults.insertVectorRatio}</div>
                          <div className="text-sm text-gray-600">Insert:Vector Ratio</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{cloningResults.expectedColonies}</div>
                          <div className="text-sm text-gray-600">Expected Colonies</div>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <PipetteIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Enter parameters and calculate to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'protein' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <LightbulbIcon className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900">Protein Analysis Calculator</h4>
                    <p className="text-sm text-orange-700">
                      Calculate protein concentration from absorbance, molarity, and optimize SDS-PAGE conditions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Protein Parameters</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Absorbance (280nm)</label>
                      <Input
                        type="number"
                        value={proteinState.absorbance}
                        onChange={(e) => setProteinState({...proteinState, absorbance: parseFloat(e.target.value)})}
                        step="0.001"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Path Length (cm)</label>
                      <Input
                        type="number"
                        value={proteinState.pathLength}
                        onChange={(e) => setProteinState({...proteinState, pathLength: parseFloat(e.target.value)})}
                        step="0.1"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Extinction Coefficient</label>
                      <Input
                        type="number"
                        value={proteinState.extinctionCoefficient}
                        onChange={(e) => setProteinState({...proteinState, extinctionCoefficient: parseFloat(e.target.value)})}
                        step="0.1"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Molecular Weight (Da)</label>
                      <Input
                        type="number"
                        value={proteinState.molecularWeight}
                        onChange={(e) => setProteinState({...proteinState, molecularWeight: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Gel Percentage (%)</label>
                      <Input
                        type="number"
                        value={proteinState.gelPercentage}
                        onChange={(e) => setProteinState({...proteinState, gelPercentage: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Voltage (V)</label>
                      <Input
                        type="number"
                        value={proteinState.voltage}
                        onChange={(e) => setProteinState({...proteinState, voltage: parseInt(e.target.value)})}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculateProteinConcentration}
                    disabled={isCalculating}
                    className="w-full"
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <BeakerIcon className="w-4 h-4 mr-2" />
                        Calculate Protein
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Results</h4>
                  {proteinResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{proteinResults.concentration}</div>
                          <div className="text-sm text-gray-600">Concentration (mg/mL)</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{proteinResults.molarity}</div>
                          <div className="text-sm text-gray-600">Molarity (M)</div>
                        </Card>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{proteinResults.absorbance}</div>
                          <div className="text-sm text-gray-600">Absorbance (280nm)</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{proteinResults.extinctionCoefficient}</div>
                          <div className="text-sm text-gray-600">Extinction Coefficient</div>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BeakerIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Enter parameters and calculate to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="text-center py-12">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analysis</h3>
              <p className="text-gray-500">Advanced molecular biology analysis tools coming soon...</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(pcrResults || cellResults || proteinResults || cloningResults) && (
          <div className="mt-8 flex justify-center space-x-4">
            <Button onClick={clearResults} variant="secondary">
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Clear Results
            </Button>
            <Button onClick={exportResults}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          </div>
        )}

        {/* Getting Started Guide */}
        <div className="mt-16 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Getting Started with Molecular Biology</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Learn how to use these powerful tools for your molecular biology research
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DnaIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PCR Tools</h3>
                <p className="text-gray-600">Calculate optimal master mix components and reaction conditions</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MicroscopeIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cell Culture</h3>
                <p className="text-gray-600">Optimize cell counting, viability, and passaging schedules</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PipetteIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Molecular Cloning</h3>
                <p className="text-gray-600">Calculate optimal insert:vector ratios and transformation efficiency</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BeakerIcon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Protein Analysis</h3>
                <p className="text-gray-600">Determine protein concentration, molarity, and gel electrophoresis conditions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MolecularBiologyPage;
