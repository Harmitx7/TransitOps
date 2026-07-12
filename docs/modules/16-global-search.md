# Module 16 — Global Search

## Overview

Unified search system enabling users to find any entity (vehicle, driver, trip, registration number, license, QR code) from a single search bar. Uses PostgreSQL full-text search with a denormalized search index for sub-100ms response times.

---

## Architecture

### Denormalized Search Index

A dedicated `SearchDocument` table pre-computes tsvector data from all searchable entities, maintained via application-side event hooks (Prisma middleware). This avoids expensive cross-table joins at query time.

```
User types query → Frontend debounce (300ms) → GET /api/v1/search?q=MH12
  → Backend → PostgreSQL full-text search on SearchDocument table
  → Returns grouped results: { vehicles: [], drivers: [], trips: [] }
```

### Why Not JOIN at Search Time?

Joining Vehicle, Driver, and Trip tables on every keystroke degrades performance as data grows. A denormalized search table with a GIN index ensures consistent sub-100ms queries regardless of dataset size.

---

## Data Model

```prisma
model SearchDocument {
  id          String @id @default(cuid())
  entityType  SearchEntityType
  entityId    String
  title       String        // Primary display text
  subtitle    String?       // Secondary display text
  searchText  String        // Concatenated searchable fields
  metadata    Json?         // Extra context for display
  
  organizationId String
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([entityType, entityId])
  @@index([organizationId])
}

enum SearchEntityType {
  VEHICLE
  DRIVER
  TRIP
}
```

### PostgreSQL Full-Text Search Setup

```sql
-- Add tsvector column and GIN index (via Prisma migration)
ALTER TABLE "SearchDocument" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce("searchText", '')), 'C')
  ) STORED;

CREATE INDEX idx_search_fts ON "SearchDocument" USING GIN(search_vector);

-- Trigram index for fuzzy matching (handles typos)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_search_trgm ON "SearchDocument" USING GIN(title gin_trgm_ops);
```

---

## Indexed Fields Per Entity

| Entity | title (Weight A) | subtitle (Weight B) | searchText (Weight C) |
|---|---|---|---|
| Vehicle | registrationNumber | `{make} {model}` | `{type} {status} {fuelType}` |
| Driver | `{firstName} {lastName}` | `{employeeId}` | `{licenseNumber} {phone} {email}` |
| Trip | tripNumber | `{source} → {destination}` | `{cargoType} {status}` |

---

## Search Behavior

### Query Processing

```typescript
// Input: "MH12 truck"
// Step 1: Sanitize input (remove special chars)
// Step 2: Split into terms
// Step 3: Build tsquery with AND operator
// Result: 'MH12' & 'truck'
```

### Result Grouping

Results are returned grouped by entity type with relevance ranking:

```json
{
  "query": "MH12",
  "results": {
    "vehicles": [
      {
        "id": "clx...",
        "title": "MH12AB1234",
        "subtitle": "Tata Prima 4928",
        "type": "VEHICLE",
        "rank": 0.95,
        "url": "/vehicles/clx..."
      }
    ],
    "drivers": [],
    "trips": [
      {
        "id": "clx...",
        "title": "TRP-2026-00042",
        "subtitle": "Mumbai → Pune",
        "type": "TRIP",
        "rank": 0.32,
        "url": "/trips/clx..."
      }
    ]
  },
  "totalResults": 2
}
```

### Search Modes

| Mode | Trigger | Behavior |
|---|---|---|
| Quick Search | Typing in global search bar | Debounced, max 10 results, grouped |
| Full Search | Pressing Enter or clicking "View All" | Paginated results page, all types |
| QR Search | Scanning QR code | Direct redirect to vehicle profile |
| Filter Search | Module-specific search fields | Searches within one entity type |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/search?q={query}&limit=10` | Bearer | Global quick search |
| GET | `/search?q={query}&type=VEHICLE&page=1&limit=20` | Bearer | Filtered full search |
| GET | `/search/reindex` | Bearer (Admin) | Force reindex all entities |

---

## Index Maintenance

The search index updates automatically via Prisma middleware:

```typescript
// Prisma middleware hook
prisma.$use(async (params, next) => {
  const result = await next(params);
  
  if (['Vehicle', 'Driver', 'Trip'].includes(params.model)) {
    if (['create', 'update', 'delete'].includes(params.action)) {
      await updateSearchIndex(params.model, result);
    }
  }
  
  return result;
});
```

| Event | Action |
|---|---|
| Entity created | Insert SearchDocument |
| Entity updated | Update SearchDocument |
| Entity deleted | Delete SearchDocument |
| Admin reindex | Rebuild all SearchDocuments |

---

## Frontend Implementation

- **Search Bar**: Global search input in topbar, visible on all pages
- **Keyboard Shortcut**: `Cmd+K` / `Ctrl+K` opens search overlay
- **Debounce**: 300ms debounce on input to minimize API calls
- **Result Preview**: Dropdown shows top 3 results per category with icons
- **Navigation**: Click result to navigate directly to entity detail page
- **Recent Searches**: Last 5 searches stored in localStorage
- **No Results**: Helpful message with suggestions ("Try searching by registration number")
