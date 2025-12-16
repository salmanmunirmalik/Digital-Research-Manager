import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowRightLeftIcon
} from './icons';
import InventoryAlertsView from './InventoryAlertsView';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  unit?: string;
  min_quantity?: number;
  location?: string;
  supplier?: string;
  expiry_date?: string;
  cost_per_unit?: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

interface InventoryViewProps {
  items: InventoryItem[];
  onCreateItem: () => void;
  onItemClick?: (item: InventoryItem) => void;
  onEditItem?: (item: InventoryItem) => void;
  onDeleteItem?: (item: InventoryItem) => void;
  onTransaction?: (item: InventoryItem) => void;
  loading?: boolean;
}

const InventoryView: React.FC<InventoryViewProps> = ({ 
  items, 
  onCreateItem,
  onItemClick,
  onEditItem,
  onDeleteItem,
  onTransaction,
  loading = false 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Get unique categories and calculate status
  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));
  
  const getItemStatus = (item: InventoryItem): string => {
    if (item.expiry_date) {
      const expiry = new Date(item.expiry_date);
      const today = new Date();
      if (expiry < today) return 'expired';
      const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) return 'expiring_soon';
    }
    if (item.min_quantity !== undefined && item.quantity <= item.min_quantity) {
      return 'low_stock';
    }
    if (item.quantity === 0) return 'out_of_stock';
    return 'in_stock';
  };

  // Filter and sort items
  const filteredItems = items
    .map(item => ({ ...item, status: getItemStatus(item) }))
    .filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quantity':
          return a.quantity - b.quantity;
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'out_of_stock':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'expired':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'expiring_soon':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      case 'expired':
        return 'Expired';
      case 'expiring_soon':
        return 'Expiring Soon';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No expiry';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  const isExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <button
            onClick={onCreateItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Name</option>
            <option value="quantity">Quantity</option>
            <option value="category">Category</option>
            <option value="status">Status</option>
          </select>

          {/* View Toggle */}
          <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              title="Grid view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Items Display */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Inventory Alerts */}
        <InventoryAlertsView items={items} />

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first inventory item'}
            </p>
            {!searchQuery && categoryFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={onCreateItem}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                    {item.category && (
                      <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                    )}
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(item.status || 'in_stock')}`}>
                    {getStatusLabel(item.status || 'in_stock')}
                  </span>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                )}

                {/* Quantity */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Quantity</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {item.quantity} {item.unit || ''}
                    </span>
                  </div>
                  {item.min_quantity !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.quantity <= item.min_quantity ? 'bg-red-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(100, (item.quantity / (item.min_quantity * 2)) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-sm">
                  {item.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                  {item.expiry_date && (
                    <div className={`flex items-center gap-2 ${
                      isExpiringSoon(item.expiry_date) ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(item.expiry_date)}</span>
                      {isExpiringSoon(item.expiry_date) && (
                        <ExclamationTriangleIcon className="w-4 h-4" />
                      )}
                    </div>
                  )}
                  {item.supplier && (
                    <div className="text-gray-600">
                      <span className="font-medium">Supplier:</span> {item.supplier}
                    </div>
                  )}
                  {item.cost_per_unit && (
                    <div className="text-gray-600">
                      <span className="font-medium">Cost:</span> ${item.cost_per_unit.toFixed(2)}/{item.unit || 'unit'}
                    </div>
                  )}
                </div>

                {/* Transaction Button */}
                {onTransaction && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransaction(item);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ArrowRightLeftIcon className="w-4 h-4" />
                      Transaction
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      {item.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(item.status || 'in_stock')}`}>
                        {getStatusLabel(item.status || 'in_stock')}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Qty:</span>
                        <span className="text-gray-900">{item.quantity} {item.unit || ''}</span>
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      {item.expiry_date && (
                        <div className={`flex items-center gap-1 ${
                          isExpiringSoon(item.expiry_date) ? 'text-orange-600' : ''
                        }`}>
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(item.expiry_date)}</span>
                        </div>
                      )}
                      {item.supplier && (
                        <div>
                          <span className="font-medium">Supplier:</span> {item.supplier}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onTransaction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransaction(item);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <ArrowRightLeftIcon className="w-4 h-4" />
                        Transaction
                      </button>
                    )}
                  </div>
                  {item.min_quantity !== undefined && (
                    <div className="ml-4 w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.quantity <= item.min_quantity ? 'bg-red-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(100, (item.quantity / (item.min_quantity * 2)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryView;

