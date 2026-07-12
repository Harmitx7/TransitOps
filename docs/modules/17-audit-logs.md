# Module 17 — Audit Logs / Activity History

## Overview

Enterprise-grade activity history system that records every significant action in the platform. Provides complete traceability of who did what, when, and to which resource — covering user logins, vehicle creation, trip dispatch, status changes, maintenance updates, fuel entries, report generation, and administrative actions.

---

## Scope

The audit log is **not** limited to authentication events. It captures the full lifecycle of system activity across all modules.

### Tracked Action Categories

| Category | Actions Captured |
|---|---|
| **Authentication** | Login, logout, password change, failed login, password reset |
| **User Management** | User created, role changed, deactivated, profile updated |
| **Vehicle Operations** | Created, updated, retired, document uploaded/expired, health score changed |
| **Driver Operations** | Created, updated, suspended, license expired, face profile registered |
| **Trip Lifecycle** | Created, validated, dispatched, started, completed, cancelled |
| **Maintenance** | Created, started, completed, cancelled, parts added |
| **Fuel & Expenses** | Fuel logged, expense created, expense approved, anomaly flagged |
| **Inspection** | Started, completed (passed/failed), item updated |
| **Notifications** | Alert triggered, email sent |
| **Reports** | Report generated, report downloaded |
| **AI/CV Actions** | Dispatch recommendation used, face verification result, LPR scan |
| **System Config** | Settings changed, cron job executed, batch operation run |

---

## Data Model

```prisma
model AuditLog {
  id          String    @id @default(cuid())
  
  // WHO
  userId      String?
  user        User?     @relation(fields: [userId], references: [id])
  userEmail   String?   // Denormalized for query speed
  userRole    String?   // Role at time of action
  
  // WHAT
  action      AuditAction
  category    AuditCategory
  description String    // Human-readable: "Dispatched trip TRP-2026-00042"
  
  // WHERE (affected resource)
  entityType  String?   // "Vehicle", "Driver", "Trip", etc.
  entityId    String?   // ID of the affected entity
  entityLabel String?   // Human-readable: "MH12AB1234" or "TRP-2026-00042"
  
  // CHANGE DATA
  oldValues   Json?     // Previous state (for updates)
  newValues   Json?     // New state (for creates/updates)
  changedFields String[] // List of changed field names
  
  // CONTEXT
  ipAddress   String?
  userAgent   String?
  requestId   String?   // Correlation ID for tracing
  
  // META
  status      AuditStatus @default(SUCCESS)
  errorMessage String?    // If action failed
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  createdAt   DateTime  @default(now())

  @@index([userId, createdAt])
  @@index([entityType, entityId])
  @@index([action, createdAt])
  @@index([category, createdAt])
  @@index([organizationId, createdAt])
}

enum AuditAction {
  // Auth
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_CHANGED
  PASSWORD_RESET
  
  // CRUD
  CREATED
  UPDATED
  DELETED
  
  // Lifecycle
  DISPATCHED
  STARTED
  COMPLETED
  CANCELLED
  APPROVED
  REJECTED
  SUSPENDED
  RESTORED
  RETIRED
  
  // AI/CV
  AI_RECOMMENDATION
  CV_VERIFICATION
  CV_DETECTION
  
  // System
  REPORT_GENERATED
  REPORT_DOWNLOADED
  NOTIFICATION_SENT
  CRON_EXECUTED
  CONFIG_CHANGED
  BATCH_OPERATION
}

enum AuditCategory {
  AUTHENTICATION
  USER_MANAGEMENT
  VEHICLE
  DRIVER
  TRIP
  MAINTENANCE
  FUEL
  EXPENSE
  INSPECTION
  NOTIFICATION
  REPORT
  AI_CV
  SYSTEM
}

enum AuditStatus {
  SUCCESS
  FAILURE
  WARNING
}
```

---

## Implementation

### Middleware Pattern

A centralized audit service called from all controllers after successful operations:

