# Here Now - Sprint Plan & Development Roadmap

**Version:** 1.0
**Last Updated:** November 3, 2025
**Total Duration:** 12 weeks (6 sprints × 2 weeks)
**Target MVP Launch:** End of Sprint 5 (Week 10)

---

## 📅 Sprint Overview

| Sprint | Weeks | Theme | Stories | Focus |
|--------|-------|-------|---------|-------|
| **Sprint 0** | 1-2 | Foundation & Auth | 46-52 | Setup, onboarding, profile |
| **Sprint 1** | 3-4 | Core Discovery | 1-8, 13-16 | Toggle, location, nearby users |
| **Sprint 2** | 5-6 | 1:1 Connections | 17-30, 36-37 | Requests, messaging, meetup coordination |
| **Sprint 3** | 7-8 | Activities & Groups | 2, 4-5, 31-35, 38-40 | Pile-ons, group chat, host tools |
| **Sprint 4** | 9-10 | Filters, Safety & Reset | 9-12, 41-45, 53-56 | Advanced filtering, blocking, daily reset |
| **Sprint 5** | 11-12 | Admin & Launch Prep | 57-60 | Admin dashboard, analytics, beta launch |
| **Sprint 6** | 13-14 | Polish & Experimental | 61-62, bug fixes | Future features, optimization |

---

## Sprint 0: Foundation & Authentication (Weeks 1-2)

**Goal:** Set up project infrastructure and complete user onboarding flow

### User Stories (7 stories)
- ✅ Story 46: Create account via phone/email
- ✅ Story 47: Verify account (ID verification)
- ✅ Story 48: Add photo
- ✅ Story 49: Add bio
- ✅ Story 50: Add activity tags
- ✅ Story 51: Set neighbourhood
- ✅ Story 52: Manage notifications

### Technical Tasks
- [ ] Set up React Native + Expo project structure
- [ ] Configure Supabase client and environment variables
- [ ] Implement Supabase Auth (phone + email)
- [ ] Integrate ID verification service (Onfido/Jumio)
- [ ] Build onboarding screen flow
- [ ] Create profile management screens
- [ ] Set up image upload (Supabase Storage)
- [ ] Implement AI content moderation (photos & bios)
- [ ] Create reusable UI components (buttons, inputs, cards)
- [ ] Set up React Navigation (tabs + stack)
- [ ] Configure push notifications (Expo Notifications)

### Deliverables
- ✅ Users can sign up with phone or email
- ✅ Complete ID verification flow
- ✅ Build profile with photo, bio, tags, neighbourhood
- ✅ Notification settings functional
- ✅ Basic app shell with navigation

### Acceptance Criteria
- New users can complete full onboarding in <5 minutes
- ID verification completes in <5 minutes
- Photos pass AI moderation
- All data persists to Supabase

---

## Sprint 1: Core Discovery (Weeks 3-4)

**Goal:** Implement the core "Toggle ON" feature and nearby user discovery

### User Stories (12 stories)
- ✅ Story 1: See people nearby who are available today
- ✅ Story 3: See distance/time to person or activity
- ✅ Story 6: See who is currently ON
- ✅ Story 7: Toggle "I'M ON" to show availability
- ✅ Story 8: ON/OFF state resets daily
- ✅ Story 13: View all options (no filters)
- ✅ Story 14: Message when no one nearby
- ✅ Story 15: Suggestions to turn ON
- ✅ Story 16: Suggestions to widen filters

### Technical Tasks
- [ ] Request location permissions (expo-location)
- [ ] Implement location tracking and updates
- [ ] Build Toggle component (large, prominent switch)
- [ ] Create HomeScreen with toggle + feed
- [ ] Implement `get_nearby_users()` Supabase RPC call
- [ ] Build UserCard component (photo, name, bio, distance, tags)
- [ ] Calculate walking time estimates
- [ ] Set up Supabase Realtime subscriptions for presence
- [ ] Implement online/offline indicators
- [ ] Build empty states (no users nearby, toggle OFF)
- [ ] Add pull-to-refresh on feed
- [ ] Store location in PostGIS format

