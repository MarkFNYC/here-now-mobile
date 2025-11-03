# Here Now - Product Roadmap

**Version:** 1.0
**Last Updated:** November 3, 2025
**Target MVP Launch:** Week 10 (End of Sprint 5)

---

## 🗓️ Timeline Overview

```
Weeks 1-2     Weeks 3-4     Weeks 5-6     Weeks 7-8     Weeks 9-10    Weeks 11-12   Weeks 13-14
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Sprint 0 │  │ Sprint 1 │  │ Sprint 2 │  │ Sprint 3 │  │ Sprint 4 │  │ Sprint 5 │  │ Sprint 6 │
│Foundation│  │Discovery │  │1:1 Connect│ │Activities│  │ Safety   │  │ Admin    │  │  Polish  │
│   Auth   │  │ + Toggle │  │Messaging │  │ Groups   │  │ Filters  │  │ Launch   │  │Experimen.│
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
     │             │              │              │              │              │              │
     ▼             ▼              ▼              ▼              ▼              ▼              ▼
  Setup       Core UX       Social Layer   Group Features  Safety+UX     Beta Launch  Future Test
  Onboarding  Location      Chat/Meet      Pile-ons        Reset Daily   Analytics    Iterations
  Profile     Nearby Feed   Proposals      Host Tools      Block/Report  Admin Tools  Performance
```

---

## 🎯 Milestones

### Milestone 1: Alpha (End of Sprint 1 - Week 4)
**Goal:** Core discovery feature functional for internal testing

**Deliverables:**
- ✅ Users can sign up and create profile
- ✅ Toggle "I'm ON" works
- ✅ Nearby users appear in feed with distance
- ✅ Real-time presence indicators

**Success Criteria:**
- 5 internal team members using daily
- Toggle ON/OFF < 2 second response time
- Feed updates in real-time

---

### Milestone 2: Beta (End of Sprint 3 - Week 8)
**Goal:** 1:1 and group connections work end-to-end

**Deliverables:**
- ✅ Users can send and accept connection requests
- ✅ Real-time messaging works
- ✅ Location and time proposals functional
- ✅ Activities can be created and joined
- ✅ Group chat works for pile-ons

**Success Criteria:**
- 20 beta testers in Clapham
- 50% daily toggle rate
- 10+ confirmed meetups per week

---

### Milestone 3: MVP Launch (End of Sprint 5 - Week 10)
**Goal:** Production-ready app for 200-300 users in Clapham

**Deliverables:**
- ✅ All 60 MVP user stories completed
- ✅ Safety features (block, report, moderation)
- ✅ Daily midnight reset working
- ✅ Admin dashboard operational
- ✅ App store listings published

**Success Criteria:**
- 200-300 active users
- 35%+ daily toggle rate
- 25%+ connection → meetup conversion
- <1% safety incidents
- <1% crash rate

---

### Milestone 4: Scale (End of Sprint 6 - Week 14)
**Goal:** Stable, scalable app ready for 1000+ users

**Deliverables:**
- ✅ Performance optimizations
- ✅ Bug fixes from beta feedback
- ✅ Experimental features tested
- ✅ Analytics tracking key metrics

**Success Criteria:**
- 500+ active users
- 40%+ Day 7 retention
- <2 second load times
- 4.5+ app store rating

---

## 📅 Detailed Sprint Roadmap

### **Sprint 0: Foundation & Authentication** (Weeks 1-2)
**November 4 - November 17, 2025**

#### Week 1
- [ ] Project setup (React Native + Expo + TypeScript)
- [ ] Configure Supabase client
- [ ] Set up React Navigation
- [ ] Build sign-up flow (phone + email)
- [ ] Integrate ID verification service

#### Week 2
- [ ] Profile creation screens (photo, bio, tags, neighbourhood)
- [ ] Notification settings screen
- [ ] Onboarding flow end-to-end
- [ ] Image upload to Supabase Storage
- [ ] AI content moderation integration

**Demo:** Complete user onboarding from sign-up to profile

---

### **Sprint 1: Core Discovery** (Weeks 3-4)
**November 18 - December 1, 2025**

#### Week 3
- [ ] Request location permissions
- [ ] Build Toggle component (large, prominent)
- [ ] Implement HomeScreen with toggle + feed
- [ ] Create UserCard component
- [ ] Implement `get_nearby_users()` RPC call

#### Week 4
- [ ] Calculate distance and walking time
- [ ] Real-time presence subscriptions
- [ ] Online/offline indicators
- [ ] Empty states (no users nearby, toggle OFF)
- [ ] Pull-to-refresh functionality

**Demo:** Toggle ON to see nearby users in real-time

---

### **Sprint 2: 1:1 Connections** (Weeks 5-6)
**December 2 - December 15, 2025**

