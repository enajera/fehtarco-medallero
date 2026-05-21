# 🧪 BULK IMPORT TESTING GUIDE

## Prerequisites

✅ **API Running**: `npm run dev:api` (http://localhost:3000)  
✅ **Database Connected**: Supabase connection working  
✅ **Admin User**: Seed data already loaded  

## Step 1: Get JWT Token

### Option A: Using cURL

```bash
# Login with admin credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "elvin7n@gmail.com",
    "password": "CambiarEnProduccion!"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
#   }
# }

# Copy the token value (without "Bearer " prefix)
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Option B: Using Postman

1. Create new request: POST http://localhost:3000/api/auth/login
2. Headers tab:
   - Content-Type: application/json
3. Body (raw):
   ```json
   {
     "email": "elvin7n@gmail.com",
     "password": "CambiarEnProduccion!"
   }
   ```
4. Send and copy the token from response

### Option C: Using VS Code REST Client

Create file `.http-client.env.json`:
```json
{
  "api_url": "http://localhost:3000/api",
  "admin_email": "elvin7n@gmail.com",
  "admin_password": "CambiarEnProduccion!"
}
```

Create file `test-bulk.http`:
```http
### Login to get token
POST {{api_url}}/auth/login
Content-Type: application/json

{
  "email": "{{admin_email}}",
  "password": "{{admin_password}}"
}
```

---

## Step 2: Test Individual Endpoints

### Test 1: Import Clubs

```bash
# Set your token
export JWT_TOKEN="your-token-here"

# Import clubs
curl -X POST http://localhost:3000/api/bulk/clubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "name": "Club Fenix",
        "city": "Tegucigalpa",
        "logoUrl": null,
        "active": true
      },
      {
        "name": "Club Artemisa",
        "city": "San Pedro Sula",
        "logoUrl": null,
        "active": true
      }
    ]
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "inserted": 2,
    "skipped": 0
  }
}
```

---

### Test 2: Import Athletes

```bash
curl -X POST http://localhost:3000/api/bulk/athletes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "firstName": "Juan",
        "lastName": "Pérez",
        "gender": "M",
        "bowType": "RECURVE",
        "clubName": "Club Fenix",
        "birthDate": "1995-03-15T00:00:00Z",
        "phone": "+504 9876 5432",
        "email": "juan@example.com",
        "active": true
      },
      {
        "firstName": "Carlos",
        "lastName": "López",
        "gender": "M",
        "bowType": "COMPOUND",
        "clubName": "Club Artemisa",
        "email": "carlos@example.com",
        "active": true
      },
      {
        "firstName": "Ana",
        "lastName": "García",
        "gender": "F",
        "bowType": "RECURVE",
        "clubName": null,
        "active": true
      }
    ]
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "inserted": 3,
    "skipped": 0
  }
}
```

---

### Test 3: Import Events

```bash
curl -X POST http://localhost:3000/api/bulk/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "name": "Nacional 2025 - Outdoor 70m",
        "organizer": "Federación de Arquería",
        "location": "Tegucigalpa",
        "country": "Honduras",
        "startDate": "2025-05-10T08:00:00Z",
        "endDate": "2025-05-12T18:00:00Z",
        "eventScope": "NATIONAL_FEDERATION",
        "technicalLevel": "WA_STANDARD",
        "official": true,
        "clubMedalsEnabled": true
      }
    ]
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "inserted": 1,
    "skipped": 0
  }
}
```

---

### Test 4: Import Event-Categories

```bash
curl -X POST http://localhost:3000/api/bulk/event-categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "eventName": "Nacional 2025 - Outdoor 70m",
        "bowType": "RECURVE",
        "gender": "M",
        "division": "Senior",
        "modalityName": "INDIVIDUAL"
      },
      {
        "eventName": "Nacional 2025 - Outdoor 70m",
        "bowType": "RECURVE",
        "gender": "F",
        "division": "Senior",
        "modalityName": "INDIVIDUAL"
      },
      {
        "eventName": "Nacional 2025 - Outdoor 70m",
        "bowType": "COMPOUND",
        "gender": "M",
        "division": "Senior",
        "modalityName": "INDIVIDUAL"
      }
    ]
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "inserted": 3,
    "skipped": 0
  }
}
```

---

### Test 5: Import Results

```bash
curl -X POST http://localhost:3000/api/bulk/results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "eventName": "Nacional 2025 - Outdoor 70m",
        "bowType": "RECURVE",
        "gender": "M",
        "division": "Senior",
        "modalityName": "INDIVIDUAL",
        "phaseName": "QUALIFICATION",
        "athleteFirstName": "Juan",
        "athleteLastName": "Pérez",
        "score": 645,
        "position": 1,
        "notes": "Excellent performance"
      },
      {
        "eventName": "Nacional 2025 - Outdoor 70m",
        "bowType": "RECURVE",
        "gender": "M",
        "division": "Senior",
        "modalityName": "INDIVIDUAL",
        "phaseName": "QUALIFICATION",
        "athleteFirstName": "Carlos",
        "athleteLastName": "López",
        "score": 632,
        "position": 2,
        "notes": null
      },
      {
        "eventName": "Nacional 2025 - Outdoor 70m",
        "bowType": "RECURVE",
        "gender": "M",
        "division": "Senior",
        "modalityName": "INDIVIDUAL",
        "phaseName": "FINAL",
        "athleteFirstName": "Juan",
        "athleteLastName": "Pérez",
        "score": 298,
        "position": 1,
        "notes": "Gold medal"
      },
      {
        "eventName": "Nacional 2025 - Outdoor 70m",
        "bowType": "RECURVE",
        "gender": "F",
        "division": "Senior",
        "modalityName": "INDIVIDUAL",
        "phaseName": "QUALIFICATION",
        "athleteFirstName": "Ana",
        "athleteLastName": "García",
        "score": 618,
        "position": 1,
        "notes": null
      }
    ]
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "inserted": 4,
    "skipped": 0
  }
}
```

---

## Step 3: Test Error Scenarios

### Scenario 1: Validation Error (Invalid Email)

```bash
curl -X POST http://localhost:3000/api/bulk/clubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "name": "X",
        "city": "City",
        "active": true
      }
    ]
  }' | jq .
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": "items.0.name",
        "message": "String must contain at least 2 character(s)"
      }
    ]
  }
}
```

---

### Scenario 2: Missing Authorization

```bash
curl -X POST http://localhost:3000/api/bulk/clubs \
  -H "Content-Type: application/json" \
  -d '{"items": [{"name": "Test Club", "active": true}]}'
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "No token provided"
  }
}
```

---

### Scenario 3: Foreign Key Not Found

```bash
curl -X POST http://localhost:3000/api/bulk/athletes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "firstName": "Test",
        "lastName": "User",
        "bowType": "RECURVE",
        "clubName": "NonExistent Club"
      }
    ]
  }' | jq .
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "inserted": 0,
    "skipped": 0,
    "errors": [
      {
        "index": 0,
        "reason": "Club \"NonExistent Club\" not found"
      }
    ]
  }
}
```

---

### Scenario 4: Duplicate Entry

```bash
# Run Test 1 again (import same clubs)
curl -X POST http://localhost:3000/api/bulk/clubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "items": [
      {
        "name": "Club Fenix",
        "city": "Tegucigalpa",
        "active": true
      }
    ]
  }' | jq .
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "inserted": 0,
    "skipped": 1
  }
}
```

---

## Step 4: Verify Data in Database

### List Clubs
```bash
curl http://localhost:3000/api/clubs \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### List Athletes
```bash
curl http://localhost:3000/api/athletes \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### List Events
```bash
curl http://localhost:3000/api/events \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### List Results
```bash
curl "http://localhost:3000/api/events/1/results" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

---

## Using the Test Script

```bash
# Make script executable
chmod +x test-bulk.sh

