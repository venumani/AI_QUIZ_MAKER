"""
Tests for AI Quiz Maker backend.
Run: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app

# Use SQLite for tests
TEST_DB = "sqlite:///./test.db"
engine = create_engine(TEST_DB, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


# ── AUTH TESTS ──────────────────────────────────────────────

def register(name="Test User", email="test@example.com", password="pass123", role="student"):
    return client.post("/auth/register", json={
        "name": name, "email": email,
        "password": password, "confirm_password": password, "role": role
    })


def login(email="test@example.com", password="pass123"):
    return client.post("/auth/login", json={"email": email, "password": password})


def auth_header(email="test@example.com", password="pass123"):
    r = login(email, password)
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


class TestAuth:
    def test_register_student(self):
        r = register()
        assert r.status_code == 200
        assert "user_id" in r.json()

    def test_register_duplicate_email(self):
        register()
        r = register()
        assert r.status_code == 400

    def test_register_admin_blocked(self):
        r = client.post("/auth/register", json={
            "name": "Admin", "email": "admin@x.com",
            "password": "pass123", "confirm_password": "pass123", "role": "admin"
        })
        assert r.status_code == 422  # Pydantic validation rejects admin role

    def test_register_short_password(self):
        r = client.post("/auth/register", json={
            "name": "X", "email": "x@x.com",
            "password": "abc", "confirm_password": "abc", "role": "student"
        })
        assert r.status_code == 422

    def test_login_success(self):
        register()
        r = login()
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["user"]["role"] == "student"

    def test_login_wrong_password(self):
        register()
        r = login(password="wrongpass")
        assert r.status_code == 401

    def test_login_unknown_email(self):
        r = login(email="nobody@x.com")
        assert r.status_code == 401

    def test_me_authenticated(self):
        register()
        headers = auth_header()
        r = client.get("/auth/me", headers=headers)
        assert r.status_code == 200
        assert r.json()["email"] == "test@example.com"

    def test_me_unauthenticated(self):
        r = client.get("/auth/me")
        assert r.status_code == 401


class TestAuthorization:
    def test_student_cannot_access_teacher_route(self):
        register(role="student")
        headers = auth_header()
        r = client.get("/teacher/classes", headers=headers)
        assert r.status_code == 403

    def test_student_cannot_access_admin_route(self):
        register(role="student")
        headers = auth_header()
        r = client.get("/admin/statistics", headers=headers)
        assert r.status_code == 403

    def test_teacher_can_access_teacher_route(self):
        register(email="teacher@x.com", role="teacher")
        headers = auth_header(email="teacher@x.com")
        r = client.get("/teacher/classes", headers=headers)
        assert r.status_code == 200

    def test_teacher_cannot_access_admin_route(self):
        register(email="teacher@x.com", role="teacher")
        headers = auth_header(email="teacher@x.com")
        r = client.get("/admin/statistics", headers=headers)
        assert r.status_code == 403


class TestClasses:
    def setup_teacher(self):
        register(email="t@x.com", role="teacher")
        return auth_header(email="t@x.com")

    def test_create_class(self):
        headers = self.setup_teacher()
        r = client.post("/teacher/classes", json={
            "class_name": "CSE-A", "subject": "Python", "academic_year": "2026-27"
        }, headers=headers)
        assert r.status_code == 200
        assert r.json()["class_name"] == "CSE-A"

    def test_get_classes_empty(self):
        headers = self.setup_teacher()
        r = client.get("/teacher/classes", headers=headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_get_classes_after_create(self):
        headers = self.setup_teacher()
        client.post("/teacher/classes", json={
            "class_name": "CSE-B", "subject": "DBMS", "academic_year": "2026-27"
        }, headers=headers)
        r = client.get("/teacher/classes", headers=headers)
        assert len(r.json()) == 1

    def test_delete_class(self):
        headers = self.setup_teacher()
        c = client.post("/teacher/classes", json={
            "class_name": "CSE-A", "subject": "Python", "academic_year": "2026-27"
        }, headers=headers).json()
        r = client.delete(f"/teacher/classes/{c['id']}", headers=headers)
        assert r.status_code == 200


class TestStudentQuizFlow:
    def setup(self):
        register(name="Student", email="s@x.com", role="student")
        register(name="Teacher", email="t@x.com", role="teacher")

    def test_student_quizzes_empty(self):
        self.setup()
        headers = auth_header(email="s@x.com")
        r = client.get("/student/quizzes", headers=headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_student_history_empty(self):
        self.setup()
        headers = auth_header(email="s@x.com")
        r = client.get("/student/history", headers=headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_student_statistics_empty(self):
        self.setup()
        headers = auth_header(email="s@x.com")
        r = client.get("/student/statistics", headers=headers)
        assert r.status_code == 200
        assert r.json()["quizzes_completed"] == 0


class TestLeaderboard:
    def test_overall_leaderboard_empty(self):
        r = client.get("/leaderboard", headers={"Authorization": "Bearer invalid"})
        assert r.status_code == 401

    def test_leaderboard_authenticated(self):
        register()
        headers = auth_header()
        r = client.get("/leaderboard", headers=headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_my_rank_no_attempts(self):
        register()
        headers = auth_header()
        r = client.get("/leaderboard/my-rank", headers=headers)
        assert r.status_code == 200
        assert r.json()["total_quizzes"] == 0
