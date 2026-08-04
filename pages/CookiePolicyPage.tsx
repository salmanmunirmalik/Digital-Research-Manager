import React, { useEffect, useMemo, useState } from 'react';

interface Policy {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  language: string;
}

const fallbackPolicy: Policy = {
  id: 'fallback-cookies',
  type: 'cookies',
  title: 'Cookie Policy',
  version: 'draft',
  effective_date: new Date().toISOString(),
  language: 'en',
  content: `This Cookie Policy explains how we use cookies and similar technologies.

Essential cookies are required for core functionality. Functional cookies remember preferences. Analytics cookies help us improve. Marketing cookies support relevant outreach.

You can update your preferences at any time using the cookie preferences page.`
};

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalhost) {
      const port = import.meta.env.VITE_API_PORT || '5002';
      return `http://localhost:${port}/api`;
    }

    return `${window.location.origin}/api`;
  }

  return 'http://localhost:5002/api';
};

const CookiePolicyPage: React.FC = () => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/compliance/policies/cookies`);
        if (!response.ok) {
          setPolicy(fallbackPolicy);
          return;
        }
        const data = await response.json();
        if (!data?.policy) {
          setPolicy(fallbackPolicy);
          return;
        }
        setPolicy(data.policy);
      } catch (err) {
        setPolicy(fallbackPolicy);
        setError(err instanceof Error ? err.message : 'Failed to load policy');
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, [apiBaseUrl]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mt-2">Last updated information is shown below.</p>

        {loading && (
          <div className="mt-6 text-gray-600">Loading policy...</div>
        )}

        {!loading && error && (
          <div className="mt-6 text-red-600">{error}</div>
        )}

        {!loading && policy && (
          <div className="mt-6 space-y-4">
            <div className="text-sm text-gray-500">
              Version {policy.version} · Effective {new Date(policy.effective_date).toLocaleDateString()}
            </div>
            <div className="whitespace-pre-wrap text-gray-700 leading-7">
              {policy.content}
            </div>
            <div className="text-sm text-indigo-600">
              <a href="/cookie-preferences" className="hover:underline">Manage preferences</a>
            </div>
          </div>
        )}
      </div>
      <footer className="mt-6 text-center text-xs text-gray-500">
        <a href="/privacy" className="hover:text-indigo-600">Privacy</a>
        <span className="text-gray-300"> · </span>
        <a href="/terms" className="hover:text-indigo-600">Terms</a>
      </footer>
    </div>
  );
};

export default CookiePolicyPage;
