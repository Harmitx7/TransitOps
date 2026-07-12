# TransitOps — Product Requirements Document

> **Version:** 1.0  
> **Date:** 2026-07-12  
> **Status:** Draft  
> **Classification:** Internal / Hackathon Submission

---

## 1. Executive Summary

TransitOps is an AI-powered Smart Transport Operations Platform that digitizes the complete fleet lifecycle. It replaces fragmented spreadsheets and manual coordination with a unified, intelligent system spanning vehicle registration, driver management, dispatch, maintenance, fuel tracking, safety monitoring, financial analytics, and predictive intelligence.

The platform fulfills every mandatory hackathon requirement while extending capabilities with computer vision safety modules, predictive maintenance, AI-powered dispatch recommendations, and real-time fleet visibility.

---

## 2. Problem Statement

Fleet operators today suffer from:

| Problem | Impact |
|---|---|
| Manual vehicle allocation | Low fleet utilization, idle assets |
| Driver scheduling conflicts | Double-bookings, compliance violations |
| Missed maintenance windows | Breakdowns, safety incidents, costly repairs |
| Expired licenses & documents | Legal liability, regulatory fines |
| Fuel wastage & theft | Inflated operating costs |
| Paper-based inspections | No audit trail, inconsistent quality |
| No operational visibility | Reactive decision-making |
| Poor profitability tracking | Unknown cost-per-trip, revenue leaks |
| Manual reporting | Hours wasted on spreadsheet compilation |

**Result:** Reduced fleet utilization, inflated costs, compliance risks, and zero predictive capability.

---

## 3. Solution Overview

TransitOps centralizes every fleet operation into a single intelligent platform with this operational flow:

```
Vehicle Registration
  → Driver Management
    → AI Dispatch Recommendation
      → Trip Execution
        → Computer Vision Safety
          → Fuel Tracking
            → Maintenance Management
              → Expense Management
                → Analytics & Reports
                  → Predictive Intelligence
```

Every action automatically cascades updates to related modules, ensuring operational consistency without manual coordination.

---

## 4. Target Users & RBAC

### 4.1 Role Definitions

| Role | Primary Responsibilities | Dashboard Focus |
|---|---|---|
| **Administrator** | User & role management, system config, audit logs | System health, user activity |
| **Fleet Manager** | Vehicle registry, maintenance oversight, fleet KPIs | Vehicle health, utilization rates |
| **Dispatcher** | Trip creation, vehicle/driver assignment, route planning | Live fleet map, pending trips, ETAs |
| **Safety Officer** | Driver compliance, license monitoring, CV alerts | Safety scores, violation logs |
| **Financial Analyst** | Cost analysis, ROI tracking, report generation | Revenue, expenses, profitability |
| **Driver** | Trip execution, inspections, fuel entry | Assigned trips, navigation, safety score |

### 4.2 Permission Matrix

| Resource | Admin | Fleet Mgr | Dispatcher | Safety | Finance | Driver |
|---|---|---|---|---|---|---|
| Users & Roles | CRUD | R | — | — | — | — |
| Vehicles | CRUD | CRUD | R | R | R | R (own) |
| Drivers | CRUD | CRUD | R | RU | R | R (own) |
| Trips | CRUD | CRUD | CRUD | R | R | RU (own) |
| Maintenance | CRUD | CRUD | R | R | R | R |
| Fuel Logs | CRUD | CRUD | R | — | R | CRU (own) |
| Expenses | CRUD | R | R | — | CRUD | R (own) |
| Reports | CRUD | CR | CR | CR | CRUD | R (own) |
| AI Modules | Full | Full | Use | R | R | — |
| CV Modules | Full | R | — | Full | — | — |
| Settings | Full | R | — | — | — | — |

> `C` = Create, `R` = Read, `U` = Update, `D` = Delete

---

## 5. Core Modules Index

Each module is documented in detail in its own file under `docs/modules/`:

| # | Module | Document |
|---|---|---|
| 1 | Authentication & Authorization | [01-auth.md](./modules/01-auth.md) |
| 2 | Dashboard & KPIs | [02-dashboard.md](./modules/02-dashboard.md) |
| 3 | Vehicle Registry | [03-vehicles.md](./modules/03-vehicles.md) |
| 4 | Driver Management | [04-drivers.md](./modules/04-drivers.md) |
| 5 | Trip Management | [05-trips.md](./modules/05-trips.md) |
| 6 | Maintenance | [06-maintenance.md](./modules/06-maintenance.md) |
| 7 | Fuel & Expense Management | [07-fuel-expenses.md](./modules/07-fuel-expenses.md) |
| 8 | Reports & Export | [08-reports.md](./modules/08-reports.md) |
| 9 | AI Intelligence Modules | [09-ai-modules.md](./modules/09-ai-modules.md) |
| 10 | Computer Vision Modules | [10-computer-vision.md](./modules/10-computer-vision.md) |
| 11 | Notifications & Alerts | [11-notifications.md](./modules/11-notifications.md) |
| 12 | Business Rules Engine | [12-business-rules.md](./modules/12-business-rules.md) |
| 13 | Live Fleet Map & ETA | [13-live-map.md](./modules/13-live-map.md) |
| 14 | Digital Inspection | [14-inspection.md](./modules/14-inspection.md) |
| 15 | Vehicle Timeline | [15-timeline.md](./modules/15-timeline.md) |

---

## 6. Technology Stack

### 6.1 Frontend

