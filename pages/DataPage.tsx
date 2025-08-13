
import React, { useState, useMemo, FC, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { ResultEntry, DataPreview } from '../types';
import { compileSummaries, analyzeResultData } from '../services/geminiService';
import { SearchIcon, BarChartIcon, ChevronRightIcon, FilesIcon, SparklesIcon, FilterIcon, LineChartIcon, LightbulbIcon, CheckCircleIcon, Wand2Icon, AlertTriangleIcon } from '../components/icons';

const LoadingSpinner: React.FC<{className?: string}> = ({className}) => (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
    </div>
);

// --- MODAL & DETAIL VIEW COMPONENTS ---

const Modal: FC<{onClose: () => void, children: React.ReactNode, size?: 'md' | 'lg' | 'xl'}> = ({ onClose, children, size = 'xl' }) => {
    const sizeClasses = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl' };
    return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-8 sm:pt-16" onClick={onClose}>
        <div className={`bg-slate-50 rounded-lg shadow-xl w-full ${sizeClasses[size]} mx-4`} onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
)};

const BarChart: FC<{ data: { label: string, value: number }[], title: string }> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const chartHeight = 250;
    const barWidth = 40;
    const chartWidth = data.length * (barWidth + 40);

    return (
        <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold text-center text-slate-700 mb-4">{title}</h4>
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <g>
                    {data.map((d, i) => {
                        const barHeight = d.value >= 0 ? (d.value / maxValue) * (chartHeight - 40) : 0;
                        const x = i * (barWidth + 40) + 20;
                        const y = chartHeight - barHeight - 20;
                        return (
                            <g key={d.label}>
                                <rect x={x} y={y} width={barWidth} height={barHeight} fill="rgba(71, 85, 105, 0.7)" className="hover:fill-slate-800 transition-colors"/>
                                <text x={x + barWidth / 2} y={chartHeight - 5} textAnchor="middle" fontSize="12" fill="#475569">{d.label}</text>
                                <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="bold">{d.value}</text>
                            </g>
                        );
                    })}
                </g>
                 <line x1="0" y1={chartHeight - 20} x2={chartWidth} y2={chartHeight - 20} stroke="#cbd5e1" strokeWidth="2"/>
            </svg>
        </div>
    );
};


