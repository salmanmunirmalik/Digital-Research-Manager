import React, { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PackageIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  ArrowRightLeftIcon,
  CalendarIcon,
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
} from './icons';

export interface LabInventoryItem {
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
}

export interface LabInstrument {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  category?: string;
  location?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_order' | 'reserved';
  description?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  usage_hours?: number;
  total_bookings?: number;
}

type FocusFilter = 'all' | 'attention' | 'consumables' | 'equipment';

type UnifiedResource =
  | ({ kind: 'consumable'; attention: string | null; stockStatus: string } & LabInventoryItem)
  | ({ kind: 'equipment'; attention: string | null } & LabInstrument);

interface LabResourcesViewProps {
  inventory: LabInventoryItem[];
  instruments: LabInstrument[];
  onCreateConsumable: () => void;
  onCreateEquipment: () => void;
  onConsumableClick?: (item: LabInventoryItem) => void;
  onEquipmentClick?: (item: LabInstrument) => void;
  onTransaction?: (item: LabInventoryItem) => void;
  onBookInstrument?: (instrument: LabInstrument) => void;
  onScheduleMaintenance?: (instrument: LabInstrument) => void;
  onViewRoster?: (instrument: LabInstrument) => void;
  loading?: boolean;
}

function consumableAttention(item: LabInventoryItem): { attention: string | null; stockStatus: string } {
  if (item.expiry_date) {
    const expiry = new Date(item.expiry_date);
    const today = new Date();
    if (expiry < today) return { attention: 'Expired', stockStatus: 'expired' };
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 30) return { attention: `Expires in ${days}d`, stockStatus: 'expiring_soon' };
  }
  if (item.quantity === 0) return { attention: 'Out of stock', stockStatus: 'out_of_stock' };
  if (item.min_quantity !== undefined && item.quantity <= item.min_quantity) {
    return { attention: 'Low stock', stockStatus: 'low_stock' };
  }
  return { attention: null, stockStatus: 'in_stock' };
}

function equipmentAttention(item: LabInstrument): string | null {
  if (item.status === 'out_of_order') return 'Out of order';
  if (item.status === 'maintenance') return 'In maintenance';
  if (item.next_maintenance) {
    const next = new Date(item.next_maintenance);
    const today = new Date();
    const days = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Calibration overdue';
    if (days <= 14) return `Cal due in ${days}d`;
  }
  return null;
}

