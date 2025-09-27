# Social Networking Ecosystem

A comprehensive social networking system for researchers with profile sharing, connections, follows, and professional networking features.

## 🌟 Features

### **Profile Management & Sharing** 👤

- **Enhanced Profiles**: Rich profiles with bio, research interests, expertise areas, and professional links
- **Profile Sharing**: Create shareable links with customizable permissions and privacy settings
- **Privacy Controls**: Granular privacy settings for profile visibility and contact information
- **Profile Customization**: Cover photos, profile pictures, and professional branding

### **Connection System** 🤝

- **LinkedIn-style Connections**: Mutual professional relationships with context and verification
- **Connection Requests**: Send and manage connection requests with personal messages
- **Relationship Context**: Specify how you know someone (conference, colleague, collaborator, etc.)
- **Connection Strength**: Rate connection quality and relationship depth

### **Follow System** ❤️

- **Twitter-style Following**: One-way following for research updates and activities
- **Follow Types**: General, research updates, or publications-only following
- **Notification Settings**: Customize what notifications you receive from followed users
- **Follower Management**: Manage your followers and following lists

### **Profile Sharing Options** 🔗

- **Public Links**: Share your profile with anyone via a simple link
- **Password Protected**: Secure sharing with password protection
- **Time Limited**: Links that expire after a set time
- **View Limited**: Links that expire after a certain number of views
- **Custom Permissions**: Control what information is visible in shared profiles

### **Social Activities & Feed** 📱

- **Activity Feed**: See updates from your connections and followed users
- **Activity Types**: Publications, connections, profile updates, event participation
- **Engagement**: Like and comment on activities
- **Privacy Controls**: Control who can see your activities

### **Notifications System** 🔔

- **Real-time Notifications**: Get notified of connection requests, follows, and interactions
- **Notification Types**: Connection requests, follows, messages, activity likes, etc.
- **Notification Management**: Mark as read, manage notification preferences
- **Email Integration**: Optional email notifications for important events

### **Search & Discovery** 🔍

- **Advanced Search**: Search users by name, institution, research interests, or expertise
- **Smart Recommendations**: AI-powered suggestions for potential connections
- **Research Interest Matching**: Find researchers with similar interests
- **Institution-based Discovery**: Connect with researchers from your institution

## 🚀 Getting Started

### **Database Setup**

1. Run the database setup script:
```bash
node setup-social-networking.cjs
```

2. This will create the following tables:
   - `user_social_profiles` - Enhanced user profiles
   - `user_connections` - LinkedIn-style connections
   - `user_follows` - Twitter-style follows
   - `profile_shares` - Profile sharing links
   - `profile_share_views` - Share link analytics
   - `networking_events` - Professional events
   - `event_participants` - Event participation
   - `social_activities` - Activity feed
   - `activity_likes` - Activity engagement
   - `activity_comments` - Activity comments
   - `user_notifications` - Notification system
   - `user_blocks` - User blocking
   - `user_privacy_settings` - Privacy controls

### **Integration**

The Social Networking System is integrated into the **Researcher Portfolio** page:

1. Navigate to **Researcher Portfolio** in the main navigation
2. Click on the **Social Network** tab
3. Access all social networking features

## 📊 How It Works

### **1. Profile Management**

Create and customize your professional profile:

```typescript
// Update social profile
const response = await fetch('/api/social/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bio: 'AI researcher passionate about machine learning',
    currentPosition: 'Senior Research Scientist',
    currentInstitution: 'Google Research',
    researchInterests: ['machine_learning', 'computer_vision', 'nlp'],
    expertiseAreas: ['deep_learning', 'neural_networks'],
    websiteUrl: 'https://mywebsite.com',
    linkedinUrl: 'https://linkedin.com/in/myprofile',
    orcidId: '0000-0000-0000-0000',
    profileVisibility: 'public'
  })
});
```

### **2. Connection System**

Send and manage professional connections:

```typescript
// Send connection request
const response = await fetch('/api/social/connections/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiverId: 'user-id',
    connectionType: 'professional',
    relationshipContext: 'Met at ICML 2023',
    requestMessage: 'Hi! I\'d like to connect with you.'
  })
});

// Respond to connection request
const response = await fetch('/api/social/connections/connection-id/respond', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'accepted', // or 'declined'
    responseMessage: 'Great to connect!'
  })
});
```

### **3. Follow System**

Follow researchers for updates:

```typescript
// Follow user
const response = await fetch('/api/social/follow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    followingId: 'user-id',
    followType: 'general' // or 'research_updates', 'publications_only'
  })
});

// Unfollow user
const response = await fetch('/api/social/follow/user-id', {
  method: 'DELETE'
});
```

### **4. Profile Sharing**

Create shareable profile links:

