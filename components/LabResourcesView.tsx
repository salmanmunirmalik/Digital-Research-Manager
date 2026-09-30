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
  CubeIcon,
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
  hideCreateMenu?: boolean;
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
  hideCreateMenu = false,
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
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[12rem] max-w-md">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, location, model…"
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: 'all' as const, label: 'All', count: resources.length },
                { id: 'attention' as const, label: 'Attention', count: attentionCount },
                { id: 'consumables' as const, label: 'Consumables', count: inventory.length },
                { id: 'equipment' as const, label: 'Equipment', count: instruments.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFocus(tab.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  focus === tab.id
                    ? 'bg-slate-900 text-white'
                    : tab.id === 'attention' && attentionCount > 0
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.id === 'attention' && attentionCount > 0 && focus !== tab.id && (
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                )}
                {tab.label}
                <span
                  className={`tabular-nums text-[11px] ${
                    focus === tab.id ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          {!hideCreateMenu && (
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setCreateMenuOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800"
              >
                <PlusIcon className="w-4 h-4" />
                Add
              </button>
              {createMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label="Close menu"
                    onClick={() => setCreateMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 z-20 w-52 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-1 overflow-hidden">
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-sky-50 flex items-center gap-2"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        onCreateConsumable();
                      }}
                    >
                      <PackageIcon className="w-4 h-4 text-emerald-600" />
                      Consumable / stock
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-sky-50 flex items-center gap-2"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        onCreateEquipment();
                      }}
                    >
                      <WrenchScrewdriverIcon className="w-4 h-4 text-sky-600" />
                      Instrument / equipment
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[18rem] text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-200/60 flex items-center justify-center mb-4">
              <CubeIcon className="w-6 h-6" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">No resources match</h3>
            <p className="text-[13px] text-slate-500 max-w-sm mb-5">
              Add consumables and instruments to track stock levels, bookings, and maintenance.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={onCreateConsumable}
                className="px-3.5 py-2 text-[13px] font-medium bg-white border border-sky-200 text-sky-900 rounded-md hover:bg-sky-50"
              >
                Add consumable
              </button>
              <button
                type="button"
                onClick={onCreateEquipment}
                className="px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800"
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
                    r.kind === 'consumable' && onTransaction ? () => onTransaction(r) : undefined
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
      className={`group bg-white border rounded-xl px-4 py-3.5 transition-all hover:shadow-sm hover:shadow-sky-100/40 ${
        resource.attention
          ? 'border-amber-200/90 bg-amber-50/20'
          : 'border-slate-200/80 hover:border-sky-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isConsumable ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
          }`}
        >
          {isConsumable ? (
            <PackageIcon className="w-4 h-4" />
          ) : (
            <WrenchScrewdriverIcon className="w-4 h-4" />
          )}
        </div>

        <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-medium text-slate-900">{resource.name}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
              {isConsumable ? 'Consumable' : 'Equipment'}
            </span>
            {resource.attention && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
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
                Exp{' '}
                {new Date(resource.expiry_date).toLocaleDateString(undefined, {
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
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-900 rounded-md transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

export default LabResourcesView;