const LabResourcesView: React.FC<LabResourcesViewProps> = ({
  inventory,
  instruments,
  onCreateConsumable,
  onCreateEquipment,
  onConsumableClick,
  onEquipmentClick,
  onTransaction,
  onBookInstrument,
  onScheduleMaintenance,
  onViewRoster,
  loading = false,
}) => {
  const [focus, setFocus] = useState<FocusFilter>('all');
  const [search, setSearch] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const resources = useMemo<UnifiedResource[]>(() => {
    const consumables: UnifiedResource[] = inventory.map((item) => {
      const { attention, stockStatus } = consumableAttention(item);
      return { ...item, kind: 'consumable' as const, attention, stockStatus };
    });
    const equipment: UnifiedResource[] = instruments.map((item) => ({
      ...item,
      kind: 'equipment' as const,
      attention: equipmentAttention(item),
    }));
    return [...consumables, ...equipment];
  }, [inventory, instruments]);

  const attentionCount = resources.filter((r) => r.attention).length;

  const filtered = useMemo(() => {
    return resources
      .filter((r) => {
        if (focus === 'attention') return !!r.attention;
        if (focus === 'consumables') return r.kind === 'consumable';
        if (focus === 'equipment') return r.kind === 'equipment';
        return true;
      })
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const hay = [
          r.name,
          r.description,
          r.category,
          r.location,
          r.kind === 'equipment' ? r.model : undefined,
          r.kind === 'equipment' ? r.manufacturer : undefined,
          r.kind === 'consumable' ? r.supplier : undefined,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        if (a.attention && !b.attention) return -1;
        if (!a.attention && b.attention) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [resources, focus, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Lab resources</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Consumables and instruments in one place - stock, bookings, and what needs attention.
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCreateMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
            >
              <PlusIcon className="w-4 h-4" />
              Add resource
            </button>
            {createMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close menu"
                  onClick={() => setCreateMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 z-20 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 overflow-hidden">
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-slate-50 flex items-center gap-2"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      onCreateConsumable();
                    }}
                  >
                    <PackageIcon className="w-4 h-4 text-slate-500" />
                    Consumable / stock
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-slate-50 flex items-center gap-2"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      onCreateEquipment();
                    }}
                  >
                    <WrenchScrewdriverIcon className="w-4 h-4 text-slate-500" />
                    Instrument / equipment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location, category, model…"
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all' as const, label: `All (${resources.length})` },
              {
                id: 'attention' as const,
                label: `Needs attention (${attentionCount})`,
                warn: attentionCount > 0,
              },
              { id: 'consumables' as const, label: `Consumables (${inventory.length})` },
              { id: 'equipment' as const, label: `Equipment (${instruments.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFocus(tab.id)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-full transition-colors ${
                focus === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } ${'warn' in tab && tab.warn && focus !== tab.id ? 'text-amber-800 bg-amber-50' : ''}`}
            >
              {tab.id === 'attention' && attentionCount > 0 && focus !== tab.id && (
                <ExclamationTriangleIcon className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] font-medium text-slate-800 mb-1">No resources match</p>
            <p className="text-[13px] text-slate-500 mb-4">
              Add consumables or instruments to build your lab resource map.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={onCreateConsumable}
                className="px-3 py-2 text-[13px] font-medium bg-white border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Add consumable
              </button>
              <button
                type="button"
                onClick={onCreateEquipment}
                className="px-3 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                Add instrument
              </button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2 max-w-4xl mx-auto">
            {filtered.map((r) => (
              <li key={`${r.kind}-${r.id}`}>
                <ResourceRow
                  resource={r}
                  onOpen={() => {
                    if (r.kind === 'consumable') onConsumableClick?.(r);
                    else onEquipmentClick?.(r);
                  }}
                  onTransaction={
                    r.kind === 'consumable' && onTransaction
                      ? () => onTransaction(r)
                      : undefined
                  }
                  onBook={
                    r.kind === 'equipment' && onBookInstrument
                      ? () => onBookInstrument(r)
                      : undefined
                  }
                  onMaintain={
                    r.kind === 'equipment' && onScheduleMaintenance
                      ? () => onScheduleMaintenance(r)
                      : undefined
                  }
                  onRoster={
                    r.kind === 'equipment' && onViewRoster ? () => onViewRoster(r) : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

function ResourceRow({
  resource,
  onOpen,
  onTransaction,
  onBook,
  onMaintain,
  onRoster,
}: {
  resource: UnifiedResource;
  onOpen: () => void;
  onTransaction?: () => void;
  onBook?: () => void;
  onMaintain?: () => void;
  onRoster?: () => void;
}) {
  const isConsumable = resource.kind === 'consumable';

  return (
    <div
      className={`group bg-white border rounded-xl px-4 py-3.5 transition-colors hover:border-slate-300 ${
        resource.attention ? 'border-amber-200/80 bg-amber-50/30' : 'border-slate-200/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isConsumable ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
          }`}
        >
          {isConsumable ? (
            <PackageIcon className="w-4.5 h-4.5 w-4 h-4" />
          ) : (
            <WrenchScrewdriverIcon className="w-4 h-4" />
          )}
        </div>

        <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-medium text-slate-900">{resource.name}</span>
            <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
              {isConsumable ? 'Consumable' : 'Equipment'}
            </span>
            {resource.attention && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                <ExclamationTriangleIcon className="w-3 h-3" />
                {resource.attention}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-slate-500">
            {resource.category ? <span>{resource.category}</span> : null}
            {resource.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="w-3 h-3" />
                {resource.location}
              </span>
            ) : null}
            {isConsumable ? (
              <span>
                {resource.quantity}
                {resource.unit ? ` ${resource.unit}` : ''} on hand
              </span>
            ) : null}
            {!isConsumable ? (
              <>
                <span className="capitalize">{resource.status.replace(/_/g, ' ')}</span>
                {resource.model ? <span>{resource.model}</span> : null}
                {resource.next_maintenance ? (
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Next service{' '}
                    {new Date(resource.next_maintenance).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                ) : null}
              </>
            ) : null}
            {isConsumable && resource.expiry_date ? (
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                Exp {new Date(resource.expiry_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            ) : null}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {isConsumable && onTransaction ? (
            <ActionChip icon={<ArrowRightLeftIcon className="w-3.5 h-3.5" />} label="Stock" onClick={onTransaction} />
          ) : null}
          {!isConsumable && onBook ? (
            <ActionChip icon={<BookOpenIcon className="w-3.5 h-3.5" />} label="Book" onClick={onBook} />
          ) : null}
          {!isConsumable && onMaintain ? (
            <ActionChip icon={<WrenchScrewdriverIcon className="w-3.5 h-3.5" />} label="Service" onClick={onMaintain} />
          ) : null}
          {!isConsumable && onRoster ? (
            <ActionChip icon={<UsersIcon className="w-3.5 h-3.5" />} label="Roster" onClick={onRoster} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ActionChip({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
    >
      {icon}
      {label}
    </button>
  );
}

export default LabResourcesView;
