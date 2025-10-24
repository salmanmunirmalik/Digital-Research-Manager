# Communication Ecosystem Analysis & Proposal

## Current Communication Infrastructure

### Existing Communication Systems

#### 1. **Team Messaging** (Slack-like)
- **Channels**: Public, private, direct messages
- **Features**: Threading, reactions, @mentions, file attachments
- **Scope**: Lab members
- **Status**: ✅ Fully implemented

#### 2. **User Connections** (LinkedIn-style)
- **Connection Types**: Professional, academic, industry, personal
- **Status**: Pending, accepted, declined, blocked
- **Features**: Connection requests, mutual confirmation
- **Context**: Relationship context ("Worked together at Google")

#### 3. **User Follows** (Twitter-style)
- **Types**: General, research updates, publications only
- **Features**: One-way following, notifications
- **Status**: Active, muted, blocked

#### 4. **Profile Sharing**
- **Types**: Public, password-protected, time-limited, one-time
- **Features**: Share tokens, view tracking, custom permissions

#### 5. **Reference Requests**
- **Features**: Request references from peers
- **Context**: Skills, research context
- **Status**: Pending, accepted, declined

#### 6. **Notifications System**
- **Types**: Email, push, SMS
- **Triggers**: Various events (connections, messages, updates)

## User Hierarchy & Relationships

### User Roles:
- **Admin** - System administrators
- **Principal Researcher** - Lab PIs
- **Co-Supervisor** - Co-PIs
- **Researcher** - Postdocs, professionals
- **Student** - PhD, Masters, Undergrad

### Organizational Structure:
- **Labs** → Lab Members → Projects → Project Members
- **Hierarchy**: PI → Co-PI → PostDoc → PhD → Masters → RA → Undergrad

## Communication Requirements Analysis

### Based on User Type:

#### **Lab Members (Internal)**
- ✅ Team Messaging (Slack-like channels)
- ✅ Direct Messages
- ✅ Lab Announcements
- ✅ Project Updates
- ✅ Equipment/Resource Coordination

#### **Network Connections (External)**
- ✅ Connection Requests
- ✅ Follow System
- ✅ Profile Sharing
- ✅ Reference Requests
- ✅ Collaboration Opportunities

#### **Lab-to-Lab**
- ⚠️ Lab Follows
- ⚠️ Lab Announcements
- ⚠️ Cross-Lab Collaboration

#### **Event-Based**
- ⚠️ Conference Networking
- ⚠️ Workshop Interactions
- ⚠️ Research Exchange Communication

## Proposed Communication Ecosystem

### Centralized Communication Hub

Create a unified communication center that consolidates all communication types:

```
┌─────────────────────────────────────────────────────────┐
│           COMMUNICATION HUB (Dashboard)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Messages   │  │ Connections│  │  Events    │        │
│  │   (Lab)    │  │ (Network)  │  │ (External) │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Discussions│  │ Notifications│ │ References │        │
│  │  (Forum)   │  │  (All)     │  │ (Professional)│    │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Communication Types by Scope:

#### **1. Lab Communications (Internal)**
- **Team Messaging**: Channels, DMs, threads
- **Lab Announcements**: Important updates
- **Project Updates**: Progress sharing
- **Equipment Coordination**: Booking, issues
- **Protocol Discussions**: Lab-specific protocols

#### **2. Network Communications (External)**
- **Connection Requests**: Invite to connect
- **Follow Updates**: One-way following
- **Profile Sharing**: Share professional profile
- **Reference Requests**: Request references
- **Collaboration Invites**: Cross-lab collaboration

#### **3. Event Communications**
- **Conference Networking**: Meet at events
- **Workshop Interactions**: Pre/post event
- **Research Exchange**: Program communication
- **Webinar Participation**: Virtual events

#### **4. Public Communications**
- **Help Forum**: Open discussions
- **Research Questions**: Community Q&A
- **Knowledge Sharing**: Public content

## Implementation Proposal

### Create Unified Communication Center

**Location**: Dashboard → Communications Card

**Features**:
1. **Unified Inbox**
   - All messages in one place
   - Filter by type (lab, network, events)
   - Unread badge
   - Quick actions

2. **Communication Types**
   - **Lab Messages**: Team messaging channels
   - **Connections**: Connection requests & updates
   - **Network**: Follow updates & mentions
   - **Events**: Conference & event communications
   - **Discussions**: Help forum participation
   - **References**: Reference requests & responses

3. **Smart Notifications**
   - Priority-based sorting
   - @mentions highlighted
   - Urgent messages flagged
   - Mute/archive options

4. **Communication Actions**
   - Reply
   - Accept/Decline
   - Archive
   - Mark as read
   - Delete

### Enhance Existing Systems

#### **1. Team Messaging**
- ✅ Already implemented
- Add: Cross-lab messaging
- Add: Lab-to-lab channels
- Add: Integration with calendar

#### **2. Connection System**
- ✅ Already implemented
- Add: Bulk connection requests
- Add: Connection suggestions
- Add: Mutual connections display

#### **3. Follow System**
- ✅ Already implemented
- Add: Follow notifications
- Add: Unfollow reasons
- Add: Block/Report

#### **4. Profile Sharing**
- ✅ Already implemented
- Add: Share analytics
- Add: Share expiration
- Add: Share revocation

### New Communication Features

#### **1. Lab-to-Lab Communication**
```sql
CREATE TABLE lab_communications (
    id UUID PRIMARY KEY,
    from_lab_id UUID REFERENCES labs(id),
    to_lab_id UUID REFERENCES labs(id),
    subject VARCHAR(255),
    message TEXT,
    type VARCHAR(50), -- collaboration, equipment_share, protocol_request
    status VARCHAR(20), -- pending, responded, archived
    created_at TIMESTAMP
);
```

#### **2. Event-Based Communication**
```sql
CREATE TABLE event_communications (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES networking_events(id),
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    message TEXT,
    type VARCHAR(50), -- meetup_request, collaboration_offer, follow_up
    status VARCHAR(20),
    created_at TIMESTAMP
);
```

#### **3. Communication Preferences**
```sql
CREATE TABLE communication_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    
    -- Notification preferences
    notification_channels TEXT[], -- ['email', 'in_app', 'push']
    notification_types TEXT[], -- ['message', 'connection', 'mention', 'reference']
    
    -- Communication filters
    allow_lab_messages BOOLEAN DEFAULT true,
    allow_connection_requests BOOLEAN DEFAULT true,
    allow_event_messages BOOLEAN DEFAULT true,
    allow_public_messages BOOLEAN DEFAULT true,
    
    -- Do not disturb
    dnd_enabled BOOLEAN DEFAULT false,
    dnd_start_time TIME,
    dnd_end_time TIME,
    
    -- Auto-responses
    auto_response_enabled BOOLEAN DEFAULT false,
    auto_response_message TEXT,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Communication Flow Design

