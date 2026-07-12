# TransitOps: 8-Hour Hackathon Implementation Plan

> **Strategy:** 100% Frontend + Partial Backend (mock-ready) + Full Database  
> **Stack:** Vite + React 18 + TypeScript + Vanilla CSS + Node/Express + Prisma/PostgreSQL  
> **Theme:** Industrial Neomorphic ("GaugeOS")  
> **No:** emojis, em dashes, shadcn, Tailwind, purple/violet, mesh gradients, AI-generic rounded boxes

---

## PART 1: Design System + Theme + Layout

---

### 1.1 Color Palette (HSL-based, Light + Dark)

```css
:root {
  --hue: 220;
  --bg-base: hsl(220, 12%, 95%);
  --bg-surface: hsl(220, 15%, 99%);
  --bg-sunken: hsl(220, 10%, 90%);
  --bg-sidebar: hsl(220, 18%, 16%);

  --text-primary: hsl(220, 25%, 12%);
  --text-secondary: hsl(220, 10%, 45%);
  --text-muted: hsl(220, 8%, 60%);
  --text-inverse: hsl(220, 10%, 92%);

  --accent-primary: hsl(16, 85%, 55%);   /* Warm Copper #E06430 */
  --accent-success: hsl(152, 55%, 42%);  /* Muted Teal */
  --accent-warning: hsl(38, 90%, 55%);   /* Amber */
  --accent-danger: hsl(4, 70%, 52%);     /* Muted Red */
  --accent-info: hsl(200, 60%, 48%);     /* Steel Blue */

  --neu-light: hsl(220, 15%, 100%);
  --neu-dark: hsl(220, 10%, 82%);
  --neu-shadow-raised: 6px 6px 14px var(--neu-dark), -6px -6px 14px var(--neu-light);
  --neu-shadow-inset: inset 4px 4px 8px var(--neu-dark), inset -4px -4px 8px var(--neu-light);
  --neu-shadow-subtle: 3px 3px 6px var(--neu-dark), -3px -3px 6px var(--neu-light);

  --radius-pill: 9999px;
  --radius-round: 50%;
  --radius-card: 16px;
  --radius-inner-curve: 24px;

  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px;

  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}

[data-theme="dark"] {
  --bg-base: hsl(220, 15%, 10%);
  --bg-surface: hsl(220, 14%, 14%);
  --bg-sunken: hsl(220, 12%, 8%);
  --bg-sidebar: hsl(220, 20%, 8%);
  --text-primary: hsl(220, 10%, 90%);
  --text-secondary: hsl(220, 8%, 62%);
  --text-muted: hsl(220, 6%, 45%);
  --neu-light: hsl(220, 12%, 18%);
  --neu-dark: hsl(220, 15%, 5%);
}
```

### 1.2 Typography

```
Font UI: "Inter" (weights: 400, 500, 600, 700)
Font Data: "JetBrains Mono" (weights: 400, 500, 600)

Scale:
  display  -> clamp(1.75rem, 3vw, 2.5rem), 700, -0.02em tracking
  h1       -> 1.5rem, 700, -0.01em
  h2       -> 1.25rem, 600
  h3       -> 1.1rem, 600
  body     -> 0.9375rem, 400, line-height 1.5
  small    -> 0.8125rem, 400
  caption  -> 0.75rem, 500, uppercase, 0.05em tracking
  data     -> JetBrains Mono, 600 (KPI numbers, gauges)
```

### 1.3 Industrial "GaugeOS" Theme Elements

Visual elements that create the mechanical/speedometer look:

| Element | Implementation |
|---|---|
| Screws | 10x10px SVG pseudo-elements in card corners, 0.3 opacity |
| Gauge Ring | conic-gradient circle with inset center for KPI% values |
| Brushed Metal | repeating-linear-gradient horizontal micro-lines |
| Rivets | 2px solid border with subtle dot pattern |
| Dash Marks | SVG tick marks on circular gauges (like speedometer) |
| Panel Seams | 1px border with slight shadow at joins |

### 1.4 Neomorphic Component Primitives

| Component | Shape | Shadow State Default | Shadow State Active |
|---|---|---|---|
| Card | 16px radius | raised (outset) | n/a |
| Input | 12px radius | inset (sunken well) | inset + 2px accent ring |
| Pill Button | 9999px radius | subtle outset | inset (pressed) |
| Round Button | 50% radius | subtle outset | inset (pressed) |
| Toggle | pill track | inset track | accent bg + knob slides |
| Progress Bar | pill track | inset track | gradient fill, animated width |
| Select/Dropdown | 12px radius | inset well | dropdown uses raised shadow |
| Badge | pill shape | subtle outset | n/a |

### 1.5 Layout Architecture

```
DESKTOP (1024px+)
+--------+--------------------------------------------------+
| SIDEBAR|  TOPBAR (logo, search, notifications, user)      |
|  240px |--------------------------------------------------|
|        | MAIN CONTENT (top-left corner: 24px curve)        |
| [nav]  |                                                   |
| [nav]  |   Page content here                              |
| [nav]  |                                                   |
+--------+---------------------------------------------------+

MOBILE (<768px)
+--------------------------------------------------+
|  TOP BAR (logo, notifications, theme toggle)      |
|--------------------------------------------------|
|                                                  |
|  Page content (stacked, smaller elements)        |
|                                                  |
|--------------------------------------------------|
| BOTTOM NAV (5 icons max, no hamburger)           |
+--------------------------------------------------+
```

Key CSS rules:
- `.app-layout` = flex row, min-height: 100vh
- `.sidebar` = fixed left, 240px width, hidden on mobile
- `.topbar` = sticky top, 60px height, neu-subtle shadow
- `.main-content` = border-top-left-radius: 24px (the signature curve)
- `.bottom-nav` = fixed bottom, 64px, hidden on desktop, flex on mobile
- `.main-area` = margin-left: 240px on desktop, 0 on mobile, padding-bottom: 72px on mobile

### 1.6 Sidebar Navigation Items

| Icon (Lucide) | Label | Route | Roles |
|---|---|---|---|
| Gauge | Dashboard | `/` | All |
| Truck | Fleet | `/vehicles` | Admin, FM, Dispatcher |
| Users | Drivers | `/drivers` | Admin, FM, Dispatcher |
| Route | Trips | `/trips` | All |
| Wrench | Maintenance | `/maintenance` | Admin, FM |
| Fuel | Fuel / Expenses | `/fuel` | Admin, FM, Finance |
| FileBarChart | Reports | `/reports` | Admin, FM, Finance |
| MapPin | Live Map | `/map` | Admin, Dispatcher |
| ClipboardCheck | Inspections | `/inspections` | Admin, FM, Safety |
| Camera | CV Monitor | `/cv` | Admin, Safety |
| Brain | AI Dispatch | `/ai` | Admin, Dispatcher |
| Bell | Alerts | `/notifications` | All |
| Settings | Settings | `/settings` | Admin |

### 1.7 Bottom Nav Items (Mobile, max 5)

| Icon | Label | Route |
|---|---|---|
| Gauge | Home | `/` |
| Truck | Fleet | `/vehicles` |
| Route | Trips | `/trips` |
| Users | Drivers | `/drivers` |
| MoreHorizontal | More | opens slide-up sheet with remaining items |

### 1.8 Icon Strategy

No emojis anywhere. All icons from `lucide-react` (SVG).

Custom SVGs for decorative elements stored in `client/src/assets/icons/`:
- `screw.svg`, `gauge-needle.svg`, `logo.svg`, `logo-mark.svg`

Custom textures in `client/src/assets/textures/`:
- `brushed-metal.png`, `noise-grain.png`

### 1.9 Animation Standards

