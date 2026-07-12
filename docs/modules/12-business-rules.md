# Module 12 — Business Rules Engine

## Overview

Centralized enforcement layer that validates all operations against mandatory hackathon rules and operational constraints. Rules are evaluated before any state transition, ensuring data integrity and preventing illegal operations.

---

## Rule Categories

### 12.1 Vehicle Rules

| Rule ID | Rule | Enforcement Point |
|---|---|---|
| VR-001 | Registration number must be unique (case-insensitive) | Vehicle creation |
| VR-002 | Cannot dispatch a RETIRED vehicle | Trip validation |
| VR-003 | Cannot dispatch a vehicle in MAINTENANCE | Trip validation |
| VR-004 | Cannot assign a vehicle already ON_TRIP | Trip validation |
| VR-005 | Cannot delete a vehicle with active trips | Vehicle deletion |
| VR-006 | Odometer can only increase | Fuel log, trip completion |
| VR-007 | Cannot create maintenance for RETIRED vehicle | Maintenance creation |

### 12.2 Driver Rules

| Rule ID | Rule | Enforcement Point |
|---|---|---|
| DR-001 | Cannot assign a SUSPENDED driver | Trip validation |
| DR-002 | Cannot assign a driver with EXPIRED license | Trip validation |
| DR-003 | Cannot assign a driver already ON_TRIP | Trip validation |
| DR-004 | License category must authorize vehicle type | Trip validation |
| DR-005 | Cannot assign a driver ON_LEAVE | Trip validation |
| DR-006 | Daily driving hours must not exceed 10 hours | Trip start |

### 12.3 Trip Rules

| Rule ID | Rule | Enforcement Point |
|---|---|---|
| TR-001 | Cargo weight cannot exceed vehicle capacity | Trip validation |
| TR-002 | Pre-trip inspection must pass before dispatch | Trip dispatch |
| TR-003 | Trip completion requires end odometer ≥ start odometer | Trip completion |
| TR-004 | Cannot complete a trip without recording distance | Trip completion |
| TR-005 | Trip number auto-generated, never manually set | Trip creation |
| TR-006 | Cancelled trip restores vehicle and driver to AVAILABLE | Trip cancellation |

### 12.4 Automatic Status Transitions

| Event | Vehicle Status | Driver Status |
|---|---|---|
| Trip dispatched | → ON_TRIP | → ON_TRIP |
| Trip completed | → AVAILABLE | → AVAILABLE |
| Trip cancelled | → AVAILABLE | → AVAILABLE |
| Maintenance started | → MAINTENANCE | — |
| Maintenance completed | → AVAILABLE | — |

---

## Implementation

### Validation Middleware

```typescript
// Business rule validation is a middleware layer
// called before every mutation that involves state transitions

interface ValidationResult {
  valid: boolean;
  errors: {
    ruleId: string;
    message: string;
    field?: string;
    severity: 'ERROR' | 'WARNING';
  }[];
}

// Example: Trip validation
async function validateTripDispatch(tripData): Promise<ValidationResult> {
  const errors = [];
  
  // VR-002: Check vehicle not retired
  const vehicle = await getVehicle(tripData.vehicleId);
  if (vehicle.status === 'RETIRED') {
    errors.push({ ruleId: 'VR-002', message: 'Cannot dispatch a retired vehicle', severity: 'ERROR' });
  }
  
  // VR-003: Check vehicle not in maintenance
  if (vehicle.status === 'MAINTENANCE') {
    errors.push({ ruleId: 'VR-003', message: 'Vehicle is currently in maintenance', severity: 'ERROR' });
  }
  
  // ... all other rules
  
  return { valid: errors.filter(e => e.severity === 'ERROR').length === 0, errors };
}
```

### Rule Engine Pattern

```
Request → Controller → Business Rule Validator → Database Operation → Side Effects
                              ↓ (if invalid)
                        Return 422 with rule violations
```

All business rules are evaluated synchronously before any database write. Warnings are returned but don't block the operation. Errors block the operation and return a structured error response.

---

## Error Response Format

```json
{
  "status": 422,
  "type": "BUSINESS_RULE_VIOLATION",
  "title": "Trip validation failed",
  "violations": [
    {
      "ruleId": "VR-003",
      "message": "Vehicle MH12AB1234 is currently in maintenance",
      "field": "vehicleId",
      "severity": "ERROR"
    },
    {
      "ruleId": "DR-002",
      "message": "Driver license expired on 2026-06-01",
      "field": "driverId",
      "severity": "ERROR"
    }
  ]
}
```

---

## Testing Requirements

Every business rule requires:
1. A positive test (valid input passes)
2. A negative test (rule violation blocks operation)
3. An edge case test (boundary values)

Total minimum: 3 tests per rule × 19 rules = **57 business rule tests**.
