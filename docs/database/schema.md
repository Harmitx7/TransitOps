# TransitOps — Database Schema

## Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ═══════════════════════════════════════════
// ORGANIZATION
// ═══════════════════════════════════════════

model Organization {
  id        String   @id @default(cuid())
  name      String
  address   String?
  phone     String?
  email     String?
  logoUrl   String?
  settings  Json?    // General settings (timezone, currency, etc.)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users              User[]
  vehicles           Vehicle[]
  drivers            Driver[]
  trips              Trip[]
  maintenanceRecords MaintenanceRecord[]
  fuelLogs           FuelLog[]
  expenses           Expense[]
  inspections        Inspection[]
  notifications      Notification[]
}

// ═══════════════════════════════════════════
// AUTHENTICATION & USERS
// ═══════════════════════════════════════════

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  role          Role      @default(DRIVER)
  phone         String?
  avatar        String?
  isActive      Boolean   @default(true)
  lastLogin     DateTime?
  refreshToken  String?
  resetToken    String?
  resetExpiry   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  driver         Driver?
  notifications  Notification[]
  auditLogs      AuditLog[]

  @@index([email])
  @@index([role])
  @@index([organizationId])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

enum Role {
  ADMIN
  FLEET_MANAGER
  DISPATCHER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
  DRIVER
}

// ═══════════════════════════════════════════
// VEHICLES
// ═══════════════════════════════════════════

model Vehicle {
  id                 String        @id @default(cuid())
  registrationNumber String        @unique
  model              String
  make               String
  year               Int
  type               VehicleType
  capacity           Float
  capacityUnit       CapacityUnit
  currentOdometer    Float         @default(0)
  acquisitionCost    Float?
  acquisitionDate    DateTime?
  status             VehicleStatus @default(AVAILABLE)
  healthScore        Float         @default(100)
  fuelType           FuelType      @default(DIESEL)
  fuelEfficiency     Float?
  tankCapacity       Float?
  qrCode             String?
  currentLat         Float?
  currentLng         Float?
  notes              String?
  isDeleted          Boolean       @default(false)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  documents      VehicleDocument[]
  trips          Trip[]
  fuelLogs       FuelLog[]
  maintenance    MaintenanceRecord[]
  inspections    Inspection[]
  timelineEvents TimelineEvent[]

  @@index([status])
  @@index([type])
  @@index([registrationNumber])
  @@index([organizationId])
}

model VehicleDocument {
  id         String       @id @default(cuid())
  vehicleId  String
  vehicle    Vehicle      @relation(fields: [vehicleId], references: [id])
  type       DocumentType
  fileUrl    String
  fileName   String
  issuedDate DateTime?
  expiryDate DateTime?
  status     DocStatus    @default(VALID)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  @@index([vehicleId])
  @@index([expiryDate])
}

