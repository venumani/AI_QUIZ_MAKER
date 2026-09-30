import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Auth
import { LoginPage, RegisterPage } from './pages/Auth'

// Student
import StudentDashboard from './pages/student/StudentDashboard'
import QuizPage from './pages/student/QuizPage'
import {
  ResultPage, HistoryPage, PerformancePage, StudentLeaderboard
} from './pages/student/StudentPages'

// Teacher
import {
  TeacherDashboard, UploadPDFPage, TeacherQuizzes,
  TeacherClasses, TeacherAnalytics, TeacherLeaderboard
} from './pages/teacher/TeacherPages'

// Admin
import {
  AdminDashboard, AdminStudents, AdminTeachers,
  AdminQuizzes, AdminLeaderboard
} from './pages/admin/AdminPages'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin')    return <Navigate to="/admin"   replace />
  if (user.role === 'teacher')  return <Navigate to="/teacher" replace />
  return <Navigate to="/student" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />}    />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/"         element={<RootRedirect />} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/quizzes"         element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/quiz/:quizId"    element={<ProtectedRoute role="student"><QuizPage /></ProtectedRoute>} />
          <Route path="/student/result/:attemptId" element={<ProtectedRoute role="student"><ResultPage /></ProtectedRoute>} />
          <Route path="/student/history"         element={<ProtectedRoute role="student"><HistoryPage /></ProtectedRoute>} />
          <Route path="/student/performance"     element={<ProtectedRoute role="student"><PerformancePage /></ProtectedRoute>} />
          <Route path="/student/leaderboard"     element={<ProtectedRoute role="student"><StudentLeaderboard /></ProtectedRoute>} />

          {/* Teacher */}
          <Route path="/teacher"              element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/upload"       element={<ProtectedRoute role="teacher"><UploadPDFPage /></ProtectedRoute>} />
          <Route path="/teacher/quizzes"      element={<ProtectedRoute role="teacher"><TeacherQuizzes /></ProtectedRoute>} />
          <Route path="/teacher/classes"      element={<ProtectedRoute role="teacher"><TeacherClasses /></ProtectedRoute>} />
          <Route path="/teacher/analytics"    element={<ProtectedRoute role="teacher"><TeacherAnalytics /></ProtectedRoute>} />
          <Route path="/teacher/leaderboard"  element={<ProtectedRoute role="teacher"><TeacherLeaderboard /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"              element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students"     element={<ProtectedRoute role="admin"><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/teachers"     element={<ProtectedRoute role="admin"><AdminTeachers /></ProtectedRoute>} />
          <Route path="/admin/quizzes"      element={<ProtectedRoute role="admin"><AdminQuizzes /></ProtectedRoute>} />
          <Route path="/admin/leaderboard"  element={<ProtectedRoute role="admin"><AdminLeaderboard /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
