# 🏟️ Venue Experience Enhancement System — MVP Implementation Plan

## Scope (Phase 1 MVP)

### Backend (Express.js + SQLite)
| Service | Key Endpoints |
|---------|--------------|
| **Auth** | Register, Login, Profile, JWT refresh |
| **Venues & Events** | CRUD venues, events, sections |
| **Amenities & Wait Times** | List amenities, live wait times, crowd density |
| **Orders** | Browse menus, place/track orders |
| **Notifications** | Push notification preferences, alerts |
| **Incidents** | Report, assign, resolve incidents |

### Database (SQLite)
Full schema for: Users, PaymentMethods, Venues, Events, Sections, Amenities, MenuItems, Orders, OrderItems, Transactions, CrowdDensity, WaitTimes, SensorData, Incidents, UserActivity, Notifications, Staff, StaffAssignments.

### Frontend (React + Vite)
1. **Attendee Web App (PWA)**: Venue map, wait times, menu browsing, mobile ordering, navigation
2. **Operations Dashboard**: Live heatmap, wait time dashboard, staff management, incident board, analytics

### Real-Time
- Socket.io for live crowd density, wait times, order status, incident updates

---

## Project Structure

```
promptwars-demo/
├── server/
│   ├── src/
│   │   ├── index.js          # Express entry point
│   │   ├── db/
│   │   │   ├── schema.sql     # SQLite schema
│   │   │   └── seed.js        # Demo seed data
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── venues.js
│   │   │   ├── events.js
│   │   │   ├── amenities.js
│   │   │   ├── orders.js
│   │   │   ├── incidents.js
│   │   │   ├── staff.js
│   │   │   └── dashboard.js
│   │   └── services/
│   │       ├── crowdService.js
│   │       └── waitTimeService.js
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Build Order
1. SQLite schema + seed data
2. Express server + middleware
3. API routes (auth → venues → amenities → orders → incidents → dashboard)
4. React client (design system → pages → real-time)
