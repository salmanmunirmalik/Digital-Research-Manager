import React, { useEffect, useMemo, useState } from 'react';

interface CookieBannerProps {
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onSavePreferences?: (preferences: ConsentPreferences) => void;
}

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

const CookieBanner: React.FC<CookieBannerProps> = ({
  privacyPolicyUrl = '/privacy',
  cookiePolicyUrl = '/cookies',
  onAcceptAll,
  onRejectAll,
  onSavePreferences
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false
  });
  const [policyVersion, setPolicyVersion] = useState<string | null>(null);

  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
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

  const saveConsent = async (consents: ConsentPreferences) => {
    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({
        ...consents,
        policyType: 'cookies',
        policyVersion,
        timestamp: new Date().toISOString()
      })
    );

    try {
      const token = localStorage.getItem('authToken');
      const sessionId = getSessionId();
      const response = await fetch(`${apiBaseUrl}/compliance/consent/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          source: 'cookie_banner',
          consents: Object.entries(consents).map(([type, granted]) => ({
            type,
            granted,
            policyType: 'cookies',
            policyVersion,
            purposes: mapPurposes(type as keyof ConsentPreferences)
          }))
        })
      });

      if (!response.ok) {
        console.error('Failed to sync consent to server:', await response.text());
      }
    } catch (error) {
      console.error('Failed to save consent:', error);
    }

    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    saveConsent(allAccepted);
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    saveConsent(onlyEssential);
    onRejectAll?.();
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    onSavePreferences?.(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200">
      <div className="max-w-7xl mx-auto p-4">
        {!showDetails ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-gray-700">
                We use essential cookies to run this site. Optional cookies are only used if you choose them.{` `}
                <a href={privacyPolicyUrl} className="text-indigo-600 hover:underline">Privacy</a>
                <span className="text-gray-400"> · </span>
                <a href={cookiePolicyUrl} className="text-indigo-600 hover:underline">Cookies</a>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
              >
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Essential</span>
                  <span className="text-sm text-gray-500">Always Active</span>
                </div>
                <p className="text-sm text-gray-600">
                  Required for the website to function. Cannot be disabled.
                </p>
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
                <p className="text-sm text-gray-600">
                  Enhanced features like preferences and personalization.
                </p>
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
                <p className="text-sm text-gray-600">
                  Help us understand how visitors interact with our website.
                </p>
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
                <p className="text-sm text-gray-600">
                  Personalized content and outreach based on your interests.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <a href={privacyPolicyUrl} className="text-sm text-indigo-600 hover:underline">
                Privacy Policy
              </a>
              <div className="flex gap-3">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieBanner;
