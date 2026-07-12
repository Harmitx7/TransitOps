<p align="center">
  <img src="assets/app-logo.svg" alt="TransitOps Logo" width="80" />
</p>

<h1 align="center">TransitOps</h1>

<p align="center">
  <strong>AI-Powered Smart Transport Operations Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

<p align="center">
  Digitizes the complete fleet lifecycle: vehicle registration, driver management, AI dispatch, maintenance, fuel tracking, computer vision safety, financial analytics, and predictive intelligence.
</p>

<p align="center">
  <strong><a href="https://odoo-transitops-jenil.vercel.app">Live Demo</a></strong> •
  <strong><a href="https://drive.google.com/drive/folders/1xlMjWQNHyjsnxTH__hGHoR4EwBsdKkhY?usp=sharing">Google Drive (Video & Assets)</a></strong>
</p>

<p align="center">
  <em>Made by <a href="https://harmit.vercel.app">Harmit Kalal</a> | <a href="https://www.jenil.me">Jenil Soni</a> | Aarth Patel</em>
</p>

---

## Quick Start

```bash
git clone https://github.com/Harmitx7/TransitOps.git
cd TransitOps
chmod +x start.sh
./start.sh
```

| Service | URL |
|---------|-----|
| Client  | `http://localhost:5173` |
| API     | `http://localhost:3001/api` |
| Health  | `http://localhost:3001/health` |

**Demo Login:** `admin@transitops.io` / `Admin@123`

---

## Theme: GaugeOS Industrial Neomorphic

TransitOps uses a custom **"GaugeOS"** design system inspired by mechanical dashboards and automotive instrument clusters. Every component uses neomorphic shadows, brushed-steel textures, gauge rings, and screw decorations.

<table>
<tr>
<td width="50%">

### Light Mode
<img src="assets/login light theme.png" alt="Login Light" width="100%" />

</td>
<td width="50%">

### Dark Mode
<img src="assets/login dark theme.png" alt="Login Dark" width="100%" />

</td>
</tr>
</table>

- Pre-filled demo accounts for instant access
- Role-based login: Admin, Fleet Manager, Dispatcher, Safety Officer, Finance Manager, Driver
- JWT authentication with bcrypt password hashing
- Error shake animation on invalid credentials
- Theme toggle persists across sessions

---

## Dashboard

<table>
<tr>
<td width="50%">

### Light Dashboard
<img src="assets/dashboard light.png" alt="Dashboard Light" width="100%" />

</td>
<td width="50%">

### Dark Dashboard
<img src="assets/dashboard dark.png" alt="Dashboard Dark" width="100%" />

</td>
</tr>
</table>

### KPI Metrics at a Glance

<table>
  <tr>
    <td align="center"><img src="https://img.shields.io/badge/Total_Vehicles-Fleet_Size_&_Availability-blue" alt="Total Vehicles" /></td>
    <td align="center"><img src="https://img.shields.io/badge/Active_Trips-Live_Tracking_&_Capacity-green" alt="Active Trips" /></td>
  </tr>
  <tr>
    <td align="center"><img src="https://img.shields.io/badge/Fleet_Utilization-%25_of_Assets_Deployed-orange" alt="Utilization" /></td>
    <td align="center"><img src="https://img.shields.io/badge/Active_Drivers-On--Duty_&_Safety_Index-purple" alt="Drivers" /></td>
  </tr>
</table>

### Dashboard Modules

