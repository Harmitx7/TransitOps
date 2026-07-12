# TransitOps — API Specification

> **Base URL:** `/api/v1`  
> **Auth:** Bearer JWT in Authorization header  
> **Content-Type:** `application/json`

---

## Conventions

### Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error (RFC 9457):**
```json
{
  "success": false,
  "error": {
    "status": 422,
    "type": "VALIDATION_ERROR",
    "title": "Validation failed",
    "detail": "Registration number already exists",
    "violations": [
      { "field": "registrationNumber", "message": "Must be unique" }
    ]
  }
}
```

### Pagination

```
GET /vehicles?page=1&limit=20&sort=createdAt&order=desc
```

### Filtering

```
GET /vehicles?status=AVAILABLE&type=TRUCK&search=MH12
```

---

## Complete Endpoint Registry

### Authentication (`/auth`)

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | — | `{ email, password, firstName, lastName, role }` | `{ user, accessToken }` |
| POST | `/auth/login` | — | `{ email, password }` | `{ user, accessToken }` (+ httpOnly refresh cookie) |
| POST | `/auth/refresh` | Cookie | — | `{ accessToken }` |
| POST | `/auth/logout` | Bearer | — | `{ message }` |
| POST | `/auth/forgot-password` | — | `{ email }` | `{ message }` |
| POST | `/auth/reset-password` | — | `{ token, password }` | `{ message }` |
| GET | `/auth/me` | Bearer | — | `{ user }` |
| PUT | `/auth/me` | Bearer | `{ firstName?, lastName?, phone?, avatar? }` | `{ user }` |
| PUT | `/auth/change-password` | Bearer | `{ currentPassword, newPassword }` | `{ message }` |

### Users (`/users`) — Admin only

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users |
| GET | `/users/:id` | Admin | User detail |
| PUT | `/users/:id` | Admin | Update user (role, status) |
| DELETE | `/users/:id` | Admin | Deactivate user |

### Vehicles (`/vehicles`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/vehicles` | Bearer | All |
| GET | `/vehicles/:id` | Bearer | All |
| POST | `/vehicles` | Bearer | Admin, FM |
| PUT | `/vehicles/:id` | Bearer | Admin, FM |
| DELETE | `/vehicles/:id` | Bearer | Admin |
| GET | `/vehicles/:id/qr` | Bearer | All |
| POST | `/vehicles/:id/documents` | Bearer | Admin, FM |
| DELETE | `/vehicles/:id/documents/:docId` | Bearer | Admin, FM |
| GET | `/vehicles/:id/health` | Bearer | All |
| GET | `/vehicles/:id/timeline` | Bearer | All |
| GET | `/vehicles/search` | Bearer | All |
| GET | `/vehicles/stats` | Bearer | Admin, FM |

### Drivers (`/drivers`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/drivers` | Bearer | Admin, FM, Disp, Safety |
| GET | `/drivers/:id` | Bearer | All |
| POST | `/drivers` | Bearer | Admin, FM |
| PUT | `/drivers/:id` | Bearer | Admin, FM, Safety |
| DELETE | `/drivers/:id` | Bearer | Admin |
| POST | `/drivers/:id/face-profile` | Bearer | Admin, FM |
| GET | `/drivers/:id/safety-events` | Bearer | Admin, FM, Safety |
| GET | `/drivers/:id/safety-score` | Bearer | All |
| GET | `/drivers/:id/trips` | Bearer | All |
| GET | `/drivers/expiring-licenses` | Bearer | Admin, FM, Safety |
| GET | `/drivers/available` | Bearer | Dispatcher |

### Trips (`/trips`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/trips` | Bearer | Admin, FM, Disp, Fin |
| GET | `/trips/:id` | Bearer | All |
| POST | `/trips` | Bearer | Admin, FM, Disp |
| PUT | `/trips/:id` | Bearer | Admin, FM, Disp |
| POST | `/trips/:id/validate` | Bearer | Admin, FM, Disp |
| POST | `/trips/:id/dispatch` | Bearer | Admin, FM, Disp |
| POST | `/trips/:id/start` | Bearer | Driver |
| POST | `/trips/:id/complete` | Bearer | Driver |
| POST | `/trips/:id/cancel` | Bearer | Admin, FM, Disp |
| POST | `/trips/:id/tracking-link` | Bearer | Disp |
| GET | `/trips/track/:token` | Public | — |
| GET | `/trips/:id/expenses` | Bearer | All |
| GET | `/trips/:id/fuel-logs` | Bearer | All |
| GET | `/trips/my-trips` | Bearer | Driver |

### Maintenance (`/maintenance`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/maintenance` | Bearer | Admin, FM |
| GET | `/maintenance/:id` | Bearer | Admin, FM |
| POST | `/maintenance` | Bearer | Admin, FM |
| PUT | `/maintenance/:id` | Bearer | Admin, FM |
| POST | `/maintenance/:id/start` | Bearer | Admin, FM |
| POST | `/maintenance/:id/complete` | Bearer | Admin, FM |
| POST | `/maintenance/:id/cancel` | Bearer | Admin, FM |
| POST | `/maintenance/:id/parts` | Bearer | Admin, FM |
| DELETE | `/maintenance/:id/parts/:partId` | Bearer | Admin, FM |
| GET | `/maintenance/vehicle/:vehicleId` | Bearer | All |
| GET | `/maintenance/upcoming` | Bearer | Admin, FM |
| GET | `/maintenance/overdue` | Bearer | Admin, FM |

