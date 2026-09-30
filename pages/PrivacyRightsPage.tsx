import React, { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';
import { Link, useSearchParams } from 'react-router-dom';


type RequestType = 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';

const requestTypes: { value: RequestType; label: string; help: string }[] = [
  { value: 'access', label: 'Access (Art. 15)', help: 'Receive a copy of personal data we hold about you.' },
  { value: 'rectification', label: 'Rectification (Art. 16)', help: 'Ask us to correct inaccurate personal data.' },
  { value: 'erasure', label: 'Erasure (Art. 17)', help: 'Request anonymization / deletion of your account data where applicable.' },
  { value: 'portability', label: 'Portability (Art. 20)', help: 'Receive your data in a machine-readable format.' },
  { value: 'restriction', label: 'Restriction (Art. 18)', help: 'Limit how we process your data while a concern is reviewed.' },
  { value: 'objection', label: 'Objection (Art. 21)', help: 'Object to processing based on legitimate interests / withdraw optional consents.' }
];

const PrivacyRightsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);
  const [email, setEmail] = useState('');
  const [type, setType] = useState<RequestType>('access');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'error'; message: string }>({
    kind: 'idle',
    message: ''
  });
  const [verifyStatus, setVerifyStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const requestId = searchParams.get('requestId');
    const token = searchParams.get('token');
    if (!requestId || !token) return;

    const verify = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/compliance/gdpr/requests/${requestId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await response.json();
        if (!response.ok) {
          setVerifyStatus(data.error || 'Verification failed');
          return;
        }
        setVerifyStatus('Your request has been verified. An administrator will process it shortly.');
      } catch {
        setVerifyStatus('Unable to verify request right now.');
      }
    };
    verify();
  }, [apiBaseUrl, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ kind: 'idle', message: '' });
    try {
      const response = await fetch(`${apiBaseUrl}/compliance/gdpr/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          email,
          description: description || undefined,
          verificationMethod: 'email'
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus({ kind: 'error', message: data.error || 'Failed to submit request' });
        return;
      }
      const extra = data.verificationUrl
        ? ` Dev verification link: ${data.verificationUrl}`
        : ' Check your email for a verification link.';
      setStatus({
        kind: 'ok',
        message: `Request submitted (ID: ${data.requestId}).${extra}`
      });
      setDescription('');
    } catch {
      setStatus({ kind: 'error', message: 'Network error while submitting request' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Privacy rights</h1>
          <p className="mt-2 text-slate-600">
            Exercise your GDPR data-subject rights. After you submit, we email a verification link
            before processing the request.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            <Link to="/privacy" className="text-indigo-600 hover:underline">Back to Privacy</Link>
          </p>
        </div>

        {verifyStatus ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            {verifyStatus}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email associated with your data
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="you@institution.edu"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="type">
              Request type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as RequestType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {requestTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-slate-500">
              {requestTypes.find((item) => item.value === type)?.help}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
              Details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Describe what you need corrected, restricted, or exported"
            />
          </div>

          {status.kind !== 'idle' ? (
            <div
              className={`rounded-lg border p-3 text-sm ${
                status.kind === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrivacyRightsPage;
