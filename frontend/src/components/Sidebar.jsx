import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  FileUp,
  BookOpen,
  Users,
  BarChart3,
  Trophy,
  History,
  TrendingUp,
  GraduationCap,
  LogOut,
  Sparkles,
  ShieldAlert
} from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const studentLinks = [
    { name: 'Dashboard', path: '/student', icon: <LayoutDashboard size={18} /> },
    { name: 'Attempt History', path: '/student/history', icon: <History size={18} /> },
    { name: 'Performance', path: '/student/performance', icon: <TrendingUp size={18} /> },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: <Trophy size={18} /> },
  ]

  const teacherLinks = [
    { name: 'Dashboard', path: '/teacher', icon: <LayoutDashboard size={18} /> },
    { name: 'AI Quiz Maker', path: '/teacher/upload', icon: <Sparkles size={18} /> },
    { name: 'My Quizzes', path: '/teacher/quizzes', icon: <BookOpen size={18} /> },
    { name: 'My Classes', path: '/teacher/classes', icon: <Users size={18} /> },
    { name: 'Analytics', path: '/teacher/analytics', icon: <BarChart3 size={18} /> },
    { name: 'Leaderboard', path: '/teacher/leaderboard', icon: <Trophy size={18} /> },
  ]

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Students', path: '/admin/students', icon: <Users size={18} /> },
    { name: 'Teachers', path: '/admin/teachers', icon: <GraduationCap size={18} /> },
    { name: 'All Quizzes', path: '/admin/quizzes', icon: <BookOpen size={18} /> },
    { name: 'Leaderboard', path: '/admin/leaderboard', icon: <Trophy size={18} /> },
  ]

  let links = studentLinks
  if (user?.role === 'teacher') links = teacherLinks
  if (user?.role === 'admin') links = adminLinks

  const roleBadgeColor = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
    teacher: 'bg-purple-50 text-purple-700 border-purple-200',
    student: 'bg-blue-50 text-blue-700 border-blue-200'
  }[user?.role || 'student']

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg text-slate-900 leading-none">
              Quiz<span className="text-purple-600">AI</span>
            </h1>
            <span className="text-[11px] font-medium text-slate-400">LMS Platform</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/student' || link.path === '/teacher' || link.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-purple-50 text-purple-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span className="shrink-0">{link.icon}</span>
            <span>{link.name}</span>
          </NavLink>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user?.name || 'User'}</p>
              <span className={`inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-semibold rounded-md border uppercase tracking-wider ${roleBadgeColor}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