#### Week 5
- [ ] UserProfileScreen (detailed view)
- [ ] Send connection request flow
- [ ] RequestsScreen (pending requests)
- [ ] Accept/decline buttons
- [ ] Push notifications for requests

#### Week 6
- [ ] ChatScreen with real-time messaging
- [ ] LocationPicker (Google Places API)
- [ ] TimePicker component
- [ ] Location/time proposal cards in chat
- [ ] Confirm meetup flow

**Demo:** Full 1:1 connection from request to confirmed meetup

---

### **Sprint 3: Activities & Groups** (Weeks 7-8)
**December 16 - December 29, 2025**

#### Week 7
- [ ] Implement `get_nearby_activities()` RPC
- [ ] ActivityCard component
- [ ] Activity creation flow
- [ ] ActivityDetailScreen
- [ ] Join activity button

#### Week 8
- [ ] Group chat functionality
- [ ] Host management tools (accept/decline participants)
- [ ] ParticipantsList component
- [ ] Activity confirmation flow
- [ ] Map view with approximate location

**Demo:** Create activity, others join, group chat, confirm meetup

---

### **Sprint 4: Filters, Safety & Reset** (Weeks 9-10)
**December 30 - January 12, 2026**

#### Week 9
- [ ] FilterBar component (distance, type, time, 1:1/group)
- [ ] Filter logic for users and activities
- [ ] Block user functionality
- [ ] Report user form
- [ ] Privacy controls (profile visibility, location fuzzing)

#### Week 10
- [ ] Midnight reset cron job setup
- [ ] Archive messages and activities
- [ ] End conversation button
- [ ] Share contact modal
- [ ] Final QA and bug fixes

**Demo:** Filters work, blocking/reporting functional, midnight reset tested

---

### **Sprint 5: Admin & Launch Prep** (Weeks 11-12)
**January 13 - January 26, 2026**

#### Week 11
- [ ] Admin dashboard (reports list, user management)
- [ ] Report detail view with actions
- [ ] User deactivation (warn/suspend/ban)
- [ ] Analytics dashboard
- [ ] Ban management interface

#### Week 12
- [ ] Security audit (RLS policies, API endpoints)
- [ ] Performance optimization (query tuning, image compression)
- [ ] Error monitoring setup (Sentry)
- [ ] App store submission (iOS + Android)
- [ ] Beta tester recruitment (200-300 in Clapham)

**Demo:** Admin can manage reports, ban users, view analytics

**🎉 MVP LAUNCH** - End of Week 12

---

### **Sprint 6: Polish & Experimental** (Weeks 13-14)
**January 27 - February 9, 2026**

#### Week 13
- [ ] Activity expiry automation
- [ ] Beta user feedback implementation
- [ ] Critical bug fixes
- [ ] UI/UX polish pass
- [ ] A/B testing setup

#### Week 14
- [ ] Test future-day meetup feature (if validated)
- [ ] Performance monitoring and tuning
- [ ] Accessibility improvements
- [ ] Documentation updates
- [ ] Scale testing (500+ concurrent users)

**Demo:** Fully polished MVP ready for wider rollout

---

## 🎯 Feature Releases by Quarter

### Q4 2025 (Nov-Dec)
- **November:** Foundation + Auth (Sprint 0)
- **December:** Core Discovery + 1:1 Connections (Sprints 1-2)

### Q1 2026 (Jan-Mar)
- **January:** Activities, Safety, Admin, Launch (Sprints 3-5)
- **February:** Polish + Beta expansion
- **March:** Iterate based on user feedback

### Q2 2026 (Apr-Jun) - Post-MVP
- **April:** Geographic expansion (new neighborhoods)
- **May:** Voice/video calls (if validated)
- **June:** In-app payments for paid activities

### Q3 2026 (Jul-Sep) - Scale
- **July:** Advanced matching algorithms
- **August:** Web app version
- **September:** 10,000 users across 5 cities

---

## 🚀 Launch Strategy

### Phase 1: Internal Alpha (Week 4)
- **Users:** 5-10 team members
- **Goal:** Test core functionality
- **Duration:** 2 weeks

### Phase 2: Closed Beta (Week 8)
- **Users:** 20 early adopters in Clapham
- **Goal:** Validate 1:1 and group features
- **Duration:** 2 weeks

### Phase 3: Beta Launch (Week 10)
- **Users:** 200-300 in Clapham (density-first)
- **Goal:** Reach critical mass for network effects
- **Duration:** 4-8 weeks

### Phase 4: Public Launch (Week 18)
- **Users:** Open to all in Clapham, then expand
- **Goal:** 1000+ users, sustainable growth
- **Duration:** Ongoing

---

## 📊 Key Performance Indicators (KPIs)

