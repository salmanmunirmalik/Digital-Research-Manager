import React, { useState } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import { SparklesIcon, UsersIcon } from './icons';

type MatchResult = {
  itemId: string;
  score: number;
  reason: string;
  metadata?: {
    title?: string;
    name?: string;
    institution?: string;
    expertise?: string[];
    complementarySkills?: string[];
    availability?: string;
  };
};

type ProjectCollaboratorMatchPanelProps = {
  onSelectUser?: (userId: string) => void;
};

const ProjectCollaboratorMatchPanel: React.FC<ProjectCollaboratorMatchPanelProps> = ({
  onSelectUser,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [expertiseCsv, setExpertiseCsv] = useState('');
  const [collaborationType, setCollaborationType] = useState<
    'any' | 'co-author' | 'co-investigator' | 'consultant' | 'mentor'
  >('any');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [tips, setTips] = useState<any[]>([]);

  const runMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setMatches([]);
    setTips([]);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/recommendations/collaborators/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          description,
          researchArea,
          requiredExpertise: expertiseCsv,
          collaborationType,
          maxCollaborators: 8,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Matching failed');
      setMatches(data.recommendations || []);
      setTips(data.agentRecommendations || []);
    } catch (err: any) {
      setError(err?.message || 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              Match collaborators for a project
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Describe the project and expertise you need. AI ranks researchers by complementary fit.
            </p>
          </div>
        </div>

        <form onSubmit={runMatch} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-medium text-slate-700">
              Project title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-900"
                placeholder="e.g. CRISPR screen for drug resistance"
              />
            </label>
            <label className="block text-[12px] font-medium text-slate-700">
              Research area
              <input
                required
                value={researchArea}
                onChange={(e) => setResearchArea(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-900"
                placeholder="e.g. Cancer biology"
              />
            </label>
          </div>
          <label className="block text-[12px] font-medium text-slate-700">
            Description
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-900"
              placeholder="Goals, methods, what a collaborator would contribute…"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-medium text-slate-700">
              Required expertise (comma-separated)
              <input
                required
                value={expertiseCsv}
                onChange={(e) => setExpertiseCsv(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-900"
                placeholder="bioinformatics, single-cell RNA-seq"
              />
            </label>
            <label className="block text-[12px] font-medium text-slate-700">
              Collaboration type
              <select
                value={collaborationType}
                onChange={(e) => setCollaborationType(e.target.value as typeof collaborationType)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-900"
              >
                <option value="any">Any</option>
                <option value="co-author">Co-author</option>
                <option value="co-investigator">Co-investigator</option>
                <option value="consultant">Consultant</option>
                <option value="mentor">Mentor</option>
              </select>
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" disabled={loading}>
            <span className="inline-flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              {loading ? 'Finding matches…' : 'Find project matches'}
            </span>
          </Button>
        </form>

        {matches.length > 0 ? (
          <ul className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            {matches.map((m) => {
              const name = m.metadata?.name || m.metadata?.title || 'Researcher';
              return (
                <li
                  key={m.itemId}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-slate-900">{name}</p>
                    <p className="truncate text-[12px] text-slate-500">
                      {[m.metadata?.institution, `Score ${Math.round(m.score)}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-600">{m.reason}</p>
                    {m.metadata?.expertise?.length ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {(m.metadata.expertise || []).slice(0, 5).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  {onSelectUser ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onSelectUser(m.itemId)}
                    >
                      View in directory
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {tips.length > 0 ? (
          <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
            <p className="font-medium text-slate-800">Agent tips</p>
            <ul className="mt-1 list-disc pl-4">
              {tips.slice(0, 4).map((t, i) => (
                <li key={i}>{typeof t === 'string' ? t : t?.text || JSON.stringify(t)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default ProjectCollaboratorMatchPanel;
