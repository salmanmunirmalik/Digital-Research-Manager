import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, WrenchScrewdriverIcon } from './icons';
import axios from 'axios';

interface InstrumentAlert {
  id: string;
  instrument_id: string;
  instrument_name?: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

interface InstrumentAlertsViewProps {
  instrumentId?: string;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

const InstrumentAlertsView: React.FC<InstrumentAlertsViewProps> = ({
  instrumentId,
  onAcknowledge,
  onResolve
}) => {
  const [alerts, setAlerts] = useState<InstrumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAlerts();
  }, [instrumentId]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = instrumentId 
        ? `/api/instruments/${instrumentId}/alerts`
        : '/api/instruments/alerts';
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlerts(response.data.alerts || []);
    } catch (err: any) {
      console.error('Error fetching instrument alerts:', err);
      // If endpoint doesn't exist, generate alerts from maintenance records
      // For now, set empty array
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
    
    if (onAcknowledge) {
      try {
        await onAcknowledge(alertId);
        await fetchAlerts();
      } catch (error) {
        // Revert on error
        setAcknowledgedAlerts(prev => {
          const newSet = new Set(prev);
          newSet.delete(alertId);
          return newSet;
        });
      }
    }
  };

  const handleResolve = async (alertId: string) => {
    if (onResolve) {
      try {
        await onResolve(alertId);
        await fetchAlerts();
      } catch (error) {
        console.error('Error resolving alert:', error);
      }
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolved);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (unacknowledgedAlerts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <WrenchScrewdriverIcon className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Instrument Alerts</h2>
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            {unacknowledgedAlerts.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {unacknowledgedAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{alert.title}</h3>
                  <p className="text-sm mb-2">{alert.message}</p>
                  {alert.instrument_name && (
                    <p className="text-xs opacity-75 mb-1">
                      Instrument: {alert.instrument_name}
                    </p>
                  )}
                  <p className="text-xs opacity-75">
                    {new Date(alert.timestamp).toLocaleDateString()} at {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {onResolve && alert.type === 'maintenance_due' && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1.5 text-sm font-medium bg-white bg-opacity-70 hover:bg-opacity-100 rounded-md transition-colors"
                    title="Mark as resolved"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="px-3 py-1.5 text-sm font-medium bg-white bg-opacity-70 hover:bg-opacity-100 rounded-md transition-colors flex items-center gap-1"
                  title="Acknowledge alert"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstrumentAlertsView;


