# Nexus Connect

**Nexus Connect** is a full-stack collaboration platform that connects **Investors** and **Entrepreneurs** — enabling startup pitch discovery, secure connections, meeting scheduling, real-time chat, document e-signing, and in-platform payments, all in one place.

Built as a 3-week Full Stack Development Internship project for **@DevelopersHub**.

---

## Features

### 🔐 Authentication & Security
- JWT-based authentication (access + refresh tokens) via `djangorestframework-simplejwt`
- Role-based accounts — separate **Investor** and **Entrepreneur** experiences
- Two-Factor Authentication (2FA) with email-based OTP (send, verify, disable)
- Password hashing with `bcrypt`
- Editable user profiles (bio, company name, industry, profile picture)

### 🤝 Investor–Entrepreneur Collaboration
- Entrepreneurs can create and manage **Startup Pitches** (title, description, funding goal, industry, pitch deck upload)
- Investors can browse pitches and send **Connection Requests**
- Connection request lifecycle: Pending → Accepted / Rejected
- Dedicated Investors and Entrepreneurs directory pages

### 📅 Meeting Scheduling
- Schedule, accept, and reject meetings between users
- Organizer/participant model with start & end time tracking
- Status tracking (Pending, Accepted, Rejected)

### 💬 Real-Time Chat
- WebSocket-based real-time messaging powered by **Django Channels** + Redis
- Live chat between connected investors and entrepreneurs

### 📄 Document Chamber
- Upload and manage documents per user
- In-browser PDF preview
- E-signature capture linked to documents
- Document status tracking (Pending / Signed)

### 💳 Payments & Wallet
- Wallet balance system per user
- Deposit, withdraw, and transfer endpoints
- Stripe integration (test mode) for payment intents
- Transaction history with status tracking (Pending / Completed / Failed)

### 📚 API Documentation
- Auto-generated **Swagger** and **ReDoc** docs via `drf-yasg`
- Postman collection included for quick API testing

---

## Tech Stack

**Backend**
- Django 6.0 + Django REST Framework
- Simple JWT (authentication)
- Django Channels + Redis (real-time WebSocket chat)
- Stripe API (payments)
- drf-yasg (Swagger/ReDoc API docs)
- Gunicorn + WhiteNoise (production serving)
- PostgreSQL (via `dj-database-url` / `psycopg2`)

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Hot Toast
- React Dropzone (file uploads)
- Lucide React (icons)
- date-fns

---

## Project Structure

```
Nexus-Connect/
├── backend/
│   ├── authentication/        # Core app: users, pitches, connections,
│   │                           meetings, documents, payments, 2FA, chat consumers
│   ├── nexus_backend/          # Django project settings, URLs, ASGI/WSGI
│   ├── API_DOCUMENTATION.md
│   ├── Nexus_API_Postman_Collection.json
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/               # dashboard, auth, wallet, chat, documents,
    │   │                          investors, entrepreneurs, deals, settings, etc.
    │   ├── components/          # auth, investor, entrepreneur, chat, documents, pitch, ui
    │   ├── services/            # API integration layer
    │   └── context/
    └── package.json
```

---

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Configure your .env file (SECRET_KEY, DB credentials, Stripe keys, Gmail SMTP, etc.)

python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### API Documentation

Once the backend is running, visit:
- Swagger UI → `/api/docs/`
- ReDoc → `/api/redoc/`

---

## Author

**Muhammad Sami**
GitHub: [@m-sami-dev](https://github.com/m-sami-dev)

---

## Acknowledgements

Developed as part of the Full Stack Development Internship at **@DevelopersHub**.
