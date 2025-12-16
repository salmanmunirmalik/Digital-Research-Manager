# API Task Assignment System

## Overview

This system allows users to **control which APIs handle which tasks**, making the AI Research Agent flexible and user-controlled. Instead of building a complex agent ecosystem, users simply:

1. **Add their own API keys** (OpenAI, Google Gemini, Anthropic Claude, Perplexity, etc.)
2. **Assign tasks to APIs** (e.g., OpenAI → content writing, Google Gemini → research)
3. **AI Research Agent routes automatically** based on user's configuration

## Why This Approach is Better ✅

### **User Benefits:**
- ✅ **Full Control** - Users decide which API handles which task
- ✅ **Cost Control** - Users use their own API keys (no platform costs)
- ✅ **Flexibility** - Easy to add new APIs or change assignments
- ✅ **Privacy** - Users' API keys stay encrypted and private
- ✅ **Customization** - Different APIs for different tasks

### **Platform Benefits:**
- ✅ **Zero AI Costs** - Platform doesn't pay for API usage
- ✅ **Simpler Architecture** - No complex agent ecosystem to maintain
- ✅ **Future-Proof** - New APIs just need to be added to config
- ✅ **Scalable** - No API cost bottleneck
- ✅ **Less Code** - Simpler routing logic

## Architecture

### **Database Schema**

```sql
-- API Task Assignments Table
CREATE TABLE api_task_assignments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    api_key_id UUID REFERENCES ai_provider_keys(id),
    task_type VARCHAR(100) NOT NULL,  -- 'paper_finding', 'content_writing', etc.
    task_name VARCHAR(200) NOT NULL,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);
```

### **Available Task Types**

- `paper_finding` - Find Research Papers
- `abstract_writing` - Write Abstracts
- `content_writing` - General Content Writing
- `idea_generation` - Generate Ideas
- `proposal_writing` - Write Proposals
- `data_analysis` - Data Analysis
- `image_creation` - Create Images
- `paper_generation` - Generate Papers
- `presentation_generation` - Generate Presentations
- `code_generation` - Generate Code
- `translation` - Translation
- `summarization` - Summarization

## How It Works

### **1. User Adds API Key**
```
User → Settings → API Management → Add API Key
- Select Provider (OpenAI, Google Gemini, etc.)
- Enter API Key
- Save (encrypted)
```

### **2. User Assigns Tasks**
```
User → Settings → API Task Assignments
- Select API (from their configured APIs)
- Select Task Type (paper_finding, content_writing, etc.)
- Set Priority (if multiple APIs for same task)
- Save
```

### **3. AI Research Agent Routes**
```
User Query → Task Analysis → Find User's API Assignment → Call API → Return Response
```

## API Endpoints

### **Task Management**
- `GET /api/api-task-assignments/tasks` - Get all available task types
- `GET /api/api-task-assignments/assignments` - Get user's task assignments
- `GET /api/api-task-assignments/api-keys` - Get user's API keys (for dropdown)
- `POST /api/api-task-assignments/assignments` - Create task assignment
- `PUT /api/api-task-assignments/assignments/:id` - Update task assignment
- `DELETE /api/api-task-assignments/assignments/:id` - Delete task assignment

### **AI Research Agent**
- `POST /api/ai-research-agent/chat` - Main chat endpoint (routes to user's APIs)

## Example Flow

### **User Setup:**
1. User adds OpenAI API key
2. User assigns: `content_writing` → OpenAI
3. User adds Google Gemini API key
4. User assigns: `paper_finding` → Google Gemini

### **User Query:**
```
User: "Find papers on CRISPR"
```

### **System Processing:**
1. **Task Analysis:** Detects `paper_finding` task
2. **Find Assignment:** Looks up user's assignment → Google Gemini
3. **Call API:** Calls Google Gemini with query
4. **Return Response:** Returns results to user

## Supported APIs

Currently supported:
- ✅ OpenAI (GPT-4)
- ✅ Google Gemini
- ✅ Anthropic Claude
- ✅ Perplexity AI

Easy to add more by:
1. Adding provider config to `ai_provider_configs` table
2. Adding API call function in `aiResearchAgent.ts`

## UI Components Needed

1. **API Management Page** (already exists in Settings)
   - Add/Edit/Delete API keys
   - View API keys

2. **Task Assignment Interface** (NEW)
   - List of user's APIs
   - List of available tasks
   - Drag-and-drop or select interface
   - Priority settings
   - Active/Inactive toggle

## Benefits Over Complex Agent Ecosystem

| Complex Agent System | Simple API Assignment System |
|---------------------|------------------------------|
| Platform pays API costs | Users pay their own costs |
| Complex codebase | Simple routing logic |
| Hard to add new providers | Easy to add new APIs |
| Fixed provider selection | User-controlled selection |
| Maintenance burden | Minimal maintenance |
| Less flexible | Highly flexible |

## Next Steps

1. ✅ Database schema created
2. ✅ Backend API routes created
3. ✅ AI Research Agent updated to use assignments
4. ⏳ UI component for task assignments
5. ⏳ Integration with Settings page
6. ⏳ Testing and documentation

## Conclusion

This approach is **much better** because:
- Users have full control
- Platform has zero AI costs
- Simpler to maintain
- More flexible
- Future-proof

The AI Research Agent becomes a **smart router** that uses user-configured APIs instead of a complex ecosystem.