<ul>
  <li><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layout-grid.svg" width="16" align="center"/> <b>Bento Grid Layout</b> with 12-column CSS Grid</li>
  <li><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/circle-dashed.svg" width="16" align="center"/> <b>Animated Gauge Rings</b> with conic-gradient fills</li>
  <li><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/cctv.svg" width="16" align="center"/> <b>Live Camera Feeds</b> with 16:9 aspect ratio cards</li>
  <li><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/map.svg" width="16" align="center"/> <b>Interactive Map Panel</b> with Google Maps / Leaflet tiles</li>
  <li><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bar-chart-3.svg" width="16" align="center"/> <b>Revenue vs Cost Trend Charts</b> (Recharts)</li>
  <li><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/pie-chart.svg" width="16" align="center"/> <b>Fleet Status Donut Chart</b> with color-coded segments</li>
  <li><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/zap.svg" width="16" align="center"/> <b>Quick Action Buttons</b>: New Trip, Log Fuel, License Plate Scan</li>
  <li><img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bell.svg" width="16" align="center"/> <b>Real-time Notification Badge</b> in the topbar</li>
</ul>

---

## Feature Modules

### 1. Live Fleet Map

<img src="assets/live maps with vehicle live locations.png" alt="Live Map" width="100%" />

- Real-time vehicle tracking on interactive Leaflet/Google Maps
- Color-coded markers: Green (moving), Blue (idle), Red (maintenance)
- Click any vehicle to see trip details, ETA, and route polyline
- Collapsible side panel with full fleet list
- Speed and heading indicators per vehicle
- Customer ETA sharing via public tracking URL (no auth required)

---

### 2. Vehicle Registry and Management

<img src="assets/vehicles registry and management.png" alt="Vehicle Registry" width="100%" />

- Full CRUD for 15+ vehicle types (Truck, Bus, Van, Car)
- Unique registration number enforcement
- **Health Score Gauge** (0-100) based on 6 weighted factors
- **QR Code** auto-generated per vehicle for quick scanning
- **Document Vault**: Insurance, Registration, Fitness, PUC certificates with expiry tracking
- **Vehicle Timeline**: Chronological event log (trips, maintenance, inspections, fuel)
- Filter by status: Available, On Trip, In Shop, Retired
- Odometer tracking with km/miles display

---

### 3. AI Smart Routing

<img src="assets/AI smart routing.png" alt="AI Smart Routing" width="100%" />

**2x2 Grid Layout:**

| Cell | Module |
|------|--------|
| Top-Left | **Plan Route** with Uber-style booking inputs and quick-select location chips |
| Top-Right | **Route Selection** with 3 optimized route cards (Fastest, Fuel Efficient, Lowest Toll) |
| Bottom (Full Width) | **Vehicle Assignment** as horizontal scrollable carousel of vehicle cards |

**AI Dispatch Scoring Algorithm:**
```
score = (proximity x 0.25) + (health x 0.20) + (fuelEfficiency x 0.20)
      + (driverSafety x 0.20) + (availability x 0.15)
```

**Fuel Prediction Model:**
```
fuel = baseRate x distance x (1 + loadFactor) x vehicleAgeFactor
```

| Vehicle Type | Base Rate (L/km) |
|-------------|-------------------|
| Truck | 0.25 |
| Bus | 0.20 |
| Van | 0.12 |
| Car | 0.08 |

---

### 4. Driver Camera Safety and Live Streams

<img src="assets/drivers cams saftey managements system with live streams.png" alt="CV Safety Monitor" width="100%" />

- **Multi-camera CCTV Grid** with live video feeds
- **Drowsiness Detection** using MediaPipe Face Landmarker
- **Eye Aspect Ratio (EAR)** calculation in real-time
- Alert triggers after 60 consecutive frames below 0.21 threshold (~2 seconds)
- Color-coded camera borders: Green (Normal), Amber (Drowsy), Red (Alert with pulse animation)
- Per-driver drowsiness score gauge
- **Seatbelt Detection**: AI monitors proper seatbelt usage during transit.
- **Face Verification**: Pre-dispatch identity authentication to prevent unauthorized drivers.
- CRT scanline and noise overlay effects for authentic CCTV aesthetic
- HUD-style PTZ controls and timestamp overlays

**EAR Calculation:**
```
EAR = (||p2-p6|| + ||p3-p5||) / (2 x ||p1-p4||)
Threshold: 0.21 (configurable)
Alert: 60 frames below threshold at 30fps = ~2 seconds
```

