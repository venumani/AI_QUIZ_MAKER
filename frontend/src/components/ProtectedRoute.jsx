import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role && user.role !== 'admin') {
    // Redirect to user's appropriate default dashboard
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />
    if (user.role === 'student') return <Navigate to="/student" replace />
    return <Navigate to="/admin" replace />
  }

  return children
}
