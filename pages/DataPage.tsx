
import React, { useState, useMemo, FC, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { ResultEntry, DataPreview } from '../types';

import { SearchIcon, BarChartIcon, ChevronRightIcon, FilesIcon, FilterIcon, LineChartIcon, LightbulbIcon, CheckCircleIcon, PencilIcon, DatabaseIcon } from '../components/icons';

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


            </div>
             <div className="p-4 bg-slate-100 flex justify-end gap-3 rounded-b-lg border-t">
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    )
};


// --- CARD & MAIN PAGE COMPONENTS ---

const ResultEntryCard: React.FC<{ entry: ResultEntry, onViewDetails: (entry: ResultEntry) => void }> = ({ entry, onViewDetails }) => (
    <Card className="h-full relative hover:shadow-lg transition-shadow">
        <CardContent className="flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <p className="text-sm text-slate-500">{entry.date}</p>
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

    const handleViewDetails = (entry: ResultEntry) => {
        setCurrentResult(entry);
        setIsDetailOpen(true);
    };

    const handleUpdateAndClose = (updatedResult: ResultEntry) => {
        onUpdateResult(updatedResult);
        setCurrentResult(updatedResult); // Keep modal updated
    };

    return (
        <div className="space-y-6">
            {isDetailOpen && currentResult && <ResultDetailModal result={currentResult} onClose={() => setIsDetailOpen(false)} onUpdate={handleUpdateAndClose} />}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Data & Results</h1>
                <p className="mt-1 text-md text-slate-600">Your comprehensive repository for experimental data, conclusions, and research results.</p>
            </div>

            {/* --- DATA ENTRY TOOLS --- */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <FilesIcon className="h-6 w-6 text-slate-700"/>
                        <div>
                            <CardTitle>Data Entry & Import Tools</CardTitle>
                            <CardDescription>Import and manage research data from various sources and formats.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Excel & CSV Import */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                            <BarChartIcon className="h-5 w-5 mr-2 text-green-600" />
                            Spreadsheet Data Import
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Excel (.xlsx, .xls)</span>
                                    <p className="text-xs text-slate-500">Import data from Excel spreadsheets</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">CSV Files</span>
                                    <p className="text-xs text-slate-500">Import comma-separated values</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">TSV Files</span>
                                    <p className="text-xs text-slate-500">Import tab-separated values</p>
                                </button>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Google Sheets</span>
                                    <p className="text-xs text-slate-500">Import from Google Sheets</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Data Validation</span>
                                    <p className="text-xs text-slate-500">Check data integrity & format</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Template Library</span>
                                    <p className="text-xs text-slate-500">Pre-built data entry forms</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Image & Document Import */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                            <FilesIcon className="h-5 w-5 mr-2 text-blue-600" />
                            Image & Document Import
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Microscope Images</span>
                                    <p className="text-xs text-slate-500">Import microscopy & imaging data</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Gel Images</span>
                                    <p className="text-xs text-slate-500">Import electrophoresis gels</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Charts & Graphs</span>
                                    <p className="text-xs text-slate-500">Import visual data representations</p>
                                </button>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">PDF Documents</span>
                                    <p className="text-xs text-slate-500">Extract data from PDF reports</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Lab Notebooks</span>
                                    <p className="text-xs text-slate-500">Import handwritten notes</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">OCR Processing</span>
                                    <p className="text-xs text-slate-500">Convert images to text</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Database & API Import */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                            <DatabaseIcon className="h-5 w-5 mr-2 text-purple-600" />
                            Database & API Import
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">SQL Databases</span>
                                    <p className="text-xs text-slate-500">Connect to external databases</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">REST APIs</span>
                                    <p className="text-xs text-slate-500">Import from web services</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">GraphQL</span>
                                    <p className="text-xs text-slate-500">Query-based data import</p>
                                </button>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Cloud Storage</span>
                                    <p className="text-xs text-slate-500">Import from cloud platforms</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Data Sync</span>
                                    <p className="text-xs text-slate-500">Automated data synchronization</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Version Control</span>
                                    <p className="text-xs text-slate-500">Track data changes over time</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Manual Data Entry */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                            <PencilIcon className="h-5 w-5 mr-2 text-orange-600" />
                            Manual Data Entry
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Form Builder</span>
                                    <p className="text-xs text-slate-500">Create custom data entry forms</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Bulk Entry</span>
                                    <p className="text-xs text-slate-500">Enter multiple records at once</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Data Templates</span>
                                    <p className="text-xs text-slate-500">Use predefined data structures</p>
                                </button>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Validation Rules</span>
                                    <p className="text-xs text-slate-500">Set data quality standards</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Auto-save</span>
                                    <p className="text-xs text-slate-500">Prevent data loss</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Data Review</span>
                                    <p className="text-xs text-slate-500">Review and approve entries</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- DATA ANALYTICS --- */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <BarChartIcon className="h-6 w-6 text-slate-700"/>
                        <div>
                            <CardTitle>Data Analytics & Insights</CardTitle>
                            <CardDescription>Comprehensive analysis tools for your research data and experimental results.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Analytics Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">Total Results</p>
                                    <p className="text-2xl font-bold">{filteredEntries.length}</p>
                                </div>
                                <BarChartIcon className="w-8 h-8 opacity-80" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">This Month</p>
                                    <p className="text-2xl font-bold">
                                        {filteredEntries.filter(entry => {
                                            const entryDate = new Date(entry.date);
                                            const now = new Date();
                                            return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
                                        }).length}
                                    </p>
                                </div>
                                <LineChartIcon className="w-8 h-8 opacity-80" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">Unique Authors</p>
                                    <p className="text-2xl font-bold">{uniqueAuthors.length}</p>
                                </div>
                                <FilesIcon className="w-8 h-8 opacity-80" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">Tags Used</p>
                                    <p className="text-2xl font-bold">{uniqueTags.length}</p>
                                </div>
                                <FilterIcon className="w-8 h-8 opacity-80" />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Analytics Tools */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                <Wand2Icon className="h-5 w-5 mr-2 text-purple-600" />
                                Statistical Analysis
                            </h4>
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Descriptive Statistics</span>
                                    <p className="text-xs text-slate-500">Mean, median, standard deviation</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Correlation Analysis</span>
                                    <p className="text-xs text-slate-500">Find relationships between variables</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Hypothesis Testing</span>
                                    <p className="text-xs text-slate-500">T-tests, ANOVA, chi-square</p>
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                <LightbulbIcon className="h-5 w-5 mr-2 text-blue-600" />
                                Data Visualization
                            </h4>
                            <div className="space-y-3">
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Chart Generator</span>
                                    <p className="text-xs text-slate-500">Bar, line, scatter plots</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Heat Maps</span>
                                    <p className="text-xs text-slate-500">Correlation and distribution maps</p>
                                </button>
                                <button className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                                    <span className="font-medium">Interactive Dashboards</span>
                                    <p className="text-xs text-slate-500">Real-time data exploration</p>
                                </button>
                            </div>
                        </div>
                    </div>


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
