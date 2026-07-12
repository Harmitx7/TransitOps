# Module 06 — Maintenance Management

## Overview

Preventive, scheduled, corrective, and emergency maintenance tracking with automatic vehicle status management, cost recording, and parts inventory. Integrates with predictive maintenance AI for proactive scheduling.

---

## Maintenance Types

| Type | Trigger | Priority |
|---|---|---|
| **Preventive** | Mileage threshold or time interval | Medium |
| **Scheduled** | Calendar-based (manufacturer recommendation) | Low |
| **Corrective** | Breakdown or defect reported | High |
| **Emergency** | Critical failure, safety hazard | Critical |

---

## Maintenance Lifecycle

```
SCHEDULED → IN_PROGRESS → COMPLETED
                            ↓
                         CANCELLED
```

### State Transitions

| From | To | Trigger | Side Effects |
|---|---|---|---|
| SCHEDULED | IN_PROGRESS | Work begins | Vehicle → MAINTENANCE |
| IN_PROGRESS | COMPLETED | Work finished | Vehicle → AVAILABLE, health score recalc |
| SCHEDULED | CANCELLED | Manual cancel | — |

---

## Data Model

```prisma
model MaintenanceRecord {
  id              String            @id @default(cuid())
  maintenanceNumber String          @unique  // MNT-2026-00001
  
  vehicleId       String
  vehicle         Vehicle           @relation(fields: [vehicleId], references: [id])
  
  type            MaintenanceType
  priority        Priority          @default(MEDIUM)
  status          MaintenanceStatus @default(SCHEDULED)
  
  problem         String
  description     String?
  resolution      String?
  
  scheduledDate   DateTime
  startedDate     DateTime?
  completedDate   DateTime?
  
  laborCost       Float             @default(0)
  partsCost       Float             @default(0)
  totalCost       Float             @default(0) // labor + parts
  
  odometerAtService Float?
  serviceProvider String?           // workshop name
  
  createdBy       String
  notes           String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  organizationId  String
  organization    Organization      @relation(fields: [organizationId], references: [id])
  parts           MaintenancePart[]

  @@index([vehicleId])
  @@index([status])
  @@index([scheduledDate])
  @@index([organizationId])
}

model MaintenancePart {
  id              String           @id @default(cuid())
  maintenanceId   String
  maintenance     MaintenanceRecord @relation(fields: [maintenanceId], references: [id])
  partName        String
  partNumber      String?
  quantity        Int              @default(1)
  unitCost        Float
  totalCost       Float            // quantity × unitCost
  createdAt       DateTime         @default(now())
}

enum MaintenanceType {
  PREVENTIVE
  SCHEDULED
  CORRECTIVE
  EMERGENCY
}

enum MaintenanceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum Priority {
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
| GET | `/maintenance` | Bearer | Admin, FM | List records (filtered) |
| GET | `/maintenance/:id` | Bearer | Admin, FM | Record detail |
| POST | `/maintenance` | Bearer | Admin, FM | Create record |
| PUT | `/maintenance/:id` | Bearer | Admin, FM | Update record |
| POST | `/maintenance/:id/start` | Bearer | Admin, FM | Begin work |
| POST | `/maintenance/:id/complete` | Bearer | Admin, FM | Mark complete |
| POST | `/maintenance/:id/cancel` | Bearer | Admin, FM | Cancel |
| POST | `/maintenance/:id/parts` | Bearer | Admin, FM | Add part |
| DELETE | `/maintenance/:id/parts/:partId` | Bearer | Admin, FM | Remove part |
| GET | `/maintenance/vehicle/:vehicleId` | Bearer | All | Vehicle maintenance history |
| GET | `/maintenance/upcoming` | Bearer | Admin, FM | Due within 7 days |
| GET | `/maintenance/overdue` | Bearer | Admin, FM | Past due date |

---

## Business Rules

1. Creating maintenance with IN_PROGRESS status sets vehicle to MAINTENANCE
2. Completing maintenance restores vehicle to AVAILABLE
3. Cannot create maintenance for a RETIRED vehicle
4. Total cost auto-calculated: laborCost + SUM(parts.totalCost)
5. Overdue maintenance triggers notifications at 1/3/7 day marks
6. Emergency maintenance creates a CRITICAL notification to Fleet Manager
7. Maintenance completion triggers vehicle health score recalculation
8. Cannot complete maintenance without recording resolution notes

---

## Preventive Maintenance Schedule

Default thresholds (configurable per vehicle):

| Service | Mileage Interval | Time Interval |
|---|---|---|
| Oil Change | Every 10,000 km | Every 3 months |
| Brake Inspection | Every 20,000 km | Every 6 months |
| Tire Rotation | Every 15,000 km | Every 4 months |
| Battery Check | Every 25,000 km | Every 6 months |
| Full Service | Every 40,000 km | Every 12 months |
| AC Service | — | Every 12 months |

The system auto-generates maintenance reminders based on these thresholds cross-referenced with vehicle odometer readings.
