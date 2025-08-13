
import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { mockHelpRequests } from '../data/mockHelpData';
import { HelpRequest, Protocol } from '../types';
import { LightbulbIcon, MessageSquareQuestionIcon } from '../components/icons';
import { getCommunityHelpAdvice } from '../services/geminiService';
import { mockProtocols } from '../data/mockData';
import Select from '../components/ui/Select';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce"></div>
    </div>
);

const HelpRequestCard: React.FC<{ request: HelpRequest }> = ({ request }) => (
    <Card className="hover:shadow-lg transition-shadow">
        <CardContent>
            <div className="flex justify-between items-start">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${request.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                    {request.status}
                </span>
                <div className="flex flex-wrap gap-1">
                    {request.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">{tag}</span>
                    ))}
                </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mt-3">{request.title}</h3>
            <p className="text-slate-500 text-sm mt-1">asked by {request.author} on {request.date}</p>
            <p className="text-slate-600 text-sm mt-3 mb-4 line-clamp-2">{request.description}</p>
            <Button variant="secondary">View Discussion ({Math.floor(Math.random() * 5)} replies)</Button>
        </CardContent>
    </Card>
);

const HelpPage: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [protocolId, setProtocolId] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = title && description;

    const handleGetAIAdvice = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsLoading(true);
        setError('');
        setAiResponse('');
        try {
            const protocolName = mockProtocols.find(p => p.id === protocolId)?.title;
            const advice = await getCommunityHelpAdvice(title, description, protocolName);
            setAiResponse(advice);
        } catch (err) {
            setError('Failed to get advice from AI. Please check your API key and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Inter-Lab Help Forum</h1>
                <p className="mt-1 text-md text-slate-600">Ask the community or get instant AI-powered advice for your research hurdles.</p>
            </div>

            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Submit a New Help Request</CardTitle>
                    <CardDescription>Describe your problem to get help from peers and our AI assistant.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title / Subject</label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Low yield from bacterial transformation" className="mt-1"/>
                        </div>
                         <div>
                            <label htmlFor="protocol" className="block text-sm font-medium text-slate-700">Relevant Protocol (Optional)</label>
                            <Select id="protocol" value={protocolId} onChange={e => setProtocolId(e.target.value)} className="mt-1">
                                <option value="">None</option>
                                {mockProtocols.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </Select>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700">Describe your issue in detail</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Include details like cell type, reagents used, what you've already tried, etc." className="mt-1 flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"></textarea>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center justify-end pt-4 border-t">
                             <Button onClick={handleGetAIAdvice} disabled={!canSubmit || isLoading}>
                                <LightbulbIcon className="mr-2 h-5 w-5" />
                                {isLoading ? <LoadingSpinner/> : 'Get Instant AI Advice'}
                             </Button>
                             <Button type="submit" variant="secondary" disabled>Post to Community (Soon)</Button>
                        </div>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    {aiResponse && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center mb-2">
                                <LightbulbIcon className="h-6 w-6 mr-3 text-yellow-500" />
                                <h4 className="font-semibold text-lg text-yellow-900">Here's some initial advice from our AI assistant:</h4>
                            </div>
                            <pre className="text-sm text-yellow-800 whitespace-pre-wrap font-sans mt-2">{aiResponse}</pre>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Open Community Requests</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mockHelpRequests.map(request => (
                        <HelpRequestCard key={request.id} request={request} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