### Deliverables
- ✅ Functional toggle switch
- ✅ Real-time feed of nearby users who are ON
- ✅ Distance and walking time calculations
- ✅ Online indicators with live updates
- ✅ Empty states and prompts

### Acceptance Criteria
- Toggle updates `is_on` status in <2 seconds
- Feed shows users within 5km radius
- Distance updates when user moves >100m
- Online status reflects in real-time
- Daily reset at midnight works correctly

---

## Sprint 2: 1:1 Connections (Weeks 5-6)

**Goal:** Enable users to request connections, message, and coordinate meetups

### User Stories (16 stories)
- ✅ Story 17: View lightweight profile
- ✅ Story 18: View activity details
- ✅ Story 19: "Today only" indicator
- ✅ Story 20: Time window display
- ✅ Story 21: Activity tags display
- ✅ Story 22: 1:1 vs pile-on indicator
- ✅ Story 23: Participant count
- ✅ Story 24: Send 1:1 request
- ✅ Story 25: Accept/decline requests
- ✅ Story 26: Message after acceptance
- ✅ Story 27: Propose meet location
- ✅ Story 28: Propose meet time
- ✅ Story 29: Adjust place/time
- ✅ Story 30: Receive notifications for requests
- ✅ Story 36: Confirm the meet
- ✅ Story 37: Cancel the meet

### Technical Tasks
- [ ] Build UserProfileScreen (detailed view)
- [ ] Create SendRequestButton + modal
- [ ] Implement connections table CRUD operations
- [ ] Build RequestsScreen (pending requests list)
- [ ] Create accept/decline buttons
- [ ] Build ChatScreen with real-time messaging
- [ ] Implement Supabase Realtime for messages
- [ ] Create LocationPicker component (Google Places API)
- [ ] Create TimePicker component
- [ ] Build special message cards (location, time proposals)
- [ ] Implement push notifications for requests and messages
- [ ] Create ConfirmMeetupButton
- [ ] Build "Today's Plans" section
- [ ] Add calendar event integration
- [ ] Create CancelMeetupButton with confirmation

### Deliverables
- ✅ Full 1:1 connection flow (request → accept → chat → confirm)
- ✅ Real-time messaging
- ✅ Location and time proposal system
- ✅ Push notifications for key events
- ✅ Meetup confirmation with calendar integration

### Acceptance Criteria
- Requests sent and received within 5 seconds
- Messages appear in real-time (<1 second)
- Location/time proposals render as interactive cards
- Confirmed meetups appear in "Today's Plans"
- Push notifications respect user settings

---

## Sprint 3: Activities & Groups (Weeks 7-8)

**Goal:** Implement pile-on activities with group coordination

### User Stories (11 stories)
- ✅ Story 2: See activities happening nearby
- ✅ Story 4: See approximate location of activity
- ✅ Story 5: See group size on activity
- ✅ Story 31: Join existing activity (pile-on)
- ✅ Story 32: Host notified when someone joins
- ✅ Story 33: Host sees who joined
- ✅ Story 34: Participant messages host
- ✅ Story 35: Host confirms group meet details
- ✅ Story 38: View confirmed details
- ✅ Story 39: Edit meeting time
- ✅ Story 40: Suggested public locations

### Technical Tasks
- [ ] Implement `get_nearby_activities()` Supabase RPC call
- [ ] Build ActivityCard component
- [ ] Create ActivityCreationFlow (title, type, location, time)
- [ ] Build ActivityDetailScreen
- [ ] Implement JoinActivityButton
- [ ] Create group chat functionality
- [ ] Build ParticipantsList for hosts
- [ ] Add accept/decline for pile-on requests
- [ ] Implement activity confirmation flow
- [ ] Create ActivityMapView (approximate location circles)
- [ ] Integrate Google Places API for public locations
- [ ] Build host management tools
- [ ] Add capacity limits for activities
- [ ] Implement activity status updates (pending, confirmed, completed)

### Deliverables
- ✅ Browse nearby activities feed
- ✅ Create pile-on activities
- ✅ Join activities and group chat
- ✅ Host management dashboard
- ✅ Activity confirmation with all participants

