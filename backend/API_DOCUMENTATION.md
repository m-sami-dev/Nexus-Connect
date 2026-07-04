# Nexus Backend API Documentation

## Overview
Complete API documentation for the Nexus Backend - Investment & Entrepreneurship Platform with enhanced security features.

**Base URL:** `http://localhost:8000/api`

---

## 🔒 Security Features Implemented

### 1. **Password Hashing with Bcrypt**
- ✅ Django configured with bcrypt (BCryptSHA256PasswordHasher)
- ✅ Custom password validator enforcing strong requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character (!@#$%^&*...)

### 2. **Input Validation & Sanitization**
- ✅ XSS Prevention: All user inputs are sanitized using the `bleach` library
- ✅ SQL Injection Prevention: Django ORM parameterized queries
- ✅ Custom validators for:
  - Username (3-30 chars, alphanumeric + underscore)
  - Email (format + disposable email check)
  - Company Name (2-100 chars, allowed punctuation)
  - Text Fields (max length validation)

### 3. **Error Handling & Logging**
- ✅ Centralized exception handler with consistent error format
- ✅ Structured logging with rotating file handlers
- ✅ Three log files:
  - `nexus_app.log` - All application logs
  - `nexus_errors.log` - Error logs only
  - `nexus_security.log` - Security warnings

### 4. **API Documentation**
- ✅ Swagger UI at `/api/docs/`
- ✅ ReDoc at `/api/redoc/`
- ✅ OpenAPI schema available in JSON/YAML format

---

## 📚 API Endpoints

### Authentication

#### 1. Register User
**Endpoint:** `POST /auth/register/`

**Request Body:**
```json
{
  "username": "entrepreneur123",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "role": "entrepreneur",
  "company_name": "Tech Startup",
  "industry": "Technology"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully!",
  "user_id": 1,
  "email": "user@example.com",
  "role": "entrepreneur"
}
```

**Validation Rules:**
- Username: 3-30 characters, only letters, numbers, underscores
- Email: Valid format, no duplicate, no disposable domains
- Password: Min 8 chars, uppercase, lowercase, digit, special character
- Role: "investor" or "entrepreneur"

---

#### 2. Login
**Endpoint:** `POST /token/`

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "entrepreneur123",
    "role": "entrepreneur"
  }
}
```

---

#### 3. Refresh Token
**Endpoint:** `POST /token/refresh/`

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

#### 4. Get User Profile
**Endpoint:** `GET /auth/profile/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "entrepreneur123",
    "email": "user@example.com",
    "role": "entrepreneur",
    "bio": null,
    "profile_picture": null,
    "company_name": "Tech Startup",
    "industry": "Technology"
  }
}
```

---

#### 5. Update User Profile
**Endpoint:** `PUT /auth/profile/`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bio": "Experienced entrepreneur",
  "company_name": "Updated Company"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {...}
}
```

---

#### 6. Health Check
**Endpoint:** `GET /auth/health/`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API is running",
  "status": "healthy"
}
```

---

### Startup Pitches

#### 1. Create Pitch
**Endpoint:** `POST /auth/pitches/`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "AI-Powered Analytics Platform",
  "description": "Revolutionary analytics platform using ML",
  "funding_goal": 500000,
  "industry": "Technology",
  "pitch_deck": null
}
```

**Validation:**
- Title: Max 255 characters, non-empty
- Description: Max 5000 characters, non-empty
- Funding Goal: Must be positive number
- Industry: Max 100 characters

---

