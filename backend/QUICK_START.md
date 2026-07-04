# Quick Start Guide - Week 1 Security Features

## 🚀 Quick Setup (5 minutes)

### 1. Activate Virtual Environment
```bash
cd "d:\New folder (2)\Nexus\backend"
.\venv\Scripts\Activate.ps1
```

### 2. Verify Django Setup
```bash
python manage.py check
```

Expected output: `System check identified no issues (0 silenced).`

### 3. Start Django Server
```bash
python manage.py runserver
```

Expected output:
```
Watching for file changes with StatReloader
Quit the server with CTRL-BREAK.
Starting development server at http://127.0.0.1:8000/
```

---

## 📚 Access API Documentation

Open your browser and visit:

### Swagger UI (Recommended for Testing)
```
http://localhost:8000/api/docs/
```
- Interactive API testing
- Try-it-out button on each endpoint
- Full request/response examples

### Alternative Documentation  
```
http://localhost:8000/api/redoc/
```
- Reader-friendly format
- Complete parameter descriptions
- Error codes reference

### OpenAPI Schema
```
http://localhost:8000/api/schema.json  # JSON format
http://localhost:8000/api/schema.yaml  # YAML format
```

---

## 🧪 Test the API

### Using Swagger UI (Easiest):
1. Go to http://localhost:8000/api/docs/
2. Find "Register User" endpoint
3. Click "Try it out"
4. Enter required fields:
   ```json
   {
     "username": "testuser123",
     "email": "test@example.com",
     "password": "SecurePass123!",
     "password_confirm": "SecurePass123!",
     "role": "entrepreneur",
     "company_name": "Test Company",
     "industry": "Technology"
   }
   ```
5. Click "Execute"

### Using cURL (Terminal):

#### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "entrepreneur",
    "company_name": "Test Company",
    "industry": "Technology"
  }'
```

#### Login to Get Tokens
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser123",
    "role": "entrepreneur"
  }
}
```

#### Get User Profile
```bash
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer <your_access_token>"
```

---

## 🔒 Test Security Features

### 1. Test Strong Password Requirements

**Try weak password (will fail):**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "email": "user1@test.com",
    "password": "weak123",
    "password_confirm": "weak123",
    "role": "entrepreneur"
  }'
```

Response (400 error):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "password": ["Password must contain at least one uppercase letter."]
  }
}
```

### 2. Test Input Sanitization (XSS Prevention)

**Try malicious input:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test<script>alert(1)</script>",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "entrepreneur"
  }'
```

Response (400 error - malicious content rejected):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "username": ["Username can only contain letters, numbers, and underscores..."]
  }
}
```

### 3. Check Log Files

**View all application logs:**
```bash
Get-Content backend\logs\nexus_app.log -Tail 50
```

**View only errors:**
```bash
Get-Content backend\logs\nexus_errors.log -Tail 50
```

**View security warnings:**
```bash
Get-Content backend\logs\nexus_security.log -Tail 50
```

---

## 📲 Using Postman

### Import Collection:
1. Open Postman
2. Click "Import"
3. Select `Nexus_API_Postman_Collection.json` from backend folder
4. Collection will be imported with all endpoints

### Set Up Variables:
1. Click collection settings
2. Go to "Variables" tab
3. Add:
   - `access_token` = JWT token from login
   - `refresh_token` = Refresh token from login

### Test Endpoints:
- All endpoints are organized by category
- Click "Send" to execute
- View response in bottom panel

---

## 🐛 Troubleshooting

### Problem: "System check identified some issues"
**Solution:**
```bash
python manage.py check --deploy
# Fix any reported issues
```

### Problem: "Database not connected"
**Solution:**
Make sure PostgreSQL is running (if using Postgres):
```bash
# On Windows, PostgreSQL service should be running in Services
# Or use SQLite: Update DATABASES in settings.py
```

### Problem: "Logs directory not found"
**Solution:**
Logs directory is created automatically. If issues:
```bash
mkdir backend\logs
```

### Problem: "Access token expired"
**Solution:**
Use refresh token to get new access token:
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "your_refresh_token"}'
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Django check passes without errors
- [ ] Server starts on http://localhost:8000
- [ ] Swagger UI loads at `/api/docs/`
- [ ] Can register user with strong password
- [ ] Weak password is rejected
- [ ] Can login and get JWT tokens
- [ ] Log files are created in `backend/logs/`
- [ ] API responses have consistent error format
- [ ] ReDoc loads at `/api/redoc/`

---

## 📊 Current Endpoints

### Authentication (✅ Implemented & Secured)
- `POST /api/auth/register/` - Register user
- `POST /api/token/` - Login (get JWT)
- `POST /api/token/refresh/` - Refresh token
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update profile
- `GET /api/auth/health/` - Health check

### Startup Pitches (✅ With Validation)
- `POST /api/auth/pitches/` - Create pitch
- `GET /api/auth/pitches/` - List all pitches
- `GET /api/auth/pitches/{id}/` - Get pitch details
- `PUT /api/auth/pitches/{id}/` - Update pitch
- `DELETE /api/auth/pitches/{id}/` - Delete pitch

### Connections (✅ With Validation)
- `POST /api/auth/connections/` - Send connection
- `GET /api/auth/connections/` - List connections
- `PATCH /api/auth/connections/{id}/` - Update status

### Meetings (✅ With Conflict Detection & Validation)
- `POST /api/auth/meetings/` - Schedule meeting
- `GET /api/auth/meetings/` - List meetings
- `POST /api/auth/meetings/{id}/accept/` - Accept meeting
- `POST /api/auth/meetings/{id}/reject/` - Reject meeting

### Documents (✅ With Validation)
- `POST /api/auth/documents/upload/` - Upload document

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `API_DOCUMENTATION.md` | Complete API reference |
| `WEEK_1_IMPLEMENTATION_SUMMARY.md` | Implementation details |
| `Nexus_API_Postman_Collection.json` | Postman collection |
| `QUICK_START.md` | This file |

---

## 🎯 Next Steps

1. **Test all endpoints** using the Swagger UI
2. **Review log files** to understand logging
3. **Create frontend requests** using the API
4. **Check Week 2 tasks** for next security features

---

## 🆘 Need Help?

1. Check API documentation: http://localhost:8000/api/docs/
2. Review error messages in response
3. Check logs: `backend/logs/` directory
4. Look at `API_DOCUMENTATION.md` for detailed endpoint info

---

**Happy Testing! 🚀**