### 1. **Lab Member → Lab Member**
```
Path: Team Messaging → Channels → Direct Messages
Type: Internal lab communication
Scope: Lab members only
Features: Threading, reactions, @mentions
```

### 2. **Researcher → Researcher (Network)**
```
Path: Connections → Send Message
Type: Professional networking
Scope: Connected users
Features: Connection context, mutual connections
```

### 3. **User → Lab (Join Request)**
```
Path: Networking → Labs → Join Lab
Type: Lab membership request
Scope: Lab admins
Features: Membership approval, role assignment
```

### 4. **User → User (Follow)**
```
Path: Networking → Follow → Updates
Type: One-way following
Scope: Public profiles
Features: Research updates, publications
```

### 5. **User → User (Reference Request)**
```
Path: Scientist Passport → Request Reference
Type: Professional reference
Scope: Connected users
Features: Context, skills, relationship
```

### 6. **Lab → Lab (Collaboration)**
```
Path: Lab Management → Cross-Lab Collaboration
Type: Inter-lab communication
Scope: Lab admins
Features: Project sharing, resource sharing
```

### 7. **User → Community (Forum)**
```
Path: Help Forum → Ask Question
Type: Public discussion
Scope: All users
Features: Open Q&A, knowledge sharing
```

### 8. **Event → Participants**
```
Path: Events & Opportunities → Event Communication
Type: Event-based networking
Scope: Event participants
Features: Meetup requests, collaboration offers
```

## Communication Priority Matrix

### High Priority (Immediate)
- Lab members need instant communication
- Connection requests need quick responses
- Lab announcements need wide visibility

### Medium Priority (Daily)
- Follow updates
- Network messages
- Reference requests

### Low Priority (Weekly)
- Profile shares
- Event communications
- Public forum discussions

## Recommendation: Create Unified Communication Center

### Dashboard Card Enhancement

Replace the "Communications" card to show:

**Card Content**:
- **Unread Messages**: Count of unread messages across all types
- **Recent Activity**: Last 3-5 communications
- **Quick Actions**: 
  - Send Message
  - View Connections
  - Check Forum
  - Review References

### New Page: Communications Hub

**Route**: `/communications`

**Sections**:
1. **Unified Inbox** (All communications)
2. **Lab Messages** (Team messaging)
3. **Network** (Connections & follows)
4. **Events** (Event communications)
5. **Discussions** (Help forum)
6. **References** (Reference requests)

**Features**:
- Filter by type
- Sort by date, priority, unread
- Search across all communications
- Bulk actions
- Archive/Delete

## Benefits of Unified System

✅ **Single Source of Truth**: All communications in one place  
✅ **Better Organization**: Filter by type, priority, status  
✅ **Improved UX**: No switching between pages  
✅ **Smart Notifications**: Context-aware notifications  
✅ **Relationship Context**: See who you're communicating with  
✅ **Communication History**: Track all interactions  
✅ **Analytics**: Understand communication patterns

## Next Steps

1. **Create Communications Hub Page**
2. **Implement Unified Inbox**
3. **Add Communication Filters**
4. **Create Communication API Endpoints**
5. **Add Real-time Updates**
6. **Implement Smart Notifications**

Would you like me to implement this unified communication ecosystem?