const ResultDetailModal: FC<{ result: ResultEntry, onClose: () => void, onUpdate: (result: ResultEntry) => void }> = ({ result, onClose, onUpdate }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError('');
        try {
            const analysis = await analyzeResultData(result);
            onUpdate({ ...result, analysis });
        } catch (err) {
            setError('Failed to get analysis. Please check your API key and network connection.');
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    }

    const renderDataPreview = (preview: DataPreview) => {
        switch(preview.type) {
            case 'graph':
                if (preview.content.type === 'bar') {
                    return <BarChart data={preview.content.data} title={preview.content.title} />;
                }
                return <div className="p-4 bg-white rounded-lg border flex items-center gap-3"><LineChartIcon className="h-6 w-6 text-slate-500"/><p>Line chart preview not yet implemented.</p></div>;
            case 'table':
                return (
                    <div className="overflow-x-auto bg-white rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>{preview.content.headers.map(h => <th key={h} className="p-2 text-left font-semibold text-slate-700">{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {preview.content.rows.map((row, i) => (
                                    <tr key={i} className="border-t border-slate-200">
                                        {row.map((cell, j) => <td key={j} className="p-2 text-slate-600">{cell}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'text':
                return <div className="p-4 bg-white rounded-lg border"><p className="text-slate-700">{preview.content}</p></div>;
        }
    }

    return (
        <Modal onClose={onClose} size="xl">
            <CardHeader className="bg-white rounded-t-lg">
                <CardTitle>{result.title}</CardTitle>
                <CardDescription>By {result.author} on {result.date}</CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                    {result.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">{tag}</span>
                    ))}
                </div>
            </CardHeader>
            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
                <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Summary</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap font-sans">{result.summary}</p>
                </div>
                <div>
                     <h3 className="font-semibold text-slate-800 mb-2">Data Preview</h3>
                     {renderDataPreview(result.dataPreview)}
                </div>

                <div className="pt-4 border-t">
                    <h3 className="font-semibold text-slate-800 mb-2">AI Insight Engine</h3>
                    {!result.analysis && (
                        <div className="p-4 bg-white rounded-lg border text-center">
                            <p className="text-slate-600">Analyze this result to generate key insights, suggest next steps, and identify potential pitfalls.</p>
                            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="mt-3">
                                {isAnalyzing ? <LoadingSpinner className="text-white"/> : <SparklesIcon className="h-4 w-4 mr-2"/>}
                                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                            </Button>
                            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                        </div>
                    )}
                    {result.analysis && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-white">
                                <CardHeader className="p-4"><CardTitle className="text-base flex items-center"><LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500"/>Key Insights</CardTitle></CardHeader>
                                <CardContent className="p-4 text-sm text-slate-700">{result.analysis.insights}</CardContent>
                            </Card>
                             <Card className="bg-white">
                                <CardHeader className="p-4"><CardTitle className="text-base flex items-center"><ChevronRightIcon className="h-5 w-5 mr-2 text-blue-500"/>Suggested Next Steps</CardTitle></CardHeader>
                                <CardContent className="p-4 text-sm text-slate-700">{result.analysis.nextSteps}</CardContent>
                            </Card>
                             <Card className="bg-white">
                                <CardHeader className="p-4"><CardTitle className="text-base flex items-center"><AlertTriangleIcon className="h-5 w-5 mr-2 text-red-500"/>Potential Pitfalls</CardTitle></CardHeader>
                                <CardContent className="p-4 text-sm text-slate-700">{result.analysis.pitfalls}</CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
             <div className="p-4 bg-slate-100 flex justify-end gap-3 rounded-b-lg border-t">
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    )
};


// --- CARD & MAIN PAGE COMPONENTS ---

const ResultEntryCard: React.FC<{ entry: ResultEntry, isSelected: boolean, onToggleSelect: (id: string) => void, onViewDetails: (entry: ResultEntry) => void }> = ({ entry, isSelected, onToggleSelect, onViewDetails }) => (
    <Card className="h-full relative hover:shadow-lg transition-shadow">
         {entry.source === 'Notebook Summary' && (
            <div className="absolute top-4 left-4 z-10">
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => onToggleSelect(entry.id)}
                    className="h-5 w-5 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    aria-label={`Select result ${entry.title}`}
                />
            </div>
        )}
        <CardContent className="flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <p className={`text-sm text-slate-500 ${entry.source === 'Notebook Summary' ? 'pl-8' : ''}`}>{entry.date}</p>
                    <div className="flex flex-wrap gap-1">
                        {entry.tags.slice(0, 2).map(tag => (
                            <span key={tag} className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                entry.source === 'Notebook Summary' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-700'
                            }`}>{tag}</span>
                        ))}
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mt-2">{entry.title}</h3>
                <p className="text-slate-600 text-sm mt-1 mb-4 line-clamp-3">{entry.summary}</p>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>By {entry.author}</span>
                    {entry.analysis && <span title="AI Analysis available"><Wand2Icon className="h-4 w-4 text-purple-500"/></span>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(entry)}>
                    View Details <ChevronRightIcon className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </CardContent>
    </Card>
);

interface DataPageProps {
    results: ResultEntry[];
    onUpdateResult: (result: ResultEntry) => void;
}

const DataPage: FC<DataPageProps> = ({ results, onUpdateResult }) => {
    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [authorFilter, setAuthorFilter] = useState('All');
    const [tagFilter, setTagFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All Time');
    const [sourceFilter, setSourceFilter] = useState<'All' | 'Manual' | 'Notebook Summary'>('All');
    
    // UI State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentResult, setCurrentResult] = useState<ResultEntry | null>(null);
    
    // Compiler State
    const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
    const [compilationFormat, setCompilationFormat] = useState<'Weekly Report' | 'Paper Section'>('Weekly Report');
    const [isCompiling, setIsCompiling] = useState(false);
    const [compiledText, setCompiledText] = useState('');
    const [compilerError, setCompilerError] = useState('');
    
    const uniqueAuthors = useMemo(() => ['All', ...new Set(results.map(r => r.author))], [results]);
    const uniqueTags = useMemo(() => ['All', ...new Set(results.flatMap(r => r.tags))], [results]);

    const filteredEntries = useMemo(() => {
        const now = new Date();
        return results.filter(entry => {
            const searchMatch = (
                entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.summary.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const authorMatch = authorFilter === 'All' || entry.author === authorFilter;
            const tagMatch = tagFilter === 'All' || entry.tags.includes(tagFilter);
            const sourceMatch = sourceFilter === 'All' || entry.source === sourceFilter;

            let dateMatch = true;
            if (dateFilter !== 'All Time') {
                const entryDate = new Date(entry.date);
                if (dateFilter === 'This Week') {
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    dateMatch = entryDate >= weekStart;
                } else if (dateFilter === 'This Month') {
                    dateMatch = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
                }
            }

            return searchMatch && authorMatch && tagMatch && sourceMatch && dateMatch;
        });
    }, [searchTerm, results, authorFilter, tagFilter, dateFilter, sourceFilter]);

    const handleToggleSelect = (id: string) => {
        setSelectedResultIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleViewDetails = (entry: ResultEntry) => {
        setCurrentResult(entry);
        setIsDetailOpen(true);
    };

    const handleUpdateAndClose = (updatedResult: ResultEntry) => {
        onUpdateResult(updatedResult);
        setCurrentResult(updatedResult); // Keep modal updated
    };
    
    const handleCompile = async () => {
        setIsCompiling(true);
        setCompiledText('');
        setCompilerError('');
        const selectedSummaries = results
            .filter(r => selectedResultIds.has(r.id))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(r => `Date: ${r.date}\nTitle: ${r.title}\nAuthor: ${r.author}\n\nSummary:\n${r.summary}\n---\n`);
        
        try {
            const result = await compileSummaries(selectedSummaries, compilationFormat);
            setCompiledText(result);
        } catch(err) {
            setCompilerError('Failed to compile summaries. Please check the console and your API key.');
            console.error(err);
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <div className="space-y-6">
            {isDetailOpen && currentResult && <ResultDetailModal result={currentResult} onClose={() => setIsDetailOpen(false)} onUpdate={handleUpdateAndClose} />}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Data & Results</h1>
                <p className="mt-1 text-md text-slate-600">Your intelligent repository for experimental data, conclusions, and AI-powered analysis.</p>
            </div>

            {/* --- COMPILER --- */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <FilesIcon className="h-6 w-6 text-slate-700"/>
                        <div>
                            <CardTitle>AI Summary Compiler</CardTitle>
                            <CardDescription>Select stored notebook summaries and compile them into a report or paper draft.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-grow">
                             <label htmlFor="compilationFormat" className="block text-sm font-medium text-slate-700 mb-1">Compilation Format</label>
                             <Select id="compilationFormat" value={compilationFormat} onChange={e => setCompilationFormat(e.target.value as any)}>
                                 <option>Weekly Report</option>
                                 <option>Paper Section</option>
                             </Select>
                        </div>
                        <Button onClick={handleCompile} disabled={isCompiling || selectedResultIds.size === 0}>
                            {isCompiling ? <LoadingSpinner className="text-white"/> : <SparklesIcon className="h-4 w-4 mr-2"/>}
                            {isCompiling ? 'Compiling...' : `Compile ${selectedResultIds.size} Summaries`}
                        </Button>
                    </div>
                     {compilerError && <p className="text-sm text-red-500">{compilerError}</p>}
                     {compiledText && (
                        <div className="pt-4 mt-4 border-t">
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Compiled Result</h3>
                            <pre className="p-4 bg-slate-100 rounded-md text-sm text-slate-800 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">{compiledText}</pre>
                        </div>
                     )}
                </CardContent>
            </Card>

            {/* --- FILTERS & SEARCH --- */}
             <Card>
                <CardHeader>
                     <CardTitle className="flex items-center"><FilterIcon className="h-5 w-5 mr-2"/>Filter & Search</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                     <div className="lg:col-span-2">
                        <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                        <div className="relative">
                           <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                           <Input id="search" placeholder="Search title or summary..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                        </div>
                    </div>
                    <div>
                         <label htmlFor="authorFilter" className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                         <Select id="authorFilter" value={authorFilter} onChange={e => setAuthorFilter(e.target.value)}>{uniqueAuthors.map(a => <option key={a}>{a}</option>)}</Select>
                    </div>
                     <div>
                         <label htmlFor="tagFilter" className="block text-sm font-medium text-slate-700 mb-1">Tag</label>
                         <Select id="tagFilter" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>{uniqueTags.map(t => <option key={t}>{t}</option>)}</Select>
                    </div>
                     <div>
                         <label htmlFor="dateFilter" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                         <Select id="dateFilter" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                            <option>All Time</option><option>This Week</option><option>This Month</option>
                         </Select>
                    </div>
                </CardContent>
            </Card>
            
            {filteredEntries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEntries.map(entry => (
                        <ResultEntryCard 
                            key={entry.id} 
                            entry={entry}
                            isSelected={selectedResultIds.has(entry.id)}
                            onToggleSelect={handleToggleSelect}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 rounded-lg bg-white">
                     <BarChartIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-2 text-lg font-medium text-slate-900">No Results Found</h3>
                    <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or search term.</p>
                </div>
            )}
        </div>
    );
};

export default DataPage;
