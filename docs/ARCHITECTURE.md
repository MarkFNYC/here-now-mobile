# Here Now - System Architecture

**Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** Production Architecture

---

## 📐 Architecture Overview

Here Now follows a **client-server architecture** with a mobile-first approach, leveraging Supabase as the Backend-as-a-Service (BaaS) platform.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ iOS (Expo)   │  │Android (Expo)│  │Web (future)  │ │
│  │ React Native │  │ React Native │  │  React.js    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                              │
└────────────────────────────┼──────────────────────────────┘
                             │
                   HTTPS / WebSocket
                             │
┌────────────────────────────┼──────────────────────────────┐
│                  SUPABASE BACKEND                         │
│  ┌──────────────────────────┴────────────────────────┐   │
│  │            Supabase API Gateway                    │   │
│  │  (Authentication, RLS, Realtime, Storage)          │   │
│  └──────────────────────────┬────────────────────────┘   │
│                              │                             │
│   ┌─────────────┬────────────┴──────┬──────────────┐    │
│   │             │                    │               │    │
│   ▼             ▼                    ▼               ▼    │
│ ┌────┐   ┌──────────┐        ┌──────────┐   ┌──────────┐│
│ │Auth│   │PostgreSQL│        │ Realtime │   │ Storage  ││
│ │    │   │+ PostGIS │        │ (WS)     │   │(S3-like) ││
│ └────┘   └──────────┘        └──────────┘   └──────────┘│
└──────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
   ┌──────────────┐                      ┌──────────────┐
   │  Third-Party │                      │   Cron Jobs  │
   │   Services   │                      │  (midnight   │
   │ - ID verify  │                      │   reset)     │
   │ - Google     │                      └──────────────┘
   │   Places API │
   │ - Push Notif │
   └──────────────┘
```

---

## 🏗️ Component Architecture

### Mobile App (React Native + Expo)

#### **Navigation Structure**
```
AppNavigator (Root)
├── AuthNavigator (Auth flows)
│   ├── LoginScreen
│   ├── SignUpScreen
│   └── OnboardingFlow
│       ├── IDVerificationScreen
│       ├── PhotoUploadScreen
│       ├── ProfileSetupScreen
│       └── PermissionsScreen
│
└── MainNavigator (Authenticated)
    ├── BottomTabNavigator
    │   ├── HomeTab
    │   │   ├── HomeScreen (Toggle + Feed)
    │   │   ├── UserProfileScreen
    │   │   └── ActivityDetailScreen
    │   ├── ActivitiesTab
    │   │   ├── ActivitiesScreen
    │   │   ├── CreateActivityScreen
    │   │   └── ActivityManagementScreen
    │   ├── ChatsTab
    │   │   ├── ChatsListScreen
    │   │   ├── ChatScreen (1:1)
    │   │   └── GroupChatScreen
    │   └── ProfileTab
    │       ├── ProfileScreen
    │       ├── SettingsScreen
    │       └── NotificationSettingsScreen
    │
    └── ModalNavigator
        ├── RequestModal
        ├── LocationPickerModal
        └── TimePickerModal
```

#### **State Management**
- **React Context API** for global state:
  - `AuthContext` - User authentication state
  - `LocationContext` - Current location, permission status
  - `PresenceContext` - Real-time ON/OFF status of nearby users
  - `NotificationContext` - Push notification handling

- **Local State** (useState/useReducer) for:
  - Component-specific UI state
  - Form inputs
  - Temporary data

- **Supabase Realtime** for:
  - Presence (who's ON)
  - Messages (chat updates)
  - Connection requests
  - Activity updates

#### **Key Custom Hooks**
```typescript
// Location management
useLocation() → { location, error, requestPermission }

// Nearby users
useNearbyUsers(lat, lng, radius) → { users, loading, refresh }

// Nearby activities
useNearbyActivities(lat, lng, radius) → { activities, loading, refresh }

// Real-time subscriptions
useRealtimeSubscription(channel, event, callback)

// Connection management
useConnection(connectionId) → { connection, sendMessage, updateStatus }
```

---

## 🗄️ Database Architecture (PostgreSQL + PostGIS)

### **Core Tables**

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_or_email TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  full_name TEXT,
  photo_url TEXT,
  bio TEXT,
  activity_tags TEXT[],
  neighbourhood TEXT,
  location GEOGRAPHY(POINT, 4326),  -- PostGIS geospatial
  is_on BOOLEAN DEFAULT FALSE,
  last_toggled_on TIMESTAMP,
  notification_settings JSONB DEFAULT '{"requests": true, "joins": true, "messages": true}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  blocked_user_ids UUID[],
  is_deactivated BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_users_is_on ON users (is_on) WHERE is_on = true;
CREATE INDEX idx_users_location ON users USING GIST (location) WHERE is_on = true;
CREATE INDEX idx_users_neighbourhood ON users (neighbourhood);
```