---

### 5. License Plate Scanning and Detection (OCR)

<img src="assets/license plate scanning.png" alt="License Plate Scanner" width="100%" />

- **YOLO v8** object detection for plate localization
- **EasyOCR / Tesseract** for character recognition
- Mobile-optimized: rear camera with alignment guide overlay
- Desktop fallback: drag-and-drop image upload
- Instant vehicle lookup from database on detection
- Confidence score with progress bar
- Entry/Exit logging for gate management
- Demo mode with pre-loaded sample plate images

| Metric | Score |
|--------|-------|
| Detection Accuracy | 94%+ |
| OCR Confidence | 91%+ |
| Processing Time | < 500ms |

---

### 6. Vehicle Inspection Pass/Fail

<img src="assets/vehicle inspection and testing (pass:fail).png" alt="Vehicle Inspection" width="100%" />

**14-Point Digital Checklist:**

| # | Inspection Item |
|---|----------------|
| 1 | Engine Oil Level |
| 2 | Brake System |
| 3 | Tire Condition (all wheels) |
| 4 | Headlights and Taillights |
| 5 | Turn Signals |
| 6 | Windshield and Wipers |
| 7 | Horn |
| 8 | Mirrors |
| 9 | Seatbelts |
| 10 | Fire Extinguisher |
| 11 | First Aid Kit |
| 12 | Reflective Triangles |
| 13 | Fluid Leaks |
| 14 | Body Damage |

- Toggle Pass/Fail per item with optional failure notes
- Progress bar showing completion percentage
- **Business Rule**: Failed inspection blocks vehicle dispatch
- Status badges: PASSED (teal), FAILED (red), PENDING (amber)

---

### 7. Trip Details and Operations

<img src="assets/trips details and operations.png" alt="Trip Operations" width="100%" />

**Trip Lifecycle State Machine:**

```
DRAFT --> SCHEDULED --> DISPATCHED --> IN_PROGRESS --> COMPLETED
  |           |             |                            |
  +---> CANCELLED <----+----+----------------------------+
```

- 3-step trip creation wizard: Route, Assignment, Cargo
- Lifecycle progress bar with 5 visual stages
- Route map preview with source/destination markers
- Cargo weight validation against vehicle max load capacity
- Financial tracking: Revenue, Fuel Cost, Tolls, Net Profit
- Status-dependent action buttons (Schedule, Dispatch, Start, Complete, Cancel)

---

### 8. Driver Registry

<img src="assets/driver registery.png" alt="Driver Registry" width="100%" />

- Full CRUD with 10+ seeded driver profiles
- **Safety Score Gauge** (0-100) based on 6 weighted factors:
  - Accidents, Violations, On-time Rate, Fuel Efficiency, Inspection Pass Rate, Experience
- License management: Number, Category (LMV/HMV/HGV etc.), Expiry date
- **License Expiry Alerts**: Color-coded indicators
  - Green: > 30 days remaining
  - Amber: 7-30 days remaining
  - Red: < 7 days or expired
- Driver health report and fitness documentation
- Trip history tab with route, vehicle, distance, and status
- Drowsiness alert history from CV monitoring
- Face verification profile for driver identity checks

---

### 9. Vehicle Maintenance Center

<img src="assets/vehicle maintainence center.png" alt="Maintenance Center" width="100%" />

- 4 maintenance types: Preventive, Corrective, Emergency, Inspection
- Status workflow: Scheduled, In Progress, Completed, Cancelled
- **Auto Status Change**: Scheduling maintenance sets vehicle to "In Shop"; completing it restores to "Available"
- Cost tracking per maintenance record
- Parts replacement logging
- Mechanic assignment
- Expandable row details with notes and duration

---

### 10. Fuel Logs and Consumption Management

<img src="assets/fuel logs and consumption management.png" alt="Fuel Management" width="100%" />

