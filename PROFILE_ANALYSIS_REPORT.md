# User Profile & Publications Analysis

## Current Profile Structure

### 1. **Settings Page** (`/settings` or `/profile`)
**Location:** `pages/SettingsPage.tsx`

**Profile Tab Fields:**
- ✅ First Name
- ✅ Last Name
- ✅ Phone
- ✅ Department
- ✅ Specialization
- ✅ Bio
- ✅ Location
- ✅ Timezone

**Additional Tabs:**
- Notifications settings
- Privacy settings
- Security settings
- API Keys management
- Data management

**Status:** ✅ Basic profile fields exist

---

### 2. **Scientist Passport** (`/scientist-passport`)
**Location:** `pages/ScientistPassportPage.tsx`

**Purpose:** Gamified scientific reputation (NOT personal profile)

**Features:**
- Overall Scientific Reputation Score
- Badge System
- Contribution Categories
- Community Impact Metrics
- Achievement Unlock System
- Peer Validation & Endorsements

**Status:** ✅ Separate from profile - focuses on scientific contributions

---

### 3. **Research Assistant - Paper Library** (`/research-assistant`)
**Location:** `pages/ResearchAssistantPage.tsx` (Literature & Papers tab)

**Features:**
- ✅ Add papers manually
- ✅ Import from ORCID
- ✅ Fetch by DOI/PMID/arXiv ID
- ✅ Save papers (full or summary)
- ✅ Organize with folders & tags
- ✅ Personal notes
- ✅ Reading status tracking

**Status:** ✅ Personal paper library exists

---

### 4. **Researcher Portfolio Service** (Backend)
**Location:** `services/researcherPortfolioService.ts` & `database/researcher_portfolio_schema.sql`

**Publication Management:**
```typescript
interface Publication {
  title: string;
  abstract?: string;
  authors: string[];
  journal?: string;
  publication_date?: string;
  doi?: string;
  arxiv_id?: string;
  pdf_url?: string;
  keywords: string[];
  research_domains: string[];
  citation_count: number;
  impact_factor?: number;
  ai_summary?: string;
  ai_keywords?: string[];
  ai_research_areas?: string[];
}
```

**Researcher Profile Extensions:**
```typescript
interface ResearcherProfile {
  institution?: string;
  department?: string;
  position?: string;
  research_interests: string[];
  expertise_areas: string[];
  research_domains: string[];
  years_of_experience?: number;
  h_index: number;
  total_citations: number;
  total_publications: number;
  current_projects: string[];
  previous_institutions: string[];
  awards: string[];
  grants: string[];
  languages: string[];
  availability_status: string;
  max_students: number;
  current_students: number;
  collaboration_preferences?: string;
  research_philosophy?: string;
  mentorship_style?: string;
  lab_website?: string;
  orcid_id?: string;
  google_scholar_id?: string;
  researchgate_id?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  ai_generated_bio?: string;
  ai_research_strengths?: string[];
  ai_collaboration_style?: string;
}
```

**Status:** ✅ Database schema exists, service exists, but NO frontend UI connected

---

## Gap Analysis

### ✅ What EXISTS:
1. **Basic Profile** (Settings page)
   - Personal info (name, phone, department, bio, location)
   - Limited to basic account settings

2. **Paper Library** (Research Assistant)
   - Personal paper collection
   - ORCID import
   - Organization features

3. **Backend Infrastructure**
   - `researcher_profiles` table
   - `researcher_publications` table
   - Full portfolio service with AI analysis
   - Publication management API

### ❌ What's MISSING:

1. **No Comprehensive Profile Page**
   - No single page to manage all profile information
   - No UI to add publications directly to profile
   - No connection between paper library and researcher profile
   - No display of researcher profile publicly

2. **No Publications Integration**
   - Papers in library are NOT linked to researcher profile
   - No way to add publications to profile from Settings
   - No display of publications on profile

3. **No Profile Features**
   - Research interests not editable in Settings
   - No awards/grants section
   - No ORCID integration in profile
   - No academic social links (Google Scholar, ResearchGate, etc.)
   - No research philosophy/mentorship style
   - No current projects section

---

## Recommendations

### Option 1: Enhance Settings Page
Add a "Publications" tab to Settings page to manage publications

### Option 2: Create Dedicated Profile Page
Create a new `/profile` page that includes:
- Personal information
- Publications section
- Research interests
- Awards & grants
- Social links
- Public profile view

### Option 3: Connect Paper Library to Profile
Add functionality to:
- Import papers from library to profile
- Display publications on profile
- Auto-populate researcher profile from publications

### Recommended Approach: **Option 2** (Create Dedicated Profile Page)

**Why:**
- Settings page is for account management
- Profile page is for showcasing researcher identity
- Separates concerns (settings vs. profile)
- Allows public profile view
- Better user experience

**Implementation:**
1. Create new `ProfilePage.tsx`
2. Add tabs: Overview, Publications, Research Interests, Awards & Grants
3. Connect to `researcherPortfolioService`
4. Link with Paper Library
5. Add ORCID import for publications
6. Display public profile view

---

## Summary

**Current State:**
- ✅ Basic profile exists in Settings
- ✅ Paper library exists
- ✅ Backend infrastructure exists
- ❌ No comprehensive profile page
- ❌ No publications integration
- ❌ No public profile view

**Action Needed:**
Create a dedicated Profile page that combines personal information, publications, research interests, and other academic details in one place.