| Type | Duration | Easing | Property |
|---|---|---|---|
| Button press | 150ms | ease-smooth | transform, box-shadow |
| Card hover | 250ms | ease-smooth | transform, box-shadow |
| Page enter | 300ms | ease-out | opacity, translateY |
| Modal enter | 250ms | ease-bounce | opacity, scale |
| Progress fill | 400ms | ease-bounce | width |
| Gauge needle | 800ms | ease-bounce | rotate |
| Data counter | 600ms | linear | JS CountUp |
| Skeleton pulse | 1.5s | ease-in-out infinite | opacity |
| Error shake | 300ms | linear | translateX keyframes |
| Toggle slide | 250ms | ease-bounce | transform |

---

## PART 2: Tech Stack + Database + Backend Scaffold

---

### 2.1 Tech Stack Decisions

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Vite + React 18 + TypeScript | Fast HMR, type safety |
| Styling | Vanilla CSS (custom properties) | Full control, no framework lock-in |
| State | Zustand | Minimal boilerplate, no context hell |
| Data Fetching | @tanstack/react-query | Caching, refetch, loading states |
| Forms | react-hook-form + zod | Validation, minimal re-renders |
| Routing | react-router-dom v6 | Nested layouts, protected routes |
| Charts | Recharts | SVG-based, customizable, lightweight |
| Maps | react-leaflet + leaflet | Free, no API key for dev |
| Icons | lucide-react | Tree-shakeable SVG icons |
| Animations | Framer Motion (minimal) | Page transitions, mount/unmount |
| QR | qrcode.react | Vehicle QR codes |
| PDF | Client: html2canvas + jspdf | Quick PDF from DOM |
| CV (Browser) | @mediapipe/tasks-vision | Drowsiness (face landmarks, EAR) |
| CV (Mobile) | TensorFlow.js | LPR in browser camera |
| i18n | react-i18next | EN, HI, GU |
| Backend | Express + TypeScript | Minimal REST API |
| ORM | Prisma | Type-safe queries, migrations |
| DB | PostgreSQL | Relational, full-text search |
| Auth | jsonwebtoken + bcryptjs | JWT stateless auth |
| Validation | zod (shared schemas) | Server-side input validation |

### 2.2 Project Initialization Commands

```bash
# 1. Frontend
npx -y create-vite@latest client -- --template react-ts
cd client
npm i react-router-dom @tanstack/react-query zustand react-hook-form @hookform/resolvers zod
npm i recharts react-leaflet leaflet qrcode.react framer-motion lucide-react clsx
npm i react-i18next i18next html2canvas jspdf
npm i @mediapipe/tasks-vision
npm i -D @types/leaflet

# 2. Backend
mkdir -p server/src/{config,middleware,routes,controllers,services,validators,utils}
cd server && npm init -y
npm i express cors helmet morgan jsonwebtoken bcryptjs @prisma/client zod dotenv cookie-parser
npm i -D typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs tsx nodemon prisma

# 3. Database
npx prisma init
createdb transitops_dev
# Copy schema from section 2.3 below
npx prisma migrate dev --name init
npx prisma db seed
```

### 2.3 Prisma Schema (Core Models)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  FLEET_MANAGER
  DISPATCHER
  SAFETY_OFFICER
  FINANCE_MANAGER
  DRIVER
}

enum VehicleStatus { AVAILABLE  ON_TRIP  IN_SHOP  RETIRED }
enum DriverStatus  { AVAILABLE  ON_TRIP  ON_LEAVE  SUSPENDED }
enum TripStatus    { DRAFT  SCHEDULED  DISPATCHED  IN_PROGRESS  COMPLETED  CANCELLED }
enum MaintenanceStatus { SCHEDULED  IN_PROGRESS  COMPLETED  CANCELLED }
enum MaintenanceType   { PREVENTIVE  CORRECTIVE  EMERGENCY  INSPECTION }
enum FuelType     { DIESEL  PETROL  CNG  ELECTRIC }
enum ExpenseCategory { FUEL  TOLL  MAINTENANCE  INSURANCE  REGISTRATION  SALARY  OTHER }
enum InspectionStatus { PENDING  PASSED  FAILED }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  firstName    String
  lastName     String
  role         Role
  isActive     Boolean  @default(true)
  lastLogin    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  trips        Trip[]
  fuelLogs     FuelLog[]
  expenses     Expense[]
  inspections  Inspection[]
  auditLogs    AuditLog[]

  @@index([role])
}

model Vehicle {
  id                 String        @id @default(cuid())
  registrationNumber String        @unique
  make               String
  model              String
  year               Int
  type               String        // Truck, Bus, Van, Car
  fuelType           FuelType
  maxLoadCapacity    Float
  currentOdometer    Float         @default(0)
  acquisitionCost    Float
  status             VehicleStatus @default(AVAILABLE)
  healthScore        Float         @default(100)
  qrCode             String?
  insuranceExpiry    DateTime?
  registrationExpiry DateTime?
  fitnessExpiry      DateTime?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  trips        Trip[]
  maintenance  Maintenance[]
  fuelLogs     FuelLog[]
  inspections  Inspection[]
  timeline     VehicleTimeline[]

  @@index([status])
  @@index([registrationNumber])
}

model Driver {
  id             String       @id @default(cuid())
  userId         String?      @unique
  firstName      String
  lastName       String
  phone          String
  email          String?
  licenseNumber  String       @unique
  licenseCategory String
  licenseExpiry  DateTime
  status         DriverStatus @default(AVAILABLE)
  safetyScore    Float        @default(100)
  faceEmbedding  String?      // base64 encoded
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  trips          Trip[]

  @@index([status])
  @@index([licenseNumber])
}

model Trip {
  id              String     @id @default(cuid())
  tripNumber      String     @unique
  vehicleId       String
  driverId        String
  dispatcherId    String?
  source          String
  sourceLat       Float?
  sourceLng       Float?
  destination     String
  destLat         Float?
  destLng         Float?
  distancePlanned Float?
  distanceActual  Float?
  cargoType       String?
  cargoWeight     Float?
  status          TripStatus @default(DRAFT)
  scheduledStart  DateTime?
  actualStart     DateTime?
  actualEnd       DateTime?
  revenue         Float?
  trackingToken   String?    @unique
  notes           String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])
  driver      Driver    @relation(fields: [driverId], references: [id])
  dispatcher  User?     @relation(fields: [dispatcherId], references: [id])
  fuelLogs    FuelLog[]
  expenses    Expense[]

  @@index([status])
  @@index([vehicleId])
  @@index([driverId])
}

model Maintenance {
  id          String            @id @default(cuid())
  vehicleId   String
  type        MaintenanceType
  description String
  status      MaintenanceStatus @default(SCHEDULED)
  cost        Float?
  scheduledDate DateTime?
  startedAt   DateTime?
  completedAt DateTime?
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  vehicle     Vehicle @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId])
  @@index([status])
}

model FuelLog {
  id          String   @id @default(cuid())
  vehicleId   String
  tripId      String?
  loggedById  String
  quantity    Float    // liters
  costPerUnit Float
  totalCost   Float
  odometer    Float
  station     String?
  isAnomaly   Boolean  @default(false)
  createdAt   DateTime @default(now())

  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  trip        Trip?    @relation(fields: [tripId], references: [id])
  loggedBy    User     @relation(fields: [loggedById], references: [id])

  @@index([vehicleId])
}

model Expense {
  id          String          @id @default(cuid())
  tripId      String?
  vehicleId   String?
  loggedById  String
  category    ExpenseCategory
  amount      Float
  description String?
  receiptUrl  String?
  createdAt   DateTime        @default(now())

  trip        Trip?   @relation(fields: [tripId], references: [id])
  loggedBy    User    @relation(fields: [loggedById], references: [id])

  @@index([category])
}