### Acceptance Criteria
- Activities appear in feed with accurate distance
- Join requests notify host within 5 seconds
- Group chat works for all accepted participants
- Host can manage participants (accept/decline)
- Activity details update in real-time

---

## Sprint 4: Filters, Safety & Reset (Weeks 9-10)

**Goal:** Add advanced filtering, safety features, and daily reset logic

### User Stories (13 stories)
- ✅ Story 9: Filter by distance
- ✅ Story 10: Filter by activity type
- ✅ Story 11: Filter by time
- ✅ Story 12: Filter by 1:1 vs group
- ✅ Story 41: Chats clear at midnight
- ✅ Story 42: Activities/intent clear at midnight
- ✅ Story 43: ON state resets at midnight
- ✅ Story 44: Manually clear connection early
- ✅ Story 45: Exchange contact off-app
- ✅ Story 53: Block someone
- ✅ Story 54: Report someone
- ✅ Story 55: Limited profile exposure
- ✅ Story 56: Precise location hidden

### Technical Tasks
- [ ] Build FilterBar component (distance, activity type, time, 1:1/group)
- [ ] Implement filter logic for users and activities
- [ ] Create midnight reset cron job (Supabase function)
- [ ] Archive messages and activities at midnight
- [ ] Reset all `is_on` statuses daily
- [ ] Build BlockButton with confirmation modal
- [ ] Implement blocked_user_ids array logic
- [ ] Create ReportForm (reason selection, details)
- [ ] Store reports in database with admin notification
- [ ] Build EndConversationButton
- [ ] Create ShareContactModal (phone/email/social)
- [ ] Implement privacy controls (profile visibility, location fuzzing)
- [ ] Add RLS policies for blocked users
- [ ] Test midnight reset with different timezones

### Deliverables
- ✅ Functional filters for feed
- ✅ Daily midnight reset system
- ✅ Block and report functionality
- ✅ Privacy controls
- ✅ Off-app contact sharing

### Acceptance Criteria
- Filters update feed instantly
- Midnight reset runs reliably at 00:00 in user's timezone
- Blocked users completely hidden from blocker
- Reports trigger admin review
- Location remains approximate (100-500m fuzzing)

---

## Sprint 5: Admin & Launch Prep (Weeks 11-12)

**Goal:** Build admin tools and prepare for beta launch

### User Stories (4 stories)
- ✅ Story 57: Review reports
- ✅ Story 58: Deactivate users
- ✅ Story 59: Basic analytics
- ✅ Story 60: Manage banlist

### Technical Tasks
- [ ] Build admin dashboard (web or admin mobile app)
- [ ] Create ReportsList view for admins
- [ ] Build ReportDetailView (user profiles, chat history, actions)
- [ ] Implement user deactivation (warn/suspend/ban)
- [ ] Create analytics dashboard (DAU, toggle rate, connections, retention)
- [ ] Build ban management interface
- [ ] Add audit logging for all admin actions
- [ ] Prevent re-registration of banned users
- [ ] Final QA and bug fixes
- [ ] Performance optimization (image compression, query optimization)
- [ ] Security audit (RLS policies, API endpoints)
- [ ] Write deployment documentation
- [ ] Prepare beta launch communications
- [ ] Set up error monitoring (Sentry)
- [ ] Create feedback collection mechanism

### Deliverables
- ✅ Admin dashboard with reports, user management, analytics
- ✅ User moderation tools (warn, suspend, ban)
- ✅ Analytics tracking key metrics
- ✅ Production-ready app
- ✅ Beta launch plan

### Acceptance Criteria
- Admins can review and action reports
- User bans enforced immediately
- Analytics update daily
- App passes security review
- Ready for 200-300 beta users

---

## Sprint 6: Polish & Experimental (Weeks 13-14)

**Goal:** Add experimental features and final polish

### User Stories (2 stories + polish)
- ⚠️ Story 61: Propose future-day meet (experimental)
- ✅ Story 62: Auto-close expired activities
- Bug fixes and optimization
- User feedback implementation
- A/B testing preparation

