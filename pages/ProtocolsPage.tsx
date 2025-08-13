
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Protocol } from '../types';
import { 
    SearchIcon, 
    ChevronRightIcon, 
    BeakerIcon, 
    BookmarkIcon,
    MessageSquareQuestionIcon,
    UserIcon,
    UsersIcon,
    GlobeIcon,
    PlusCircleIcon
} from '../components/icons';

interface ProtocolsPageProps {
    protocols: Protocol[];
    onUpdateProtocols: (updatedProtocols: Protocol[]) => void;
}

const ProtocolCard: React.FC<{ protocol: Protocol; tab: 'personal' | 'lab' | 'global'; onSave: (e: React.MouseEvent, p: Protocol) => void }> = ({ protocol, tab, onSave }) => (
    <Link to={`/protocols/${protocol.id}`} className="block h-full">
        <Card className="h-full flex flex-col hover:border-blue-500 border-transparent border transition-colors duration-300">
            <CardContent className="flex-grow flex flex-col">
                <div className="flex-grow">
                    <div className="flex items-start justify-between">
                         <h3 className="text-lg font-semibold text-slate-800 pr-4">{protocol.title}</h3>
                         {tab === 'global' && protocol.discussionCount && protocol.discussionCount > 0 && (
                            <div className="flex items-center text-xs text-slate-500 flex-shrink-0">
                                <MessageSquareQuestionIcon className="h-4 w-4 mr-1" />
                                {protocol.discussionCount} Discussions
                            </div>
                        )}
                    </div>
                    <p className="text-slate-600 text-sm my-2 line-clamp-2">{protocol.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {protocol.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
                
                <div className="mt-auto flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-100">
                    <div>
                        <span>By {protocol.author}</span>
                        <br />
                        <span>Updated: {protocol.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {tab !== 'personal' && (
                             <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => onSave(e, protocol)}
                                className="text-slate-600 hover:text-blue-600 hover:bg-blue-100"
                                title="Save to Personal Library"
                             >
                                <BookmarkIcon className="h-5 w-5" />
                            </Button>
                        )}
                        <div className="p-1 rounded-full hover:bg-slate-200">
                           <ChevronRightIcon className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </Link>
);


const ProtocolsPage: React.FC<ProtocolsPageProps> = ({ protocols, onUpdateProtocols }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'personal' | 'lab' | 'global'>('lab');

    const handleSaveToPersonal = (e: React.MouseEvent, protocolToSave: Protocol) => {
        e.preventDefault(); // Prevent link navigation
        const currentUser = "Dr. Evelyn Reed"; // Assume current user
        
        const alreadyExists = protocols.some(p => p.access === 'Private' && p.forkedFrom === protocolToSave.id && p.author === currentUser);
        if(alreadyExists) {
            alert('You have already saved this protocol to your personal library.');
            return;
        }

        const newProtocol: Protocol = {
            ...JSON.parse(JSON.stringify(protocolToSave)), // Deep copy
            id: `protocol-${Date.now()}`,
            access: 'Private',
            author: currentUser,
            forkedFrom: protocolToSave.id,
            version: '1.0',
            lastUpdated: new Date().toISOString().split('T')[0],
            versionHistory: [{
                version: '1.0',
                date: new Date().toISOString().split('T')[0],
                author: currentUser,
                changes: `Saved from ${protocolToSave.access} library (original author: ${protocolToSave.author})`
            }]
        };
        
        onUpdateProtocols([...protocols, newProtocol]);
        alert(`Protocol "${newProtocol.title}" saved to your personal library!`);
    };

    const filteredProtocols = useMemo(() => {
        const protocolsByTab = protocols.filter(p => {
            if (activeTab === 'personal') return p.access === 'Private';
            if (activeTab === 'lab') return p.access === 'Lab Only';
            if (activeTab === 'global') return p.access === 'Public';
            return false;
        });

        if (!searchTerm) {
            return protocolsByTab;
        }

        return protocolsByTab.filter(protocol =>
            protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protocol.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protocol.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protocol.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, activeTab, protocols]);

    const tabs: {id: 'personal' | 'lab' | 'global', name: string, icon: JSX.Element}[] = [
        { id: 'personal', name: 'Personal Library', icon: <UserIcon className="h-5 w-5 mr-2" /> },
        { id: 'lab', name: 'Lab Library', icon: <UsersIcon className="h-5 w-5 mr-2" /> },
        { id: 'global', name: 'Global Library', icon: <GlobeIcon className="h-5 w-5 mr-2" /> },
    ];
    
    const pageSubtitles: Record<typeof activeTab, string> = {
        personal: "Your private collection of saved and created protocols.",
        lab: "Protocols shared within your research lab.",
        global: "Discover and share protocols with the worldwide research community.",
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-900">Protocol Library</h1>
                    <p className="mt-1 text-md text-slate-600">{pageSubtitles[activeTab]}</p>
                </div>
                <Link to="/protocols/new">
                    <Button>
                        <PlusCircleIcon className="mr-2 h-5 w-5"/>
                        New Protocol
                    </Button>
                </Link>
            </div>
            
            {/* TABS */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                         <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                ? 'border-slate-800 text-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm inline-flex items-center transition-colors`}
                            >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                    type="text"
                    placeholder={`Search in ${activeTab} library...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            
            {filteredProtocols.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProtocols.map(protocol => (
                        <ProtocolCard key={protocol.id} protocol={protocol} tab={activeTab} onSave={handleSaveToPersonal} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 rounded-lg bg-slate-50">
                    <BeakerIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-medium text-slate-800">No Protocols Found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {searchTerm ? `No results for "${searchTerm}" in this library.` : `This library is currently empty.`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProtocolsPage;