model Inspection {
  id          String           @id @default(cuid())
  vehicleId   String
  inspectorId String
  status      InspectionStatus @default(PENDING)
  items       Json             // Array of { name, passed, notes }
  totalItems  Int
  passedItems Int              @default(0)
  completedAt DateTime?
  createdAt   DateTime         @default(now())

  vehicle     Vehicle @relation(fields: [vehicleId], references: [id])
  inspector   User    @relation(fields: [inspectorId], references: [id])
}

model VehicleTimeline {
  id         String   @id @default(cuid())
  vehicleId  String
  eventType  String   // CREATED, TRIP_STARTED, TRIP_COMPLETED, MAINTENANCE, FUEL, INSPECTION
  title      String
  details    String?
  createdAt  DateTime @default(now())

  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId, createdAt])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String?
  type      String   // LICENSE_EXPIRY, MAINTENANCE_DUE, ANOMALY, etc.
  title     String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, isRead])
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  category    String
  description String
  entityType  String?
  entityId    String?
  ipAddress   String?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([category, createdAt])
}
```

### 2.4 Seed Data (6 Demo Accounts)

| Email | Password | Role | Name |
|---|---|---|---|
| admin@transitops.io | Admin@123 | ADMIN | Arjun Patel |
| fleet@transitops.io | Fleet@123 | FLEET_MANAGER | Priya Sharma |
| dispatch@transitops.io | Dispatch@123 | DISPATCHER | Rohit Kumar |
| safety@transitops.io | Safety@123 | SAFETY_OFFICER | Meera Desai |
| finance@transitops.io | Finance@123 | FINANCE_MANAGER | Vikram Singh |
| driver@transitops.io | Driver@123 | DRIVER | Rajesh Yadav |

**Mock data quantities (seeded):**
- 15 vehicles (mix of Truck, Bus, Van, Car)
- 10 drivers
- 25 trips (across all statuses)
- 8 maintenance records
- 30 fuel logs
- 20 expenses
- 5 inspections
- 50 notifications
- 40 timeline events

### 2.5 Backend Scaffold (Minimal, Mock-Ready)

Only implement what the frontend needs. Every endpoint returns real DB data when available, falls back to hardcoded mock data.

```
server/src/
  app.ts              # Express setup, CORS, middleware chain
  config/
    database.ts       # Prisma client singleton
    auth.ts           # JWT secret, token expiry
  middleware/
    auth.ts           # verifyToken, requireRole
    errorHandler.ts   # Global error handler
  routes/
    auth.routes.ts    # POST /login, POST /register, GET /me
    vehicle.routes.ts # CRUD + status change
    driver.routes.ts  # CRUD + status change
    trip.routes.ts    # CRUD + lifecycle transitions
    maintenance.routes.ts  # CRUD
    fuel.routes.ts    # CRUD + anomaly flag
    expense.routes.ts # CRUD
    dashboard.routes.ts    # GET /stats (aggregated KPIs)
    report.routes.ts  # GET /reports/:type
    inspection.routes.ts   # CRUD
    notification.routes.ts # GET list, PATCH mark-read
    search.routes.ts  # GET /search?q=
  controllers/        # Thin: parse request, call service, return response
  services/           # Business logic, Prisma queries
  validators/         # Zod schemas for request body validation
```

**Auth flow (implemented fully):**
1. `POST /api/auth/login` - validate credentials, return JWT + user object
2. `POST /api/auth/register` - create user (admin only)
3. `GET /api/auth/me` - return current user from token
4. Middleware: `verifyToken` extracts user from Bearer token
5. Middleware: `requireRole(['ADMIN', 'FLEET_MANAGER'])` checks role

**CRUD pattern (per module):**
```typescript
// Every resource follows this exact pattern:
GET    /api/{resource}          // List (paginated, filtered, sorted)
GET    /api/{resource}/:id      // Get by ID
POST   /api/{resource}          // Create
PATCH  /api/{resource}/:id      // Update
DELETE /api/{resource}/:id      // Soft delete or status change
```

**Dashboard stats endpoint:**
```typescript
GET /api/dashboard/stats
// Returns aggregated KPIs computed from real DB data:
{
  totalVehicles, activeVehicles, inMaintenance, availableVehicles,
  totalDrivers, onDutyDrivers, availableDrivers,
  activeTrips, pendingTrips, completedTripsToday,
  fleetUtilization, totalRevenue, totalExpenses,
  fuelEfficiency, avgHealthScore, avgSafetyScore
}
```

---

## PART 3: Module-by-Module Frontend (Modules 1 to 6)

---

### Module 1: Authentication

**Pages:** LoginPage, RegisterPage (admin-only)

**LoginPage layout:**
```
Center-aligned card (neu-card, max-width 400px)
  Logo (SVG, 48px)
  Title: "TransitOps" (text-h1)
  Subtitle: "Fleet Control Center" (text-small, muted)
  
  Form:
    Email input (neu-well, input-field)
    Password input (neu-well, input-field, eye toggle btn-round)
    "Sign In" button (btn-pill, full width, accent-primary)
    
  Bottom: theme toggle (toggle switch)
```

**Interactions:**
- Error shake animation on invalid credentials
- Button shows spinner SVG during API call
- Successful login: page-enter animation to dashboard
- Store JWT in localStorage, user in Zustand store

**Files:**
```
features/auth/
  LoginPage.tsx
  LoginPage.css
  RegisterPage.tsx
  useAuth.ts          # Zustand store: user, token, login(), logout()
  authApi.ts          # API calls: login, register, getMe
  ProtectedRoute.tsx  # Wrapper component checking auth state
```

---

### Module 2: Dashboard

**Layout:** Grid of KPI cards + Charts

**KPI Section (top, 4 columns desktop, 2 columns mobile):**

| KPI Card | Value | Visual |
|---|---|---|
| Total Vehicles | 15 | Gauge ring (% available) |
| Active Trips | 8 | Gauge ring (% of capacity) |
| Drivers On Duty | 7 | Gauge ring (% on duty) |
| Fleet Utilization | 72% | Large gauge ring with needle |

Each KPI card uses:
- `neu-card` with `screw-tl` and `screw-tr` decorative screws
- Number displayed in `text-data` (JetBrains Mono, large)
- Subtitle in `text-caption` (uppercase, muted)
- Gauge ring with animated conic-gradient fill
- CountUp animation from 0 to value on page load

**Charts Section (2 columns desktop, stacked mobile):**

| Chart | Type | Library |
|---|---|---|
| Fleet Status | Donut (Recharts PieChart) | Custom colors per status |
| Fuel Trends | Area chart (12 weeks) | Gradient fill, smooth curve |
| Revenue vs Cost | Dual line chart (12 months) | Two accent colors |
| Maintenance Types | Horizontal bar | Stacked by type |
| Vehicle Health | Progress bars list | Top 5 vehicles |
| Driver Safety | Histogram/buckets | Score distribution |

**Quick Actions Bar:**
Row of pill buttons: "New Trip", "Add Vehicle", "Log Fuel", "Run Report"

**Files:**
```
features/dashboard/
  DashboardPage.tsx
  DashboardPage.css
  components/
    KpiCard.tsx         # Gauge ring + counter + screws
    GaugeRing.tsx       # Reusable conic-gradient SVG gauge
    FleetStatusChart.tsx
    FuelTrendsChart.tsx
    RevenueChart.tsx
    QuickActions.tsx
  dashboardApi.ts
  useDashboard.ts       # React Query hook for /dashboard/stats