| Layer | Technology | Justification |
|---|---|---|
| Framework | React 18+ with TypeScript | Type safety, component ecosystem |
| Styling | Tailwind CSS v4 | Utility-first, rapid prototyping |
| Components | shadcn/ui + Radix Primitives | Accessible, customizable, no vendor lock |
| Charts | Recharts | React-native charting, composable |
| Maps | Leaflet + OpenRouteService | Free tier, no API key restrictions |
| State | Zustand | Lightweight, no boilerplate |
| HTTP | Axios + React Query (TanStack) | Caching, retry, optimistic updates |
| Forms | React Hook Form + Zod | Validation co-located with schema |
| PDF | jsPDF + html2canvas | Client-side PDF generation |
| i18n | react-i18next | Multi-language support |
| QR | qrcode.react | Vehicle QR code generation |

### 6.2 Backend

| Layer | Technology | Justification |
|---|---|---|
| Runtime | Node.js 20+ | Non-blocking I/O, JS ecosystem |
| Framework | Express.js | Mature, middleware-rich |
| ORM | Prisma | Type-safe queries, migrations |
| Database | PostgreSQL 16 | ACID, JSONB, full-text search |
| Auth | JWT (jsonwebtoken) + bcrypt | Stateless auth, secure hashing |
| Validation | Zod | Shared schemas frontend/backend |
| File Upload | Multer + Cloudinary | Local dev + cloud production |
| Email | Nodemailer | Notification delivery |
| Scheduler | node-cron | Periodic tasks (expiry checks) |
| Reports | PDFKit + csv-writer | Server-side report generation |

### 6.3 AI / ML Services

| Layer | Technology | Justification |
|---|---|---|
| Runtime | Python 3.11+ / FastAPI | ML model serving |
| ML Framework | Scikit-learn, XGBoost | Tabular prediction models |
| CV Framework | OpenCV, YOLO v8, MediaPipe | Real-time detection |
| Face Recognition | InsightFace / face_recognition | Driver verification |
| Model Serving | FastAPI endpoints | REST interface to Node backend |

### 6.4 Infrastructure

| Layer | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Process Manager | PM2 (Node), Uvicorn (Python) |
| CI/CD | GitHub Actions |
| Monitoring | Pino (logging) |

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Response Time** | < 200ms for API calls, < 500ms for AI endpoints |
| **Concurrent Users** | 50+ simultaneous users |
| **Uptime** | 99.5% availability |
| **Data Retention** | All records retained indefinitely, soft-delete |
| **Security** | OWASP Top 10 compliance, parameterized queries |
| **Accessibility** | WCAG 2.1 AA for web interface |
| **Browser Support** | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **Mobile** | Responsive PWA, optimized for 360px+ viewports |
| **Languages** | English, Hindi, Gujarati |

---

## 8. Data Architecture

### 8.1 Entity Relationship Summary

```
Organization (1) ──→ (N) Users
Organization (1) ──→ (N) Vehicles
Organization (1) ──→ (N) Drivers

Vehicle (1) ──→ (N) Documents
Vehicle (1) ──→ (N) Trips
Vehicle (1) ──→ (N) FuelLogs
Vehicle (1) ──→ (N) MaintenanceRecords
Vehicle (1) ──→ (N) Inspections
Vehicle (1) ──→ (1) HealthScore

Driver (1) ──→ (N) Trips
Driver (1) ──→ (N) SafetyEvents
Driver (1) ──→ (1) SafetyScore
Driver (1) ──→ (1) FaceProfile

Trip (1) ──→ (N) FuelLogs
Trip (1) ──→ (N) Expenses
Trip (1) ──→ (1) Route
Trip (1) ──→ (1) Inspection

MaintenanceRecord (1) ──→ (N) Parts
Notification ──→ User (recipient)
```

### 8.2 Database Schema

Full schema defined in `docs/database/schema.md`.

---

## 9. API Architecture

RESTful API following these conventions:

| Convention | Standard |
|---|---|
| Base URL | `/api/v1/` |
| Auth | Bearer JWT in Authorization header |
| Pagination | Cursor-based (`?cursor=X&limit=20`) |
| Filtering | Query params (`?status=active&type=truck`) |
| Sorting | `?sort=createdAt&order=desc` |
| Error Format | RFC 9457 Problem Details |
| Versioning | URL path (`/v1/`) |

Full API specification in `docs/api/`.

---

## 10. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Fleet Utilization Rate | > 75% | Active trips / Total vehicles |
| Dispatch Time | < 2 minutes | Time from trip request to assignment |
| Maintenance Compliance | 100% | On-time preventive maintenance |
| Document Expiry Alerts | 100% coverage | All documents monitored |
| Fuel Cost Reduction | 10-15% | AI prediction vs actual |
| Safety Score Improvement | +20% within 3 months | Driver score trend |
| Report Generation Time | < 5 seconds | PDF/CSV generation |

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| CV model accuracy in varied lighting | Medium | High | Pre-trained YOLO models, fallback to manual |
| PostgreSQL scaling under high write load | Low | Medium | Connection pooling, read replicas |
| Third-party map API rate limits | Medium | Low | OpenRouteService self-hosted fallback |
| Browser CV performance on mobile | High | Medium | Server-side CV processing, WebSocket streaming |
| Hackathon time constraint | High | High | Phased delivery, core modules first |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **RBAC** | Role-Based Access Control |
| **CV** | Computer Vision |
| **KPI** | Key Performance Indicator |
| **ETA** | Estimated Time of Arrival |
| **PUC** | Pollution Under Control certificate |
| **RC** | Registration Certificate |
| **ROI** | Return on Investment |
| **PWA** | Progressive Web App |
| **ORM** | Object-Relational Mapping |
| **CRUD** | Create, Read, Update, Delete |

---

> **Next:** See individual module documents in `docs/modules/` and the implementation plan in `docs/IMPLEMENTATION_PLAN.md`.