- Dual-tab interface: Fuel Logs | Expenses
- **Fuel Anomaly Detection**: Statistical 2-sigma deviation flagging
- 7 expense categories: Fuel, Toll, Maintenance, Insurance, Registration, Salary, Other
- Summary KPI cards: Total Liters, Avg Cost/Liter, Anomalies Detected
- Expense breakdown donut chart by category
- Monthly fuel cost trend line chart
- Anomaly rows highlighted with danger indicator

---

### 11. Reports and PDF Generation

<img src="assets/reports pdf generation.png" alt="Reports Center" width="100%" />

**8 Report Types:**

| Report | Description |
|--------|-------------|
| Fleet Summary | All vehicle stats aggregated |
| Vehicle Report | Deep dive on a single vehicle |
| Driver Performance | Safety and trip statistics |
| Trip Report | Route map, QR code, financials |
| Fuel Consumption | Trends and anomaly analysis |
| Expense Report | Category and period breakdown |
| Maintenance History | Fleet-wide or per-vehicle |
| ROI Analysis | Revenue vs cost per vehicle |

- **PDF Export**: html2canvas + jsPDF for client-side generation
- **CSV Export**: Client-side array-to-CSV with UTF-8 BOM
- Date range picker and vehicle/driver selector parameters
- In-page preview before download

---

### 12. Alerts, Events, and Notifications

<img src="assets/alerts and events generation.png" alt="Alerts and Events" width="100%" />

- **12 Notification Types**: License Expiry, Maintenance Due, Fuel Anomaly, Trip Updates, Inspection Failed, Drowsiness Alert, and more
- Topbar bell icon with unread badge count
- Dropdown panel with recent 10 notifications
- Full-page notification center with type filters
- Color-coded severity borders: Danger (red), Warning (amber), Success (green), Info (blue)
- **Email Notifications**: Automated event reports sent to authorized personnel via Nodemailer
- **Cron-based Expiry Alerts**: Triggers at 60, 30, 15, 7, and 1 day before document expiry

---

### 13. Settings

<img src="assets/settings page with notification dialogue box.png" alt="Settings Page" width="100%" />

- **Profile Management**: View/edit name, email, avatar
- **Appearance**: Light/Dark theme toggle, accent color selection
- **Notification Preferences**: Toggle per notification type
- **Security**: Password change with confirmation
- **System Info**: API version, database, environment, tech stack

---

## Document Vault and Compliance

TransitOps maintains a secure document management system for all fleet paperwork:

- **Vehicle Documents**: Insurance, Registration Certificate (RC), Fitness Certificate, PUC, Permit
- **Driver Documents**: License (with category), Health/Fitness Report, Address Proof
- **Expiry Monitoring**: Automated cron job checks at 60/30/15/7/1 day intervals
- **Alert Cascade**: In-app notification, email to fleet manager, dashboard warning badge
- **Audit Trail**: Every document upload, update, and expiry event is logged

---

## Architecture

### System Overview

```
+------------------+        +------------------+        +------------------+
|                  |        |                  |        |                  |
|   React + Vite   | <----> |  Express + JWT   | <----> |   PostgreSQL     |
|   (Port 5173)    |  REST  |  (Port 3001)     | Prisma |   (Port 5432)    |
|                  |        |                  |        |                  |
+------------------+        +------------------+        +------------------+
        |                           |
        v                           v
+------------------+        +------------------+
|  Leaflet Maps    |        |  Nodemailer      |
|  MediaPipe CV    |        |  node-cron       |
|  Recharts        |        |  Zod Validation  |
+------------------+        +------------------+
```

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite 6, Vanilla CSS (GaugeOS Design System) |
| **State** | Zustand (auth, theme, sidebar, notifications) |
| **Data Fetching** | TanStack React Query with Axios |
| **Charts** | Recharts (SVG-based, composable) |
| **Maps** | react-leaflet + Leaflet with Google/OSM tiles |
| **Icons** | lucide-react (tree-shakeable SVGs, zero emojis) |
| **Forms** | react-hook-form + Zod validation |
| **PDF/CSV** | html2canvas + jsPDF (client), PDFKit (server) |
| **QR Codes** | qrcode.react |
| **Backend** | Node.js 20+, Express.js, TypeScript |
| **ORM** | Prisma 7 with PostgreSQL adapter |
| **Database** | PostgreSQL 16 (ACID, JSONB, full-text search) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **CV/AI** | MediaPipe Face Landmarker, YOLO v8, EasyOCR |
| **Email** | Nodemailer for automated notifications |

