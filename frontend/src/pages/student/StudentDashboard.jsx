import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import { studentAPI, leaderboardAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Play,
  CheckCircle2,
  Clock,
  HelpCircle,
  Trophy,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar
} from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [stats, setStats] = useState(null)
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      studentAPI.quizzes(),
      studentAPI.statistics(),
      leaderboardAPI.myRank()
    ])
      .then(([qRes, sRes, rRes]) => {
        setQuizzes(qRes.data)
        setStats(sRes.data)
        setMyRank(rRes.data)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const difficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'hard':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  return (
    <Layout>
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-600 p-8 text-white shadow-xl shadow-purple-900/10 mb-8 overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold mb-3">
            <Sparkles size={14} className="text-yellow-300" /> Student Portal
          </div>
          <h1 className="text-3xl font-extrabold font-display">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-purple-100 text-sm mt-2 leading-relaxed">
            Ready for your next learning milestone? Practice with AI-generated quizzes, test your knowledge, and rise on the class leaderboard.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Completed Quizzes"
          value={stats?.quizzes_completed ?? 0}
          icon={<CheckCircle2 size={20} />}
          color="green"
        />
        <StatCard
          label="Average Score"
          value={stats ? `${stats.avg_score}%` : '0%'}
          icon={<Trophy size={20} />}
          color="purple"
        />
        <StatCard
          label="Highest Score"
          value={stats ? `${stats.highest_score}%` : '0%'}
          icon={<Sparkles size={20} />}
          color="orange"
        />
        <StatCard
          label="Leaderboard Rank"
          value={myRank?.rank ? `#${myRank.rank}` : '—'}
          icon={<Trophy size={20} />}
          color="blue"
        />
      </div>

      {/* Available Quizzes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Available & Assigned Quizzes</h2>
            <p className="text-slate-500 text-xs mt-0.5">Select any quiz below to begin or review your previous attempts</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Loading available quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
            <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No quizzes available right now</h3>
            <p className="text-slate-400 text-xs mt-1">Check back later once your teacher assigns new material.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => {
              const isCompleted = quiz.attempt_status === 'completed'
              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold capitalize ${difficultyBadge(quiz.difficulty)}`}>
                        {quiz.difficulty}
                      </span>
                      {quiz.class_name && (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                          {quiz.class_name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1">{quiz.title}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {quiz.description || `Evaluation covering ${quiz.topic || 'the topic'}.`}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-5">
                      <span className="flex items-center gap-1">
                        <HelpCircle size={14} className="text-slate-400" />
                        {quiz.question_count} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        {quiz.duration_minutes} Mins
                      </span>
                      {quiz.due_date && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Calendar size={14} />
                          Due {new Date(quiz.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    {isCompleted ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                            Score: {quiz.percentage}%
                          </span>
                        </div>
                        <Link
                          to={`/student/result/${quiz.attempt_id}`}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          Review Result <ArrowRight size={14} />
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-slate-400">Ready to take</span>
                        <Link
                          to={`/student/quiz/${quiz.id}`}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Play size={13} fill="currentColor" /> Start Quiz
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
