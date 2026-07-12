# Module 03 — Vehicle Registry

## Overview

Centralized vehicle inventory with full document management, QR-code access, health scoring, and automatic status management. Every vehicle gets a complete digital identity from registration to retirement.

---

## Features

### 3.1 Vehicle Registration

- Unique registration number enforcement (case-insensitive, format validated)
- Support for vehicle types: Truck, Bus, Van, Car, Bike, Auto
- Automatic QR code generation on registration
- Document upload with expiry tracking
- Initial health score: 100

### 3.2 Vehicle Documents

Each vehicle stores these documents with expiry monitoring:

| Document | Required | Expiry Tracked | Alert Window |
|---|---|---|---|
| Registration Certificate (RC) | Yes | Yes | 30 days |
| Insurance | Yes | Yes | 30 days |
| PUC Certificate | Yes | Yes | 15 days |
| Fitness Certificate | Yes | Yes | 30 days |
| Permit | Conditional | Yes | 30 days |

### 3.3 QR Code System

- Auto-generated QR encodes: `transitops://vehicle/{vehicleId}`
- Scanning opens the vehicle profile page showing:
  - Vehicle details & status
  - Document status (valid/expiring/expired)
  - Recent trips
  - Fuel history
  - Maintenance records
  - Current health score

### 3.4 Vehicle Status Lifecycle

```
AVAILABLE → ON_TRIP (via trip dispatch)
AVAILABLE → MAINTENANCE (via maintenance creation)
ON_TRIP → AVAILABLE (via trip completion)
MAINTENANCE → AVAILABLE (via maintenance closure)
ANY → RETIRED (manual, irreversible for dispatch)
```

Status transitions are automatic — no manual status toggling.

### 3.5 Vehicle Health Score (0-100)

Calculated from weighted factors:

| Factor | Weight | Scoring |
|---|---|---|
| Mileage Since Service | 25% | Degrades linearly past threshold |
| Service History Regularity | 20% | On-time services boost score |
| Breakdown Frequency | 20% | Each breakdown deducts points |
| Fuel Efficiency Trend | 15% | Declining efficiency reduces score |
| Last Inspection Result | 10% | Failed inspection = -20 points |
| Document Compliance | 10% | Expired docs = -15 points each |

Recalculated: hourly via cron job + on-demand after relevant events.

---

## Data Model

```prisma
model Vehicle {
  id                String        @id @default(cuid())
  registrationNumber String       @unique
  model             String
  make              String
  year              Int
  type              VehicleType
  capacity          Float         // in tons or passengers
  capacityUnit      CapacityUnit  // TONS, PASSENGERS
  currentOdometer   Float         @default(0)
  acquisitionCost   Float?
  acquisitionDate   DateTime?
  status            VehicleStatus @default(AVAILABLE)
  healthScore       Float         @default(100)
  fuelType          FuelType      @default(DIESEL)
  fuelEfficiency    Float?        // km per liter baseline
  qrCode            String?
  notes             String?
  isDeleted         Boolean       @default(false)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  organizationId    String
  organization      Organization  @relation(fields: [organizationId], references: [id])
  documents         VehicleDocument[]
  trips             Trip[]
  fuelLogs          FuelLog[]
  maintenance       MaintenanceRecord[]
  inspections       Inspection[]
  timelineEvents    TimelineEvent[]

  @@index([status])
  @@index([type])
  @@index([organizationId])
}

model VehicleDocument {
  id          String       @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle      @relation(fields: [vehicleId], references: [id])
  type        DocumentType
  fileUrl     String
  fileName    String
  issuedDate  DateTime?
  expiryDate  DateTime?
  status      DocStatus    @default(VALID)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

enum VehicleType {
  TRUCK
  BUS
  VAN
  CAR
  BIKE
  AUTO
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  MAINTENANCE
  RETIRED
}

enum FuelType {
  DIESEL
  PETROL
  CNG
  ELECTRIC
}

enum CapacityUnit {
  TONS
  PASSENGERS
}

enum DocumentType {
  RC
  INSURANCE
  PUC
  FITNESS
  PERMIT
}

enum DocStatus {
  VALID
  EXPIRING
  EXPIRED
}
```

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/vehicles` | Bearer | All | List vehicles (paginated, filtered) |
| GET | `/vehicles/:id` | Bearer | All | Vehicle detail with documents |
| POST | `/vehicles` | Bearer | Admin, Fleet Mgr | Create vehicle |
| PUT | `/vehicles/:id` | Bearer | Admin, Fleet Mgr | Update vehicle |
| DELETE | `/vehicles/:id` | Bearer | Admin | Soft delete |
| GET | `/vehicles/:id/qr` | Bearer | All | Get QR code image |
| POST | `/vehicles/:id/documents` | Bearer | Admin, Fleet Mgr | Upload document |
| DELETE | `/vehicles/:id/documents/:docId` | Bearer | Admin, Fleet Mgr | Remove document |
| GET | `/vehicles/:id/health` | Bearer | All | Health score breakdown |
| GET | `/vehicles/:id/timeline` | Bearer | All | Full vehicle timeline |
| GET | `/vehicles/search` | Bearer | All | Search by registration |

### Query Parameters

```
GET /vehicles?page=1&limit=20&status=AVAILABLE&type=TRUCK&sort=healthScore&order=asc&search=MH12
```

---

## Validation Rules

| Field | Rule |
|---|---|
| registrationNumber | Unique, uppercase, Indian format (e.g., MH12AB1234) |
| model | 2-100 chars |
| type | One of VehicleType enum |
| capacity | Positive number |
| currentOdometer | >= 0, >= previous value |
| acquisitionCost | Positive number if provided |

---

## Business Rules

1. Registration number must be unique across the organization
2. Cannot dispatch a vehicle with status RETIRED or MAINTENANCE
3. Cannot delete a vehicle that has active trips
4. Document expiry triggers automatic notification at 30/15/7/1 day marks
5. Health score recalculates after: maintenance completion, trip completion, inspection, fuel log entry
6. Odometer only increases (validated server-side)
7. QR code auto-regenerates if vehicle ID changes (edge case on data migration)
