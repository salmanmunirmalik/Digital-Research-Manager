import React, { useState } from 'react';
import { XMarkIcon } from './icons';
import axios from 'axios';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
}

interface InventoryTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSubmit: (transaction: any) => void;
}

const InventoryTransactionForm: React.FC<InventoryTransactionFormProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    transaction_type: 'remove' as 'add' | 'remove' | 'adjustment',
    quantity: 0,
    notes: '',
    recipient_user_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && item) {
      setFormData({
        transaction_type: 'remove',
        quantity: 0,
        notes: '',
        recipient_user_id: ''
      });
      setError(null);
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setError(null);
    setLoading(true);

    try {
      // Validate quantity
      if (formData.quantity <= 0) {
        setError('Quantity must be greater than 0');
        setLoading(false);
        return;
      }

      if (formData.transaction_type === 'remove' && formData.quantity > item.quantity) {
        setError(`Cannot remove more than available quantity (${item.quantity} ${item.unit || ''})`);
        setLoading(false);
        return;
      }

      const transactionData = {
        transaction_type: formData.transaction_type === 'add' ? 'add' : 'remove',
        quantity: formData.quantity,
        notes: formData.notes,
        ...(formData.recipient_user_id && { recipient_user_id: formData.recipient_user_id })
      };

      await onSubmit(transactionData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Inventory Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
            <p className="text-sm text-gray-600">
              Current quantity: <span className="font-semibold">{item.quantity} {item.unit || ''}</span>
            </p>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <select
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="add">Add Stock (In)</option>
              <option value="remove">Remove Stock (Out)</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity {formData.transaction_type === 'adjustment' ? '(New Total)' : ''}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {formData.transaction_type === 'remove' && (
              <p className="mt-1 text-xs text-gray-500">
                Available: {item.quantity} {item.unit || ''}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Reason for transaction, project reference, etc."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Process Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryTransactionForm;


