import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import { studentAPI, leaderboardAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowLeft
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── RESULT PAGE ──
export function ResultPage() {
  const { attemptId } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentAPI.result(attemptId)
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [attemptId])

  if (loading) {
    return (
      <Layout>
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs">Loading attempt results...</p>
        </div>
      </Layout>
    )
  }

  if (!result) {
    return (
      <Layout>
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Result Not Found</h2>
          <Link to="/student" className="mt-4 inline-block text-xs font-bold text-purple-600 hover:underline">
            ← Return to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  const isPassed = result.percentage >= 60

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <Link to="/student" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <span className="text-xs text-slate-400">
          Completed {new Date(result.submitted_at).toLocaleString()}
        </span>
      </div>

      {/* Score Summary Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-8 text-center relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-50 border-4 border-purple-200 text-purple-700 mb-4">
          <span className="text-3xl font-extrabold font-display">{result.percentage}%</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 font-display mb-1">
          {isPassed ? '🎉 Great Job! Quiz Completed' : 'Keep Practicing! Quiz Finished'}
        </h1>
        <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">
          You answered <span className="font-bold text-slate-800">{result.correct_answers}</span> out of <span className="font-bold text-slate-800">{result.total_questions}</span> questions correctly for <span className="font-bold text-purple-600">{result.quiz_title}</span>.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/student/leaderboard"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            <Trophy size={14} /> View Leaderboard
          </Link>
          <Link
            to="/student/history"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            All Past Results
          </Link>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 font-display">Detailed Question Review</h2>

        {result.questions?.map((q, idx) => {
          const isCorrect = q.is_correct
          return (
            <div
              key={q.question_id || idx}
              className={`bg-white rounded-2xl p-6 border transition-all ${
                isCorrect ? 'border-emerald-100 shadow-emerald-500/5' : 'border-rose-100 shadow-rose-500/5'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                {isCorrect ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Correct
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1">
                    <XCircle size={12} /> Incorrect
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-4">{q.question_text}</h3>

              {/* Options Breakdown */}
              <div className="grid md:grid-cols-2 gap-2 mb-4">
                {q.options?.map((opt, oIdx) => {
                  const isSelected = q.selected_option === opt
                  const isAnswer = q.correct_answer === opt

                  let style = 'bg-slate-50 border-slate-100 text-slate-600'
                  if (isAnswer) style = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                  if (isSelected && !isAnswer) style = 'bg-rose-50 border-rose-300 text-rose-800 line-through'

                  return (
                    <div key={oIdx} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}>
                      <span>{opt}</span>
                      {isAnswer && <CheckCircle2 size={14} className="text-emerald-600 shrink-0 ml-2" />}
                      {isSelected && !isAnswer && <XCircle size={14} className="text-rose-500 shrink-0 ml-2" />}
                    </div>
                  )
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 leading-relaxed">
                  <span className="font-bold">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}

// ── HISTORY PAGE ──
export function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentAPI.history()
      .then((res) => setHistory(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-display">Attempt History</h1>
        <p className="text-slate-500 text-xs mt-1">Review all your completed quiz submissions</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Quiz Title', 'Score', 'Accuracy', 'Date Completed', 'Action'].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">Loading history...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">No quiz attempts recorded yet.</td></tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{item.quiz_title}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                    {item.correct_answers} / {item.total_questions}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.percentage >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/student/result/${item.id}`}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      Review <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

// ── PERFORMANCE PAGE ──
export function PerformancePage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentAPI.statistics()
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const chartData = (stats?.recent_activity || []).map((item, idx) => ({
    name: `Quiz #${item.id}`,
    score: item.percentage
  })).reverse()

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-display">Performance Analytics</h1>
        <p className="text-slate-500 text-xs mt-1">Track your score trajectory and learning progress</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Quizzes" value={stats?.quizzes_completed ?? 0} icon={<BookOpen size={20} />} color="blue" />
        <StatCard label="Average Score" value={stats ? `${stats.avg_score}%` : '0%'} icon={<Trophy size={20} />} color="purple" />
        <StatCard label="Highest Score" value={stats ? `${stats.highest_score}%` : '0%'} icon={<Sparkles size={20} />} color="green" />
        <StatCard label="Accuracy Rate" value={stats ? `${stats.accuracy_rate}%` : '0%'} icon={<CheckCircle2 size={20} />} color="orange" />
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8">
        <h2 className="text-base font-bold text-slate-900 font-display mb-4">Score Progression Trend</h2>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            Complete some quizzes to populate performance trends.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ── STUDENT LEADERBOARD ──
export function StudentLeaderboard() {
  const [rows, setRows] = useState([])
  const [myRank, setMyRank] = useState(null)
  const { user } = useAuth()
  const medals = ['🥇', '🥈', '🥉']

  useEffect(() => {
    Promise.all([
      leaderboardAPI.overall(),
      leaderboardAPI.myRank()
    ]).then(([lRes, rRes]) => {
      setRows(lRes.data)
      setMyRank(rRes.data)
    }).catch((err) => console.error(err))
  }, [])

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <Trophy size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Global Leaderboard</h1>
          <p className="text-slate-500 text-xs mt-0.5">Top-ranked students by cumulative average score</p>
        </div>
      </div>

      {/* Podium Top 3 */}
      {rows.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {[rows[1], rows[0], rows[2]].map((r, i) => {
            const heights = ['h-24', 'h-32', 'h-20']
            const colors = ['bg-slate-100', 'bg-amber-100', 'bg-orange-100']
            const textClr = ['text-slate-700', 'text-amber-800', 'text-orange-800']
            return (
              <div key={r.student_id} className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shadow-xs">
                  {r.name[0]}
                </div>
                <p className="text-xs font-bold text-slate-800 max-w-[90px] text-center truncate">{r.name}</p>
                <p className={`text-xs font-bold ${textClr[i]}`}>{r.avg_score}%</p>
                <div className={`w-24 ${heights[i]} ${colors[i]} rounded-t-2xl flex items-center justify-center text-3xl shadow-xs`}>
                  {medals[i === 1 ? 0 : i === 0 ? 1 : 2]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Rank', 'Student', 'Average Score', 'Quizzes Done'].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs">No rankings available yet.</td></tr>
            ) : (
              rows.map((r, idx) => {
                const isMe = r.student_id === user?.id
                return (
                  <tr key={r.student_id} className={isMe ? 'bg-purple-50/70 font-semibold' : 'hover:bg-slate-50/80 transition-colors'}>
                    <td className="px-6 py-4 text-base">
                      {medals[idx] || <span className="text-slate-400 text-xs font-bold">#{r.rank}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          {r.name[0]}
                        </div>
                        <span className="text-slate-900 text-sm">{r.name} {isMe && '(You)'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.avg_score >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {r.avg_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{r.total_quizzes}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