```typescript
// services/auditService.ts
interface AuditEntry {
  userId: string;
  action: AuditAction;
  category: AuditCategory;
  description: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  req?: Request; // For IP + UserAgent extraction
}

class AuditService {
  async log(entry: AuditEntry): Promise<void> {
    // Extract changed fields by diffing old/new values
    const changedFields = entry.oldValues && entry.newValues
      ? Object.keys(entry.newValues).filter(
          key => entry.oldValues[key] !== entry.newValues[key]
        )
      : [];

    // Scrub sensitive fields (password, tokens)
    const sanitizedOld = this.scrubSensitive(entry.oldValues);
    const sanitizedNew = this.scrubSensitive(entry.newValues);

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        userEmail: req?.user?.email,
        userRole: req?.user?.role,
        action: entry.action,
        category: entry.category,
        description: entry.description,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityLabel: entry.entityLabel,
        oldValues: sanitizedOld,
        newValues: sanitizedNew,
        changedFields,
        ipAddress: entry.req?.ip,
        userAgent: entry.req?.headers['user-agent'],
        requestId: entry.req?.headers['x-request-id'],
        organizationId: entry.req?.user?.organizationId,
        status: 'SUCCESS',
      },
    });
  }

  private scrubSensitive(data?: Record<string, any>) {
    if (!data) return undefined;
    const SENSITIVE_FIELDS = ['password', 'refreshToken', 'resetToken', 'faceEmbedding'];
    const scrubbed = { ...data };
    SENSITIVE_FIELDS.forEach(field => {
      if (field in scrubbed) scrubbed[field] = '[REDACTED]';
    });
    return scrubbed;
  }
}
```

### Usage in Controllers

```typescript
// controllers/vehicleController.ts
async createVehicle(req, res) {
  const vehicle = await vehicleService.create(req.body);
  
  await auditService.log({
    userId: req.user.id,
    action: 'CREATED',
    category: 'VEHICLE',
    description: `Created vehicle ${vehicle.registrationNumber}`,
    entityType: 'Vehicle',
    entityId: vehicle.id,
    entityLabel: vehicle.registrationNumber,
    newValues: vehicle,
    req,
  });
  
  res.status(201).json({ success: true, data: vehicle });
}
```

---

## Security Requirements

1. **Append-only**: Application has INSERT permission only on audit_log table. No UPDATE or DELETE.
2. **Tamper-proof**: Audit logs cannot be modified after creation (no `updatedAt` field)
3. **PII Scrubbing**: Password hashes, tokens, face embeddings are always `[REDACTED]`
4. **Retention**: Logs retained for 12 months in active storage, archived after
5. **Access Control**: Only Admin role can view audit logs
6. **Request Correlation**: `x-request-id` header enables distributed tracing

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/audit-logs` | Bearer | Admin | List audit logs (paginated) |
| GET | `/audit-logs/:id` | Bearer | Admin | Single log detail |
| GET | `/audit-logs/entity/:type/:id` | Bearer | Admin | Logs for specific entity |
| GET | `/audit-logs/user/:userId` | Bearer | Admin | Logs for specific user |
| GET | `/audit-logs/export` | Bearer | Admin | CSV export of filtered logs |

### Query Parameters

```
GET /audit-logs?category=TRIP&action=DISPATCHED&userId=clx...&from=2026-07-01&to=2026-07-12&page=1&limit=50
```

---

## Frontend: Admin Audit View

### List Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🕵️ Activity History                         [Export CSV]      │
├──────────┬──────────┬──────────┬────────────┬────────┬─────────┤
│ Time     │ User     │ Action   │ Resource   │ Status │ Details │
├──────────┼──────────┼──────────┼────────────┼────────┼─────────┤
│ 09:42    │ Dispatch │ DISPATCH │ TRP-00042  │ ✅     │ [View]  │
│ 09:38    │ Fleet    │ CREATED  │ MH12AB1234 │ ✅     │ [View]  │
│ 09:15    │ Admin    │ UPDATED  │ Rajesh K.  │ ✅     │ [View]  │
│ 08:00    │ System   │ CRON     │ Expiry Chk │ ✅     │ [View]  │
└──────────┴──────────┴──────────┴────────────┴────────┴─────────┘
```

### Filters

| Filter | Options |
|---|---|
| Category | All, Authentication, Vehicle, Driver, Trip, Maintenance, Fuel, System |
| Action | All, Created, Updated, Deleted, Dispatched, Completed, Login, etc. |
| User | All users, specific user |
| Date Range | From — To |
| Status | All, Success, Failure |

### Detail View (Expandable Row)

Shows:
- Full description
- Changed fields with old → new values diff
- IP address and user agent
- Request correlation ID
- Link to affected entity

---

## Automatic Audit Points

Every module must call `auditService.log()` at these points:

| Module | Audit Points |
|---|---|
| Auth | Login (success/fail), logout, password change, password reset, role change |
| Users | Create, update, deactivate |
| Vehicles | Create, update, retire, document upload, document expiry |
| Drivers | Create, update, suspend, restore, face profile upload |
| Trips | Create, validate, dispatch, start, complete, cancel |
| Maintenance | Create, start, complete, cancel, add part |
| Fuel | Create fuel log, flag anomaly |
| Expenses | Create, approve, reject |
| Inspections | Complete (with result) |
| Reports | Generate (with type and params) |
| AI/CV | Dispatch recommendation accepted, face verification (pass/fail), LPR scan |
| System | Cron job execution, config change, batch reindex |