```typescript
// Create profile share link
const response = await fetch('/api/social/profile/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shareType: 'password_protected', // or 'public', 'time_limited', 'view_limited'
    password: 'mypassword',
    expiresAt: '2024-12-31T23:59:59Z',
    maxViews: 10,
    allowProfileView: true,
    allowPublicationsView: true,
    allowConnectionsView: false,
    allowContactInfo: false,
    allowReferenceRequest: true,
    customMessage: 'Check out my research profile!'
  })
});
```

### **5. Search & Discovery**

Find and connect with researchers:

```typescript
// Search users
const response = await fetch('/api/social/search?q=machine+learning&limit=20');
const data = await response.json();
// Returns array of matching users
```

## 🎯 Key Benefits

### **For Researchers**
- ✅ **Professional Networking** - Build meaningful professional relationships
- ✅ **Profile Sharing** - Share your research profile with anyone
- ✅ **Privacy Control** - Control who sees what information
- ✅ **Research Discovery** - Find researchers with similar interests
- ✅ **Activity Updates** - Stay updated on your network's research
- ✅ **Reference Building** - Connect with potential reference providers

### **For Collaboration**
- ✅ **Easy Discovery** - Find collaborators through search and recommendations
- ✅ **Context Building** - Understand how you know someone
- ✅ **Professional Context** - Maintain professional relationships
- ✅ **Event Networking** - Connect at conferences and events
- ✅ **Research Updates** - Follow researchers for latest work

### **For Recruiters**
- ✅ **Rich Profiles** - Comprehensive researcher profiles
- ✅ **Verification** - Connection-based verification system
- ✅ **Professional Context** - Understand professional relationships
- ✅ **Research Focus** - Clear research interests and expertise
- ✅ **Network Analysis** - See professional networks and connections

## 🔧 API Endpoints

### **Profile Management**
- `GET /api/social/profile/:userId` - Get user profile
- `PUT /api/social/profile` - Update own profile
- `GET /api/social/profile/shared/:shareToken` - Get shared profile
- `POST /api/social/profile/share` - Create share link
- `GET /api/social/profile/shares` - Get own share links

### **Connections**
- `POST /api/social/connections/request` - Send connection request
- `PUT /api/social/connections/:id/respond` - Respond to request
- `GET /api/social/connections` - Get connections
- `DELETE /api/social/connections/:id` - Remove connection

### **Follows**
- `POST /api/social/follow` - Follow user
- `DELETE /api/social/follow/:userId` - Unfollow user
- `GET /api/social/follows` - Get followers/following

### **Search & Discovery**
- `GET /api/social/search` - Search users
- `GET /api/social/recommendations` - Get connection recommendations

### **Notifications**
- `GET /api/social/notifications` - Get notifications
- `PUT /api/social/notifications/:id/read` - Mark as read
- `PUT /api/social/notifications/read-all` - Mark all as read

## 🎨 UI Components

### **Social Networking Page**
- **Discover Tab**: Search and find researchers
- **Connections Tab**: Manage professional connections
- **Follows Tab**: Manage followers and following
- **Notifications Tab**: View and manage notifications
- **Profile Tab**: View and edit own profile

### **Profile Components**
- **SocialProfile**: Complete profile display with sharing options
- **ProfileShareModal**: Create and manage share links
- **Connections**: Manage connection requests and connections
- **Notifications**: Real-time notification system

### **Integration with Researcher Portfolio**
- Added "Social Network" tab to Researcher Portfolio
- Seamless integration with existing portfolio features
- Enhanced profile sharing for reference system

## 🔮 Future Enhancements

- **Messaging System**: Direct messaging between connected users
- **Event Management**: Create and manage networking events
- **Group Features**: Research groups and communities
- **Advanced Analytics**: Network analysis and insights
- **Mobile App**: Native mobile application
- **Integration APIs**: Connect with external platforms (LinkedIn, ORCID)
- **AI Recommendations**: Smart connection and collaboration suggestions
- **Video Profiles**: Video introductions and presentations

## 🛠️ Technical Architecture

### **Database Schema**
- PostgreSQL with UUID primary keys
- JSONB for flexible data storage
- Array fields for skills and interests
- Proper indexing for performance
- Triggers for automatic counter updates

### **Backend Services**
- Express.js API routes
- Real-time notification system
- Privacy and security controls
- Activity tracking and analytics

### **Frontend Components**
- React with TypeScript
- Tailwind CSS for styling
- Real-time updates
- Responsive design
- Accessibility features

## 📝 Privacy & Security

### **Privacy Controls**
- Profile visibility settings (public, connections only, private)
- Granular permission controls for shared profiles
- Contact information privacy settings
- Activity visibility controls

### **Security Features**
- Password-protected profile shares
- Time-limited and view-limited shares
- User blocking and reporting
- Secure token-based sharing

## 📝 License

This Social Networking System is part of the ResearchLab platform and follows the same licensing terms.

---

**Built with ❤️ for the research community**
