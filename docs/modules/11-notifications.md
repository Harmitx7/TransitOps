# Module 11 — Notifications & Alerts

## Overview

Automatic notification system with in-app and email delivery. Monitors document expiry, maintenance schedules, fuel anomalies, safety events, and trip delays. Notifications are categorized by severity and tied to actionable events.

---

## Notification Types

| Type | Trigger | Severity | Channel |
|---|---|---|---|
| License Expiry | Driver license within expiry window | HIGH | In-App + Email |
| Document Expiry | Vehicle doc within expiry window | HIGH | In-App + Email |
| Maintenance Due | Preventive maintenance threshold reached | MEDIUM | In-App |
| Maintenance Overdue | Past scheduled maintenance date | HIGH | In-App + Email |
| Fuel Anomaly | Fuel log flagged by anomaly detection | MEDIUM | In-App |
| Vehicle Breakdown | Vehicle status set to emergency maintenance | CRITICAL | In-App + Email |
| Trip Delay | ETA exceeded by > 30 minutes | MEDIUM | In-App |
| Drowsiness Alert | CV drowsiness detection ≥ ALERT level | CRITICAL | In-App + Email |
| Seatbelt Violation | CV seatbelt detection = off | HIGH | In-App |
| Inspection Failure | Pre-trip inspection failed | HIGH | In-App |
| Unauthorized Driver | Face verification failed | CRITICAL | In-App + Email |
| Health Score Drop | Vehicle health drops below 40 | MEDIUM | In-App |

---

## Data Model

```prisma
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
  
  actionUrl   String?          // Deep link to relevant page
  metadata    Json?            // Related entity IDs, extra context
  
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

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Bearer | List user's notifications (paginated) |
| GET | `/notifications/unread-count` | Bearer | Count of unread notifications |
| PUT | `/notifications/:id/read` | Bearer | Mark as read |
| PUT | `/notifications/read-all` | Bearer | Mark all as read |
| DELETE | `/notifications/:id` | Bearer | Delete notification |
| GET | `/notifications/preferences` | Bearer | Get notification preferences |
| PUT | `/notifications/preferences` | Bearer | Update preferences |

---

## Cron Jobs

| Job | Schedule | Action |
|---|---|---|
| Document Expiry Check | Daily at 06:00 | Scan all vehicle docs, create notifications at 30/15/7/1 day marks |
| License Expiry Check | Daily at 06:00 | Scan all driver licenses, create notifications at 60/30/15/7/1 day marks |
| Maintenance Due Check | Daily at 07:00 | Check mileage and time thresholds |
| Health Score Batch | Hourly | Recalculate all vehicle health scores |
| Safety Score Batch | Daily at 00:00 | Recalculate all driver safety scores |

---

## Implementation Notes

- **In-App**: Notification bell icon in topbar with unread count badge
- **Dropdown**: Shows last 10 notifications, "View All" links to full page
- **Real-time**: Optional WebSocket/SSE for instant notification push (stretch goal)
- **Email**: Nodemailer with HTML templates for critical/high severity
- **Batching**: Cron-generated notifications batched to avoid email spam (1 digest per type per day)
- **Preferences**: Users can toggle email notifications per type