```

---

### Module 3: Vehicle Registry

**Pages:** VehicleListPage, VehicleDetailPage, VehicleFormModal

**VehicleListPage layout:**
```
Page header:
  Title: "Fleet Registry" (text-h1)
  Subtitle: vehicle count (text-small, muted)
  Actions: [Filter btn-ghost] [+ Add Vehicle btn-pill]

Filter bar (collapsible, neu-well):
  Status pills (AVAILABLE / ON_TRIP / IN_SHOP / RETIRED)
  Type dropdown (All / Truck / Bus / Van / Car)
  Fuel type dropdown
  Search input

Vehicle grid (3 cols desktop, 1 col mobile):
  Each card (neu-card):
    Top: Status badge (pill, color-coded)
    Registration number (text-h2, mono)
    Make + Model (text-body)
    Row: Type icon | Year | Fuel type
    Health score progress bar
    Odometer reading (text-data, mono)
    Actions row: [View btn-ghost] [Edit btn-round]
```

**VehicleDetailPage layout:**
```
Header: Reg number + status badge + QR code (qrcode.react)
Two-column:
  Left (2/3):
    Info card: Make, Model, Year, Type, Fuel, Max Load
    Financial card: Acquisition cost, Total maintenance, ROI
    Documents card: Insurance, Registration, Fitness (expiry dates with color)
  Right (1/3):
    Health gauge (large, with needle animation)
    Odometer reading
    Quick actions: [Start Trip] [Schedule Maintenance] [Run Inspection]

Timeline tab (below):
  Vertical timeline list (VehicleTimeline data)
  Each event: icon + title + timestamp + details
```

**VehicleFormModal:**
- Slide-in modal from right (framer-motion)
- Form fields: all vehicle attributes
- Validation: registration format, positive numbers, required fields
- On submit: POST/PATCH to API, invalidate query cache

**Files:**
```
features/vehicles/
  VehicleListPage.tsx
  VehicleListPage.css
  VehicleDetailPage.tsx
  VehicleDetailPage.css
  components/
    VehicleCard.tsx
    VehicleForm.tsx
    VehicleTimeline.tsx
    HealthGauge.tsx
    QrCodeSection.tsx
    StatusBadge.tsx
    VehicleFilters.tsx
  vehicleApi.ts
  useVehicles.ts
```

---

### Module 4: Driver Management

**Pages:** DriverListPage, DriverDetailPage, DriverFormModal

**DriverListPage layout:**
```
Page header: "Driver Management" + count + [+ Add Driver btn-pill]

Filter bar (neu-well):
  Status pills (AVAILABLE / ON_TRIP / ON_LEAVE / SUSPENDED)
  Search input
  License category dropdown

Driver grid (3 cols desktop, 1 col mobile):
  Each card (neu-card):
    Avatar circle (initials, colored by safety score range)
    Name (text-h3)
    License: number + category (text-small, mono)
    Status badge (pill)
    Safety score gauge ring (small, 60px)
    License expiry with color indicator:
      Green: > 30 days
      Amber: 7-30 days
      Red: < 7 days or expired
    Actions: [View] [Edit]
```

**DriverDetailPage layout:**
```
Header: Name + status + avatar
Two-column:
  Left:
    Personal info card
    License info card (number, category, expiry gauge)
    Contact card (phone, email)
  Right:
    Safety score (large gauge, 120px, with breakdown)
    Score factors: 6 mini progress bars
      Accidents, Violations, On-time rate, Fuel efficiency,
      Inspection pass rate, Experience
    
Trip History tab:
  Table of recent trips: date, route, vehicle, distance, status
  
Drowsiness Alerts tab:
  List of alert events from CV monitoring
  Each: timestamp, EAR value, duration, action taken
```

**Files:**
```
features/drivers/
  DriverListPage.tsx
  DriverListPage.css
  DriverDetailPage.tsx
  DriverDetailPage.css
  components/
    DriverCard.tsx
    DriverForm.tsx
    SafetyGauge.tsx
    LicenseExpiryIndicator.tsx
    DriverAvatar.tsx
    ScoreBreakdown.tsx
  driverApi.ts
  useDrivers.ts
```

---

### Module 5: Trip Management

**Pages:** TripListPage, TripDetailPage, TripFormPage

**TripListPage layout:**
```
Page header: "Trip Operations" + active count + [+ New Trip btn-pill]

Status tabs (pill buttons, horizontal scroll on mobile):
  ALL | DRAFT | SCHEDULED | DISPATCHED | IN_PROGRESS | COMPLETED | CANCELLED

Trip list (table on desktop, cards on mobile):
  Columns: Trip #, Route (source > dest), Vehicle, Driver, Status, Distance, Actions
  Each row has status badge color-coded:
    DRAFT: gray
    SCHEDULED: blue
    DISPATCHED: amber
    IN_PROGRESS: green (pulsing dot)
    COMPLETED: teal
    CANCELLED: red strikethrough
  Mobile card: stacked layout with route as header
```

**TripDetailPage layout:**
```
Header: Trip number + status badge + lifecycle progress bar
  Progress: DRAFT > SCHEDULED > DISPATCHED > IN_PROGRESS > COMPLETED
  Visual: 5 dots connected by line, filled up to current state

Two-column:
  Left:
    Route card: Source > Destination with map preview (small Leaflet)
    Schedule card: Planned start, actual start/end, duration
    Cargo card: Type, weight, max capacity bar
  Right:
    Vehicle info mini card
    Driver info mini card
    Financial card: Revenue, Fuel cost, Tolls, Net profit

Actions bar (depends on current status):
  DRAFT: [Schedule] [Cancel]
  SCHEDULED: [Dispatch] [Cancel]
  DISPATCHED: [Start Trip]
  IN_PROGRESS: [Complete Trip] [Log Fuel] [Add Expense]
  
Route Map (full width below):
  Leaflet map showing source/dest markers + route polyline
```

**TripFormPage:**
```
Step wizard (3 steps, progress bar at top):
  Step 1: Route
    Source (text input with autocomplete)
    Destination (text input with autocomplete)
    Scheduled start (datetime picker)
    Map preview updates as locations entered
    
  Step 2: Assignment
    Vehicle selector (dropdown with status + load capacity shown)
    Driver selector (dropdown with status + safety score shown)
    Business rule validation shown inline:
      "Vehicle must be AVAILABLE"
      "Driver must be AVAILABLE"
      "Cargo weight must not exceed max load"
    
  Step 3: Cargo & Details
    Cargo type, weight, notes, revenue
    Summary card showing all selections
    [Create Trip btn-pill]
```

**Files:**
```
features/trips/
  TripListPage.tsx
  TripListPage.css
  TripDetailPage.tsx
  TripDetailPage.css
  TripFormPage.tsx
  TripFormPage.css
  components/
    TripCard.tsx
    TripTable.tsx
    TripStatusBadge.tsx
    LifecycleProgressBar.tsx
    RouteMapPreview.tsx
    TripWizard.tsx
    AssignmentSelector.tsx
    CargoDetails.tsx
  tripApi.ts
  useTrips.ts
```

---

### Module 6: Maintenance

**Pages:** MaintenanceListPage, MaintenanceFormModal

**MaintenanceListPage layout:**
```
Page header: "Maintenance Center" + [+ Schedule Maintenance btn-pill]

Filter bar (neu-well):
  Status pills (SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED)
  Type pills (PREVENTIVE / CORRECTIVE / EMERGENCY / INSPECTION)
  Vehicle search