#### **activities**
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT,  -- coffee, walk, run, event, drink
  location_name TEXT,
  approximate_location GEOGRAPHY(POINT, 4326),  -- Fuzzy, not exact
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  is_one_on_one BOOLEAN DEFAULT FALSE,
  max_participants INTEGER,
  status TEXT DEFAULT 'active',  -- active, confirmed, completed, cancelled
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activities_location ON activities USING GIST (approximate_location);
CREATE INDEX idx_activities_start_time ON activities (start_time) WHERE status = 'active';
```

#### **connections**
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  type TEXT DEFAULT '1:1',  -- '1:1' or 'pile_on'
  status TEXT DEFAULT 'pending',  -- pending, accepted, declined, ended, cancelled
  is_confirmed BOOLEAN DEFAULT FALSE,
  meet_time TIMESTAMP,
  meet_location JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_connections_requester ON connections (requester_id, status);
CREATE INDEX idx_connections_target ON connections (target_id, status);
CREATE INDEX idx_connections_activity ON connections (activity_id, status);
```

#### **messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',  -- text, location, time, system
  metadata JSONB,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_connection ON messages (connection_id, created_at DESC);
```

### **Database Functions**

```sql
-- Find nearby users who are ON
CREATE OR REPLACE FUNCTION get_nearby_users(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 5
) RETURNS TABLE (...) AS $$
  -- PostGIS spatial query
  -- Filters: is_on = true, not blocked, within radius
$$;

-- Find nearby activities
CREATE OR REPLACE FUNCTION get_nearby_activities(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 5
) RETURNS TABLE (...) AS $$
  -- PostGIS spatial query
  -- Filters: status = active, start_time > NOW(), within radius
$$;

-- Midnight reset (run by cron)
CREATE OR REPLACE FUNCTION midnight_reset() RETURNS void AS $$
  -- Reset all is_on to false
  -- Mark expired activities as completed
  -- Archive messages older than 1 day
  -- Clear old notifications
$$;
```

---

## 🔐 Security Architecture

### **Row Level Security (RLS)**

All tables have RLS enabled with policies enforcing:

```sql
-- Users can only see:
-- 1. Their own profile
-- 2. Users who are ON and nearby
-- 3. Users they're connected with
CREATE POLICY "Users can view non-blocked users"
  ON users FOR SELECT
  USING (
    auth.uid() = id
    OR (is_on = true AND NOT (auth.uid() = ANY(blocked_user_ids)))
  );

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Similar policies for:
-- - activities (can view active, can create/update own)
-- - connections (can view own, can create, target can update)
-- - messages (can view/send in own connections only)
-- - notifications (can view/update own only)
```

### **Authentication Flow**

```
1. User initiates sign up (phone/email)
2. Supabase Auth sends verification code/link
3. User verifies → Supabase creates auth.users record
4. App creates users table record (trigger or manual)
5. User completes onboarding (ID verify, profile)
6. Session token stored in SecureStore
7. Token refreshed automatically by Supabase client
8. All API calls include Authorization: Bearer <token>
```

### **Privacy Controls**

- **Location Fuzzing**: Stored location ± 100-500m random offset
- **Profile Visibility**: Only visible when ON and within radius
- **No Direct URLs**: No public profile pages, no URL sharing
- **Blocked Users**: Complete removal from all feeds (enforced by RLS)

---

## 🔄 Real-time Architecture (Supabase Realtime)

### **Channels**

#### **Presence Channel: `presence:nearby`**
- Tracks who is ON in user's vicinity
- Updates within 2 seconds of toggle
- Used for online indicators

```typescript
const channel = supabase.channel('presence:nearby')
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    // Update UI with who's online
  })
  .subscribe()
```

#### **Connection Channel: `connection:{id}:messages`**
- Real-time chat messages
- Typing indicators
- Read receipts

```typescript
supabase
  .channel(`connection:${connectionId}:messages`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `connection_id=eq.${connectionId}`
  }, (payload) => {
    // New message received
  })
  .subscribe()