#### 2. Get All Pitches
**Endpoint:** `GET /auth/pitches/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Pagination page number
- `search`: Search in title/description
- `ordering`: Order by field

---

#### 3. Get Pitch by ID
**Endpoint:** `GET /auth/pitches/{id}/`

---

#### 4. Update Pitch
**Endpoint:** `PUT /auth/pitches/{id}/`

---

#### 5. Delete Pitch
**Endpoint:** `DELETE /auth/pitches/{id}/`

---

### Connection Requests

#### 1. Send Connection Request
**Endpoint:** `POST /auth/connections/`

**Request Body:**
```json
{
  "entrepreneur": 2,
  "pitch": 1
}
```

---

#### 2. Get My Connections
**Endpoint:** `GET /auth/connections/`

**Filters by role:**
- Entrepreneur: Sees received connection requests
- Investor: Sees sent connection requests

---

#### 3. Update Connection Status
**Endpoint:** `PATCH /auth/connections/{id}/`

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Status values:** `pending`, `accepted`, `rejected`

---

### Meetings

#### 1. Schedule Meeting
**Endpoint:** `POST /auth/meetings/`

**Request Body:**
```json
{
  "participant": 2,
  "title": "Investment Discussion",
  "description": "Series A funding discussion",
  "start_time": "2024-07-10T10:00:00Z",
  "end_time": "2024-07-10T11:00:00Z"
}
```

**Conflict Detection:**
- System automatically detects overlapping meetings
- Prevents double-booking for both users
- Returns error if conflict exists

**Validation:**
- End time must be after start time
- Cannot schedule meeting with yourself
- Title: Max 255 characters
- Description: Max 2000 characters (optional)

---

#### 2. Get My Meetings
**Endpoint:** `GET /auth/meetings/`

Returns meetings where user is organizer or participant

---

#### 3. Accept Meeting
**Endpoint:** `POST /auth/meetings/{id}/accept/`

Only participant can accept

---

#### 4. Reject Meeting
**Endpoint:** `POST /auth/meetings/{id}/reject/`

Both organizer and participant can reject

---

### Documents

#### 1. Upload Document
**Endpoint:** `POST /auth/documents/upload/`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title`: Document title (required)
- `file`: Document file (required)

**Validation:**
- Title: Max 255 characters, non-empty

---

## 🔐 JWT Authentication

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

**Token Lifespan:**
- Access Token: Short-lived (configure in settings)
- Refresh Token: Long-lived (configure in settings)

---

## 📊 API Documentation UIs

### Swagger UI
**URL:** `http://localhost:8000/api/docs/`

Interactive API documentation with try-it-out capability

### ReDoc
**URL:** `http://localhost:8000/api/redoc/`

Alternative API documentation view

### OpenAPI Schema
**JSON:** `http://localhost:8000/api/schema.json`
**YAML:** `http://localhost:8000/api/schema.yaml`

---

## 🚨 Error Response Format

All errors follow consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field_name": ["Error description"],
    "another_field": ["Another error"]
  }
}
```

---

## 📝 Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (permission denied) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🛠️ Postman Collection

Import the Postman collection file: `Nexus_API_Postman_Collection.json`

**Setup Variables:**
1. `access_token` - JWT access token from login
2. `refresh_token` - JWT refresh token from login

---

## 📋 Logging

All API activities are logged in `/backend/logs/` directory:

- **nexus_app.log** - All application events
- **nexus_errors.log** - Errors only
- **nexus_security.log** - Security warnings (XSS attempts, etc.)

Each log file:
- Rotates at 10MB
- Keeps last 10 backups
- Format: `timestamp - logger - level - [file:line] - message`

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Keep access tokens short-lived** (recommend 15 minutes)
3. **Store refresh tokens securely** (HTTP-only cookies)
4. **Use CORS** to restrict frontend origin
5. **Enable rate limiting** (configured: 100/hour anon, 1000/hour user)
6. **Validate all inputs** on backend (never trust client)
7. **Sanitize outputs** to prevent XSS
8. **Use strong passwords** (minimum requirements enforced)

---

## 🐛 Troubleshooting

### Invalid Password Error
- Ensure password has: uppercase, lowercase, digit, special character
- Minimum 8 characters required

### Email Already Exists
- Use a different email or check if account exists

### Meeting Conflict Error
- Check for overlapping accepted meetings
- Adjust meeting times

### Authentication Error
- Verify access token is valid and not expired
- Use refresh token to get new access token

---

## 📞 Support

For API issues or questions:
1. Check the logs in `/backend/logs/`
2. Review error details in API response
3. Check Swagger documentation at `/api/docs/`

---

**Last Updated:** July 2024
**API Version:** 1.0