Maintenance list (table desktop, cards mobile):
  Columns: Vehicle (reg #), Type badge, Description, Status, Cost, Date
  
  Status badges:
    SCHEDULED: blue outline
    IN_PROGRESS: amber filled, pulsing
    COMPLETED: teal filled, checkmark icon
    CANCELLED: gray, strikethrough

Each row expandable to show:
  Notes, parts replaced, duration, mechanic
  Actions: [Start] [Complete] [Cancel] based on current status
```

**MaintenanceFormModal:**
```
Fields:
  Vehicle selector (only AVAILABLE or IN_SHOP)
  Type selector (4 radio buttons, pill-shaped)
  Description (textarea, neu-well)
  Scheduled date (date picker)
  Estimated cost (number input)
  Notes (textarea)

On submit: vehicle status auto-changes to IN_SHOP
On complete: vehicle status auto-changes to AVAILABLE
```

**Files:**
```
features/maintenance/
  MaintenanceListPage.tsx
  MaintenanceListPage.css
  components/
    MaintenanceCard.tsx
    MaintenanceForm.tsx
    MaintenanceTable.tsx
    TypeBadge.tsx
  maintenanceApi.ts
  useMaintenance.ts
```

---

## PART 4: Module-by-Module Frontend (Modules 7 to 13)

---

### Module 7: Fuel & Expenses

**Pages:** FuelListPage, ExpenseListPage (tabbed), FuelFormModal, ExpenseFormModal

**Layout (tabbed page):**
```
Page header: "Fuel & Expenses" + total cost this month (text-data)
Tabs (pill buttons): [Fuel Logs] [Expenses]

--- Fuel Logs Tab ---
Summary row (3 mini KPI cards):
  Total Liters (this month) | Avg Cost/Liter | Anomalies Detected

Table (desktop) / Cards (mobile):
  Columns: Date, Vehicle, Trip #, Quantity, Cost, Station, Anomaly flag
  Anomaly rows highlighted with danger background + icon
  
--- Expenses Tab ---  
Summary row (3 mini KPI cards):
  Total Expenses | Top Category | Pending Approval Count

Table:
  Columns: Date, Category badge (pill), Amount, Description, Trip, Receipt
  Category colors: Fuel=blue, Toll=amber, Maintenance=red, Insurance=teal

Charts section (below table):
  Expense breakdown donut chart (by category)
  Monthly fuel cost trend line chart
```

**Files:**
```
features/fuel/
  FuelExpensePage.tsx
  FuelExpensePage.css
  components/
    FuelTable.tsx
    FuelForm.tsx
    ExpenseTable.tsx
    ExpenseForm.tsx
    AnomalyBadge.tsx
    ExpenseChart.tsx
    FuelSummary.tsx
  fuelApi.ts
  useFuel.ts
```

---

### Module 8: Reports

**Pages:** ReportsPage

**Layout:**
```
Page header: "Reports Center"

Report type grid (2 cols desktop, 1 col mobile):
  Each card (neu-card, clickable):
    Icon (Lucide SVG, 32px)
    Title (text-h3): "Fleet Summary" / "Vehicle Report" / etc.
    Description (text-small): brief one-liner
    Generate button (btn-pill small)

Report types:
  1. Fleet Summary (all vehicles stats)
  2. Vehicle Report (single vehicle deep dive)
  3. Driver Performance (safety + trip stats)
  4. Trip Report (single trip PDF with map + QR)
  5. Fuel Consumption (trends + anomalies)
  6. Expense Report (by category + period)
  7. Maintenance History (by vehicle or fleet-wide)
  8. ROI Analysis (revenue vs cost per vehicle)

On click "Generate":
  Modal with parameter selection:
    Date range picker
    Vehicle/Driver selector (if applicable)
    Format: [PDF btn-ghost] [CSV btn-ghost]
  
  Loading: skeleton shimmer in report preview area
  Result: rendered in-page with [Download PDF] [Download CSV] buttons
  
  PDF generation: html2canvas captures DOM section, jspdf wraps it
  CSV: client-side generation from data array
```

**Files:**
```
features/reports/
  ReportsPage.tsx
  ReportsPage.css
  components/
    ReportCard.tsx
    ReportGenerator.tsx
    ReportPreview.tsx
    DateRangePicker.tsx
    ParameterModal.tsx
  reportApi.ts
  useReports.ts
  pdfGenerator.ts     # html2canvas + jspdf utility
  csvGenerator.ts     # Array to CSV blob utility
```

---

### Module 9: Live Fleet Map

**Pages:** LiveMapPage

**Layout:**
```
Full-width Leaflet map (fills main content area minus topbar)

Left panel (floating, 320px, collapsible on mobile):
  Vehicle list (scrollable):
    Each item:
      Status dot (colored: green=moving, blue=idle, red=maintenance)
      Registration number
      Driver name
      Current location text
      Speed (if in progress)
    Click to zoom map to vehicle

Right panel (floating, appears on vehicle click):
  Vehicle detail mini card
  Trip info (if active)
  ETA to destination
  Route polyline highlight

Map markers:
  Custom SVG markers (truck/bus/van icon colored by status)
  Cluster markers when zoomed out
  Route polylines for active trips (dashed animation)

Bottom bar (mobile):
  Horizontal scrollable vehicle chips
  Tap to center map on vehicle

Customer ETA sharing:
  Button on active trip: "Share ETA"
  Generates public URL with tracking token
  Public page shows: map + ETA countdown + vehicle location (no auth needed)
```

**Map tile provider:** OpenStreetMap (free, no key needed)

**Files:**
```
features/fleet-map/
  LiveMapPage.tsx
  LiveMapPage.css
  components/
    FleetMap.tsx
    VehicleMarker.tsx
    VehiclePanel.tsx
    VehicleListPanel.tsx
    RoutePolyline.tsx
    EtaSharingModal.tsx
  PublicTrackingPage.tsx   # /track/:token (no auth)
  mapApi.ts
  useFleetMap.ts
```

---

### Module 10: Digital Inspections

**Pages:** InspectionListPage, InspectionFormPage

**InspectionListPage layout:**
```
Page header: "Vehicle Inspections" + [+ New Inspection btn-pill]

Filters: Status pills (PENDING / PASSED / FAILED), Vehicle search

Inspection cards (grid):
  Each card (neu-card):
    Vehicle reg number
    Inspector name
    Date
    Status badge (large):
      PASSED: teal, checkmark icon
      FAILED: red, x icon  
      PENDING: amber, clock icon
    Progress: "12/14 items passed" with progress bar
    [View Details] button
```

**InspectionFormPage layout:**
```
Header: "Inspect: MH12AB1234" + vehicle info mini card

Checklist (14 items):
  Each item row:
    Item name (text-body): "Brakes", "Tires", "Lights", etc.
    Toggle: Pass / Fail (two pill buttons, green/red)
    Notes input (optional, appears on Fail)
    
  Items list:
    1. Engine Oil Level
    2. Brake System
    3. Tire Condition (all wheels)
    4. Headlights & Taillights
    5. Turn Signals
    6. Windshield & Wipers
    7. Horn
    8. Mirrors
    9. Seatbelts
    10. Fire Extinguisher
    11. First Aid Kit
    12. Reflective Triangles
    13. Fluid Leaks
    14. Body Damage

Progress bar at top showing completion
Summary: X/14 passed

[Submit Inspection btn-pill]
  If any FAIL: status = FAILED, vehicle dispatch blocked
  If all PASS: status = PASSED
```

**Files:**
```
features/inspections/
  InspectionListPage.tsx
  InspectionListPage.css
  InspectionFormPage.tsx
  InspectionFormPage.css
  components/
    InspectionCard.tsx
    ChecklistItem.tsx
    InspectionProgress.tsx
  inspectionApi.ts
  useInspections.ts
```

---

### Module 11: AI Dispatch & Route Optimization

**Pages:** AiDispatchPage

**Layout:**
```
Page header: "AI Operations Center"

Two-column layout:
  Left (Dispatch Recommendations):
    Trip selector dropdown (pending trips)
    On select, AI recommends top 3 vehicles:
      Each recommendation card:
        Vehicle reg + type
        Ranking score (gauge, 0-100)
        Factors (mini progress bars):
          Proximity, Health, Fuel efficiency, Driver safety, Availability
        [Assign This Vehicle btn-pill]
    
    Algorithm (client-side scoring):
      score = (proximity * 0.25) + (health * 0.20) + (fuelEff * 0.20) 
              + (driverSafety * 0.20) + (availability * 0.15)
    
  Right (Route Optimization):
    Source / Destination inputs (pre-filled from selected trip)
    [Optimize Routes btn-pill]
    
    3 route cards (stacked):
      Route 1: "Fastest" - blue
        Distance, Duration, Est. fuel, Est. toll
      Route 2: "Fuel Efficient" - green  
        Distance, Duration, Est. fuel, Est. toll
      Route 3: "Lowest Toll" - amber
        Distance, Duration, Est. fuel, Est. toll
    
    Map below showing all 3 routes overlaid
    Click route card to highlight on map
    
    Route data source: 
      OpenRouteService API via backend proxy
      Fallback: mock data with 3 predefined routes

Fuel Prediction section (below):
  Input: Vehicle, Distance, Load weight
  Output: Predicted liters + cost
  Algorithm (client-side regression):
    fuel = baseRate * distance * (1 + loadFactor) * vehicleAgeFactor
    baseRate per vehicle type: Truck=0.25, Bus=0.20, Van=0.12, Car=0.08 L/km
```

**Files:**
```
features/ai/
  AiDispatchPage.tsx
  AiDispatchPage.css
  components/
    DispatchRecommendation.tsx
    RecommendationCard.tsx
    RouteOptimizer.tsx
    RouteCard.tsx
    RouteMap.tsx
    FuelPredictor.tsx
  algorithms/
    dispatchScoring.ts    # Client-side ranking algorithm
    fuelPrediction.ts     # Client-side regression
    routeOptimization.ts  # ORS API call wrapper
  aiApi.ts
  useAiDispatch.ts
```

---

### Module 12: Computer Vision Monitor

**Pages:** CvDashboardPage, DrowsinessMonitorPage, LprScanPage

**CvDashboardPage layout:**
```
Page header: "Safety Monitor"

3 cards (feature overview):
  Card 1: "Drowsiness Detection" + active camera count + [Monitor btn-pill]
  Card 2: "License Plate Scanner" + last scan info + [Scan btn-pill]
  Card 3: "Driver Verification" + verified today count + [Verify btn-pill]

Alert feed (below):
  Real-time list of CV events:
    Drowsiness alerts (driver, time, EAR value, severity)
    LPR detections (plate, vehicle matched, confidence)
  Each alert: icon + timestamp + description + severity badge
```

**DrowsinessMonitorPage layout (MULTI-CAMERA):**
```
Page header: "Drowsiness Monitor" + active feeds count

Camera grid (2 cols desktop, 1 col mobile):
  Each camera feed panel:
    Header: Driver name + trip number + status indicator
    Video feed: <video> element with MediaPipe face mesh overlay
    EAR value display (text-data, real-time updating)
    Status indicator:
      ALERT: eye closed > 2 seconds, red pulsing border + audio beep
      DROWSY: EAR < threshold but < 2 sec, amber border
      NORMAL: green border
    Drowsiness score (gauge ring): based on alert frequency
    
  Technical implementation:
    Each camera = separate <video> + canvas pair
    navigator.mediaDevices.getUserMedia() per camera
    @mediapipe/tasks-vision FaceLandmarker model (loaded once, shared)
    requestAnimationFrame loop per camera
    
    EAR calculation:
      Left eye landmarks: indices [33, 160, 158, 133, 153, 144]
      Right eye landmarks: indices [362, 385, 387, 263, 373, 380]
      EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
      Threshold: 0.21 (configurable)
      Alert after: 60 consecutive frames below threshold (~2 sec at 30fps)
    
  Demo mode (no real cameras):
    Simulated webcam using pre-recorded video loops
    Mock EAR values oscillating between 0.15 and 0.35
    Random alert triggers every 30-60 seconds

Add Camera button: [+ Add Feed btn-pill]
  Opens camera selector (lists available devices)
  Max 6 simultaneous feeds
```

**LprScanPage layout (MOBILE-OPTIMIZED):**
```
Full-screen camera view on mobile:
  Camera feed (rear camera, getUserMedia with facingMode: "environment")
  Overlay: rectangle frame guide ("Align plate within frame")
  
  Capture button (large round button, bottom center)
  
  On capture:
    Frame sent to TF.js YOLO model (in-browser)
    Plate region detected and cropped
    OCR text displayed
    Vehicle lookup from DB
    
  Result card (slides up from bottom):
    Detected plate (text-h1, mono)
    Confidence % (progress bar)
    Matched vehicle info (if found):
      Make, Model, Status, Last trip
    [Log Entry] [Log Exit] buttons
    
  Desktop fallback:
    File upload area (drag-and-drop)
    Upload image, process same way
    
  Demo mode:
    Pre-loaded sample plate images
    Click "Demo Scan" to simulate detection
    Returns mock plate: "MH12AB1234" with 94% confidence
```

**Files:**
```
features/cv/
  CvDashboardPage.tsx
  CvDashboardPage.css
  DrowsinessMonitorPage.tsx
  DrowsinessMonitorPage.css
  LprScanPage.tsx
  LprScanPage.css
  components/
    CameraFeed.tsx          # Single camera + canvas component
    EarCalculator.ts        # MediaPipe landmark to EAR math
    DrowsinessAlert.tsx     # Alert overlay component
    DrowsinessGauge.tsx     # Per-driver drowsiness score
    LprCamera.tsx           # Mobile camera with overlay guide
    LprResult.tsx           # Detection result card
    AlertFeed.tsx           # Real-time event list
  hooks/
    useMediaPipe.ts         # FaceLandmarker initialization + shared model
    useDrowsiness.ts        # Per-camera EAR tracking logic
    useLprDetection.ts      # TF.js plate detection
  models/                   # ML model files (downloaded at build)
    face_landmarker.task    # MediaPipe model
  cvApi.ts
```

---

### Module 13: Notifications & Alerts

**Pages:** NotificationListPage (also: notification dropdown in topbar)

**Topbar notification bell:**
```
Bell icon (btn-round) with badge count
Click opens dropdown panel (320px wide):
  Header: "Notifications" + [Mark All Read] link
  List of recent 10 notifications:
    Each: icon + title + message preview + time ago
    Unread: accent-primary left border
    Read: no border, muted text
  Footer: [View All] link to full page
```

**NotificationListPage layout:**
```
Page header: "Alerts & Notifications" + unread count badge

Filter tabs (pill buttons):
  ALL | UNREAD | LICENSE | MAINTENANCE | FUEL | SYSTEM

Notification list:
  Each item (neu-card, clickable):
    Left: icon (type-specific Lucide icon)
    Center: title + message + timestamp
    Right: read/unread dot + [Mark Read btn-round]
    
  Type icons:
    LICENSE_EXPIRY: AlertTriangle (amber)
    MAINTENANCE_DUE: Wrench (blue)
    FUEL_ANOMALY: Fuel (red)
    TRIP_UPDATE: Route (teal)
    INSPECTION_FAILED: ClipboardX (red)
    SYSTEM: Bell (gray)

Empty state: illustration + "No notifications"
```

**Files:**
```
features/notifications/
  NotificationListPage.tsx
  NotificationListPage.css
  components/
    NotificationDropdown.tsx
    NotificationItem.tsx
    NotificationBadge.tsx
  notificationApi.ts
  useNotifications.ts      # Zustand store + React Query
```

---

## PART 5: Shared Components + Routing + Execution Waves

---

### 5.1 Shared / Reusable Components

```
components/
  ui/
    Button.tsx          # btn-pill, btn-ghost, btn-round variants
    Card.tsx            # neu-card with optional screws
    Badge.tsx           # Status badge (pill shape, color-coded)
    Input.tsx           # neu-well input with label
    Select.tsx          # Custom dropdown with neu styling
    Toggle.tsx          # Neomorphic toggle switch
    ProgressBar.tsx     # Animated progress-fill in progress-track
    GaugeRing.tsx       # Conic gradient circular gauge
    Modal.tsx           # Framer Motion slide-in/scale-in modal
    Skeleton.tsx        # Pulse animation loading placeholder
    EmptyState.tsx      # Icon + message for empty lists
    DataTable.tsx       # Sortable, filterable table (desktop)
    Pagination.tsx      # Page navigation (pill buttons)
    DatePicker.tsx      # Date/datetime input wrapper
    SearchInput.tsx     # Global search input with Cmd+K
    Tooltip.tsx         # Hover tooltip
    Toast.tsx           # Success/error notification toast
    ConfirmDialog.tsx   # "Are you sure?" modal
    
  layout/
    AppLayout.tsx       # Sidebar + Topbar + Main area wrapper
    Sidebar.tsx         # Desktop navigation sidebar
    Topbar.tsx          # Top navigation bar (search, bells, user)
    BottomNav.tsx       # Mobile bottom navigation
    PageHeader.tsx      # Title + subtitle + action buttons
    MobileSheet.tsx     # Slide-up panel for "More" nav items

  common/
    StatusBadge.tsx     # Reusable across Vehicle/Driver/Trip/Maintenance
    CountUp.tsx         # Animated number counter (0 to N)
    ThemeToggle.tsx     # Light/dark mode switch
    Avatar.tsx          # Initials circle with color
    QrCode.tsx          # qrcode.react wrapper
    FilterBar.tsx       # Collapsible filter section in neu-well
    TabBar.tsx          # Pill-shaped tab buttons
```

### 5.2 React Router Configuration

```typescript
// App.tsx route structure
<Routes>
  {/* Public */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/track/:token" element={<PublicTrackingPage />} />
  
  {/* Protected (wrapped in AppLayout) */}
  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route index element={<DashboardPage />} />
    
    <Route path="vehicles" element={<VehicleListPage />} />
    <Route path="vehicles/:id" element={<VehicleDetailPage />} />
    
    <Route path="drivers" element={<DriverListPage />} />
    <Route path="drivers/:id" element={<DriverDetailPage />} />
    
    <Route path="trips" element={<TripListPage />} />
    <Route path="trips/new" element={<TripFormPage />} />
    <Route path="trips/:id" element={<TripDetailPage />} />
    
    <Route path="maintenance" element={<MaintenanceListPage />} />
    
    <Route path="fuel" element={<FuelExpensePage />} />
    
    <Route path="reports" element={<ReportsPage />} />
    
    <Route path="map" element={<LiveMapPage />} />
    
    <Route path="inspections" element={<InspectionListPage />} />
    <Route path="inspections/new/:vehicleId" element={<InspectionFormPage />} />
    
    <Route path="cv" element={<CvDashboardPage />} />
    <Route path="cv/drowsiness" element={<DrowsinessMonitorPage />} />
    <Route path="cv/lpr" element={<LprScanPage />} />
    
    <Route path="ai" element={<AiDispatchPage />} />
    
    <Route path="notifications" element={<NotificationListPage />} />
    
    <Route path="settings" element={<SettingsPage />} />
  </Route>
</Routes>
```

### 5.3 API Client Setup

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 (redirect to login)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### 5.4 Zustand Stores

```
store/
  useAuthStore.ts       # user, token, login(), logout(), isAuthenticated
  useThemeStore.ts      # theme ('light'|'dark'), toggleTheme()
  useNotificationStore.ts  # notifications[], unreadCount, markRead()
  useSidebarStore.ts    # isCollapsed, toggle()
```

### 5.5 Settings Page

```
Page header: "Settings"

Sections (neu-card each):
  Profile:
    Avatar, name, email (read-only)
    [Change Password btn-ghost]
    
  Appearance:
    Theme toggle (Light / Dark)
    Language selector (EN / HI / GU) dropdown
    
  System (Admin only):
    User management table
    [Add User btn-pill] (opens RegisterPage modal)
    
  About:
    Version, build info
    API status indicator (green dot if healthy)
```

### 5.6 Global Search (Cmd+K)

```
Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
Opens centered modal overlay with search input auto-focused

Input: neu-well, large font, magnifying glass icon
Results (grouped):
  Vehicles: top 3 matches (reg number, make, status)
  Drivers: top 3 matches (name, license, status)
  Trips: top 3 matches (trip #, route, status)

Click result: navigate to detail page
ESC or click outside: close

Backend: GET /api/search?q={query}
Fallback: client-side filter on cached data
```

---

### 5.7 Execution Waves (8-Hour Hackathon)

| Wave | Time | Duration | Deliverables |
|---|---|---|---|
| **Wave 0** | 0:00 - 0:45 | 45 min | Project init, Vite scaffold, backend scaffold, Prisma schema, DB migrate, seed data |
| **Wave 1** | 0:45 - 1:45 | 60 min | Design system CSS (all tokens, neomorphic primitives), AppLayout + Sidebar + Topbar + BottomNav |
| **Wave 2** | 1:45 - 3:00 | 75 min | Auth (login page + JWT backend + protected routes), Dashboard (KPI cards + gauge rings + charts) |
| **Wave 3** | 3:00 - 4:15 | 75 min | Vehicle CRUD (list + detail + form + timeline + QR), Driver CRUD (list + detail + form + safety gauge) |
| **Wave 4** | 4:15 - 5:15 | 60 min | Trip Management (list + detail + form wizard + lifecycle bar + map), Maintenance (list + form) |
| **Wave 5** | 5:15 - 6:00 | 45 min | Fuel/Expenses (tabbed + charts), Inspections (checklist form), Notifications (dropdown + page) |
| **Wave 6** | 6:00 - 7:00 | 60 min | Live Map (Leaflet + markers + route polylines), AI Dispatch (scoring algorithm + route optimization + 3 route cards) |
| **Wave 7** | 7:00 - 8:00 | 60 min | CV Monitor (drowsiness multi-cam + LPR mobile scanner + demo mode), Reports (generate + PDF), Settings, Global Search, Polish |

### Wave 0 Detail (45 min)

```
[ ] npx create-vite client -- --template react-ts
[ ] Install all frontend deps (single npm i command)
[ ] Create server directory, npm init, install deps
[ ] npx prisma init, paste schema, createdb, migrate, seed
[ ] Create .env files (client + server)
[ ] Verify: client starts on :5173, server on :3001, DB connected
```

### Wave 1 Detail (60 min)

```
[ ] Create client/src/styles/design-system.css (all CSS variables + neomorphic classes)
[ ] Create client/src/styles/animations.css (keyframes + utility classes)
[ ] Create client/src/styles/reset.css (box-sizing, font, body)
[ ] Build AppLayout.tsx (flex row, sidebar + main area)
[ ] Build Sidebar.tsx (nav items with Lucide icons, active state)
[ ] Build Topbar.tsx (logo, search input, notification bell, user menu, theme toggle)
[ ] Build BottomNav.tsx (5 items, hidden on desktop)
[ ] Add Google Fonts (Inter + JetBrains Mono) to index.html
[ ] Create SVG assets (screw.svg, logo.svg)
[ ] Verify: layout renders correctly on 1440px + 375px viewports
```

### Wave 2 Detail (75 min)

```
[ ] Build LoginPage.tsx with neomorphic card
[ ] Implement server: POST /api/auth/login (bcrypt + JWT)
[ ] Implement server: GET /api/auth/me
[ ] Build useAuthStore.ts (Zustand)
[ ] Build ProtectedRoute.tsx
[ ] Build DashboardPage.tsx layout
[ ] Build KpiCard.tsx with GaugeRing + CountUp
[ ] Build 4 KPI cards with mock/seeded data
[ ] Build FleetStatusChart (Recharts Donut)
[ ] Build FuelTrendsChart (Recharts Area)
[ ] Build QuickActions row
[ ] Implement server: GET /api/dashboard/stats
[ ] Verify: login works, dashboard loads with data
```

### Wave 3 Detail (75 min)

```
[ ] Build VehicleListPage with filter bar + card grid
[ ] Build VehicleCard.tsx
[ ] Build VehicleDetailPage with 2-column layout + timeline
[ ] Build VehicleForm.tsx (slide-in modal)
[ ] Build HealthGauge.tsx + QrCode section
[ ] Implement server: CRUD /api/vehicles
[ ] Build DriverListPage with card grid
[ ] Build DriverCard.tsx with SafetyGauge
[ ] Build DriverDetailPage with score breakdown
[ ] Build DriverForm.tsx
[ ] Implement server: CRUD /api/drivers
[ ] Verify: vehicle + driver CRUD works end-to-end
```

### Wave 4 Detail (60 min)

```
[ ] Build TripListPage with status tabs + table/cards
[ ] Build TripDetailPage with lifecycle bar + route map
[ ] Build TripFormPage (3-step wizard)
[ ] Build LifecycleProgressBar.tsx
[ ] Build RouteMapPreview.tsx (small Leaflet)
[ ] Implement server: CRUD /api/trips + status transitions
[ ] Build MaintenanceListPage with expandable rows
[ ] Build MaintenanceForm.tsx
[ ] Implement server: CRUD /api/maintenance
[ ] Verify: trip creation wizard works, status transitions work
```

### Wave 5 Detail (45 min)

```
[ ] Build FuelExpensePage (tabbed)
[ ] Build FuelTable + FuelForm + ExpenseTable + ExpenseForm
[ ] Build AnomalyBadge + ExpenseChart
[ ] Implement server: CRUD /api/fuel, /api/expenses
[ ] Build InspectionListPage + InspectionFormPage
[ ] Build ChecklistItem.tsx (14 items with pass/fail toggle)
[ ] Implement server: CRUD /api/inspections
[ ] Build NotificationDropdown.tsx (in Topbar)
[ ] Build NotificationListPage
[ ] Implement server: GET /api/notifications, PATCH mark-read
[ ] Verify: fuel logs, inspections, notifications all work
```

### Wave 6 Detail (60 min)

```
[ ] Build LiveMapPage with Leaflet MapContainer
[ ] Build VehicleMarker.tsx (custom SVG icons)
[ ] Build VehicleListPanel (left floating panel)
[ ] Build route polylines with dashed animation
[ ] Mock vehicle positions from seeded trip data
[ ] Build AiDispatchPage layout
[ ] Implement dispatchScoring.ts algorithm
[ ] Build RecommendationCard.tsx with factor progress bars
[ ] Build RouteOptimizer with 3 route cards
[ ] Mock ORS route data (3 predefined routes for demo)
[ ] Build RouteMap showing 3 overlaid routes
[ ] Implement fuelPrediction.ts
[ ] Verify: map shows vehicles, AI dispatch scores correctly
```

### Wave 7 Detail (60 min)

```
[ ] Build CvDashboardPage overview
[ ] Build DrowsinessMonitorPage multi-camera grid
[ ] Build CameraFeed.tsx with canvas overlay
[ ] Implement useMediaPipe.ts (FaceLandmarker init)
[ ] Implement EarCalculator.ts (landmark to EAR)
[ ] Implement useDrowsiness.ts (threshold + counter logic)
[ ] Build demo mode (mock EAR values + simulated alerts)
[ ] Build LprScanPage (mobile camera + desktop upload)
[ ] Build demo scan (pre-loaded images)
[ ] Build ReportsPage with 8 report cards
[ ] Implement pdfGenerator.ts (html2canvas + jspdf)
[ ] Build SettingsPage
[ ] Build SearchInput + global search modal (Cmd+K)
[ ] Polish: check all pages mobile responsiveness
[ ] Polish: verify dark mode on all pages
[ ] Polish: add page-enter animations on all routes
[ ] Verify: full app walkthrough on desktop + mobile
```

---

### 5.8 Verification Protocol (Definition of Done)

```
Per module:
  [ ] Page renders without errors
  [ ] Data loads from API (or mock fallback)
  [ ] CRUD operations work (create, read, update, delete)
  [ ] Neomorphic styling applied (shadows, pill buttons, gauge rings)
  [ ] Mobile view works (375px viewport, bottom nav visible)
  [ ] Dark mode renders correctly
  [ ] No emojis used (all icons are SVG via lucide-react)
  [ ] No em dashes in any text content
  [ ] Animations present (page enter, button press, progress bars)
  [ ] Loading states use skeleton placeholders

Full app:
  [ ] Login flow works end-to-end
  [ ] All 13 sidebar nav items route correctly
  [ ] Mobile bottom nav routes correctly
  [ ] Theme toggle persists across sessions
  [ ] Global search (Cmd+K) finds entities
  [ ] Notification badge updates
  [ ] At least one chart renders with data on dashboard
  [ ] At least one gauge ring animates on dashboard
  [ ] CV drowsiness demo mode runs without errors
  [ ] LPR demo scan returns mock result
  [ ] PDF export generates downloadable file
  [ ] Top-left curve on main content area visible
  [ ] Screw decorations visible on KPI cards
```

---

### 5.9 File Count Summary

| Category | Files | Notes |
|---|---|---|
| Design System CSS | 3 | reset, design-system, animations |
| Layout Components | 6 | AppLayout, Sidebar, Topbar, BottomNav, PageHeader, MobileSheet |
| Shared UI Components | 18 | Button, Card, Badge, Input, etc. |
| Auth Module | 5 | Pages + store + API |
| Dashboard Module | 8 | Page + 6 chart components + API |
| Vehicle Module | 10 | Pages + 7 components + API |
| Driver Module | 9 | Pages + 6 components + API |
| Trip Module | 11 | Pages + 8 components + API |
| Maintenance Module | 6 | Page + 4 components + API |
| Fuel/Expense Module | 9 | Page + 7 components + API |
| Reports Module | 9 | Page + 5 components + utilities |
| Map Module | 8 | Page + 5 components + public page |
| Inspections Module | 6 | Pages + 3 components + API |
| AI Module | 10 | Page + 6 components + 3 algorithms |
| CV Module | 12 | 3 pages + 7 components + 3 hooks |
| Notifications Module | 5 | Page + 3 components + API |
| Settings Module | 1 | Page |
| Stores (Zustand) | 4 | auth, theme, notifications, sidebar |
| API Client | 1 | Axios instance |
| Backend Routes | 11 | One per module |
| Backend Middleware | 2 | auth, errorHandler |
| Prisma Schema | 1 | All models |
| Seed Script | 1 | Demo data |
| **Total** | **~156 files** | |

---

**END OF PLAN**
