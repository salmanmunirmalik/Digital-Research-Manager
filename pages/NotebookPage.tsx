import React, { useState, useMemo, FC } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Project, Experiment, NotebookEntry, ContentBlock, Protocol, ProtocolStep, ResultEntry, ContentBlockType } from '../types';
import { mockProtocols } from '../data/mockData';
import { generateNotebookSummary } from '../services/geminiService';
import { 
    FolderIcon, FlaskConicalIcon, ChevronRightIcon, FileTextIcon, 
    PlusCircleIcon, BookOpenIcon, EditIcon, TrashIcon, PaperclipIcon,
    TableIcon, ImageIcon, MessageCircleIcon, PenSquareIcon, CheckCircleIcon, JournalIcon,
    SparklesIcon, LightbulbIcon
} from '../components/icons';

// --- MODAL COMPONENTS ---
const Modal: FC<{onClose: () => void, children: React.ReactNode, size?: 'md' | 'lg' | 'xl'}> = ({ onClose, children, size = 'lg' }) => {
    const sizeClasses = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl' };
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-16" onClick={onClose}>
        <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`} onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
)};

const CreateProjectModal: FC<{ onCancel: () => void, onCreate: (name: string, description: string) => void }> = ({ onCancel, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = () => {
        if (!name) return;
        onCreate(name, description);
    };

    return (
        <Modal onClose={onCancel} size="md">
            <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>Organize your work into a new project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Project Name" value={name} onChange={e => setName(e.target.value)} required />
                <textarea
                    placeholder="Project Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    rows={4}
                />
            </CardContent>
            <div className="p-4 bg-slate-50 flex justify-end gap-3">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!name}>Create Project</Button>
            </div>
        </Modal>
    );
};


const CreateEntryModal: FC<{ onCancel: () => void, onCreate: (entry: NotebookEntry) => void, experiment: Experiment }> = ({ onCancel, onCreate, experiment }) => {
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState('');
    const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);

    const handleCreate = () => {
        if (!title) return;
        const linkedProtocol = mockProtocols.find(p => p.id === selectedProtocolId);
        
        let content: ContentBlock[] = [{ id: `cb-${Date.now()}`, type: 'text', data: { html: '<p>Write your notes here...</p>' } }];
        
        if (linkedProtocol) {
            content = linkedProtocol.steps.flatMap(step => [
                { id: `cb-step-${step.step}`, type: 'protocol_step', data: { step: step.step, description: step.description } },
                { id: `cb-notes-${step.step}`, type: 'text', data: { html: `<p><em>Notes for step ${step.step}...</em></p>` } }
            ]);
        }

        const newEntry: NotebookEntry = {
            id: `entry-${Date.now()}`,
            title,
            author: 'Dr. Evelyn Reed', // Hardcoded user
            createdDate: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            protocolId: linkedProtocol?.id,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            status: 'In Progress',
            content,
            comments: [],
            versionHistory: [],
        };
        onCreate(newEntry);
    };

    return (
        <Modal onClose={onCancel}>
            <CardHeader>
                <CardTitle>Create New Notebook Entry</CardTitle>
                <CardDescription>Start a new entry for experiment: "{experiment.name}"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Entry Title (e.g., Western Blot Day 1)" value={title} onChange={e => setTitle(e.target.value)} />
                <Input placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} />
                <div>
                    <label className="text-sm font-medium">Create from Protocol? (Optional)</label>
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md bg-slate-50">
                        {mockProtocols.map(p => (
                            <div key={p.id} className="flex items-center">
                                <input type="radio" id={`proto-${p.id}`} name="protocol" value={p.id} 
                                       onChange={e => setSelectedProtocolId(e.target.value)}
                                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                                <label htmlFor={`proto-${p.id}`} className="ml-3 block text-sm font-medium text-gray-700">{p.title}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <div className="p-4 bg-slate-50 flex justify-end gap-3">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!title}>Create Entry</Button>
            </div>
        </Modal>
    );
};

const LoadingSpinner: React.FC<{className?: string}> = ({className}) => (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
    </div>
);

interface NotebookPageProps {
    projects: Project[];
    onUpdateProjects: (projects: Project[]) => void;
    onAddResult: (result: ResultEntry) => void;
}

const NotebookPage: FC<NotebookPageProps> = ({ projects, onUpdateProjects, onAddResult }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
    const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(projects[0]?.experiments[0]?.id || null);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(projects[0]?.experiments[0]?.entries[0]?.id || null);
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    
    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
    const selectedExperiment = useMemo(() => selectedProject?.experiments.find(e => e.id === selectedExperimentId), [selectedProject, selectedExperimentId]);
    const selectedEntry = useMemo(() => selectedExperiment?.entries.find(en => en.id === selectedEntryId), [selectedExperiment, selectedEntryId]);

    const handleSelectProject = (id: string) => {
        setSelectedProjectId(id);
        const project = projects.find(p => p.id === id);
        if (project && project.experiments.length > 0) {
            const firstExpId = project.experiments[0].id;
            setSelectedExperimentId(firstExpId);
            const firstEntryId = project.experiments[0].entries[0]?.id || null;
            setSelectedEntryId(firstEntryId);
        } else {
            setSelectedExperimentId(null);
            setSelectedEntryId(null);
        }
    };

    const handleSelectExperiment = (id: string) => {
        setSelectedExperimentId(id);
        const experiment = selectedProject?.experiments.find(e => e.id === id);
        setSelectedEntryId(experiment?.entries[0]?.id || null);
    };

    const handleCreateProject = (name: string, description: string) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            description,
            owner: 'Dr. Evelyn Reed', // hardcoded user
            experiments: []
        };
        const updatedProjects = [...projects, newProject];
        onUpdateProjects(updatedProjects);
        setProjectModalOpen(false);
        // Select the new project automatically
        handleSelectProject(newProject.id);
    };

    const handleCreateEntry = (newEntry: NotebookEntry) => {
        const updatedProjects = projects.map(proj => {
            if (proj.id !== selectedProjectId) return proj;
            return {
                ...proj,
                experiments: proj.experiments.map(exp => {
                    if (exp.id !== selectedExperimentId) return exp;
                    return { ...exp, entries: [newEntry, ...exp.entries] };
                })
            };
        });
        onUpdateProjects(updatedProjects);
        setSelectedEntryId(newEntry.id);
        setCreateModalOpen(false);
    };

    const updateEntry = (updatedEntry: NotebookEntry) => {
        const updatedProjects = projects.map(proj => {
            if (proj.id !== selectedProjectId) return proj;
            return {
                ...proj,
                experiments: proj.experiments.map(exp => {
                    if (exp.id !== selectedExperimentId) return exp;
                    return { ...exp, entries: exp.entries.map(e => e.id === updatedEntry.id ? updatedEntry : e) };
                })
            }
        });
        onUpdateProjects(updatedProjects);
    };
    
    return (
        <div className="flex h-full -m-4 sm:-m-6 lg:-m-8">
            {isProjectModalOpen && <CreateProjectModal onCancel={() => setProjectModalOpen(false)} onCreate={handleCreateProject} />}
            {isCreateModalOpen && selectedExperiment && <CreateEntryModal onCancel={() => setCreateModalOpen(false)} onCreate={handleCreateEntry} experiment={selectedExperiment}/>}

            {/* Projects Pane */}
            <div className="w-1/5 bg-slate-100 border-r border-slate-200 h-full flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Projects</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {projects.map(project => (
                        <button key={project.id} onClick={() => handleSelectProject(project.id)}
                            className={`w-full text-left p-3 rounded-md flex items-center transition-colors ${selectedProjectId === project.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-200'}`}>
                            <FolderIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                            <span className="font-semibold truncate">{project.name}</span>
                        </button>
                    ))}
                </div>
                 <div className="p-2 border-t border-slate-200">
                    <Button variant="secondary" className="w-full" onClick={() => setProjectModalOpen(true)}><PlusCircleIcon className="h-4 w-4 mr-2"/>New Project</Button>
                </div>
            </div>

            {/* Experiments & Entries Pane */}
            <div className="w-1/4 bg-white border-r border-slate-200 h-full flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-800">Experiments</h2>
                     <Button variant="ghost" size="sm" disabled><PlusCircleIcon className="h-4 w-4"/></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {selectedProject ? (
                        selectedProject.experiments.map(exp => (
                            <div key={exp.id}>
                                <button onClick={() => handleSelectExperiment(exp.id)} className="w-full text-left p-3 rounded-md flex items-center font-semibold hover:bg-slate-100">
                                    <FlaskConicalIcon className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                                    <span className="truncate">{exp.name}</span>
                                    <ChevronRightIcon className={`h-5 w-5 ml-auto transition-transform ${selectedExperimentId === exp.id ? 'rotate-90' : ''}`} />
                                </button>
                                {selectedExperimentId === exp.id && (
                                     <div className="ml-6 pl-3 border-l-2 border-slate-200 space-y-1 py-1">
                                        {exp.entries.map(entry => (
                                            <button key={entry.id} onClick={() => setSelectedEntryId(entry.id)}
                                                className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm transition-colors ${selectedEntryId === entry.id ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-slate-100'}`}>
                                                <FileTextIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                                <span className="truncate">{entry.title}</span>
                                            </button>
                                        ))}
                                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600" onClick={() => setCreateModalOpen(true)}>
                                            <PlusCircleIcon className="h-4 w-4 mr-2"/> New Entry
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-slate-500 text-center">Select a project to see experiments.</p>
                    )}
                </div>
            </div>

            {/* Entry Detail Pane */}
            <div className="flex-1 bg-slate-50 h-full overflow-y-auto">
                {selectedEntry ? (
                    <EntryDetailView entry={selectedEntry} onUpdate={updateEntry} onAddResult={onAddResult} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <JournalIcon className="mx-auto h-16 w-16 text-slate-300" />
                            <h3 className="mt-2 text-lg font-medium text-slate-800">Select an entry</h3>
                            <p className="mt-1 text-sm text-slate-500">Choose an entry from the list to view its details.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Entry Detail View ---

const EntryDetailView: FC<{ entry: NotebookEntry, onUpdate: (entry: NotebookEntry) => void, onAddResult: (result: ResultEntry) => void }> = ({ entry, onUpdate, onAddResult }) => {
    const linkedProtocol = useMemo(() => mockProtocols.find(p => p.id === entry.protocolId), [entry.protocolId]);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const handleAddContentBlock = (type: ContentBlockType) => {
        if (isLocked) return;
    
        let newBlock: ContentBlock;
        const newId = `cb-${Date.now()}`;
    
        switch (type) {
            case 'text':
                newBlock = { id: newId, type: 'text', data: { html: '<p>New text block. Edit me.</p>' } };
                break;
            case 'table':
                newBlock = { id: newId, type: 'table', data: { headers: ['Header 1', 'Header 2'], rows: [['Data A', 'Data B'], ['Data C', 'Data D']] } };
                break;
            case 'image':
                newBlock = { id: newId, type: 'image', data: { url: 'https://placehold.co/600x400/e2e8f0/64748b?text=New+Image', caption: 'A descriptive caption for the new image.' } };
                break;
            case 'file':
                newBlock = { id: newId, type: 'file', data: { name: 'attached_file.pdf', size: '256 KB', url: '#' } };
                break;
            default:
                return; // Should not happen for the toolbar items
        }
        
        const updatedContent = [...entry.content, newBlock];
        onUpdate({ ...entry, content: updatedContent, lastModified: new Date().toISOString() });
    };

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        const contentToSummarize = entry.content
            .map(block => {
                if (block.type === 'text') return block.data.html.replace(/<[^>]*>/g, ' '); // Strip html
                if (block.type === 'protocol_step') return `STEP ${block.data.step}: ${block.data.description}`;
                return '';
            })
            .join('\n');
        
        const fullContent = `Title: ${entry.title}\n${contentToSummarize}`;
        
        try {
            const summaryText = await generateNotebookSummary(fullContent);
            const summaryBlock: ContentBlock = {
                id: `cb-summary-${Date.now()}`,
                type: 'summary',
                data: { text: summaryText, isStored: false }
            };
            const updatedEntry = { ...entry, content: [...entry.content, summaryBlock] };
            onUpdate(updatedEntry);
        } catch (error) {
            console.error("Failed to generate summary:", error);
            // You could show an error toast to the user here
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleStoreSummary = (summaryBlock: ContentBlock) => {
        // 1. Create Result Entry
        const newResult: ResultEntry = {
            id: `res-${Date.now()}`,
            title: `Summary: ${entry.title}`,
            date: new Date().toISOString().split('T')[0],
            author: entry.author,
            protocolId: entry.protocolId,
            summary: summaryBlock.data.text,
            tags: ['summary', ...entry.tags],
            dataPreview: { type: 'text', content: `Link to Notebook Entry #${entry.id}` },
            source: 'Notebook Summary',
            notebookEntryId: entry.id,
        };
        onAddResult(newResult);

        // 2. Update entry to mark as stored
        const updatedContent = entry.content.map(block => 
            block.id === summaryBlock.id ? { ...block, data: { ...block.data, isStored: true } } : block
        );
        onUpdate({ ...entry, content: updatedContent });
    };

    const handleSignEntry = () => {
        if (entry.status === 'Signed') return;
        const signature = {
            signedBy: 'Dr. Evelyn Reed', // Hardcoded PI
            date: new Date().toISOString()
        };
        const updatedEntry = { ...entry, status: 'Signed' as 'Signed', signature };
        onUpdate(updatedEntry);
    };

    const statusClasses = {
        'In Progress': 'bg-blue-100 text-blue-800',
        'Completed': 'bg-gray-100 text-gray-800',
        'Awaiting Review': 'bg-yellow-100 text-yellow-800',
        'Signed': 'bg-green-100 text-green-800',
    };
    
    const isLocked = entry.status === 'Signed';

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="pb-6 border-b border-slate-200">
                 {isLocked && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-600"/>
                        <div>
                           <p className="font-semibold text-green-800">Digitally Signed & Locked</p>
                           <p className="text-sm text-green-700">Signed by {entry.signature?.signedBy} on {new Date(entry.signature!.date).toLocaleString()}. This entry cannot be edited.</p>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-start">
                    <div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[entry.status]}`}>{entry.status}</span>
                        <h1 className="text-3xl font-bold text-slate-900 mt-2">{entry.title}</h1>
                    </div>
                     <div className="flex gap-2 flex-shrink-0 ml-4">
                        <Button onClick={handleGenerateSummary} disabled={isLocked || isGeneratingSummary}>
                            {isGeneratingSummary ? <LoadingSpinner className="text-white"/> : <SparklesIcon className="h-4 w-4 mr-2"/>}
                             {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
                        </Button>
                        <Button onClick={handleSignEntry} disabled={isLocked} className="bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300">
                            <PenSquareIcon className="h-4 w-4 mr-2"/> {isLocked ? 'Signed' : 'Sign & Lock'}
                        </Button>
                    </div>
                </div>
                <div className="text-sm text-slate-500 mt-2">
                    <span>By {entry.author}</span> &middot; <span>Created: {new Date(entry.createdDate).toLocaleDateString()}</span> &middot; <span>Last Modified: {new Date(entry.lastModified).toLocaleDateString()}</span>
                </div>
                {linkedProtocol && (
                     <p className="text-sm text-slate-600 mt-2 flex items-center">
                        <BookOpenIcon className="h-4 w-4 mr-2 text-slate-400"/>
                        Based on protocol: <Link to={`/protocols/${linkedProtocol.id}`} className="ml-1 font-semibold text-blue-600 hover:underline">{linkedProtocol.title}</Link>
                    </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                    {entry.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">{tag}</span>
                    ))}
                </div>
            </div>

            {/* Content & Toolbar */}
            <div className="py-6 space-y-4">
                <div className="flex gap-2 p-2 bg-white border rounded-lg sticky top-0 z-10">
                    <Button variant="secondary" size="sm" disabled={isLocked} onClick={() => handleAddContentBlock('text')}><EditIcon className="h-4 w-4 mr-2"/>Text</Button>
                    <Button variant="secondary" size="sm" disabled={isLocked} onClick={() => handleAddContentBlock('table')}><TableIcon className="h-4 w-4 mr-2"/>Table</Button>
                    <Button variant="secondary" size="sm" disabled={isLocked} onClick={() => handleAddContentBlock('image')}><ImageIcon className="h-4 w-4 mr-2"/>Image</Button>
                    <Button variant="secondary" size="sm" disabled={isLocked} onClick={() => handleAddContentBlock('file')}><PaperclipIcon className="h-4 w-4 mr-2"/>File</Button>
                </div>
                <div className="space-y-6">
                    {entry.content.map(block => <ContentBlockView key={block.id} block={block} onStoreSummary={handleStoreSummary} isLocked={isLocked}/>)}
                </div>
            </div>
            
             {/* Comments */}
            <div className="py-6 border-t border-slate-200">
                 <h2 className="text-xl font-bold text-slate-800 mb-4">Discussion</h2>
                 <div className="space-y-4">
                     {entry.comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 flex-shrink-0">
                                {comment.author.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="bg-white p-3 rounded-lg border w-full">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-slate-800">{comment.author}</p>
                                    <p className="text-xs text-slate-400">{new Date(comment.date).toLocaleString()}</p>
                                </div>
                                <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
                            </div>
                        </div>
                     ))}
                 </div>
                 <div className="mt-4 flex gap-3">
                    <Input placeholder="Write a comment..." disabled={isLocked} />
                    <Button disabled={isLocked}>Send</Button>
                 </div>
            </div>
        </div>
    );
};

// --- Content Block Renderer ---

const ContentBlockView: FC<{ block: ContentBlock, onStoreSummary: (block: ContentBlock) => void, isLocked: boolean }> = ({ block, onStoreSummary, isLocked }) => {
    switch(block.type) {
        case 'protocol_step':
            return (
                <div className="p-4 bg-slate-100 border-l-4 border-slate-300 rounded-r-lg">
                    <p className="text-sm font-semibold text-slate-500">Protocol Step {block.data.step}</p>
                    <p className="font-semibold text-slate-800">{block.data.description}</p>
                </div>
            );
        case 'text':
            return <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: block.data.html }} />;
        case 'table':
            return (
                <div className="overflow-x-auto my-4">
                    <table className="min-w-full bg-white border border-slate-300 text-sm">
                        <thead>
                            <tr className="bg-slate-100">
                                {block.data.headers.map((h: string, i: number) => <th key={i} className="p-2 border-b text-left font-semibold">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                             {block.data.rows.map((row: string[], i: number) => (
                                <tr key={i} className="border-b">
                                    {row.map((cell: string, j: number) => <td key={j} className="p-2 border-r">{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        case 'image':
            return (
                <figure className="my-4">
                    <img src={block.data.url} alt={block.data.caption} className="rounded-lg shadow-md mx-auto max-w-full h-auto" />
                    <figcaption className="text-center text-sm text-slate-500 mt-2">{block.data.caption}</figcaption>
                </figure>
            );
        case 'file':
            return (
                 <a href={block.data.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-slate-50 transition-colors">
                    <PaperclipIcon className="h-6 w-6 text-slate-500 flex-shrink-0"/>
                    <div>
                        <p className="font-semibold text-blue-600">{block.data.name}</p>
                        <p className="text-xs text-slate-500">{block.data.size}</p>
                    </div>
                </a>
            );
        case 'summary':
            return (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg relative">
                    <div className="flex items-center mb-2">
                        <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-600"/>
                        <h3 className="text-lg font-bold text-yellow-900">AI Generated Summary</h3>
                    </div>
                    <pre className="text-sm text-yellow-800 whitespace-pre-wrap font-sans pr-32">{block.data.text}</pre>
                     {!block.data.isStored && !isLocked && (
                        <Button size="sm" onClick={() => onStoreSummary(block)} className="absolute top-4 right-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900">
                            Store in Results
                        </Button>
                    )}
                     {block.data.isStored && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-200 px-3 py-1.5 rounded-full">
                            <CheckCircleIcon className="h-4 w-4"/> Stored
                        </div>
                    )}
                </div>
            );
        default:
            return <div className="text-red-500">Unknown block type</div>;
    }
};


export default NotebookPage;