### Engagement Metrics
| Metric | Sprint 1 | Sprint 3 | Sprint 5 | Post-Launch |
|--------|----------|----------|----------|-------------|
| Daily Active Users | 5 | 20 | 200 | 500+ |
| Daily Toggle Rate | 60% | 40% | 35% | 40% |
| Avg. Requests Sent | 2 | 3 | 3 | 3-5 |
| Request → Accept | 40% | 50% | 50% | 60% |
| Accept → Meetup | 50% | 40% | 25% | 30% |

### Retention Metrics
| Metric | Target (Sprint 5) |
|--------|-------------------|
| Day 1 Retention | 60% |
| Day 7 Retention | 40% |
| Day 30 Retention | 20% |

### Safety Metrics
| Metric | Target (Sprint 5) |
|--------|-------------------|
| Reports per 100 users | <2 |
| Ban rate | <0.5% |
| Block rate | <5% |

---

## 🔮 Future Roadmap (Post-MVP)

### Q2 2026: Enhancements
- Voice/video calls for confirmed meetups
- Calendar integration (Google Calendar, Apple Calendar)
- "Vouching" system (mutual connections)
- Activity templates (recurring meetups)
- In-app tipping/payments

### Q3 2026: Geographic Expansion
- Launch in 5 new London neighborhoods
- Adapt for other UK cities (Manchester, Edinburgh)
- Localization (multiple languages)

### Q4 2026: Platform Expansion
- Web app (desktop version)
- Browser extension (quick toggle from desktop)
- API for third-party integrations

### 2027: Advanced Features
- AI-powered matching recommendations
- Community events (100+ person gatherings)
- Sponsorship/monetization for activities
- B2B product (corporate team building)

---

## 🚧 Risks & Mitigation

### High-Priority Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low initial density | High | Hyper-focused launch (single neighborhood only) |
| ID verification delays | High | Choose reliable provider, manual backup |
| Safety incident | High | Robust reporting, quick response, clear guidelines |
| Location permission denials | Medium | Clear value prop, graceful degradation |

### Medium-Priority Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance at scale | Medium | PostGIS optimization, caching, load testing |
| Spam/fake accounts | Medium | ID verification, rate limiting, AI moderation |
| Midnight reset bugs | Medium | Extensive timezone testing, manual trigger backup |
| API rate limits (Google Places) | Low | Implement caching, fallback options |

---

## 🎉 Success Criteria

### Sprint 5 (MVP Launch)
- [ ] 200-300 active users in Clapham
- [ ] 35%+ daily toggle rate
- [ ] 25%+ of connections result in confirmed meetups
- [ ] <1% crash rate
- [ ] <1% safety incidents
- [ ] 4.0+ app store rating (initial reviews)

### 6 Months Post-Launch
- [ ] 1000+ active users
- [ ] 40%+ daily toggle rate
- [ ] 30%+ Day 7 retention
- [ ] Geographic expansion to 3 new areas
- [ ] 4.5+ app store rating
- [ ] Revenue model validated (if pursuing monetization)

---

## 📞 Stakeholder Communication

### Weekly Updates (During Sprints)
- **Audience:** Product Owner, Investors, Key Stakeholders
- **Format:** Email with:
  - Sprint progress (% complete)
  - Demo video link
  - Key metrics
  - Blockers/risks
  - Next week's goals

### Sprint Reviews (Every 2 Weeks)
- **Audience:** All stakeholders, team
- **Format:** Live demo + Q&A
- **Duration:** 30-45 minutes

### Monthly Board Updates
- **Audience:** Board, Investors
- **Format:** Slide deck with:
  - Progress against roadmap
  - KPIs (engagement, retention, safety)
  - Budget vs. actuals
  - Key learnings
  - Next month's priorities

---

## 🗺️ Visual Roadmap

```
                    🏁 MVP LAUNCH
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼───┐           ┌────▼────┐         ┌────▼────┐
│ SETUP │           │  CORE   │         │ SOCIAL  │
│ Auth  │─────────► │  UX     │────────►│ LAYER   │
│Profile│           │ Toggle  │         │1:1 Chat │
└───────┘           │ Feed    │         │Activities│
 Week 1-2           └─────────┘         └─────────┘
                     Week 3-4            Week 5-8
                         │                    │
                         │                    │
                    ┌────▼────────────────────▼───┐
                    │      SAFETY & ADMIN         │
                    │  Block/Report + Analytics   │
                    └────────────┬────────────────┘
                                 │  Week 9-12
                                 │
                            ┌────▼────┐
                            │  BETA   │
                            │ LAUNCH  │
                            │200-300  │
                            │ Users   │
                            └─────────┘
```

---

**See also:**
- [SPRINT_PLAN.md](./SPRINT_PLAN.md) - Detailed sprint breakdown
- [BACKLOG.md](./BACKLOG.md) - User stories and tasks
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [PRD.md](../PRD.md) - Product requirements
