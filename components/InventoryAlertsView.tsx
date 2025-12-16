import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, CheckCircleIcon } from './icons';
import axios from 'axios';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  min_quantity?: number;
  unit?: string;
  expiry_date?: string;
}

interface InventoryAlert {
  id: string;
  item_id: string;
  item_name: string;
  type: 'low_stock' | 'expired' | 'expiring_soon';
  message: string;
  severity: 'warning' | 'error' | 'info';
  timestamp: string;
  acknowledged: boolean;
}

interface InventoryAlertsViewProps {
  items: InventoryItem[];
  onAcknowledge?: (alertId: string) => void;
}

const InventoryAlertsView: React.FC<InventoryAlertsViewProps> = ({
  items,
  onAcknowledge
}) => {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Generate alerts from inventory items
    const generatedAlerts: InventoryAlert[] = [];
    const now = new Date();

    items.forEach(item => {
      // Low stock alert
      if (item.min_quantity !== undefined && item.quantity <= item.min_quantity && item.quantity > 0) {
        generatedAlerts.push({
          id: `low_stock_${item.id}`,
          item_id: item.id,
          item_name: item.name,
          type: 'low_stock',
          message: `Low stock: ${item.quantity} ${item.unit || ''} remaining (minimum: ${item.min_quantity} ${item.unit || ''})`,
          severity: item.quantity === 0 ? 'error' : 'warning',
          timestamp: new Date().toISOString(),
          acknowledged: acknowledgedAlerts.has(`low_stock_${item.id}`)
        });
      }

      // Out of stock alert
      if (item.quantity === 0) {
        generatedAlerts.push({
          id: `out_of_stock_${item.id}`,
          item_id: item.id,
          item_name: item.name,
          type: 'low_stock',
          message: `Out of stock: ${item.name} needs to be restocked`,
          severity: 'error',
          timestamp: new Date().toISOString(),
          acknowledged: acknowledgedAlerts.has(`out_of_stock_${item.id}`)
        });
      }

      // Expiry alerts
      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (expiryDate < now) {
          // Expired
          generatedAlerts.push({
            id: `expired_${item.id}`,
            item_id: item.id,
            item_name: item.name,
            type: 'expired',
            message: `Expired: ${item.name} expired on ${expiryDate.toLocaleDateString()}`,
            severity: 'error',
            timestamp: new Date().toISOString(),
            acknowledged: acknowledgedAlerts.has(`expired_${item.id}`)
          });
        } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          // Expiring soon
          generatedAlerts.push({
            id: `expiring_soon_${item.id}`,
            item_id: item.id,
            item_name: item.name,
            type: 'expiring_soon',
            message: `Expiring soon: ${item.name} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
            severity: 'warning',
            timestamp: new Date().toISOString(),
            acknowledged: acknowledgedAlerts.has(`expiring_soon_${item.id}`)
          });
        }
      }
    });

    setAlerts(generatedAlerts);
  }, [items, acknowledgedAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
    
    if (onAcknowledge) {
      try {
        await onAcknowledge(alertId);
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

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  if (unacknowledgedAlerts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
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
                  <p className="font-medium mb-1">{alert.message}</p>
                  <p className="text-xs opacity-75">
                    {new Date(alert.timestamp).toLocaleDateString()} at {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAcknowledge(alert.id)}
                className="ml-4 px-3 py-1.5 text-sm font-medium bg-white bg-opacity-70 hover:bg-opacity-100 rounded-md transition-colors flex items-center gap-1"
                title="Acknowledge alert"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Acknowledge
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryAlertsView;


