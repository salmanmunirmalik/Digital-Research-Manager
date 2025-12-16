# Lab Workspace Seed Data

This seed script adds dummy data to all Lab Workspace tabs for testing and demonstration.

## What Gets Seeded

### 👥 Teams Tab
- Adds team members with various roles (Principal Researcher, Co-Supervisor, Researcher, Student)
- Ensures at least 5 team members exist

### 📁 Projects Tab
- 5 research projects with different statuses:
  - CRISPR Gene Editing Optimization (active)
  - Protein Expression Analysis (active)
  - Cell Culture Protocol Standardization (in_progress)
  - Antibody Development Pipeline (completed)
  - Lab Equipment Maintenance Schedule (active)

### 📦 Inventory Tab
- 8 inventory items including:
  - PCR Tubes
  - DMEM Medium
  - Trypsin-EDTA Solution
  - Agarose Powder
  - Ethidium Bromide
  - Pipette Tips
  - FBS (Fetal Bovine Serum)
  - Tris-HCl Buffer

### 🔬 Instruments Tab
- 6 instruments:
  - Thermal Cycler Pro
  - Centrifuge Ultra
  - Fluorescence Microscope
  - Cell Culture Incubator
  - Gel Documentation System
  - Autoclave Sterilizer
- 2 instrument bookings (upcoming)
- 2 maintenance records (scheduled)

### ✅ Tasks Tab
- 7 workspace tasks with various statuses:
  - Prepare PCR reaction mix (to_do)
  - Review protein expression data (in_progress)
  - Update cell culture protocol (in_review)
  - Order FBS (to_do)
  - Calibrate thermal cycler (to_do)
  - Prepare presentation (in_progress)
  - Complete antibody screening (done)

## How to Run

### Option 1: Using npm script
```bash
pnpm run db:seed:workspace
```

### Option 2: Direct execution
```bash
tsx database/seed-lab-workspace.ts
```

## Prerequisites

1. Database must be running and accessible
2. At least one lab must exist in the database
3. At least one user must exist (will be used as principal researcher)
4. Environment variables must be set:
   - `DB_HOST` (default: 127.0.0.1)
   - `DB_PORT` (default: 5432)
   - `DB_NAME` (default: digital_research_manager)
   - `DB_USER` (default: postgres)
   - `DB_PASSWORD` (required if database has password)

## Notes

- The script uses `ON CONFLICT DO NOTHING` to avoid duplicates
- It will create workspace, space, and list if they don't exist
- All dates are relative to the current date
- The script is idempotent - safe to run multiple times

## Troubleshooting

If you get a password error:
1. Check your `.env` file has `DB_PASSWORD` set
2. If your database doesn't require a password, ensure `DB_PASSWORD` is set to an empty string: `DB_PASSWORD=""`
3. Or use `DATABASE_URL` connection string instead

If you get "No lab found" error:
1. Run the main seed script first: `pnpm run db:seed`
2. Or manually create a lab in the database


