# 📦 BULK IMPORT SYSTEM - QUICK REFERENCE

## Project Structure

```
apps/api/
├── src/
│   ├── validation/
│   │   ├── schemas.ts              (existing - core validation)
│   │   └── bulk.schemas.ts         ⭐ NEW - Bulk-specific validation
│   │
│   ├── services/
│   │   ├── prisma.ts               (existing - DB client)
│   │   └── bulk.service.ts         ⭐ NEW - Bulk operations logic
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts       (existing)
│   │   └── bulk.controller.ts       ⭐ NEW - Bulk request handlers
│   │
│   ├── routes/
│   │   ├── index.ts                (MODIFIED - added bulk routes mount)
│   │   └── bulk.routes.ts          ⭐ NEW - Bulk endpoints definition
│   │
│   ├── middleware/
│   │   ├── auth.ts                 (existing - used for auth)
│   │   └── ...
│   │
│   └── app.ts                      (existing - Express app)
│
├── prisma/
│   └── schema.prisma               (existing - unchanged)
│
├── BULK_IMPORT_API.md              ⭐ NEW - Complete API documentation
├── BULK_IMPORT_IMPLEMENTATION.md   ⭐ NEW - Architecture & implementation
├── BULK_IMPORT_SUMMARY.md          ⭐ NEW - Executive summary
├── sample-bulk-data.json           ⭐ NEW - Sample test data
└── test-bulk.sh                    ⭐ NEW - Testing script

Legend:
  ⭐ = New files created
  MODIFIED = Existing files changed
  (existing) = Not modified
```

## Endpoint Reference

```
┌─────────────────────────────────────────────────────┐
│                BULK IMPORT ENDPOINTS                 │
└─────────────────────────────────────────────────────┘

POST /api/bulk/clubs
├─ Purpose: Import multiple clubs
├─ Requires: JWT + ADMIN/SUPER_ADMIN
├─ Payload: { items: [{ name, city?, logoUrl?, active? }] }
└─ Response: { inserted: N, skipped: M, errors?: [...] }

POST /api/bulk/athletes
├─ Purpose: Import multiple athletes
├─ Requires: JWT + ADMIN/SUPER_ADMIN
├─ Payload: { items: [{
│     firstName, lastName, gender?, bowType,
│     clubName?, phone?, email?, ... }] }
├─ Features: Resolves clubName → clubId
└─ Response: { inserted: N, skipped: M, errors?: [...] }

POST /api/bulk/events
├─ Purpose: Import competition events
├─ Requires: JWT + ADMIN/SUPER_ADMIN
├─ Payload: { items: [{
│     name, organizer, location, country,
│     startDate, endDate,
│     eventScope, technicalLevel,
│     official?, clubMedalsEnabled }] }
└─ Response: { inserted: N, skipped: M, errors?: [...] }

POST /api/bulk/event-categories
├─ Purpose: Associate categories with events
├─ Requires: JWT + ADMIN/SUPER_ADMIN
├─ Payload: { items: [{
│     eventName, bowType, gender, division,
│     modalityName }] }
├─ Features: Resolves event, category, modality IDs
└─ Response: { inserted: N, skipped: M, errors?: [...] }

POST /api/bulk/results
├─ Purpose: Import competition results
├─ Requires: JWT + ADMIN/SUPER_ADMIN
├─ Payload: { items: [{
│     eventName, bowType, gender, division, modalityName,
│     phaseName,
│     athleteFirstName, athleteLastName,
│     score, position, notes? }] }
├─ Features: Resolves all FKs, validates unique constraints
└─ Response: { inserted: N, skipped: M, errors?: [...] }
```

## Data Flow Diagram

```
┌──────────────────────┐
│   HTTP Request       │
│  (JSON Payload)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Routes Layer        │
│ (bulk.routes.ts)     │
│ - Auth check         │
│ - Role check         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Controllers Layer   │
│(bulk.controller.ts)  │
│ - Parse request      │
│ - Validate schema    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Services Layer      │
│(bulk.service.ts)     │
│ - Resolve FKs        │
│ - Check duplicates   │
│ - Process items      │
│ - Track errors       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Database Layer      │
│   (Prisma)           │
│ - Insert records     │
│ - Validate constraints
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Response            │
│ {inserted, skipped,  │
│  errors}             │
└──────────────────────┘
```

## Authentication Flow

```
1. Client logs in
   POST /api/auth/login
   ├─ email: admin@example.com
   └─ password: password123
   ↓
   Response: { token: "eyJhbGc..." }

2. Client uses token for bulk import
   POST /api/bulk/clubs
   ├─ Header: Authorization: Bearer eyJhbGc...
   └─ Body: { items: [...] }
   ↓
   Middleware checks:
   ├─ Token valid?          ✓
   ├─ Not expired?          ✓
   ├─ User has role?        ✓ (ADMIN/SUPER_ADMIN)
   └─ Proceed to endpoint   ✓
```

## Validation Pipeline

