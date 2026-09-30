import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quiz_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for automatic 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired, clear and redirect to login if on protected route
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('quiz_token')
        localStorage.removeItem('quiz_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

export const pdfAPI = {
  upload: (formData) => api.post('/pdf/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: () => api.get('/pdf'),
  get: (id) => api.get(`/pdf/${id}`),
  delete: (id) => api.delete(`/pdf/${id}`),
}

export const quizAPI = {
  generate: (data) => api.post('/quiz/generate', data),
  create: (data) => api.post('/quiz/create', data),
  teacherQuizzes: () => api.get('/quiz/teacher'),
  get: (id) => api.get(`/quiz/${id}`),
  update: (id, data) => api.put(`/quiz/${id}`, data),
  publish: (id) => api.post(`/quiz/${id}/publish`),
  assign: (id, data) => api.post(`/quiz/${id}/assign`, data),
  delete: (id) => api.delete(`/quiz/${id}`),
  start: (id) => api.post(`/quiz/${id}/start`),
  submit: (id, data) => api.post(`/quiz/${id}/submit`, data),
  submitAttempt: (attemptId, data) => api.post(`/quiz/attempt/${attemptId}/submit`, data),
}

export const studentAPI = {
  quizzes: () => api.get('/student/quizzes'),
  history: () => api.get('/student/history'),
  statistics: () => api.get('/student/statistics'),
  result: (attemptId) => api.get(`/student/results/${attemptId}`),
}

export const teacherAPI = {
  classes: () => api.get('/teacher/classes'),
  createClass: (data) => api.post('/teacher/classes', data),
  getClass: (id) => api.get(`/teacher/classes/${id}`),
  deleteClass: (id) => api.delete(`/teacher/classes/${id}`),
  classStudents: (id) => api.get(`/teacher/classes/${id}/students`),
  addStudentToClass: (classId, data) => api.post(`/teacher/classes/${classId}/students`, data),
  removeStudentFromClass: (classId, studentId) => api.delete(`/teacher/classes/${classId}/students/${studentId}`),
  analytics: () => api.get('/teacher/analytics'),
}

export const leaderboardAPI = {
  overall: () => api.get('/leaderboard'),
  myRank: () => api.get('/leaderboard/my-rank'),
  byClass: (classId) => api.get(`/leaderboard/class/${classId}`),
  byQuiz: (quizId) => api.get(`/leaderboard/quiz/${quizId}`),
}

export const adminAPI = {
  stats: () => api.get('/admin/statistics'),
  students: () => api.get('/admin/students'),
  teachers: () => api.get('/admin/teachers'),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  deleteTeacher: (id) => api.delete(`/admin/teachers/${id}`),
  quizzes: () => api.get('/admin/quizzes'),
  deleteQuiz: (id) => api.delete(`/admin/quizzes/${id}`),
}

export default api
