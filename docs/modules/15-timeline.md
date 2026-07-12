# Module 15 — Vehicle Timeline

## Overview

Chronological history view for every vehicle, showing all significant events from acquisition to retirement. Provides a complete audit trail and operational history in a vertical timeline UI.

---

## Event Types

| Event Type | Source | Icon |
|---|---|---|
| ACQUISITION | Vehicle creation | 🏷️ |
| TRIP_COMPLETED | Trip completion | 🚚 |
| FUEL_ENTRY | Fuel log created | ⛽ |
| MAINTENANCE_COMPLETED | Maintenance closed | 🔧 |
| INSPECTION | Inspection completed | ✅ / ❌ |
| DOCUMENT_UPLOAD | Document added | 📄 |
| DOCUMENT_EXPIRY | Document expired | ⚠️ |
| HEALTH_CHANGE | Health score significant change (±10) | 📊 |
| STATUS_CHANGE | Vehicle status transition | 🔄 |
| INCIDENT | Safety event involving this vehicle | 🚨 |
| RETIREMENT | Vehicle retired | 🏁 |

---

## Data Model

```prisma
model TimelineEvent {
  id          String        @id @default(cuid())
  
  vehicleId   String
  vehicle     Vehicle       @relation(fields: [vehicleId], references: [id])
  
  type        TimelineEventType
  title       String
  description String?
  metadata    Json?         // Related entity IDs, costs, readings
  
  createdAt   DateTime      @default(now())

  @@index([vehicleId, createdAt])
}

enum TimelineEventType {
  ACQUISITION
  TRIP_COMPLETED
  FUEL_ENTRY
  MAINTENANCE_COMPLETED
  INSPECTION
  DOCUMENT_UPLOAD
  DOCUMENT_EXPIRY
  HEALTH_CHANGE
  STATUS_CHANGE
  INCIDENT
  RETIREMENT
}
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/vehicles/:id/timeline` | Bearer | Paginated timeline events |
| GET | `/vehicles/:id/timeline?type=TRIP_COMPLETED` | Bearer | Filtered by event type |

### Query Parameters

```
GET /vehicles/:id/timeline?type=MAINTENANCE_COMPLETED&from=2026-01-01&to=2026-07-12&limit=50&cursor=clx...
```

---

## Auto-generation

Timeline events are created automatically as side effects of operations:

| Operation | Timeline Event Created |
|---|---|
| Vehicle registered | ACQUISITION event |
| Trip completed | TRIP_COMPLETED with distance, revenue |
| Fuel log added | FUEL_ENTRY with liters, cost |
| Maintenance closed | MAINTENANCE_COMPLETED with cost, problem |
| Inspection submitted | INSPECTION with result (passed/failed) |
| Document uploaded | DOCUMENT_UPLOAD with doc type |
| Document expires | DOCUMENT_EXPIRY with doc type |
| Health score changes ±10 | HEALTH_CHANGE with old/new score |
| Vehicle status changes | STATUS_CHANGE with old/new status |
| Safety event on vehicle | INCIDENT with event details |
| Vehicle retired | RETIREMENT event |

---

## UI Design

Vertical timeline with alternating left/right cards:

```
   ⏺ Jul 12 — Trip Completed
   │  Mumbai → Pune | 148 km | Revenue: ₹12,000
   │
   ⏺ Jul 10 — Fuel Entry
   │  45L Diesel | ₹4,050 | Odometer: 84,500 km
   │
   ⏺ Jul 08 — Maintenance Completed
   │  Oil Change | Cost: ₹2,500 | Service: Quick Lube
   │
   ⏺ Jul 01 — Inspection Passed
   │  Pre-trip inspection | All 14 items passed
   │
   ⏺ Jun 15 — Vehicle Registered
   │  Acquisition | Tata Prima 4928 | MH12AB1234
```

- Color-coded by event type
- Expandable cards for full details
- "Load more" pagination at bottom
- Filter chips at top for event type filtering
