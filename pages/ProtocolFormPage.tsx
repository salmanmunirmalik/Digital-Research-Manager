
import React, { useState, useEffect, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Protocol, ProtocolStep, ProtocolAttachment } from '../types';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { PlusCircleIcon, TrashIcon } from '../components/icons';

interface ProtocolFormPageProps {
    protocols: Protocol[];
    onSave: (updatedProtocols: Protocol[]) => void;
}

const emptyProtocol: Omit<Protocol, 'id'> = {
    title: '',
    description: '',
    tags: [],
    author: 'Dr. Evelyn Reed', // Assume current user
    lastUpdated: new Date().toISOString().split('T')[0],
    version: '1.0',
    versionHistory: [{
        version: '1.0',
        date: new Date().toISOString().split('T')[0],
        author: 'Dr. Evelyn Reed',
        changes: 'Initial creation.'
    }],
    access: 'Private',
    steps: [{ step: 1, description: '', details: '', safetyWarning: '' }],
    attachments: [],
};

const ProtocolFormPage: FC<ProtocolFormPageProps> = ({ protocols, onSave }) => {
    const { protocolId } = useParams<{ protocolId: string }>();
    const navigate = useNavigate();
    const [protocol, setProtocol] = useState<Omit<Protocol, 'id'> & { id?: string }>(emptyProtocol);
    const [isEditing, setIsEditing] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (protocolId) {
            const existingProtocol = protocols.find(p => p.id === protocolId);
            if (existingProtocol) {
                setProtocol(existingProtocol);
                setTagInput(existingProtocol.tags.join(', '));
                setIsEditing(true);
            }
        } else {
            // Reset for 'new protocol' page
            setProtocol(emptyProtocol);
            setTagInput('');
            setIsEditing(false);
        }
    }, [protocolId, protocols]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProtocol(prev => ({ ...prev, [name]: value }));
    };

    const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
        setProtocol(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }));
    };

    const handleStepChange = (index: number, field: keyof ProtocolStep, value: string | number) => {
        const newSteps = [...protocol.steps];
        (newSteps[index] as any)[field] = value;
        // ensure step number is correct
        if (field !== 'step') {
            newSteps[index].step = index + 1;
        }
        setProtocol(prev => ({ ...prev, steps: newSteps }));
    };

    const addStep = () => {
        setProtocol(prev => ({
            ...prev,
            steps: [...prev.steps, { step: prev.steps.length + 1, description: '' }]
        }));
    };

    const removeStep = (index: number) => {
        if (protocol.steps.length <= 1) {
            alert("A protocol must have at least one step.");
            return;
        }
        const newSteps = protocol.steps.filter((_, i) => i !== index);
        // re-number steps
        newSteps.forEach((step, i) => step.step = i + 1);
        setProtocol(prev => ({ ...prev, steps: newSteps }));
    };
    
    const addAttachment = () => {
        setProtocol(prev => ({ ...prev, attachments: [...prev.attachments, { name: '', url: '', type: 'other' }] }));
    };

    const removeAttachment = (index: number) => {
        setProtocol(prev => ({ ...prev, attachments: protocol.attachments.filter((_, i) => i !== index) }));
    };
    
    const handleAttachmentChange = (index: number, field: keyof ProtocolAttachment, value: string) => {
        const newAttachments = [...protocol.attachments];
        (newAttachments[index] as any)[field] = value;
        setProtocol(prev => ({ ...prev, attachments: newAttachments }));
    };

    const handleSaveProtocol = () => {
        const currentUser = "Dr. Evelyn Reed";
        let newProtocolsList = [...protocols];
        let finalProtocol: Protocol;
        
        if (!isEditing) { // Creating new protocol
            finalProtocol = {
                ...protocol,
                id: `protocol-${Date.now()}`,
                author: currentUser,
                lastUpdated: new Date().toISOString().split('T')[0],
                version: '1.0',
                versionHistory: [{ version: '1.0', date: new Date().toISOString().split('T')[0], author: currentUser, changes: 'Initial creation.' }]
            };
            newProtocolsList.push(finalProtocol);
        } else { // Editing or duplicating
            const originalProtocol = protocols.find(p => p.id === protocol.id)!;
            if (originalProtocol.author === currentUser) { // Just editing own protocol
                 const newVersion = (parseFloat(originalProtocol.version) + 0.1).toFixed(1);
                 finalProtocol = {
                    ...protocol,
                    id: originalProtocol.id,
                    version: newVersion,
                    lastUpdated: new Date().toISOString().split('T')[0],
                    versionHistory: [
                        { version: newVersion, date: new Date().toISOString().split('T')[0], author: currentUser, changes: 'Updated protocol.' },
                        ...originalProtocol.versionHistory
                    ]
                 } as Protocol;
                 newProtocolsList = newProtocolsList.map(p => p.id === finalProtocol.id ? finalProtocol : p);
            } else { // Forking/Duplicating a protocol from another author
                finalProtocol = {
                    ...protocol,
                    id: `protocol-${Date.now()}`,
                    author: currentUser,
                    access: 'Private', // Forked protocols become private
                    forkedFrom: originalProtocol.id,
                    lastUpdated: new Date().toISOString().split('T')[0],
                    version: '1.0',
                    versionHistory: [{ version: '1.0', date: new Date().toISOString().split('T')[0], author: currentUser, changes: `Forked from ${originalProtocol.author}'s protocol v${originalProtocol.version}.` }]
                } as Protocol;
                newProtocolsList.push(finalProtocol);
            }
        }
        
        onSave(newProtocolsList);
        navigate(`/protocols/${finalProtocol.id}`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? 'Edit Protocol' : 'Create New Protocol'}</CardTitle>
                    <CardDescription>{isEditing ? `Editing "${protocol.title}"` : 'Fill in the details for your new lab protocol.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input name="title" value={protocol.title} onChange={handleChange} placeholder="Protocol Title" required />
                    <textarea name="description" value={protocol.description} onChange={handleChange} placeholder="Protocol Description" className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2" rows={3}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="tags" value={tagInput} onChange={handleTagChange} placeholder="Tags, comma-separated" />
                        <Select name="access" value={protocol.access} onChange={handleChange}>
                            <option value="Private">Private (Just Me)</option>
                            <option value="Lab Only">Lab Only</option>
                            <option value="Public">Public (Global)</option>
                        </Select>
                    </div>
                     <Input name="videoUrl" value={protocol.videoUrl || ''} onChange={handleChange} placeholder="YouTube Embed URL (optional)" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Procedure Steps</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {protocol.steps.map((step, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-slate-50 relative">
                            <h4 className="font-bold mb-2">Step {index + 1}</h4>
                            <div className="space-y-2">
                                <textarea value={step.description} onChange={e => handleStepChange(index, 'description', e.target.value)} placeholder="Step Description" className="flex min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required/>
                                <textarea value={step.details || ''} onChange={e => handleStepChange(index, 'details', e.target.value)} placeholder="Additional Details (optional)" className="flex min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
                                <Input value={step.safetyWarning || ''} onChange={e => handleStepChange(index, 'safetyWarning', e.target.value)} placeholder="Safety Warning (optional)" />
                            </div>
                             <Button variant="ghost" size="sm" onClick={() => removeStep(index)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100">
                                <TrashIcon className="h-5 w-5"/>
                            </Button>
                        </div>
                    ))}
                    <Button variant="secondary" onClick={addStep}><PlusCircleIcon className="h-4 w-4 mr-2"/>Add Step</Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    {protocol.attachments.map((att, index) => (
                         <div key={index} className="p-4 border rounded-lg bg-slate-50 relative flex items-center gap-4">
                            <Input value={att.name} onChange={e => handleAttachmentChange(index, 'name', e.target.value)} placeholder="Attachment Name" />
                            <Input value={att.url} onChange={e => handleAttachmentChange(index, 'url', e.target.value)} placeholder="Attachment URL" />
                             <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)} className="text-red-500 hover:bg-red-100 flex-shrink-0">
                                <TrashIcon className="h-5 w-5"/>
                            </Button>
                        </div>
                    ))}
                     <Button variant="secondary" onClick={addAttachment}><PlusCircleIcon className="h-4 w-4 mr-2"/>Add Attachment</Button>
                 </CardContent>
            </Card>
            
            <div className="flex justify-end gap-4 py-4">
                 <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                 <Button onClick={handleSaveProtocol} disabled={!protocol.title}>Save Protocol</Button>
            </div>
        </div>
    );
};

export default ProtocolFormPage;
