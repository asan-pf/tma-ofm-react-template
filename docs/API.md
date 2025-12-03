# API Documentation

This document describes the REST API endpoints for the Telegram Location Review Bot backend.

## Authentication

Most endpoints are currently open for development. Telegram Web App data validation is implemented for production use.

### Telegram Web App Validation
For endpoints that require Telegram authentication, include the header:
```
X-Telegram-Init-Data: <telegram_web_app_init_data>
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad Request (missing/invalid parameters)
- `404`: Resource not found
- `500`: Internal server error
- `503`: Database connection error

## Endpoints

### Health Check

#### GET /health
Check if the API server is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

### Locations

#### GET /api/locations
Get all approved locations.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Great Coffee Shop",
    "description": "Best coffee in town",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "category": "restaurant-bar",
    "type": "permanent",
    "schedules": "9:00-18:00",
    "website_url": null,
    "is_approved": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "user_id": 1
  }
]
```

#### POST /api/locations
Create a new location (requires approval).

**Request Body:**
```json
{
  "name": "New Location",
  "description": "Description of the location",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "category": "grocery",
  "type": "permanent",
  "schedules": "9:00-18:00",
  "websiteUrl": "https://example.com",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Categories:** `grocery`, `restaurant-bar`, `bike-rent`, `clothing`, `other`  
**Types:** `permanent`, `temporary`

**Response:**
```json
{
  "id": 2,
  "name": "New Location",
  "description": "Description of the location",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "category": "grocery",
  "type": "permanent",
  "is_approved": false,
  "created_at": "2024-01-01T00:00:00.000Z",
  "user_id": 1
}
```

If the authenticated user has already created a location, the API responds with **409 Conflict**.

#### GET /api/locations/:id
Get a specific location by ID.

**Response:**
```json
{
  "id": 1,
  "name": "Great Coffee Shop",
  "description": "Best coffee in town",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "category": "restaurant-bar",
  "type": "permanent",
  "is_approved": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "user_id": 1
}
```

---

### Ratings

#### GET /api/ratings/location/:locationId
Get all ratings for a specific location.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "location_id": 1,
    "stars": 3,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/ratings/location/:locationId/average
Get average rating for a location.

**Response:**
```json
{
  "average": 2.5
}
```

#### POST /api/ratings
Create or update a rating for a location.

**Request Body:**
```json
{
  "locationId": 1,
  "stars": 3
}
```

**Note:** Stars must be between 1-3 (not 1-5). One rating per user per location.

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "location_id": 1,
  "stars": 3,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### Comments

#### GET /api/comments/location/:locationId
Get all approved comments for a location.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "location_id": 1,
    "content": "Great place, highly recommend!",
    "is_approved": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/comments
Create a new comment for a location.

**Request Body:**
```json
{
  "locationId": 1,
  "content": "This is a great place!"
}
```

**Response:**
```json
{
  "id": 2,
  "user_id": 1,
  "location_id": 1,
  "content": "This is a great place!",
  "is_approved": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---
## Error Handling

The API includes comprehensive error handling:
- Database connection errors return 503 status
- Validation errors return 400 status with descriptive messages
- All errors are logged server-side for debugging
- Sensitive information is not exposed in error responses
