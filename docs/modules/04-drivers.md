# Module 04 — Driver Management

## Overview

Complete driver lifecycle management from onboarding to assignment, compliance tracking, safety scoring, and face profile registration for computer vision verification.

---

## Features

### 4.1 Driver Registration

- Personal details, contact, emergency contact
- License details with category and expiry tracking
- Face profile photo for CV verification
- Initial safety score: 100
- Health status declaration

### 4.2 Driver Status Lifecycle

```
AVAILABLE → ON_TRIP (via trip dispatch)
AVAILABLE → ON_LEAVE (manual)
ON_TRIP → AVAILABLE (via trip completion)
ON_LEAVE → AVAILABLE (manual)
ANY → SUSPENDED (admin action)
SUSPENDED → AVAILABLE (admin action)
```

### 4.3 License Monitoring

- License expiry tracked automatically
- Alerts at 60/30/15/7/1 day marks
- Expired license blocks dispatch assignment
- License category validated against vehicle type

### 4.4 Driver Safety Score (0-100)

| Factor | Weight | Scoring |
|---|---|---|
| Seatbelt Compliance | 25% | % of trips with seatbelt on |
| Drowsiness Events | 20% | Inverse: fewer events = higher score |
| Violation Count | 20% | Traffic/safety violations |
| Trip Completion Rate | 15% | Completed trips / Assigned trips |
| Driving Hours Compliance | 10% | Within legal limits |
| Inspection Pass Rate | 10% | Pre-trip inspections passed |

Recalculated daily via cron + on-demand after safety events.

---

## Data Model

```prisma
model Driver {
  id              String       @id @default(cuid())
  employeeId      String       @unique
  firstName       String
  lastName        String
  email           String?
  phone           String
  dateOfBirth     DateTime
  address         String?
  emergencyContact String?
  emergencyPhone  String?
  
  licenseNumber   String       @unique
  licenseCategory LicenseCategory
  licenseExpiry   DateTime
  licenseStatus   LicenseStatus @default(VALID)
  
  status          DriverStatus @default(AVAILABLE)
  safetyScore     Float        @default(100)
  healthStatus    HealthStatus @default(FIT)
  faceProfileUrl  String?      // Face image for CV verification
  faceEmbedding   Json?        // Face encoding vector
  
  totalTrips      Int          @default(0)
  totalKm         Float        @default(0)
  totalHours      Float        @default(0)
  
  notes           String?
  isDeleted       Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  trips           Trip[]
  safetyEvents    SafetyEvent[]
  userId          String?      @unique
  user            User?        @relation(fields: [userId], references: [id])

  @@index([status])
  @@index([licenseExpiry])
  @@index([organizationId])
}

model SafetyEvent {
  id          String        @id @default(cuid())
  driverId    String
  driver      Driver        @relation(fields: [driverId], references: [id])
  tripId      String?
  trip        Trip?         @relation(fields: [tripId], references: [id])
  type        SafetyEventType
  severity    Severity      @default(MEDIUM)
  description String?
  imageUrl    String?       // CV capture screenshot
  metadata    Json?         // Detection confidence, coordinates, etc.
  createdAt   DateTime      @default(now())
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  ON_LEAVE
  SUSPENDED
}

enum LicenseCategory {
  LMV        // Light Motor Vehicle
  HMV        // Heavy Motor Vehicle
  HGMV       // Heavy Goods Motor Vehicle
  HTV        // Heavy Transport Vehicle
  LTV        // Light Transport Vehicle
  MCWG       // Motorcycle With Gear
  MCWOG      // Motorcycle Without Gear
}

enum LicenseStatus {
  VALID
  EXPIRING
  EXPIRED
  SUSPENDED
}

enum HealthStatus {
  FIT
  UNFIT
  UNDER_REVIEW
}

enum SafetyEventType {
  SEATBELT_VIOLATION
  DROWSINESS_DETECTED
  UNAUTHORIZED_DRIVER
  OVERSPEEDING
  HARSH_BRAKING
  HOURS_EXCEEDED
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/drivers` | Bearer | Admin, FM, Disp, Safety | List drivers |
| GET | `/drivers/:id` | Bearer | All | Driver detail |
| POST | `/drivers` | Bearer | Admin, FM | Create driver |
| PUT | `/drivers/:id` | Bearer | Admin, FM, Safety | Update driver |
| DELETE | `/drivers/:id` | Bearer | Admin | Soft delete |
| POST | `/drivers/:id/face-profile` | Bearer | Admin, FM | Upload face photo |
| GET | `/drivers/:id/safety-events` | Bearer | Admin, FM, Safety | Safety event history |
| GET | `/drivers/:id/safety-score` | Bearer | All | Score breakdown |
| GET | `/drivers/:id/trips` | Bearer | All | Trip history |
| GET | `/drivers/expiring-licenses` | Bearer | Admin, FM, Safety | Licenses expiring soon |
| GET | `/drivers/available` | Bearer | Dispatcher | Available for assignment |

---

## Validation Rules

| Field | Rule |
|---|---|
| employeeId | Unique, alphanumeric, 4-20 chars |
| firstName, lastName | 2-50 chars, alphabetic |
| phone | Valid Indian mobile (10 digits) |
| licenseNumber | Unique, Indian format |
| licenseExpiry | Future date on creation |
| dateOfBirth | Must be 18+ years old |
| licenseCategory | Must match allowed vehicle types |

---

## Business Rules

1. Cannot assign a driver with status SUSPENDED or ON_LEAVE to a trip
2. Cannot assign a driver with expired license
3. Cannot assign a driver already ON_TRIP (no double-booking)
4. License category must match vehicle type (e.g., HMV for trucks)
5. Driver automatically set to ON_TRIP when trip dispatched, AVAILABLE on completion
6. Safety events with CRITICAL severity trigger automatic admin notification
7. Driving hours per day capped at 10 hours (legal compliance)
8. Face profile required for computer vision verification feature
