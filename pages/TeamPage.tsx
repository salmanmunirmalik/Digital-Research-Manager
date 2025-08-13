
import React from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockTeam } from '../data/mockTeamData';
import { TeamMember } from '../types';
import { UsersIcon, BookOpenIcon } from '../components/icons';

const statusStyles: { [key in TeamMember['status']]: { text: string, bg: string } } = {
    Online: { text: 'text-green-800', bg: 'bg-green-200' },
    'In Lab': { text: 'text-blue-800', bg: 'bg-blue-200' },
    Away: { text: 'text-yellow-800', bg: 'bg-yellow-200' },
    Offline: { text: 'text-slate-800', bg: 'bg-slate-200' },
};

const MemberCard: React.FC<{ member: TeamMember }> = ({ member }) => {
    const status = statusStyles[member.status];
    return (
        <Card className="flex flex-col">
            <CardContent className="flex-grow">
                <div className="flex items-start justify-between">
                     {/* Placeholder for avatar */}
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <UsersIcon className="w-8 h-8 text-slate-500" />
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.bg} ${status.text}`}>
                        {member.status}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-4">{member.name}</h3>
                <p className="text-md text-slate-600 font-medium">{member.role}</p>
                <a href={`mailto:${member.email}`} className="text-sm text-blue-600 hover:underline">{member.email}</a>
                
                <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                        {member.expertise.map(skill => (
                            <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">{skill}</span>
                        ))}
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Focus</h4>
                    <ul className="space-y-2">
                        {member.currentProjects.map(proj => (
                            <li key={proj.protocolId} className="flex items-center">
                                <BookOpenIcon className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0"/>
                                <Link to={`/protocols/${proj.protocolId}`} className="text-sm text-blue-700 hover:underline truncate">
                                    {proj.name}
                                </Link>
                            </li>
                        ))}
                         {member.currentProjects.length === 0 && (
                            <li className="text-sm text-slate-500">No projects listed.</li>
                        )}
                    </ul>
                </div>
            </CardContent>
            <div className="p-4 bg-slate-50 rounded-b-xl mt-auto">
                 <Button variant="secondary" className="w-full" disabled>View Profile (Coming Soon)</Button>
            </div>
        </Card>
    );
};

const TeamPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Team & Collaborators</h1>
                <p className="mt-1 text-md text-slate-600">Meet the members of the lab and see what they're working on.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {mockTeam.map(member => (
                    <MemberCard key={member.id} member={member} />
                ))}
            </div>
        </div>
    );
};

export default TeamPage;
