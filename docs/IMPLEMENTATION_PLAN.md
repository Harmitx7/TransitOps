# TransitOps — Implementation Plan

> **Version:** 1.0  
> **Date:** 2026-07-12  
> **Approach:** Phased delivery, core-first, AI/CV modules last

---

## Phase Overview

| Phase | Name | Duration | Priority |
|---|---|---|---|
| **Phase 0** | Project Setup & Infrastructure | Day 1 | P0 |
| **Phase 1** | Core CRUD Modules | Days 2-4 | P0 |
| **Phase 2** | Business Logic & Workflows | Days 5-6 | P0 |
| **Phase 3** | Dashboard & Reports | Days 7-8 | P1 |
| **Phase 4** | AI Intelligence Modules | Days 9-10 | P1 |
| **Phase 5** | Computer Vision Modules | Days 11-12 | P2 |
| **Phase 6** | Polish, i18n & PWA | Days 13-14 | P2 |

---

## Phase 0 — Project Setup & Infrastructure (Day 1)

### 0.1 Repository & Monorepo Structure

```
TransitOps/
├── client/                  # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/      # Shared UI components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── layout/      # Sidebar, Topbar, etc.
│   │   │   └── common/      # Reusable components
│   │   ├── features/        # Feature-based modules
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── vehicles/
│   │   │   ├── drivers/
│   │   │   ├── trips/
│   │   │   ├── maintenance/
│   │   │   ├── fuel/
│   │   │   ├── expenses/
│   │   │   ├── reports/
│   │   │   ├── fleet-map/
│   │   │   ├── inspections/
│   │   │   ├── notifications/
│   │   │   ├── ai/
│   │   │   ├── cv/
│   │   │   └── settings/
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities, API client, constants
│   │   ├── store/           # Zustand stores
│   │   ├── i18n/            # Translation files
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── server/                  # Node.js backend (Express)
│   ├── src/
│   │   ├── config/          # DB, auth, env config
│   │   ├── middleware/      # Auth, RBAC, validation, error handler
│   │   ├── routes/          # Route definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── validators/      # Zod schemas
│   │   ├── utils/           # Helpers, constants
│   │   ├── cron/            # Scheduled jobs
│   │   └── app.ts           # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── tsconfig.json
│   └── package.json
│
├── ml-service/              # Python ML/CV service (FastAPI)
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/         # API route files
│   │   ├── models/          # ML model files
│   │   ├── services/        # Prediction logic
│   │   └── config.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                    # Documentation (this folder)
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### 0.2 Setup Tasks

| # | Task | Command / Action |
|---|---|---|
| 1 | Initialize Git repo | `git init` |
| 2 | Create Vite + React + TS project | `npx -y create-vite@latest client -- --template react-ts` |
| 3 | Install frontend deps | `npm i @tanstack/react-query axios zustand react-router-dom react-hook-form @hookform/resolvers zod recharts react-leaflet leaflet qrcode.react react-i18next i18next jspdf html2canvas lucide-react clsx tailwind-merge framer-motion` |
| 4 | Setup Tailwind CSS | `npx tailwindcss init -p`, configure |
| 5 | Install shadcn/ui | `npx shadcn-ui@latest init`, add components |
| 6 | Create server project | `mkdir server && cd server && npm init -y` |
| 7 | Install backend deps | `npm i express cors helmet morgan compression cookie-parser jsonwebtoken bcryptjs prisma @prisma/client zod nodemailer node-cron pdfkit csv-writer multer cloudinary dotenv pino` |
| 8 | Install backend dev deps | `npm i -D typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs @types/cookie-parser @types/multer tsx nodemon` |
| 9 | Initialize Prisma | `npx prisma init` |
| 10 | Create PostgreSQL database | `createdb transitops_dev` |
| 11 | Write Prisma schema | Copy from docs/database/schema.md |
| 12 | Run initial migration | `npx prisma migrate dev --name init` |
| 13 | Write seed script | `prisma/seed.ts` with demo data |
| 14 | Seed database | `npx prisma db seed` |
| 15 | Setup Python ML service | `python -m venv venv && pip install fastapi uvicorn scikit-learn xgboost opencv-python mediapipe insightface` |
| 16 | Create Docker Compose | PostgreSQL + Node + Python + Nginx |
| 17 | Setup .env files | Database URL, JWT secret, API keys |
| 18 | Configure ESLint + Prettier | Both client and server |
| 19 | Create README.md | Setup instructions |

### 0.3 Deliverables

- [ ] Both client and server start without errors
- [ ] Prisma schema migrated, DB tables created
- [ ] Seed data populated
- [ ] Hot reload working for frontend and backend
- [ ] Base layout (sidebar + topbar) renders

---

## Phase 1 — Core CRUD Modules (Days 2-4)

### Day 2: Authentication + Layout + Vehicle Registry

| # | Task | Details |
|---|---|---|
| 1 | Auth API | Register, login, refresh, logout, forgot/reset password |
| 2 | Auth middleware | JWT verification, RBAC authorization |
| 3 | Login page | Email + password form, validation, error handling |
| 4 | App layout | Sidebar navigation, topbar with user menu, notification bell |
| 5 | Protected routes | React Router with auth guard HOC |
| 6 | Vehicle CRUD API | All endpoints from Module 03 |
| 7 | Vehicle list page | Table with search, filter, sort, pagination |
| 8 | Vehicle create/edit forms | All fields + document upload |
| 9 | Vehicle detail page | Profile, documents, health score |
| 10 | QR code generation | Auto-generate on vehicle creation |

### Day 3: Driver Management + Trip Management

| # | Task | Details |
|---|---|---|
| 1 | Driver CRUD API | All endpoints from Module 04 |
| 2 | Driver list page | Table with filters, safety score badges |
| 3 | Driver create/edit forms | Personal details + license + face photo |
| 4 | Driver detail page | Profile, trips, safety events |
| 5 | Trip CRUD API | All endpoints from Module 05 |
| 6 | Trip list page | Table with status badges, filters |
| 7 | Trip create form | Source/dest, vehicle/driver selection, cargo |
| 8 | Trip detail page | Full trip info, map route, expenses |
| 9 | Trip lifecycle API | Validate, dispatch, start, complete, cancel |

### Day 4: Maintenance + Fuel + Expenses

| # | Task | Details |
|---|---|---|
| 1 | Maintenance CRUD API | All endpoints from Module 06 |
| 2 | Maintenance pages | List, create, detail, parts management |
| 3 | Fuel Log CRUD API | All endpoints from Module 07 |
| 4 | Fuel log pages | List, create, vehicle history |
| 5 | Expense CRUD API | All endpoints from Module 07 |
| 6 | Expense pages | List, create, approval workflow |
| 7 | Global search API | Search across vehicles, drivers, trips |

### Phase 1 Deliverables

- [ ] All 5 core entities have full CRUD
- [ ] Auth flow complete (login → dashboard → protected routes)
- [ ] All list pages with search, filter, sort, pagination
- [ ] All create/edit forms with Zod validation
- [ ] All detail pages with related data

---

## Phase 2 — Business Logic & Workflows (Days 5-6)

### Day 5: Business Rules + Status Transitions

| # | Task | Details |
|---|---|---|
| 1 | Business rules engine | All 19 rules from Module 12 |
| 2 | Trip validation middleware | Pre-dispatch checks |
| 3 | Automatic status transitions | Vehicle/driver status on trip/maintenance events |
| 4 | Trip lifecycle UI | Status stepper, action buttons per state |
| 5 | Notification system API | CRUD + mark read + preferences |
| 6 | Notification cron jobs | Document expiry, license expiry, maintenance due |
| 7 | Notification UI | Bell icon, dropdown, full page |

### Day 6: Inspections + Timeline + ETA

| # | Task | Details |
|---|---|---|
| 1 | Inspection API | Create, update items, submit |
| 2 | Inspection UI | Checklist form with photo upload |
| 3 | Inspection-dispatch integration | Failed inspection blocks dispatch |
| 4 | Vehicle timeline API | Auto-generated events |
| 5 | Vehicle timeline UI | Vertical timeline component |
| 6 | ETA tracking link API | Generate + public tracking page |
| 7 | Public tracking page | Map + ETA + progress bar (no auth) |

### Phase 2 Deliverables

- [ ] All 19 business rules enforced and tested
- [ ] Status transitions automatic and consistent
- [ ] Notification system operational
- [ ] Pre-trip inspection workflow complete
- [ ] Vehicle timeline populated automatically
- [ ] ETA sharing link functional

---

## Phase 3 — Dashboard & Reports (Days 7-8)

### Day 7: Dashboards

| # | Task | Details |
|---|---|---|
| 1 | Dashboard KPI API | Fleet, dispatch, financial, safety endpoints |
| 2 | KPI card components | Animated number counters, trend indicators |
| 3 | Fleet Manager dashboard | Utilization, health, status distribution |
| 4 | Dispatcher dashboard | Active/pending trips, drivers on duty |
| 5 | Financial dashboard | Revenue, costs, profitability |
| 6 | Safety dashboard | Driver scores, violations, compliance |
| 7 | Dashboard charts | Recharts: donut, area, bar, line, heatmap |
| 8 | Global filters | Date range, region, vehicle type, status |

### Day 8: Reports

| # | Task | Details |
|---|---|---|
| 1 | Report generation API | All 8 report types |
| 2 | PDF generation | PDFKit templates with branding |
| 3 | CSV export | Client-side from table data |
| 4 | Report UI | Parameter selection, generate button, download |
| 5 | Report history | List of generated reports |
| 6 | Dashboard dark mode | CSS custom properties for chart colors |

### Phase 3 Deliverables

- [ ] 4 role-specific dashboards with real KPIs
- [ ] 10 interactive charts
- [ ] 8 report types generating PDF and CSV
- [ ] Dark mode fully functional

---

## Phase 4 — AI Intelligence Modules (Days 9-10)

### Day 9: Dispatch + Routes

| # | Task | Details |
|---|---|---|
| 1 | Python FastAPI service setup | Project structure, CORS, health check |
| 2 | Smart Dispatch algorithm | Multi-factor vehicle ranking |
| 3 | Dispatch recommendation API | Node proxy → Python service |
| 4 | Dispatch recommendation UI | Ranked vehicle cards in trip creation |
| 5 | Route Optimization integration | OpenRouteService API |
| 6 | Route optimization UI | 3 route options on map |
| 7 | Fuel estimation (rule-based) | Distance / baseline efficiency |

### Day 10: Predictions + Scoring

| # | Task | Details |
|---|---|---|
| 1 | Fuel prediction model | XGBoost trained on seed data |
| 2 | Fuel prediction API + UI | Predicted vs actual in trip detail |
| 3 | Predictive maintenance model | Service predictions per vehicle |
| 4 | Predictive maintenance UI | Upcoming maintenance alerts |
| 5 | Vehicle health score calculator | Weighted formula |
| 6 | Driver safety score calculator | Weighted formula |
| 7 | Health/safety score APIs | Batch recalculation endpoints |

### Phase 4 Deliverables

- [ ] Smart dispatch ranks vehicles intelligently
- [ ] 3 route options displayed on map
- [ ] Fuel prediction shows expected consumption
- [ ] Predictive maintenance forecasts next services
- [ ] Health and safety scores calculated accurately

---

## Phase 5 — Computer Vision Modules (Days 11-12)

### Day 11: LPR + Face Recognition

| # | Task | Details |
|---|---|---|
| 1 | YOLOv8 plate detection model | Pre-trained or custom |
| 2 | OCR pipeline | EasyOCR for Indian plates |
| 3 | LPR API endpoint | Image → plate text → vehicle lookup |
| 4 | LPR demo UI | Upload image → show detected plate + vehicle |
| 5 | Face registration API | Upload face → extract embedding |
| 6 | Face verification API | Camera frame → compare embedding |
| 7 | Face verification UI | Live camera feed → verified/unauthorized |

### Day 12: Seatbelt + Drowsiness

| # | Task | Details |
|---|---|---|
| 1 | Seatbelt detection model | YOLOv8 custom trained |
| 2 | Seatbelt detection API | Image → seatbelt status |
| 3 | Seatbelt demo UI | Upload → detection result |
| 4 | Drowsiness detection | MediaPipe Face Mesh + EAR/MAR |
| 5 | Drowsiness API | Frame → drowsiness level |
| 6 | Drowsiness demo UI | Upload image/video → analysis |
| 7 | Safety events integration | CV events create SafetyEvent records |

### Phase 5 Deliverables

- [ ] License plate recognition with vehicle lookup
- [ ] Face verification for driver authentication
- [ ] Seatbelt compliance detection
- [ ] Drowsiness detection with alert levels
- [ ] All CV events logged as safety events

---

## Phase 6 — Polish, i18n & PWA (Days 13-14)

### Day 13: i18n + Mobile + QR

| # | Task | Details |
|---|---|---|
| 1 | i18n setup | react-i18next with EN, HI, GU |
| 2 | Translation files | All UI strings in 3 languages |
| 3 | Language switcher | Dropdown in topbar |
| 4 | Mobile responsive | Test all pages on 360px viewport |
| 5 | QR scanner page | Camera-based QR scan → vehicle profile |
| 6 | Driver mobile view | Optimized trip list, fuel entry, inspection |
| 7 | PWA manifest | Service worker, offline fallback, install prompt |

### Day 14: Testing + Polish + Demo

| # | Task | Details |
|---|---|---|
| 1 | Business rule tests | 57 tests (3 per rule × 19 rules) |
| 2 | API integration tests | Happy path for all endpoints |
| 3 | UI polish | Animations, loading states, empty states, error states |
| 4 | Live fleet map | Simulated vehicle positions |
| 5 | Seed data verification | Ensure demo data tells a story |
| 6 | Performance audit | Lighthouse, bundle size check |
| 7 | README + setup docs | Complete documentation |
| 8 | Demo script | Walkthrough script for hackathon presentation |

### Phase 6 Deliverables

- [ ] 3-language support working
- [ ] Mobile-responsive on all pages
- [ ] QR code scanning functional
- [ ] PWA installable
- [ ] 57+ business rule tests passing
- [ ] Demo-ready with comprehensive seed data

---

## Seed Data Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@transitops.com | TransitOps@2026 |
| Fleet Manager | fleet@transitops.com | TransitOps@2026 |
| Dispatcher | dispatch@transitops.com | TransitOps@2026 |
| Safety Officer | safety@transitops.com | TransitOps@2026 |
| Financial Analyst | finance@transitops.com | TransitOps@2026 |
| Driver | driver@transitops.com | TransitOps@2026 |

---

## Risk Mitigations

| Risk | Mitigation | Fallback |
|---|---|---|
| CV models don't train in time | Use pre-trained YOLO models | Demo with static images |
| OpenRouteService API limits | Cache route results | Show pre-computed routes |
| i18n translation volume | Translate critical pages first | English-only for low-priority pages |
| Time pressure | Cut Phase 6 features first | Core (P0) must be complete |
| PostgreSQL setup issues | Docker Compose with pre-configured PG | SQLite as emergency fallback |

---

## Definition of Done

A feature is considered "done" when:

1. API endpoint returns correct data with proper status codes
2. Frontend displays data correctly with loading/error/empty states
3. Form validation works (client + server)
4. Business rules are enforced
5. Responsive on mobile (360px+)
6. Dark mode compatible
7. No console errors or warnings
8. Prisma migrations applied cleanly
