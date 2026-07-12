# Module 14 — Digital Vehicle Inspection

## Overview

Pre-trip digital checklist that drivers complete before dispatch. Failed inspections block trip dispatch, ensuring vehicle safety compliance. Results are stored, auditable, and linked to trips and vehicles.

---

## Inspection Checklist

| # | Item | Category | Pass Criteria |
|---|---|---|---|
| 1 | Tyres (condition, pressure, tread) | Safety | All tyres adequate |
| 2 | Brakes (pedal, handbrake) | Safety | Functional |
| 3 | Lights (headlights, indicators, brake lights) | Safety | All working |
| 4 | Mirrors (side, rear) | Safety | Present, clean, adjusted |
| 5 | Engine Oil Level | Mechanical | Within range |
| 6 | Coolant Level | Mechanical | Within range |
| 7 | Battery (terminals, charge) | Electrical | Charged, clean terminals |
| 8 | Windshield (cracks, wipers) | Safety | Clear visibility |
| 9 | Seatbelts | Safety | Functional |
| 10 | Horn | Safety | Working |
| 11 | Fire Extinguisher | Emergency | Present, charged |
| 12 | First Aid Kit | Emergency | Present, stocked |
| 13 | Vehicle Cleanliness | General | Acceptable |
| 14 | Dashboard Warning Lights | Mechanical | No critical warnings |

Each item: **PASS**, **FAIL**, or **N/A** with optional photo and notes.

---

## Inspection Result

```
ALL items PASS or N/A → Overall: PASSED → Dispatch allowed
ANY Safety item FAIL  → Overall: FAILED → Dispatch BLOCKED
Only non-safety FAIL  → Overall: CONDITIONAL → Warning, dispatch allowed
```

---

## Data Model

```prisma
model Inspection {
  id          String           @id @default(cuid())
  
  vehicleId   String
  vehicle     Vehicle          @relation(fields: [vehicleId], references: [id])
  tripId      String?          @unique
  trip        Trip?            @relation(fields: [tripId], references: [id])
  driverId    String
  
  status      InspectionStatus @default(IN_PROGRESS)
  result      InspectionResult?
  
  items       InspectionItem[]
  
  notes       String?
  completedAt DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([vehicleId])
  @@index([tripId])
  @@index([organizationId])
}

model InspectionItem {
  id            String     @id @default(cuid())
  inspectionId  String
  inspection    Inspection @relation(fields: [inspectionId], references: [id])
  
  itemName      String
  category      String     // Safety, Mechanical, Electrical, Emergency, General
  result        ItemResult @default(PENDING)
  notes         String?
  photoUrl      String?
  
  createdAt     DateTime   @default(now())
}

enum InspectionStatus {
  IN_PROGRESS
  COMPLETED
}

enum InspectionResult {
  PASSED
  FAILED
  CONDITIONAL
}

enum ItemResult {
  PENDING
  PASS
  FAIL
  NA
}
```

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/inspections` | Bearer | Driver, FM | Start inspection |
| GET | `/inspections/:id` | Bearer | All | Inspection detail |
| PUT | `/inspections/:id/items/:itemId` | Bearer | Driver | Update item result |
| POST | `/inspections/:id/complete` | Bearer | Driver | Submit inspection |
| GET | `/inspections/vehicle/:vehicleId` | Bearer | All | Vehicle inspection history |
| GET | `/inspections/trip/:tripId` | Bearer | All | Trip's inspection |

---

## Business Rules

1. Only one active (IN_PROGRESS) inspection per vehicle at a time
2. All items must be answered (PASS, FAIL, or N/A) before submission
3. Failed safety item → overall FAILED → trip dispatch blocked
4. Inspection results feed into vehicle health score calculation
5. Inspection photos stored via Cloudinary / local storage
6. Completed inspections are immutable (no edits after submission)