### Technical Tasks
- [ ] Implement activity expiry automation
- [ ] Test future-day meetup feature (if validated)
- [ ] Address beta user feedback
- [ ] Performance monitoring and optimization
- [ ] Fix critical bugs from beta
- [ ] UI/UX polish pass
- [ ] Accessibility improvements
- [ ] Onboarding improvements based on data
- [ ] Set up A/B testing framework
- [ ] Prepare for wider rollout

### Deliverables
- ✅ Fully polished MVP
- ✅ All critical bugs fixed
- ✅ Beta user feedback incorporated
- ✅ Ready for wider launch

### Acceptance Criteria
- <1% crash rate
- Average app store rating >4.5 stars
- Beta users achieving 35% daily toggle rate
- Ready to scale to 1000+ users

---

## 📊 Success Metrics (Tracked Throughout)

### Sprint 0-1: Foundation
- [ ] 100% of test users complete onboarding
- [ ] Average onboarding time <5 minutes

### Sprint 2-3: Engagement
- [ ] 35%+ daily toggle rate
- [ ] Average 3+ connection requests per active user per day

### Sprint 4-5: Conversion
- [ ] 25%+ of connections result in confirmed meetups
- [ ] <1% safety reports
- [ ] Day 7 retention >40%

### Sprint 6: Scale Readiness
- [ ] App handles 500+ concurrent users
- [ ] <2 second load times
- [ ] 99.9% uptime

---

## 🚨 Risk Management

### High Priority Risks
1. **ID Verification Delays** - Mitigate: Choose reliable provider, have manual review backup
2. **Location Permission Denials** - Mitigate: Clear value prop, test on iOS & Android
3. **Low Initial Density** - Mitigate: Hyper-focused geographic launch (Clapham only)
4. **Safety Incidents** - Mitigate: Robust reporting, quick admin response, clear guidelines

### Medium Priority Risks
1. **Performance at Scale** - Mitigate: PostGIS optimization, caching strategies
2. **Spam/Abuse** - Mitigate: Rate limiting, AI moderation, user verification
3. **Midnight Reset Bugs** - Mitigate: Extensive timezone testing, failsafe manual trigger

---

## 🔄 Sprint Ceremonies

### Each Sprint (2 weeks):
- **Sprint Planning** (Day 1): Review stories, estimate tasks, commit to sprint goal
- **Daily Standups** (15 min): What did you do? What will you do? Any blockers?
- **Sprint Review** (Last Day): Demo completed features, gather feedback
- **Sprint Retro** (Last Day): What went well? What needs improvement?

### Definition of Done:
- [ ] Code written and reviewed
- [ ] Tests passing (unit + integration)
- [ ] Deployed to staging
- [ ] Tested on iOS and Android
- [ ] Documentation updated
- [ ] Stakeholder approved

---

## 📞 Team & Roles

- **Product Owner**: Define priorities, accept stories
- **Scrum Master**: Facilitate ceremonies, remove blockers
- **Frontend Developer(s)**: React Native, Expo, UI/UX
- **Backend Developer(s)**: Supabase, PostGIS, API design
- **Designer**: UI/UX, design system, prototypes
- **QA Tester**: Manual testing, bug reporting

---

## 🎯 Launch Checklist (End of Sprint 5)

- [ ] All 60 MVP stories completed (excluding experimental)
- [ ] App passes security audit
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] App store listings ready (screenshots, description)
- [ ] Beta testers recruited (200-300 in Clapham)
- [ ] Support email/system set up
- [ ] Error monitoring live (Sentry)
- [ ] Analytics tracking confirmed (Supabase Events)
- [ ] Admin dashboard accessible
- [ ] Midnight reset tested in production
- [ ] Push notifications tested end-to-end
- [ ] Feedback mechanism in place
- [ ] Emergency contact/escalation process defined

---

**Next Steps:**
1. Review and approve this sprint plan
2. Begin Sprint 0 planning session
3. Set up project tracking (Jira, Linear, or GitHub Projects)
4. Populate backlog with technical tasks
5. Assign team members to stories
6. Kick off Sprint 0!
