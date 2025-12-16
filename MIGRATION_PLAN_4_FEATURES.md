# Migration Plan: 4 Features to Lab Workspace

## Overview
Migrating 4 critical features from Lab Management to Lab Workspace:
1. Inventory Transactions (In/Out/Transfer tracking)
2. Inventory Alerts (Low stock warnings, expiry alerts)
3. Instrument Roster (User roster management)
4. Instrument Alerts (Maintenance due alerts)

## Feature 1: Inventory Transactions

### Components to Create
- `components/InventoryTransactionView.tsx` - Display transaction history
- `components/InventoryTransactionForm.tsx` - Form for In/Out/Transfer operations

### Integration Points
- Add to Inventory tab in Lab Workspace
- Show transaction history below inventory items
- Add "Transaction" button to inventory item cards

### API Endpoints (Verify)
- `POST /api/inventory/:id/transactions` - Create transaction (exists)
- `GET /api/inventory/:id/transactions` - Get transaction history (need to verify)

### Database
- Check if `inventory_transactions` table exists
- If not, may need to log transactions differently

---

## Feature 2: Inventory Alerts

### Components to Create
- `components/InventoryAlertsView.tsx` - Display alerts with acknowledge functionality

### Integration Points
- Add alerts section at top of Inventory tab
- Show unacknowledged alerts prominently
- Filter alerts by severity (low stock, expired, etc.)

### API Endpoints (Verify)
- `GET /api/inventory/alerts` - Get alerts (need to verify)
- `POST /api/inventory/alerts/:id/acknowledge` - Acknowledge alert (exists in code)

### Database
- Check if `inventory_alerts` table exists
- May need to generate alerts dynamically from inventory items

---

## Feature 3: Instrument Roster

### Components to Create
- `components/InstrumentRosterView.tsx` - Display roster members for an instrument
- `components/InstrumentRosterForm.tsx` - Form to add users to roster

### Integration Points
- Add "Roster" button to instrument cards
- Show roster in instrument detail view
- Manage user permissions and training levels

### API Endpoints (Verify)
- `POST /api/instruments/:id/roster` - Add to roster (exists)
- `GET /api/instruments/:id/roster` - Get roster (need to verify)
- `DELETE /api/instruments/:id/roster/:userId` - Remove from roster (need to verify)

### Database
- `instrument_rosters` table should exist

---

## Feature 4: Instrument Alerts

### Components to Create
- `components/InstrumentAlertsView.tsx` - Display maintenance due alerts

### Integration Points
- Add alerts section at top of Instruments tab
- Show unacknowledged alerts prominently
- Link alerts to maintenance scheduling

### API Endpoints (Verify)
- `GET /api/instruments/alerts` - Get alerts (need to verify)
- `POST /api/instruments/alerts/:id/acknowledge` - Acknowledge alert (need to verify)

### Database
- Check if `instrument_alerts` table exists
- May need to generate alerts from maintenance records

---

## Implementation Order

1. **Inventory Transactions** (Day 1)
   - Create transaction form
   - Create transaction view
   - Integrate into Inventory tab
   - Test In/Out/Transfer operations

2. **Inventory Alerts** (Day 1)
   - Create alerts view
   - Integrate into Inventory tab
   - Test alert generation and acknowledgment

3. **Instrument Roster** (Day 2)
   - Create roster view
   - Create roster form
   - Integrate into Instruments tab
   - Test add/remove roster members

4. **Instrument Alerts** (Day 2)
   - Create alerts view
   - Integrate into Instruments tab
   - Test alert generation and acknowledgment

---

## UI/UX Design

### Inventory Tab Enhancements
```
Inventory Tab
├── Inventory Alerts (top section)
│   ├── Low Stock Alerts
│   ├── Expiry Alerts
│   └── Acknowledge buttons
├── Inventory Items (existing)
│   └── Transaction button on each item
└── Transaction History (new section)
    ├── Recent transactions
    └── Transaction form modal
```

### Instruments Tab Enhancements
```
Instruments Tab
├── Instrument Alerts (top section)
│   ├── Maintenance Due Alerts
│   └── Acknowledge buttons
├── Instruments (existing)
│   └── Roster button on each instrument
└── Instrument Roster (new section)
    ├── Roster members list
    └── Add to roster form
```

---

## Testing Checklist

- [ ] Inventory transactions: In/Out/Transfer work correctly
- [ ] Inventory alerts: Low stock and expiry alerts display
- [ ] Inventory alerts: Acknowledge functionality works
- [ ] Instrument roster: Add/remove users works
- [ ] Instrument roster: Training levels and permissions work
- [ ] Instrument alerts: Maintenance due alerts display
- [ ] Instrument alerts: Acknowledge functionality works
- [ ] All features integrate seamlessly with existing Lab Workspace UI
- [ ] All API calls work correctly
- [ ] Error handling works for all operations

---

## Files to Create/Modify

### New Components
- `components/InventoryTransactionView.tsx`
- `components/InventoryTransactionForm.tsx`
- `components/InventoryAlertsView.tsx`
- `components/InstrumentRosterView.tsx`
- `components/InstrumentRosterForm.tsx`
- `components/InstrumentAlertsView.tsx`

### Modified Files
- `pages/LabWorkspacePage.tsx` - Add state and handlers for new features
- `components/InventoryView.tsx` - Add transaction and alerts sections
- `components/InstrumentsView.tsx` - Add roster and alerts sections

### API Verification
- Check `server/index.ts` for existing endpoints
- Add missing endpoints if needed