model TimelineEvent {
  id          String            @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle           @relation(fields: [vehicleId], references: [id])
  type        TimelineEventType
  title       String
  description String?
  metadata    Json?
  createdAt   DateTime          @default(now())

  @@index([vehicleId, createdAt])
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

// ═══════════════════════════════════════════
// DRIVERS
// ═══════════════════════════════════════════

model Driver {
  id               String          @id @default(cuid())
  employeeId       String          @unique
  firstName        String
  lastName         String
  email            String?
  phone            String
  dateOfBirth      DateTime
  address          String?
  emergencyContact String?
  emergencyPhone   String?
  licenseNumber    String          @unique
  licenseCategory  LicenseCategory
  licenseExpiry    DateTime
  licenseStatus    LicenseStatus   @default(VALID)
  status           DriverStatus    @default(AVAILABLE)
  safetyScore      Float           @default(100)
  healthStatus     HealthStatus    @default(FIT)
  faceProfileUrl   String?
  faceEmbedding    Json?
  totalTrips       Int             @default(0)
  totalKm          Float           @default(0)
  totalHours       Float           @default(0)
  notes            String?
  isDeleted        Boolean         @default(false)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  trips          Trip[]
  safetyEvents   SafetyEvent[]
  userId         String?      @unique
  user           User?        @relation(fields: [userId], references: [id])

  @@index([status])
  @@index([licenseExpiry])
  @@index([organizationId])
}

model SafetyEvent {
  id          String          @id @default(cuid())
  driverId    String
  driver      Driver          @relation(fields: [driverId], references: [id])
  tripId      String?
  trip        Trip?           @relation(fields: [tripId], references: [id])
  type        SafetyEventType
  severity    Severity        @default(MEDIUM)
  description String?
  imageUrl    String?
  metadata    Json?
  createdAt   DateTime        @default(now())

  @@index([driverId])
  @@index([tripId])
  @@index([type])
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  ON_LEAVE
  SUSPENDED
}

enum LicenseCategory {
  LMV
  HMV
  HGMV
  HTV
  LTV
  MCWG
  MCWOG
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

// ═══════════════════════════════════════════
// TRIPS
// ═══════════════════════════════════════════

model Trip {
  id              String     @id @default(cuid())
  tripNumber      String     @unique
  source          String
  sourceLat       Float?
  sourceLng       Float?
  destination     String
  destLat         Float?
  destLng         Float?
  cargoType       String?
  cargoWeight     Float?
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
  distancePlanned Float?
  distanceActual  Float?
  revenue         Float?
  fuelCost        Float?
  totalExpenses   Float?
  netProfit       Float?
  routeData       Json?
  etaMinutes      Int?
  fuelEstimate    Float?
  tollEstimate    Float?
  trackingToken   String?    @unique
  trackingExpiry  DateTime?
  notes           String?
  cancelReason    String?
  createdBy       String
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  fuelLogs       FuelLog[]
  expenses       Expense[]
  inspection     Inspection?
  safetyEvents   SafetyEvent[]

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

// ═══════════════════════════════════════════
// MAINTENANCE
// ═══════════════════════════════════════════

model MaintenanceRecord {
  id                String            @id @default(cuid())
  maintenanceNumber String            @unique
  vehicleId         String
  vehicle           Vehicle           @relation(fields: [vehicleId], references: [id])
  type              MaintenanceType
  priority          Priority          @default(MEDIUM)
  status            MaintenanceStatus @default(SCHEDULED)
  problem           String
  description       String?
  resolution        String?
  scheduledDate     DateTime
  startedDate       DateTime?
  completedDate     DateTime?
  laborCost         Float             @default(0)
  partsCost         Float             @default(0)
  totalCost         Float             @default(0)
  odometerAtService Float?
  serviceProvider   String?
  createdBy         String
  notes             String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  parts          MaintenancePart[]

  @@index([vehicleId])
  @@index([status])
  @@index([scheduledDate])
  @@index([organizationId])
}

model MaintenancePart {
  id            String            @id @default(cuid())
  maintenanceId String
  maintenance   MaintenanceRecord @relation(fields: [maintenanceId], references: [id])
  partName      String
  partNumber    String?
  quantity      Int               @default(1)
  unitCost      Float
  totalCost     Float
  createdAt     DateTime          @default(now())
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

// ═══════════════════════════════════════════
// FUEL & EXPENSES
// ═══════════════════════════════════════════

model FuelLog {
  id             String   @id @default(cuid())
  vehicleId      String
  vehicle        Vehicle  @relation(fields: [vehicleId], references: [id])
  tripId         String?
  trip           Trip?    @relation(fields: [tripId], references: [id])
  driverId       String?
  fuelType       FuelType
  liters         Float
  costPerLiter   Float
  totalCost      Float
  odometer       Float
  station        String?
  receiptUrl     String?
  isAnomaly      Boolean  @default(false)
  anomalyReason  String?
  loggedAt       DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([vehicleId])
  @@index([tripId])
  @@index([loggedAt])
  @@index([organizationId])
}

model Expense {
  id             String          @id @default(cuid())
  vehicleId      String?
  tripId         String?
  trip           Trip?           @relation(fields: [tripId], references: [id])
  category       ExpenseCategory
  description    String
  amount         Float
  receiptUrl     String?
  expenseDate    DateTime
  approvedBy     String?
  isApproved     Boolean         @default(false)
  createdBy      String
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

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

// ═══════════════════════════════════════════
// INSPECTIONS
// ═══════════════════════════════════════════

model Inspection {
  id          String            @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle           @relation(fields: [vehicleId], references: [id])
  tripId      String?           @unique
  trip        Trip?             @relation(fields: [tripId], references: [id])
  driverId    String
  status      InspectionStatus  @default(IN_PROGRESS)
  result      InspectionResult?
  notes       String?
  completedAt DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  items          InspectionItem[]

  @@index([vehicleId])
  @@index([tripId])
  @@index([organizationId])
}

model InspectionItem {
  id           String     @id @default(cuid())
  inspectionId String
  inspection   Inspection @relation(fields: [inspectionId], references: [id])
  itemName     String
  category     String
  result       ItemResult @default(PENDING)
  notes        String?
  photoUrl     String?
  createdAt    DateTime   @default(now())
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

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════

model Notification {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id])
  type        NotificationType
  title       String
  message     String
  severity    Severity         @default(MEDIUM)
  isRead      Boolean          @default(false)
  readAt      DateTime?
  actionUrl   String?
  metadata    Json?
  emailSent   Boolean          @default(false)
  emailSentAt DateTime?
  createdAt   DateTime         @default(now())

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([userId, isRead])
  @@index([type])
  @@index([createdAt])
  @@index([organizationId])
}

enum NotificationType {
  LICENSE_EXPIRY
  DOCUMENT_EXPIRY
  MAINTENANCE_DUE
  MAINTENANCE_OVERDUE
  FUEL_ANOMALY
  VEHICLE_BREAKDOWN
  TRIP_DELAY
  DROWSINESS_ALERT
  SEATBELT_VIOLATION
  INSPECTION_FAILURE
  UNAUTHORIZED_DRIVER
  HEALTH_SCORE_DROP
}
```

---

## Index Strategy

| Table | Indexed Columns | Purpose |
|---|---|---|
| User | email, role, organizationId | Login lookup, role filtering |
| Vehicle | status, type, registrationNumber, organizationId | Filtering, search |
| Driver | status, licenseExpiry, organizationId | Availability check, expiry alerts |
| Trip | status, vehicleId, driverId, scheduledAt, organizationId | Status filtering, assignment lookup |
| MaintenanceRecord | vehicleId, status, scheduledDate, organizationId | Vehicle history, due dates |
| FuelLog | vehicleId, tripId, loggedAt, organizationId | History, reporting |
| Expense | category, vehicleId, tripId, expenseDate, organizationId | Reporting |
| Notification | userId+isRead, type, createdAt, organizationId | Unread fetch |
| TimelineEvent | vehicleId+createdAt | Chronological display |

---

## Seed Data

The project includes a comprehensive seed script (`prisma/seed.ts`) that populates:
- 1 organization
- 6 users (one per role) with password: `TransitOps@2026`
- 15 vehicles with documents
- 10 drivers with face profiles
- 30 trips across all statuses
- 50 fuel logs
- 20 maintenance records
- 25 expenses
- 15 inspections
- 40 notifications
- 100 timeline events
