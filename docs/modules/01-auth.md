# Module 01 — Authentication & Authorization

## Overview

Secure, role-based access control system using JWT tokens and bcrypt password hashing. Supports 6 distinct user roles with granular permissions.

---

## Features

### 1.1 Registration & Login

- Email + password registration (admin-invited or self-registration with approval)
- Login returns JWT access token (15min) + refresh token (7d, httpOnly cookie)
- Password hashing: bcrypt with 12 salt rounds
- Rate limiting: 5 login attempts per minute per IP

### 1.2 JWT Token Flow

```
Client → POST /api/v1/auth/login { email, password }
Server → Validate → bcrypt.compare → Generate JWT
Server → Set httpOnly cookie (refresh) + Return { accessToken, user }
Client → Authorization: Bearer <accessToken> on every request
Client → POST /api/v1/auth/refresh (automatic on 401)
```

### 1.3 Role-Based Access Control

Middleware chain: `authenticate → authorize(roles[]) → handler`

```typescript
// Middleware signature
const authorize = (...roles: Role[]) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};
```

### 1.4 Password Recovery

- POST `/api/v1/auth/forgot-password` → sends reset link via email
- POST `/api/v1/auth/reset-password` → validates token, updates password
- Reset tokens expire in 1 hour, single-use

### 1.5 Session Management

- Active session tracking per user
- Force-logout capability for admins
- Automatic token revocation on password change

---

## Data Model

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  firstName     String
  lastName      String
  role          Role     @default(DRIVER)
  phone         String?
  avatar        String?
  isActive      Boolean  @default(true)
  lastLogin     DateTime?
  refreshToken  String?
  resetToken    String?
  resetExpiry   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  notifications  Notification[]
  auditLogs      AuditLog[]
}

enum Role {
  ADMIN
  FLEET_MANAGER
  DISPATCHER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
  DRIVER
}
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account (admin invite) |
| POST | `/auth/login` | — | Login, returns JWT |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | Bearer | Invalidate refresh token |
| POST | `/auth/forgot-password` | — | Send reset email |
| POST | `/auth/reset-password` | — | Reset with token |
| GET | `/auth/me` | Bearer | Current user profile |
| PUT | `/auth/me` | Bearer | Update own profile |
| PUT | `/auth/change-password` | Bearer | Change password |

---

## Validation Rules

| Field | Rule |
|---|---|
| email | Valid email format, unique |
| password | Min 8 chars, 1 uppercase, 1 number, 1 special |
| firstName | 2-50 chars, alphabetic |
| lastName | 2-50 chars, alphabetic |
| phone | Valid Indian mobile (10 digits) |
| role | One of enum values |

---

## Security Requirements

- All passwords bcrypt-hashed (never stored plaintext)
- JWT secrets from environment variables
- Refresh tokens stored hashed in DB
- CORS restricted to frontend origin
- Helmet.js for HTTP security headers
- Rate limiting on auth endpoints
- Input sanitization on all fields
- SQL injection prevention via Prisma parameterization
- Audit log on every auth event (login, logout, password change)

---

## Audit Logging

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // LOGIN, LOGOUT, PASSWORD_CHANGE, ROLE_CHANGE
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

Every authentication event is recorded with user ID, action type, IP address, and timestamp.