### Database Schema

```
12 models | 6 enums | 15+ indexed fields
```

| Model | Key Fields |
|-------|-----------|
| User | email, role (6 RBAC roles), lastLogin |
| Vehicle | registrationNumber, healthScore, status, document expiries |
| Driver | licenseNumber, safetyScore, faceEmbedding, status |
| Trip | 7-state lifecycle, source/dest coords, cargo, revenue |
| Maintenance | 4 types, cost, parts, auto status transitions |
| FuelLog | quantity, costPerUnit, anomaly flag, odometer |
| Expense | 7 categories, receipt storage, trip linkage |
| Inspection | 14-item JSON checklist, pass/fail with notes |
| Notification | 12 types, read/unread, user targeting |
| VehicleTimeline | 11 event types, chronological history |
| AuditLog | full activity tracking, IP logging |

---

## API Endpoints

```
POST   /api/auth/login          # JWT authentication
POST   /api/auth/register       # Admin-only user creation
GET    /api/auth/me             # Current user profile

GET    /api/dashboard/stats     # Aggregated KPI metrics

CRUD   /api/vehicles            # Fleet registry
CRUD   /api/drivers             # Driver management
CRUD   /api/trips               # Trip lifecycle operations
CRUD   /api/maintenance         # Maintenance scheduling
CRUD   /api/fuel                # Fuel log tracking
CRUD   /api/notifications       # Alert management

GET    /api/search?q=           # Global search (vehicles, drivers, trips)
```

---

## Business Rules Engine

19 validated business rules enforced across the platform:

| Rule | Description |
|------|-------------|
| VR-001 | Unique vehicle registration number |
| TR-001 | Cargo weight cannot exceed vehicle max load |
| TR-002 | Vehicle must be AVAILABLE for trip assignment |
| TR-003 | Driver must be AVAILABLE for trip assignment |
| MR-001 | Scheduling maintenance auto-sets vehicle to IN_SHOP |
| MR-002 | Completing maintenance auto-restores AVAILABLE status |
| IR-001 | Failed inspection blocks vehicle dispatch |
| LR-001 | Expired license flags driver as non-compliant |
| FR-001 | Fuel anomaly detection via 2-sigma statistical threshold |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time | < 200ms |
| AI Endpoint Response | < 500ms |
| Fleet Utilization Rate | > 75% |
| Dispatch Time | < 2 minutes |
| Maintenance Compliance | 100% |
| Document Expiry Coverage | 100% |
| Report Generation | < 5 seconds |
| Concurrent Users | 50+ |

---

## Mobile-First Portable Experience

TransitOps offers a dedicated, fully responsive mobile view designed for **better, easy, and portable use** by drivers and on-the-go managers.

<table>
<tr>
<td width="50%" align="center">
  <!-- TODO: Attach Mobile Screenshot 1 Here -->
  <img src="assets/mobile-placeholder-1.png" alt="Mobile View 1" width="250" />
</td>
<td width="50%" align="center">
  <!-- TODO: Attach Mobile Screenshot 2 Here -->
  <img src="assets/mobile-placeholder-2.png" alt="Mobile View 2" width="250" />
</td>
</tr>
</table>

- **Dedicated Mobile Navigation**: Bottom tab bar replaces the sidebar for instant one-handed access.
- **Global CSS variable scaling** at 768px breakpoint (reduced spacing, typography, radii).
- **Horizontal scrollable tabs** for status filters to maximize screen real estate.
- **Single-column card layouts** ensuring data is perfectly readable on small screens.
- **Touch-optimized buttons** with larger tap targets.
- **Collapsible elements** ensuring the dashboard fits entirely inside the mobile viewport.
- **Multi-language Support**: Layouts architected to support English, Hindi, and Gujarati localization.

