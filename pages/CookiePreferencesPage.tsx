import React, { useEffect, useMemo, useState } from 'react';

interface ConsentPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

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

const CookiePreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false
  });
  const [policyVersion, setPolicyVersion] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({
          essential: parsed.essential ?? true,
          functional: parsed.functional ?? true,
          analytics: parsed.analytics ?? false,
          marketing: parsed.marketing ?? false
        });
        if (parsed.policyVersion) {
          setPolicyVersion(parsed.policyVersion);
        }
      } catch {
        // Ignore invalid stored data
      }
    }
  }, []);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/compliance/policies/cookies`);
        if (!response.ok) return;
        const data = await response.json();
        if (data?.policy?.version) {
          setPolicyVersion(data.policy.version);
        }
      } catch (error) {
        console.error('Failed to load cookie policy:', error);
      }
    };
    loadPolicy();
  }, [apiBaseUrl]);

  const mapPurposes = (consentType: keyof ConsentPreferences) => {
    switch (consentType) {
      case 'essential':
        return ['platform_security', 'core_functionality'];
      case 'functional':
        return ['preferences', 'personalization'];
      case 'analytics':
        return ['usage_analytics', 'service_improvement'];
      case 'marketing':
        return ['personalized_outreach'];
      default:
        return ['unspecified'];
    }
  };

  const getSessionId = () => {
    const existing = localStorage.getItem('consent_session_id');
    if (existing) return existing;
    const generated = crypto.randomUUID();
    localStorage.setItem('consent_session_id', generated);
    return generated;
  };

  const withdrawConsents = async (types: string[]) => {
    if (types.length === 0) return;
    const token = localStorage.getItem('authToken');
    const sessionId = getSessionId();
    await fetch(`${apiBaseUrl}/compliance/consent/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Session-Id': sessionId
      },
      body: JSON.stringify({
        types,
        source: 'account_settings',
        policyType: 'cookies',
        policyVersion
      })
    });
  };

  const persistConsents = async (consents: ConsentPreferences) => {
    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({
        ...consents,
        policyType: 'cookies',
        policyVersion,
        timestamp: new Date().toISOString()
      })
    );

    const token = localStorage.getItem('authToken');
    const sessionId = getSessionId();

    await fetch(`${apiBaseUrl}/compliance/consent/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Session-Id': sessionId
      },
      body: JSON.stringify({
        source: 'account_settings',
        consents: Object.entries(consents).map(([type, granted]) => ({
          type,
          granted,
          policyType: 'cookies',
          policyVersion,
          purposes: mapPurposes(type as keyof ConsentPreferences)
        }))
      })
    });

    const typesToWithdraw = Object.entries(consents)
      .filter(([, granted]) => !granted)
      .map(([type]) => type);
    await withdrawConsents(typesToWithdraw);
  };

  const savePreferences = async () => {
    try {
      await persistConsents(preferences);
      setStatus('Preferences updated successfully.');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setStatus('Failed to update preferences. Please try again.');
    }
  };

  const acceptAll = async () => {
    const updated = { essential: true, functional: true, analytics: true, marketing: true };
    setPreferences(updated);
    await persistConsents(updated);
    setStatus('All cookies accepted.');
  };

  const rejectAll = async () => {
    const updated = { essential: true, functional: false, analytics: false, marketing: false };
    setPreferences(updated);
    await persistConsents(updated);
    setStatus('Non-essential cookies rejected.');
  };

  const resetBanner = () => {
    localStorage.removeItem('cookie_consent');
    setStatus('Cookie banner will reappear on next page load.');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Cookie Preferences</h1>
        <p className="text-sm text-gray-500 mt-2">
          Update your consent choices at any time. Essential cookies are always active.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Essential</span>
              <span className="text-sm text-gray-500">Always Active</span>
            </div>
            <p className="text-sm text-gray-600">Required for security and core functionality.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Functional</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences(prev => ({ ...prev, functional: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-600">Remember preferences and personalization.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Analytics</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-600">Help improve our services with usage insights.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Marketing</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-600">Relevant updates and outreach.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={savePreferences}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Save Preferences
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:text-gray-900"
          >
            Accept All
          </button>
          <button
            onClick={rejectAll}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:text-gray-900"
          >
            Reject Non-essential
          </button>
          <button
            onClick={resetBanner}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:text-gray-900"
          >
            Reset Banner
          </button>
        </div>

        {status && (
          <div className="mt-4 text-sm text-gray-600">{status}</div>
        )}
      </div>
      <footer className="mt-6 text-center text-xs text-gray-500">
        <a href="/privacy" className="hover:text-indigo-600">Privacy</a>
        <span className="text-gray-300"> · </span>
        <a href="/cookies" className="hover:text-indigo-600">Cookie policy</a>
        <span className="text-gray-300"> · </span>
        <a href="/terms" className="hover:text-indigo-600">Terms</a>
      </footer>
    </div>
  );
};

export default CookiePreferencesPage;