```
┌─────────────────────────────────────────┐
│        Input Validation (Zod)           │
├─────────────────────────────────────────┤
│                                         │
│ Clubs:                                  │
│ ├─ name: string (2-100)                │
│ ├─ city?: string (0-100)               │
│ ├─ logoUrl?: valid URL                 │
│ └─ active?: boolean                    │
│                                         │
│ Athletes:                               │
│ ├─ firstName: string (2-50)            │
│ ├─ lastName: string (2-50)             │
│ ├─ bowType: enum (RECURVE|COMPOUND|..) │
│ ├─ clubName?: string                   │
│ └─ [...other optional fields]          │
│                                         │
│ Events:                                 │
│ ├─ name: string (3-200)                │
│ ├─ startDate: ISO 8601 datetime        │
│ ├─ endDate: ISO 8601 datetime          │
│ ├─ eventScope: enum                    │
│ ├─ technicalLevel: enum                │
│ └─ clubMedalsEnabled: boolean          │
│                                         │
│ Event-Categories:                       │
│ ├─ eventName: string                   │
│ ├─ bowType: enum                       │
│ ├─ gender: enum (M|F)                  │
│ ├─ division: string                    │
│ └─ modalityName: enum (INDIVIDUAL|...) │
│                                         │
│ Results:                                │
│ ├─ eventName: string                   │
│ ├─ phaseName: enum (QUALIFICATION|...) │
│ ├─ athleteFirstName: string            │
│ ├─ athleteLastName: string             │
│ ├─ score: int (≥0)                     │
│ └─ position: int (>0)                  │
│                                         │
└─────────────────────────────────────────┘
        ↓
   If invalid: 400 Bad Request
   If valid: Proceed to service layer
```

## Error Handling Examples

```
┌──────────────────────────────────────────┐
│     Error Response Format                │
├──────────────────────────────────────────┤
│                                          │
│ Validation Error (400):                  │
│ {                                        │
│   "success": false,                      │
│   "error": {                             │
│     "message": "Validation error",       │
│     "code": "VALIDATION_ERROR",          │
│     "details": [                         │
│       {                                  │
│         "path": "items.0.name",          │
│         "message": "Must be 2+ chars"    │
│       }                                  │
│     ]                                    │
│   }                                      │
│ }                                        │
│                                          │
│ Auth Error (401):                        │
│ {                                        │
│   "success": false,                      │
│   "error": {                             │
│     "message": "No token provided"       │
│   }                                      │
│ }                                        │
│                                          │
│ Permission Error (403):                  │
│ {                                        │
│   "success": false,                      │
│   "error": {                             │
│     "message": "Insufficient permissions"│
│   }                                      │
│ }                                        │
│                                          │
│ Success with Errors (201):               │
│ {                                        │
│   "success": true,                       │
│   "data": {                              │
│     "inserted": 5,                       │
│     "skipped": 0,                        │
│     "errors": [                          │
│       {                                  │
│         "index": 2,                      │
│         "reason": "Club not found"       │
│       }                                  │
│     ]                                    │
│   }                                      │
│ }                                        │
│                                          │
└──────────────────────────────────────────┘
```

## Size Guidelines

```
Recommended Batch Sizes:

Clubs:              100-500 items
Athletes:           100-500 items
Events:             10-100 items
Event-Categories:   50-500 items
Results:            100-1000 items

For larger imports:
├─ Split into multiple requests
├─ Implement pagination
└─ Consider async processing
```

## Testing Workflow

```
┌─────────────────────────────────────────┐
│    TESTING BULK IMPORT SYSTEM           │
├─────────────────────────────────────────┤
│                                         │
│ Step 1: Start API Server                │
│ $ npm run dev:api                       │
│                                         │
│ Step 2: Login to Get Token              │
│ $ curl -X POST http://localhost:3000/..│
│        /api/auth/login                  │
│        -d '{"email":"admin@...",        │
│             "password":"..."}' │
│        → Copy token                     │
│                                         │
│ Step 3: Run Tests                       │
│ $ ./test-bulk.sh clubs TOKEN            │
│ $ ./test-bulk.sh athletes TOKEN         │
│ $ ./test-bulk.sh events TOKEN           │
│ $ ./test-bulk.sh event-categories TOKEN │
│ $ ./test-bulk.sh results TOKEN          │
│                                         │
│ Step 4: Check Results                   │
│ $ curl http://localhost:3000/api/clubs  │
│                                         │
└─────────────────────────────────────────┘
```

## Key Statistics

| Metric | Value |
|--------|-------|
| New files created | 8 |
| Endpoints implemented | 5 |
| Lines of code (backend) | ~500 |
| Lines of documentation | ~1000+ |
| Validation schemas | 5 |
| Service functions | 5 |
| Route handlers | 5 |
| HTTP status codes supported | 4 (201, 400, 401, 403, 500) |
| Error types handled | 8+ |
| Supported content types | 1 (application/json) |

## Integration Checklist

- [x] Code implemented
- [x] Validation schemas created
- [x] Service layer implemented
- [x] Controllers implemented
- [x] Routes mounted
- [x] Error handling added
- [x] Documentation created
- [x] API examples provided
- [x] Test script created
- [x] Sample data included
- [ ] Frontend integration (optional)
- [ ] Load testing (optional)
- [ ] Performance optimization (optional)

---

**Version**: 1.0  
**Status**: ✅ Ready for Testing  
**Last Updated**: 2025-01-09