---

## Security

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT with HS256 signing |
| Password Hashing | bcrypt with 12 salt rounds |
| RBAC | 6 roles with permission matrix |
| Protected Routes | Middleware chain (verifyToken + requireRole) |
| Input Validation | Zod schemas on every endpoint |
| Session Management | Token expiry (24h), auto-redirect on 401 |

---

## Audit Logs / Activity History

TransitOps maintains a complete, enterprise-grade history of every important system action. 
- **Traceability**: Logs user logins, vehicle creation, trip dispatch, maintenance updates, and fuel entries.
- **Accountability**: Every action is tied to a user ID and IP address.
- **Debugging**: Easily trace state changes (e.g., who changed the vehicle status to "In Shop").

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@transitops.io` | `Admin@123` |
| Fleet Manager | `fleet@transitops.io` | `Fleet@123` |
| Dispatcher | `dispatch@transitops.io` | `Dispatch@123` |
| Safety Officer | `safety@transitops.io` | `Safety@123` |
| Finance Manager | `finance@transitops.io` | `Finance@123` |
| Driver | `driver@transitops.io` | `Driver@123` |

---

## Seeded Data

| Entity | Count |
|--------|-------|
| Users | 6 |
| Vehicles | 15 |
| Drivers | 10 |
| Trips | 25 |
| Maintenance Records | 8 |
| Fuel Logs | 30 |
| Expenses | 20 |
| Inspections | 5 |
| Notifications | 50 |
| Timeline Events | 40 |

---

## Project Structure

```
TransitOps/
  client/                     # React + Vite Frontend
    src/
      components/layout/      # Sidebar, Topbar, BottomNav
      features/
        auth/                  # Login, Protected Routes
        dashboard/             # KPI Cards, Charts, Bento Grid
        vehicles/              # Fleet Registry CRUD
        drivers/               # Driver Management CRUD
        trips/                 # Trip Lifecycle Operations
        maintenance/           # Maintenance Scheduling
        fuel/                  # Fuel & Expense Tracking
        reports/               # PDF/CSV Report Generation
        fleet-map/             # Live Map with Leaflet
        inspections/           # Digital 14-Point Checklist
        ai/                    # Smart Routing & AI Dispatch
        cv/                    # Drowsiness, LPR, Safety Monitor
        events/                # System Events & Alerts
        settings/              # Profile, Theme, Security
      store/                   # Zustand Stores
      styles/                  # GaugeOS Design System
  server/                     # Express + Prisma Backend
    src/
      config/                  # Database, Auth Config
      middleware/              # JWT Verification, RBAC
      routes/                  # REST API Endpoints
    prisma/
      schema.prisma            # 12 Models, 6 Enums
      seed.ts                  # Demo Data Generator
  assets/                     # Screenshots & Media
  docs/                       # PRD, Feature Audit, Module Docs
  start.sh                    # One-command launcher
```

---

## Why TransitOps

| Problem | TransitOps Solution |
|---------|-------------------|
| Manual vehicle allocation | AI dispatch with 5-factor scoring algorithm |
| Driver safety blind spots | Real-time drowsiness detection with MediaPipe |
| Expired documents and licenses | Automated cron alerts at 60/30/15/7/1 day intervals |
| No fleet visibility | Live GPS map with color-coded vehicle markers |
| Paper-based inspections | Digital 14-point checklist that blocks unsafe dispatch |
| Fuel theft and waste | Statistical anomaly detection (2-sigma) |
| Slow report generation | One-click PDF/CSV with in-page preview |
| Fragmented spreadsheets | Unified platform covering the entire fleet lifecycle |

---

<p align="center">
  <strong>Built for the future of fleet operations.</strong>
</p>
