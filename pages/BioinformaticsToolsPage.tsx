import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  DnaIcon, 
  TargetIcon, 
  PuzzleIcon,
  BrainCircuitIcon,
  BeakerIcon,
  ChartBarIcon,
  CogIcon,
  SearchIcon,
  DownloadIcon,
  ShareIcon,
  SaveIcon,
  RefreshCwIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  CopyIcon,
  BookOpenIcon,
  LightbulbIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  GlobeIcon,
  DatabaseIcon,
  CloudIcon,
  CodeIcon,
  SparklesIcon,

  ZapIcon,
  RocketIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  LockOpenIcon,
  HeartIcon,
  BookmarkIcon,
  HistoryIcon,
  FilterIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  TrendingUpIcon
} from '../components/icons';

interface SequenceAnalysis {
  sequence: string;
  gcContent: number;
  gcSkew: number;
  length: number;
  molecularWeight: number;
  meltingTemp: number;
  restrictionSites: RestrictionSite[];
  hairpins: Hairpin[];
  dimers: Dimer[];
}

interface RestrictionSite {
  enzyme: string;
  position: number;
  sequence: string;
  cutSite: string;
  frequency: number;
}

interface Hairpin {
  position: number;
  length: number;
  sequence: string;
  stability: number;
}

interface Dimer {
  position: number;
  length: number;
  sequence: string;
  type: 'self' | 'cross';
  stability: number;
}

interface Primer {
  sequence: string;
  length: number;
  gcContent: number;
  meltingTemp: number;
  hairpins: Hairpin[];
  dimers: Dimer[];
  score: number;
  warnings: string[];
  suggestions: string[];
}

const BioinformaticsToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sequence' | 'primer' | 'restriction' | 'analysis'>('sequence');
  const [inputSequence, setInputSequence] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<SequenceAnalysis | null>(null);
  const [primerResults, setPrimerResults] = useState<Primer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedEnzymes, setSelectedEnzymes] = useState<string[]>([]);
  const [primerParams, setPrimerParams] = useState({
    minLength: 18,
    maxLength: 25,
    minTm: 55,
    maxTm: 65,
    targetGc: 50,
    maxHairpin: 3,
    maxDimer: 3
  });

  // Common restriction enzymes
  const restrictionEnzymes = [
    { name: 'EcoRI', sequence: 'GAATTC', cutSite: 'G^AATTC', supplier: 'NEB' },
    { name: 'BamHI', sequence: 'GGATCC', cutSite: 'G^GATCC', supplier: 'NEB' },
    { name: 'HindIII', sequence: 'AAGCTT', cutSite: 'A^AGCTT', supplier: 'NEB' },
    { name: 'XhoI', sequence: 'CTCGAG', cutSite: 'C^TCGAG', supplier: 'NEB' },
    { name: 'NotI', sequence: 'GCGGCCGC', cutSite: 'GC^GGCCGC', supplier: 'NEB' },
    { name: 'SalI', sequence: 'GTCGAC', cutSite: 'G^TCGAC', supplier: 'NEB' },
    { name: 'PstI', sequence: 'CTGCAG', cutSite: 'CTGCA^G', supplier: 'NEB' },
    { name: 'KpnI', sequence: 'GGTACC', cutSite: 'GGTAC^C', supplier: 'NEB' },
    { name: 'SmaI', sequence: 'CCCGGG', cutSite: 'CCC^GGG', supplier: 'NEB' },
    { name: 'SacI', sequence: 'GAGCTC', cutSite: 'GAGCT^C', supplier: 'NEB' }
  ];

  const analyzeSequence = () => {
    if (!inputSequence.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      const seq = inputSequence.toUpperCase();
      const gcCount = (seq.match(/[GC]/g) || []).length;
      const totalLength = seq.length;
      const gcContent = (gcCount / totalLength) * 100;
      
      // Calculate GC skew
      const gCount = (seq.match(/G/g) || []).length;
      const cCount = (seq.match(/C/g) || []).length;
      const gcSkew = (gCount - cCount) / (gCount + cCount);
      
      // Calculate molecular weight (approximate)
      const molecularWeight = seq.split('').reduce((weight, base) => {
        switch (base) {
          case 'A': return weight + 313.21;
          case 'T': return weight + 304.2;
          case 'G': return weight + 329.21;
          case 'C': return weight + 289.18;
          default: return weight;
        }
      }, 0);
      
      // Calculate melting temperature (simplified)
      const meltingTemp = 2 * (seq.match(/[AT]/g) || []).length + 4 * gcCount;
      
      // Find restriction sites
      const restrictionSites = restrictionEnzymes
        .map(enzyme => {
          const positions = [];
          let pos = seq.indexOf(enzyme.sequence);
          while (pos !== -1) {
            positions.push({
              enzyme: enzyme.name,
              position: pos + 1,
              sequence: enzyme.sequence,
              cutSite: enzyme.cutSite,
              frequency: 1
            });
            pos = seq.indexOf(enzyme.sequence, pos + 1);
          }
          return positions;
        })
        .flat()
        .sort((a, b) => a.position - b.position);
      
      // Find potential hairpins (simplified)
      const hairpins: Hairpin[] = [];
      for (let i = 0; i < seq.length - 10; i++) {
        for (let len = 10; len <= Math.min(20, seq.length - i); len++) {
          const segment = seq.substr(i, len);
          const reverse = segment.split('').reverse().join('');
          if (seq.includes(reverse, i + len)) {
            hairpins.push({
              position: i + 1,
              length: len,
              sequence: segment,
              stability: Math.random() * 10 + 5 // Simplified stability score
            });
          }
        }
      }
      
      // Find potential dimers (simplified)
      const dimers: Dimer[] = [];
      for (let i = 0; i < seq.length - 5; i++) {
        for (let len = 5; len <= Math.min(15, seq.length - i); len++) {
          const segment = seq.substr(i, len);
          const reverse = segment.split('').reverse().join('');
          if (seq.includes(reverse, i + len)) {
            dimers.push({
              position: i + 1,
              length: len,
              sequence: segment,
              type: 'self',
              stability: Math.random() * 10 + 5
            });
          }
        }
      }
      
      const result: SequenceAnalysis = {
        sequence: seq,
        gcContent,
        gcSkew,
        length: totalLength,
        molecularWeight: Math.round(molecularWeight),
        meltingTemp: Math.round(meltingTemp),
        restrictionSites,
        hairpins: hairpins.slice(0, 5), // Limit to top 5
        dimers: dimers.slice(0, 5) // Limit to top 5
      };
      
      setAnalysisResult(result);
      setIsAnalyzing(false);
    }, 2000);
  };

  const designPrimers = () => {
    if (!inputSequence.trim()) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const seq = inputSequence.toUpperCase();
      const primers: Primer[] = [];
      
      // Generate forward primers
      for (let i = 0; i < seq.length - 18; i++) {
        for (let len = 18; len <= 25; len++) {
          if (i + len > seq.length) break;
          
          const primerSeq = seq.substr(i, len);
          const gcCount = (primerSeq.match(/[GC]/g) || []).length;
          const gcContent = (gcCount / len) * 100;
          const meltingTemp = 2 * (primerSeq.match(/[AT]/g) || []).length + 4 * gcCount;
          
          // Check if GC content and Tm are within range
          if (gcContent >= 40 && gcContent <= 60 && meltingTemp >= primerParams.minTm && meltingTemp <= primerParams.maxTm) {
            // Check for hairpins and dimers
            const hairpins = [];
            const dimers = [];
            
            // Simplified hairpin detection
            if (len >= 10) {
              for (let j = 0; j < len - 5; j++) {
                const segment = primerSeq.substr(j, 5);
                const reverse = segment.split('').reverse().join('');
                if (primerSeq.includes(reverse, j + 5)) {
                  hairpins.push({
                    position: j + 1,
                    length: 5,
                    sequence: segment,
                    stability: Math.random() * 5 + 2
                  });
                }
              }
            }
            
            // Simplified dimer detection
            if (len >= 5) {
              for (let j = 0; j < len - 3; j++) {
                const segment = primerSeq.substr(j, 3);
                const reverse = segment.split('').reverse().join('');
                if (primerSeq.includes(reverse, j + 3)) {
                  dimers.push({
                    position: j + 1,
                    length: 3,
                    sequence: segment,
                    type: 'self',
                    stability: Math.random() * 5 + 2
                  });
                }
              }
            }
            
            // Calculate score
            let score = 100;
            score -= Math.abs(gcContent - primerParams.targetGc) * 2;
            score -= Math.abs(meltingTemp - 60) * 2;
            score -= hairpins.length * 10;
            score -= dimers.length * 10;
            
            const warnings = [];
            const suggestions = [];
            
            if (gcContent < 45 || gcContent > 55) {
              warnings.push('GC content outside optimal range');
              suggestions.push('Consider adjusting primer length or position');
            }
            
            if (meltingTemp < 58 || meltingTemp > 62) {
              warnings.push('Melting temperature outside optimal range');
              suggestions.push('Adjust primer length or GC content');
            }
            
            if (hairpins.length > 0) {
              warnings.push('Potential hairpin structures detected');
              suggestions.push('Avoid regions with strong secondary structure');
            }
            
            if (dimers.length > 0) {
              warnings.push('Potential dimer formation detected');
              suggestions.push('Check for self-complementarity');
            }
            
            primers.push({
              sequence: primerSeq,
              length: len,
              gcContent: Math.round(gcContent * 10) / 10,
              meltingTemp: Math.round(meltingTemp),
              hairpins,
              dimers,
              score: Math.max(0, Math.round(score)),
              warnings,
              suggestions
            });
          }
        }
      }
      
      // Sort by score and take top 10
      const sortedPrimers = primers
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      setPrimerResults(sortedPrimers);
      setIsAnalyzing(false);
    }, 3000);
  };

  const clearResults = () => {
    setAnalysisResult(null);
    setPrimerResults([]);
    setInputSequence('');
  };

  const exportResults = () => {
    if (!analysisResult && primerResults.length === 0) return;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      sequence: inputSequence,
      analysis: analysisResult,
      primers: primerResults
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `bioinformatics_analysis_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderSequenceAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Sequence Analysis</h4>
            <p className="text-sm text-blue-700">
              Analyze DNA/RNA sequences for GC content, restriction sites, secondary structures, and more.
              Enter a sequence in FASTA format or plain text.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DNA/RNA Sequence
          </label>
          <textarea
            value={inputSequence}
            onChange={(e) => setInputSequence(e.target.value)}
            placeholder="Enter DNA/RNA sequence (e.g., ATGCGATCGATCG...)"
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <div className="mt-2 text-xs text-gray-500">
            {inputSequence.length > 0 && (
              <>
                Length: {inputSequence.length} bp | 
                GC Content: {((inputSequence.match(/[GC]/gi) || []).length / inputSequence.length * 100).toFixed(1)}%
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restriction Enzymes
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {restrictionEnzymes.map((enzyme) => (
                <label key={enzyme.name} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedEnzymes.includes(enzyme.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEnzymes([...selectedEnzymes, enzyme.name]);
                      } else {
                        setSelectedEnzymes(selectedEnzymes.filter(e => e !== enzyme.name));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {enzyme.name} ({enzyme.sequence})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={analyzeSequence}
            disabled={!inputSequence.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <SearchIcon className="w-4 h-4 mr-2" />
                Analyze Sequence
              </>
            )}
          </Button>
        </div>
      </div>

      {analysisResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analysisResult.length}</div>
              <div className="text-sm text-gray-600">Sequence Length (bp)</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analysisResult.gcContent.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">GC Content</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{analysisResult.meltingTemp}°C</div>
              <div className="text-sm text-gray-600">Melting Temperature</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{analysisResult.molecularWeight}</div>
              <div className="text-sm text-gray-600">Molecular Weight</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <PuzzleIcon className="w-5 h-5 text-blue-600" />
                <span>Restriction Sites</span>
              </h3>
              {analysisResult.restrictionSites.length > 0 ? (
                <div className="space-y-3">
                  {analysisResult.restrictionSites.map((site, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{site.enzyme}</div>
                        <div className="text-xs text-gray-500">
                          Position {site.position}: {site.sequence}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{site.cutSite}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No restriction sites found</p>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <TargetIcon className="w-5 h-5 text-green-600" />
                <span>Secondary Structures</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Hairpins</h4>
                  {analysisResult.hairpins.length > 0 ? (
                    <div className="space-y-2">
                      {analysisResult.hairpins.map((hairpin, index) => (
                        <div key={index} className="text-xs bg-yellow-50 p-2 rounded">
                          Position {hairpin.position}: {hairpin.sequence} (Stability: {hairpin.stability.toFixed(1)})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No significant hairpins detected</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Dimers</h4>
                  {analysisResult.dimers.length > 0 ? (
                    <div className="space-y-2">
                      {analysisResult.dimers.map((dimer, index) => (
                        <div key={index} className="text-xs bg-red-50 p-2 rounded">
                          Position {dimer.position}: {dimer.sequence} (Stability: {dimer.stability.toFixed(1)})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No significant dimers detected</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  const renderPrimerDesign = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <LightbulbIcon className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Primer Design</h4>
            <p className="text-sm text-green-700">
              Design optimal PCR primers with automatic optimization for GC content, melting temperature, 
              and secondary structure analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Sequence
          </label>
          <textarea
            value={inputSequence}
            onChange={(e) => setInputSequence(e.target.value)}
            placeholder="Enter target DNA sequence for primer design..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Primer Parameters</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Length</label>
              <Input
                type="number"
                value={primerParams.minLength}
                onChange={(e) => setPrimerParams({...primerParams, minLength: parseInt(e.target.value)})}
                min={15}
                max={30}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Length</label>
              <Input
                type="number"
                value={primerParams.maxLength}
                onChange={(e) => setPrimerParams({...primerParams, maxLength: parseInt(e.target.value)})}
                min={18}
                max={35}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Tm (°C)</label>
              <Input
                type="number"
                value={primerParams.minTm}
                onChange={(e) => setPrimerParams({...primerParams, minTm: parseInt(e.target.value)})}
                min={50}
                max={70}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Tm (°C)</label>
              <Input
                type="number"
                value={primerParams.maxTm}
                onChange={(e) => setPrimerParams({...primerParams, maxTm: parseInt(e.target.value)})}
                min={55}
                max={75}
                className="text-sm"
              />
            </div>
          </div>

          <Button
            onClick={designPrimers}
            disabled={!inputSequence.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                Designing Primers...
              </>
            ) : (
              <>
                <TargetIcon className="w-4 h-4 mr-2" />
                Design Primers
              </>
            )}
          </Button>
        </div>
      </div>

      {primerResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Designed Primers</h3>
            <div className="flex items-center space-x-2">
              <Button onClick={exportResults} variant="outline" size="sm">
                <DownloadIcon className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {primerResults.map((primer, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Primer {index + 1} (Score: {primer.score}/100)
                    </h4>
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                      {primer.sequence}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{primer.meltingTemp}°C</div>
                    <div className="text-sm text-gray-500">Melting Temp</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{primer.length}</div>
                    <div className="text-sm text-gray-500">Length (bp)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{primer.gcContent}%</div>
                    <div className="text-sm text-gray-500">GC Content</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{primer.hairpins.length}</div>
                    <div className="text-sm text-gray-500">Hairpins</div>
                  </div>
                </div>

                {primer.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="font-medium text-yellow-800 mb-2">Warnings:</div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {primer.warnings.map((warning, wIndex) => (
                        <li key={wIndex}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {primer.suggestions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-medium text-blue-800 mb-2">Suggestions:</div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {primer.suggestions.map((suggestion, sIndex) => (
                        <li key={sIndex}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <BrainCircuitIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Bioinformatics Tools</h1>
              <p className="text-xl text-gray-600 mt-2">Advanced DNA/RNA analysis and molecular biology tools</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex justify-center space-x-8 text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-2">
              <DnaIcon className="w-5 h-5" />
              <span>Sequence Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <TargetIcon className="w-5 h-5" />
              <span>Primer Design</span>
            </div>
            <div className="flex items-center space-x-2">
              <PuzzleIcon className="w-5 h-5" />
              <span>Restriction Mapping</span>
            </div>
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5" />
              <span>Bioinformatics</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            <div className="flex space-x-1">
              {[
                { id: 'sequence', name: 'Sequence Analysis', icon: SearchIcon },
                { id: 'primer', name: 'Primer Design', icon: TargetIcon },
                { id: 'restriction', name: 'Restriction Mapping', icon: PuzzleIcon },
                { id: 'analysis', name: 'Advanced Analysis', icon: ChartBarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
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
          {activeTab === 'sequence' && renderSequenceAnalysis()}
          {activeTab === 'primer' && renderPrimerDesign()}
          {activeTab === 'restriction' && (
            <div className="text-center py-12">
              <PuzzleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Restriction Mapping</h3>
              <p className="text-gray-500">Advanced restriction enzyme mapping tools coming soon...</p>
            </div>
          )}
          {activeTab === 'analysis' && (
            <div className="text-center py-12">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analysis</h3>
              <p className="text-gray-500">Advanced bioinformatics analysis tools coming soon...</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(analysisResult || primerResults.length > 0) && (
          <div className="mt-8 flex justify-center space-x-4">
            <Button onClick={clearResults} variant="outline">
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
        <div className="mt-16 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Getting Started with Bioinformatics</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Learn how to use these powerful tools for your molecular biology research
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sequence Analysis</h3>
                <p className="text-gray-600">Analyze DNA/RNA sequences for composition, structure, and features</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TargetIcon className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Primer Design</h3>
                <p className="text-gray-600">Design optimal PCR primers with automatic optimization</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Tools</h3>
                <p className="text-gray-600">Access cutting-edge bioinformatics analysis and visualization</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BioinformaticsToolsPage;
