# Module 05 — Trip Management

## Overview

End-to-end trip lifecycle management from creation through dispatch, execution, and archival. Integrates with AI dispatch, vehicle/driver assignment validation, fuel tracking, expense logging, and automatic status transitions.

---

## Trip Lifecycle

```
DRAFT → VALIDATED → DISPATCHED → IN_PROGRESS → COMPLETED → ARCHIVED
                                                    ↓
                                                CANCELLED
```

### State Transitions

| From | To | Trigger | Side Effects |
|---|---|---|---|
| DRAFT | VALIDATED | Business rules pass | — |
| VALIDATED | DISPATCHED | Dispatcher confirms | Vehicle → ON_TRIP, Driver → ON_TRIP |
| DISPATCHED | IN_PROGRESS | Driver starts trip | Trip timer begins |
| IN_PROGRESS | COMPLETED | Driver ends trip | Vehicle → AVAILABLE, Driver → AVAILABLE, odometer updated |
| ANY (before IN_PROGRESS) | CANCELLED | Manual cancel | Vehicle → AVAILABLE, Driver → AVAILABLE |
| COMPLETED | ARCHIVED | Auto after 30 days | Read-only |

---

## Features

### 5.1 Trip Creation

- Source & destination (text + geocoordinates)
- Cargo type and weight/passenger count
- Scheduled departure date/time
- Vehicle assignment (manual or AI-recommended)
- Driver assignment (manual or AI-recommended)
- Expected revenue
- Route selection (via Route Optimization API)

### 5.2 Trip Validation (Pre-dispatch)

Automated checks before dispatch:

| Check | Rule | Block Dispatch |
|---|---|---|
| Vehicle status | Must be AVAILABLE | Yes |
| Vehicle health | Must be ≥ 30 | Warning only |
| Driver status | Must be AVAILABLE | Yes |
| Driver license | Must not be EXPIRED | Yes |
| Driver license category | Must match vehicle type | Yes |
| Cargo capacity | Must not exceed vehicle capacity | Yes |
| Pre-trip inspection | Must be PASSED (if required) | Yes |
| Vehicle documents | All required docs valid | Warning only |
| No duplicate assignment | Vehicle/driver not already assigned | Yes |

### 5.3 Trip Execution

During a trip, drivers can:
- Update current location (GPS)
- Log fuel entries
- Record expenses (tolls, parking)
- Report issues
- Complete trip with final odometer reading

### 5.4 Customer ETA Sharing

- Dispatcher generates a unique, time-limited tracking link
- Public page (no auth) shows: trip status, current location, ETA, delivery progress
- Link format: `https://app.transitops.com/track/{trackingToken}`
- Token expires 24 hours after trip completion

---

## Data Model

```prisma
model Trip {
  id              String     @id @default(cuid())
  tripNumber      String     @unique  // Auto: TRP-2026-00001
  
  source          String
  sourceLat       Float?
  sourceLng       Float?
  destination     String
  destLat         Float?
  destLng         Float?
  
  cargoType       String?
  cargoWeight     Float?     // in tons
  passengerCount  Int?
  
  scheduledAt     DateTime
  dispatchedAt    DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  
  status          TripStatus @default(DRAFT)
  
  vehicleId       String?
  vehicle         Vehicle?   @relation(fields: [vehicleId], references: [id])
  driverId        String?
  driver          Driver?    @relation(fields: [driverId], references: [id])
  
  startOdometer   Float?
  endOdometer     Float?
  distancePlanned Float?     // km
  distanceActual  Float?     // km (endOdometer - startOdometer)
  
  revenue         Float?
  fuelCost        Float?     // calculated from fuel logs
  totalExpenses   Float?     // calculated from expenses
  netProfit       Float?     // revenue - fuelCost - totalExpenses
  
  routeData       Json?      // GeoJSON route from ORS
  etaMinutes      Int?
  fuelEstimate    Float?     // liters
  tollEstimate    Float?
  
  trackingToken   String?    @unique
  trackingExpiry  DateTime?
  
  notes           String?
  cancelReason    String?
  
  createdBy       String
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  fuelLogs        FuelLog[]
  expenses        Expense[]
  inspection      Inspection?
  safetyEvents    SafetyEvent[]

  @@index([status])
  @@index([vehicleId])
  @@index([driverId])
  @@index([scheduledAt])
  @@index([organizationId])
}

enum TripStatus {
  DRAFT
  VALIDATED
  DISPATCHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  ARCHIVED
}
```

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/trips` | Bearer | Admin, FM, Disp, Fin | List trips (filtered) |
| GET | `/trips/:id` | Bearer | All | Trip detail |
| POST | `/trips` | Bearer | Admin, FM, Disp | Create trip (DRAFT) |
| PUT | `/trips/:id` | Bearer | Admin, FM, Disp | Update trip |
| POST | `/trips/:id/validate` | Bearer | Admin, FM, Disp | Run validation checks |
| POST | `/trips/:id/dispatch` | Bearer | Admin, FM, Disp | Dispatch trip |
| POST | `/trips/:id/start` | Bearer | Driver | Start trip |
| POST | `/trips/:id/complete` | Bearer | Driver | Complete trip |
| POST | `/trips/:id/cancel` | Bearer | Admin, FM, Disp | Cancel trip |
| POST | `/trips/:id/tracking-link` | Bearer | Dispatcher | Generate ETA link |
| GET | `/trips/track/:token` | Public | — | Public tracking page |
| GET | `/trips/:id/expenses` | Bearer | All | Trip expenses |
| GET | `/trips/:id/fuel-logs` | Bearer | All | Trip fuel logs |
| GET | `/trips/my-trips` | Bearer | Driver | Driver's assigned trips |

---

## Business Rules

1. Vehicle must be AVAILABLE for assignment
2. Driver must be AVAILABLE with valid license
3. Cargo weight cannot exceed vehicle capacity
4. Driver license category must authorize the vehicle type
5. No duplicate vehicle/driver assignments across active trips
6. Trip completion auto-restores vehicle and driver to AVAILABLE
7. Trip cancellation auto-restores vehicle and driver to AVAILABLE
8. Odometer at trip end must be ≥ odometer at trip start
9. Actual distance = endOdometer - startOdometer
10. Net profit auto-calculated: revenue - fuelCost - totalExpenses
11. Trip number auto-generated: TRP-{YEAR}-{SEQ}
12. Failed pre-trip inspection blocks dispatch