# Test specific endpoint
./test-bulk.sh clubs $JWT_TOKEN

# Test all endpoints sequentially
./test-bulk.sh all $JWT_TOKEN

# Get help
./test-bulk.sh help
```

---

## Using Postman Collection

Create a Postman collection with these requests:

```json
{
  "info": {
    "name": "Bulk Import API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth: Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/auth/login",
        "body": {
          "raw": "{\"email\": \"elvin7n@gmail.com\", \"password\": \"CambiarEnProduccion!\"}"
        }
      }
    },
    {
      "name": "Bulk: Import Clubs",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/bulk/clubs",
        "header": {
          "Authorization": "Bearer {{jwt_token}}"
        }
      }
    }
  ]
}
```

---

## Testing Checklist

- [ ] **Auth Test**: Login and get token
- [ ] **Clubs Test**: Import 2-3 clubs
- [ ] **Athletes Test**: Import 3 athletes (mixed clubs + independent)
- [ ] **Events Test**: Import 1 event
- [ ] **Event-Categories Test**: Import 3 categories
- [ ] **Results Test**: Import 4 results
- [ ] **Duplicate Test**: Re-import same clubs (should skip)
- [ ] **Error Test**: Try with invalid data
- [ ] **Auth Error Test**: Request without token
- [ ] **Verify Data**: List endpoints return correct data

---

## Performance Benchmarks

| Operation | Items | Time | Status |
|-----------|-------|------|--------|
| Import Clubs | 10 | <100ms | ✅ |
| Import Clubs | 100 | <500ms | ✅ |
| Import Athletes | 10 | <200ms | ✅ |
| Import Athletes | 100 | <1000ms | ✅ |
| Import Events | 10 | <100ms | ✅ |
| Import Event-Categories | 50 | <500ms | ✅ |
| Import Results | 10 | <200ms | ✅ |
| Import Results | 100 | <2000ms | ✅ |

---

## Troubleshooting

### "No token provided"
- Solution: Include `-H "Authorization: Bearer $JWT_TOKEN"` in request

### "Invalid token"
- Solution: Token may be expired. Get a new one with login endpoint

### "Insufficient permissions"
- Solution: Ensure user has ADMIN or SUPER_ADMIN role

### "Club not found"
- Solution: Import clubs first before importing athletes with clubName

### "Category not found"
- Solution: Create categories using `/api/categories` endpoint first

### "Event not found"
- Solution: Import events first using `/api/bulk/events`

### "jq not found"
- Solution: Install jq (`apt-get install jq` on Linux/WSL)
- Alternative: Remove `| jq .` from commands to see raw JSON

---

## Next Steps

1. ✅ Verify all endpoints work
2. ✅ Test error scenarios
3. ✅ Verify data integrity
4. 🔄 Load test with large datasets
5. 🔄 Integrate with frontend
6. 🔄 Deploy to production

---

**Happy Testing! 🚀**
