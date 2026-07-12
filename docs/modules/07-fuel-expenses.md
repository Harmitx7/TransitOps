# Module 07 — Fuel & Expense Management

## Overview

Comprehensive fuel tracking and operational expense management. Every cost is categorized, linked to trips/vehicles, and feeds into financial analytics. Anomaly detection flags unusual fuel consumption patterns.

---

## Fuel Logs

### Features

- Per-trip or standalone fuel entries
- Odometer validation (must increase)
- Automatic fuel efficiency calculation (km/liter)
- Anomaly detection: flags entries > 2 standard deviations from vehicle average
- Fuel cost aggregation by vehicle, driver, trip, and period

### Data Model

```prisma
model FuelLog {
  id            String    @id @default(cuid())
  
  vehicleId     String
  vehicle       Vehicle   @relation(fields: [vehicleId], references: [id])
  tripId        String?
  trip          Trip?     @relation(fields: [tripId], references: [id])
  driverId      String?
  
  fuelType      FuelType
  liters        Float
  costPerLiter  Float
  totalCost     Float     // liters × costPerLiter
  odometer      Float
  
  station       String?   // fuel station name
  receiptUrl    String?   // photo of receipt
  
  isAnomaly     Boolean   @default(false)
  anomalyReason String?
  
  loggedAt      DateTime  @default(now())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([vehicleId])
  @@index([tripId])
  @@index([loggedAt])
  @@index([organizationId])
}
```

### Anomaly Detection Logic

```
vehicleAvg = AVG(km/liter) for last 20 entries
vehicleStdDev = STDDEV(km/liter) for last 20 entries
currentEfficiency = (currentOdometer - previousOdometer) / liters

IF currentEfficiency < (vehicleAvg - 2 * vehicleStdDev):
  → Flag as anomaly: "Unusually low fuel efficiency"
IF currentEfficiency > (vehicleAvg + 2 * vehicleStdDev):
  → Flag as anomaly: "Unusually high fuel efficiency (possible error)"
IF liters > vehicleCapacity * 1.1:
  → Flag as anomaly: "Fuel quantity exceeds tank capacity"
```

---

## Expenses

### Categories

| Category | Examples |
|---|---|
| TOLL | Highway tolls, bridge fees |
| PARKING | Parking charges |
| MAINTENANCE | Repair costs (linked to maintenance records) |
| INSURANCE | Insurance premiums |
| PERMIT | Permit fees, road tax |
| FINE | Traffic violations, penalties |
| MISCELLANEOUS | Other operational costs |

### Data Model

```prisma
model Expense {
  id            String        @id @default(cuid())
  
  vehicleId     String?
  tripId        String?
  trip          Trip?         @relation(fields: [tripId], references: [id])
  
  category      ExpenseCategory
  description   String
  amount        Float
  receiptUrl    String?
  
  expenseDate   DateTime
  approvedBy    String?
  isApproved    Boolean       @default(false)
  
  createdBy     String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([category])
  @@index([vehicleId])
  @@index([tripId])
  @@index([expenseDate])
  @@index([organizationId])
}

enum ExpenseCategory {
  TOLL
  PARKING
  MAINTENANCE
  INSURANCE
  PERMIT
  FINE
  MISCELLANEOUS
}
```

---

## API Endpoints

### Fuel Logs

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/fuel-logs` | Bearer | Admin, FM, Fin | List fuel logs |
| GET | `/fuel-logs/:id` | Bearer | All | Fuel log detail |
| POST | `/fuel-logs` | Bearer | Admin, FM, Driver | Create fuel log |
| PUT | `/fuel-logs/:id` | Bearer | Admin, FM | Update fuel log |
| DELETE | `/fuel-logs/:id` | Bearer | Admin | Delete fuel log |
| GET | `/fuel-logs/vehicle/:vehicleId` | Bearer | All | Vehicle fuel history |
| GET | `/fuel-logs/anomalies` | Bearer | Admin, FM, Fin | Flagged anomalies |
| GET | `/fuel-logs/stats` | Bearer | Admin, FM, Fin | Fuel statistics |

### Expenses

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/expenses` | Bearer | Admin, FM, Fin | List expenses |
| GET | `/expenses/:id` | Bearer | All | Expense detail |
| POST | `/expenses` | Bearer | Admin, FM, Disp, Driver | Create expense |
| PUT | `/expenses/:id` | Bearer | Admin, FM, Fin | Update expense |
| DELETE | `/expenses/:id` | Bearer | Admin | Delete expense |
| POST | `/expenses/:id/approve` | Bearer | Admin, Fin | Approve expense |
| GET | `/expenses/summary` | Bearer | Admin, FM, Fin | Expense breakdown |

---

## Validation Rules

### Fuel Logs

| Field | Rule |
|---|---|
| liters | > 0, max 500 |
| costPerLiter | > 0 |
| odometer | > previous odometer for vehicle |
| vehicleId | Must exist, not RETIRED |
| tripId | Must exist if provided, must belong to same vehicle |

### Expenses

| Field | Rule |
|---|---|
| amount | > 0 |
| category | One of ExpenseCategory enum |
| expenseDate | Cannot be future date |
| description | 3-500 chars |

---

## Automatic Calculations

| Calculation | Formula |
|---|---|
| Fuel total cost | liters × costPerLiter |
| Trip fuel cost | SUM(fuelLogs.totalCost) WHERE tripId |
| Trip total expenses | SUM(expenses.amount) WHERE tripId |
| Trip net profit | revenue - fuelCost - totalExpenses |
| Vehicle monthly fuel cost | SUM(fuelLogs.totalCost) WHERE vehicleId AND month |
| Fleet fuel cost | SUM(all fuelLogs.totalCost) for period |
| Cost per km | Total costs / Total km driven |