### Fuel Logs (`/fuel-logs`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/fuel-logs` | Bearer | Admin, FM, Fin |
| GET | `/fuel-logs/:id` | Bearer | All |
| POST | `/fuel-logs` | Bearer | Admin, FM, Driver |
| PUT | `/fuel-logs/:id` | Bearer | Admin, FM |
| DELETE | `/fuel-logs/:id` | Bearer | Admin |
| GET | `/fuel-logs/vehicle/:vehicleId` | Bearer | All |
| GET | `/fuel-logs/anomalies` | Bearer | Admin, FM, Fin |
| GET | `/fuel-logs/stats` | Bearer | Admin, FM, Fin |

### Expenses (`/expenses`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/expenses` | Bearer | Admin, FM, Fin |
| GET | `/expenses/:id` | Bearer | All |
| POST | `/expenses` | Bearer | Admin, FM, Disp, Driver |
| PUT | `/expenses/:id` | Bearer | Admin, FM, Fin |
| DELETE | `/expenses/:id` | Bearer | Admin |
| POST | `/expenses/:id/approve` | Bearer | Admin, Fin |
| GET | `/expenses/summary` | Bearer | Admin, FM, Fin |

### Inspections (`/inspections`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| POST | `/inspections` | Bearer | Driver, FM |
| GET | `/inspections/:id` | Bearer | All |
| PUT | `/inspections/:id/items/:itemId` | Bearer | Driver |
| POST | `/inspections/:id/complete` | Bearer | Driver |
| GET | `/inspections/vehicle/:vehicleId` | Bearer | All |
| GET | `/inspections/trip/:tripId` | Bearer | All |

### Dashboard (`/dashboard`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/dashboard/fleet-kpis` | Bearer | FM |
| GET | `/dashboard/dispatch-kpis` | Bearer | Disp |
| GET | `/dashboard/financial-kpis` | Bearer | Fin |
| GET | `/dashboard/safety-kpis` | Bearer | Safety |
| GET | `/dashboard/charts/:chartId` | Bearer | All |
| GET | `/dashboard/summary` | Bearer | All |

### Reports (`/reports`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| POST | `/reports/fleet` | Bearer | Admin, FM, Fin |
| POST | `/reports/vehicle/:vehicleId` | Bearer | Admin, FM, Fin |
| POST | `/reports/driver/:driverId` | Bearer | Admin, FM, Safety, Fin |
| POST | `/reports/expenses` | Bearer | Admin, Fin |
| POST | `/reports/fuel` | Bearer | Admin, FM, Fin |
| POST | `/reports/maintenance` | Bearer | Admin, FM |
| POST | `/reports/roi` | Bearer | Admin, Fin |
| POST | `/reports/trips` | Bearer | Admin, FM, Disp, Fin |
| GET | `/reports/history` | Bearer | All |
| GET | `/reports/:id/download` | Bearer | All |

### Notifications (`/notifications`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/notifications` | Bearer | All |
| GET | `/notifications/unread-count` | Bearer | All |
| PUT | `/notifications/:id/read` | Bearer | All |
| PUT | `/notifications/read-all` | Bearer | All |
| DELETE | `/notifications/:id` | Bearer | All |
| GET | `/notifications/preferences` | Bearer | All |
| PUT | `/notifications/preferences` | Bearer | All |

### Fleet Map (`/fleet`)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/fleet/positions` | Bearer | All |
| GET | `/fleet/positions/:vehicleId` | Bearer | All |
| PUT | `/fleet/positions/:vehicleId` | Bearer | Driver |

### AI Modules (`/ai`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/ai/dispatch/recommend` | Bearer | Smart dispatch ranking |
| POST | `/ai/routes/optimize` | Bearer | Route optimization |
| POST | `/ai/fuel/predict` | Bearer | Fuel prediction |
| GET | `/ai/maintenance/predict/:vehicleId` | Bearer | Predictive maintenance |
| GET | `/ai/maintenance/fleet-forecast` | Bearer | Fleet maintenance forecast |
| GET | `/ai/health/vehicle/:vehicleId` | Bearer | Vehicle health score |
| GET | `/ai/safety/driver/:driverId` | Bearer | Driver safety score |
| POST | `/ai/health/recalculate-all` | Bearer | Batch recalculate |

### Computer Vision (`/cv`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/cv/lpr/detect` | Bearer | License plate detection |
| POST | `/cv/lpr/identify` | Bearer | Plate detection + vehicle lookup |
| POST | `/cv/face/register` | Bearer | Register driver face |
| POST | `/cv/face/verify` | Bearer | Verify driver identity |
| POST | `/cv/seatbelt/detect` | Bearer | Seatbelt detection |
| POST | `/cv/drowsiness/analyze` | Bearer | Drowsiness analysis |

---

## Total Endpoints: **~95**

| Module | Count |
|---|---|
| Auth | 9 |
| Users | 4 |
| Vehicles | 12 |
| Drivers | 11 |
| Trips | 14 |
| Maintenance | 12 |
| Fuel Logs | 8 |
| Expenses | 7 |
| Inspections | 6 |
| Dashboard | 6 |
| Reports | 10 |
| Notifications | 7 |
| Fleet Map | 3 |
| AI | 8 |
| CV | 6 |
