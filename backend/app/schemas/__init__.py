from .auth import UserRegister, UserLogin, UserResponse, TokenResponse
from .class_schema import ClassCreate, ClassResponse, ClassDetailResponse, ClassStudentResponse, AddStudentRequest
from .pdf_schema import PDFResponse
from .quiz_schema import (
    QuestionCreate, QuestionResponse, QuestionStudentView,
    QuizGenerateRequest, QuizCreate, QuizUpdateRequest,
    QuizResponse, QuizAssignRequest, QuizAssignmentResponse
)
from .student_schema import (
    SubmitAnswersRequest, AttemptResponse, AttemptDetailResponse,
    StudentQuizItem, StudentStatsResponse, AttemptAnswerDetail
)
from .leaderboard_schema import LeaderboardEntry, MyRankResponse
from .admin_schema import AdminStats
