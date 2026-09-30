# ⚡ AI Quiz Maker — Full-Stack LMS

A production-quality AI-powered Learning Management System built for teachers and students. Teachers upload PDFs, AI generates quizzes, students practice and are ranked on leaderboards.

---

## 🏗️ Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | React 18 + React Router + Tailwind CSS + Recharts |
| Backend     | FastAPI + Python 3.11                    |
| Database    | PostgreSQL + SQLAlchemy + Alembic        |
| AI          | OpenAI GPT-4o-mini                       |
| PDF         | PyMuPDF (fitz)                           |
| Auth        | JWT (python-jose) + bcrypt               |

---

## 👥 User Roles

| Role    | Capabilities |
|---------|-------------|
| Admin   | View all users, quizzes, stats, leaderboard. Delete any resource. |
| Teacher | Upload PDFs, generate AI quizzes, create classes, assign quizzes, view analytics. |
| Student | Take assigned quizzes, view results, track performance, view leaderboard. |

---

## 📁 Project Structure

```
ai-quiz-maker/
├── backend/
│   ├── app/
│   │   ├── main.py             ← FastAPI app entry point
│   │   ├── config.py           ← Settings from .env
│   │   ├── database.py         ← SQLAlchemy engine + session
│   │   ├── dependencies.py     ← JWT auth + role guards
│   │   ├── models/             ← SQLAlchemy ORM models
│   │   ├── schemas/            ← Pydantic request/response schemas
│   │   ├── routers/            ← API route handlers
│   │   └── services/           ← Business logic (AI, PDF, quiz eval)
│   ├── alembic/                ← DB migrations
│   ├── tests/                  ← pytest test suite
│   ├── uploads/                ← Uploaded PDF files
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── services/api.js
        ├── components/         ← Sidebar, Layout, StatCard, ProtectedRoute
        └── pages/
            ├── Auth.jsx        ← Login + Register
            ├── student/        ← Dashboard, Quiz, Result, History, Performance, Leaderboard
            ├── teacher/        ← Dashboard, Upload PDF, Quizzes, Classes, Analytics
            └── admin/          ← Dashboard, Students, Teachers, Quizzes, Leaderboard
```

---

## 🚀 Quick Start

### 1. PostgreSQL Setup

```sql
CREATE DATABASE ai_quiz_db;
CREATE USER quiz_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE ai_quiz_db TO quiz_user;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY and DATABASE_URL

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## 🔌 Key API Endpoints

### Authentication
```
POST /auth/register    Register (student or teacher)
POST /auth/login       Get JWT token
GET  /auth/me          Current user info
```

### PDF
```
POST /pdf/upload       Upload PDF (teacher)
GET  /pdf              List my PDFs
DELETE /pdf/{id}       Delete PDF
```

### Quiz
```
POST /quiz/generate              AI generates quiz from PDF
GET  /quiz/teacher               Teacher's quizzes
GET  /quiz/{id}                  Quiz details + questions
POST /quiz/{id}/publish          Publish draft quiz
POST /quiz/{id}/assign           Assign to class/student
POST /quiz/{id}/start            Student starts attempt
POST /quiz/{id}/submit           Student submits answers
```

### Student
```
GET /student/quizzes             Assigned quizzes
GET /student/history             Attempt history
GET /student/statistics          Performance stats
GET /student/results/{id}        Detailed result + review
```

### Leaderboard
```
GET /leaderboard                 Overall ranking
GET /leaderboard/class/{id}      Class ranking
GET /leaderboard/quiz/{id}       Quiz-specific ranking
GET /leaderboard/my-rank         Your current rank
```

### Admin
```
GET  /admin/statistics           Platform-wide stats
GET  /admin/students             All students
GET  /admin/teachers             All teachers
DELETE /admin/students/{id}      Delete student
DELETE /admin/quizzes/{id}       Delete any quiz
```

---

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## 🔐 Security Features

- JWT authentication on all protected routes
- bcrypt password hashing — no plain-text passwords stored
- Role-based access control enforced on the backend
- Students cannot access other students' data
- AI API key stays server-side only — never exposed to frontend
- File type + size validation on PDF upload
- Backend-calculated scores — client cannot manipulate scores
- One attempt per quiz per student enforced by backend

---

## 🌐 Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_quiz_db
OPENAI_API_KEY=sk-...
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
MAX_PDF_SIZE_MB=20
```

---

## 📦 Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

---

## 🎓 Complete User Flow

### Teacher
1. Register → login as teacher
2. Upload PDF study material
3. Configure quiz (topic, difficulty, questions)
4. AI generates MCQ questions from PDF content
5. Review and edit questions
6. Publish quiz
7. Create class → add students
8. Assign quiz to class with due date
9. Monitor results and leaderboard

### Student
1. Register → login as student
2. View assigned quizzes on dashboard
3. Start quiz (timer begins)
4. Answer all questions, navigate freely
5. Submit → backend calculates score
6. View score, review answers with explanations
7. Track performance on progress page
8. View class leaderboard and ranking

---

## 📊 Features Summary

- ✅ AI quiz generation from PDF using OpenAI
- ✅ Role-based access: admin / teacher / student
- ✅ JWT authentication with bcrypt passwords
- ✅ PDF upload, validation, text extraction
- ✅ Quiz publish workflow (draft → published)
- ✅ Class creation and student management
- ✅ Quiz assignment to classes or individual students
- ✅ Live countdown timer (auto-submits on expiry)
- ✅ Question navigation dots
- ✅ Backend score evaluation
- ✅ Answer review with explanations
- ✅ Score history with chart
- ✅ Overall, class, and quiz leaderboards
- ✅ Admin dashboard with platform stats
- ✅ Responsive design (Tailwind CSS)
- ✅ pytest test suite
- ✅ Alembic database migrations
- ✅ Swagger API docs at /docs