```

#### **Activity Channel: `activity:{id}:updates`**
- Participant joins/leaves
- Host confirmations
- Status updates

---

## 📱 Push Notifications (Expo Notifications)

### **Notification Types**

| Event | Title | Body | Deep Link |
|-------|-------|------|-----------|
| New Request | "X wants to meet today" | "View their profile" | `/requests/{id}` |
| Request Accepted | "X accepted your request" | "Start chatting!" | `/chats/{id}` |
| New Message | "X: {message preview}" | "Tap to reply" | `/chats/{id}` |
| Join Request | "X wants to join your activity" | "Approve or decline" | `/activities/{id}` |
| Midnight Reset | "Your availability has been reset" | "Toggle ON to get started" | `/home` |
| Meetup Reminder | "Meeting X in 15 minutes" | "At {location}" | `/plans/{id}` |

### **Notification Flow**

```
1. Event occurs (e.g., new request)
2. Database trigger or API call
3. Check user's notification_settings
4. If enabled, create notification record
5. Send push notification via Expo Push API
6. User taps notification
7. Deep link opens correct screen in app
```

---

## 🛠️ Third-Party Integrations

### **ID Verification (Onfido / Jumio)**
- Government ID + selfie verification
- Prevents fake accounts
- API-based integration
- Results stored as `is_verified` boolean

### **Google Places API**
- Location search for meetup spots
- Autocomplete suggestions
- Place details (ratings, hours, photos)
- Safety indicators (e.g., "Busy area")

### **Expo Services**
- **Expo Location**: GPS coordinates, permissions
- **Expo Notifications**: Push notifications, deep linking
- **Expo ImagePicker**: Photo upload (camera/gallery)
- **Expo SecureStore**: Token storage
- **Expo Updates**: OTA updates

### **AI Moderation (OpenAI / Hive)**
- Photo content moderation (detect inappropriate images)
- Bio text moderation (detect harassment, spam)
- Real-time checks before saving to database

---

## ⚙️ Backend Jobs (Cron)

### **Midnight Reset**
- **Schedule**: Daily at 00:00 in each timezone
- **Tasks**:
  - Set all `users.is_on = false`
  - Mark expired activities as `completed`
  - Archive messages older than 1 day
  - Clear notifications older than 7 days
  - Send "reset" push notification

### **Activity Expiry**
- **Schedule**: Every hour
- **Tasks**:
  - Mark activities with `end_time < NOW()` as `completed`
  - Send cancellation notification if meetup didn't happen

### **Analytics Aggregation**
- **Schedule**: Daily at 02:00 UTC
- **Tasks**:
  - Calculate DAU, toggle rate, connections made
  - Update admin dashboard metrics
  - Generate retention cohorts

---

## 📊 Monitoring & Observability

### **Error Tracking (Sentry)**
- Client-side errors (React Native crashes)
- API errors (4xx, 5xx responses)
- Database errors (RLS violations, query failures)
- Real-time alerts for critical errors

### **Analytics (Supabase Events Table)**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Event types:
-- - user_toggled_on
-- - user_toggled_off
-- - request_sent
-- - request_accepted
-- - activity_created
-- - activity_joined
-- - meetup_confirmed
-- - app_opened
```

### **Performance Monitoring**
- PostGIS query performance (EXPLAIN ANALYZE)
- Supabase API response times
- Real-time connection latency
- Client-side render times (React Native Profiler)

---

## 🚀 Deployment Architecture

### **Mobile App**
- **Development**: Expo Go app (for dev/testing)
- **Staging**: TestFlight (iOS) + Internal Testing (Android)
- **Production**: App Store + Google Play Store
- **OTA Updates**: Expo Updates (for JS/config changes)

### **Backend (Supabase)**
- **Environment**: Cloud-hosted (Supabase managed)
- **Database**: PostgreSQL with PostGIS extension
- **Regions**: EU/US (select closest to user base)
- **Backups**: Automated daily backups
- **Scaling**: Auto-scaling via Supabase

### **CI/CD Pipeline**
```
GitHub Repository
  ├── Push to main branch
  ├── Run tests (Jest, React Native Testing Library)
  ├── Build iOS binary (EAS Build)
  ├── Build Android binary (EAS Build)
  ├── Deploy to TestFlight / Internal Testing
  └── Manual approval → Deploy to Production
```

---

## 🔮 Future Architecture Considerations

### **Scaling Considerations**
- **Database sharding** by geographic region (if >100K users)
- **CDN** for profile photos and static assets
- **Redis caching** for frequently accessed data (nearby users)
- **Microservices** for compute-heavy tasks (AI moderation, analytics)

### **Feature Expansions**
- **Voice/Video Calls**: WebRTC integration (Agora, Twilio)
- **In-App Payments**: Stripe for paid activities
- **Advanced Matching**: ML-based recommendation engine
- **Admin Web Dashboard**: Next.js admin portal

---

## 📚 Architecture Decision Records (ADRs)

### **ADR-001: Why Supabase over Custom Backend?**
- **Decision**: Use Supabase as BaaS
- **Rationale**:
  - Faster development (no backend code)
  - Built-in auth, real-time, storage
  - PostGIS for geolocation
  - Strong RLS for security
- **Trade-offs**: Less control over backend, vendor lock-in

### **ADR-002: Why React Native over Native (Swift/Kotlin)?**
- **Decision**: React Native with Expo
- **Rationale**:
  - Single codebase for iOS + Android
  - Faster development
  - Easier to find React developers
  - Expo ecosystem (OTA updates, notifications, location)
- **Trade-offs**: Performance slightly worse than native, limited access to native APIs

### **ADR-003: Why PostgreSQL + PostGIS over MongoDB/Firestore?**
- **Decision**: PostgreSQL with PostGIS
- **Rationale**:
  - PostGIS is industry standard for geospatial queries
  - Strong ACID compliance for safety-critical data
  - Complex querying (joins, RLS, triggers)
  - Supabase provides managed PostgreSQL
- **Trade-offs**: Less flexible than NoSQL, harder to scale horizontally

---

**See also:**
- [SPRINT_PLAN.md](./SPRINT_PLAN.md) - Development timeline
- [BACKLOG.md](./BACKLOG.md) - User stories and tasks
- [PRD.md](../PRD.md) - Product requirements
