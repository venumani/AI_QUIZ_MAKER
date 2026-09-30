import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import { adminAPI, leaderboardAPI } from '../../services/api'
import { Trophy, Trash2, Users, BookOpen, GraduationCap } from 'lucide-react'

export function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform-wide overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students"  value={stats?.total_students  ?? 0} icon="🎓" color="blue"   />
        <StatCard label="Total Teachers"  value={stats?.total_teachers  ?? 0} icon="👨‍🏫" color="purple" />
        <StatCard label="Total Classes"   value={stats?.total_classes   ?? 0} icon="👥" color="green"  />
        <StatCard label="Total PDFs"      value={stats?.total_pdfs      ?? 0} icon="📄" color="orange" />
        <StatCard label="Total Quizzes"   value={stats?.total_quizzes   ?? 0} icon="📝" color="purple" />
        <StatCard label="Total Attempts"  value={stats?.total_attempts  ?? 0} icon="✅" color="green"  />
        <StatCard label="Platform Avg"    value={stats ? `${stats.avg_score}%` : '—'} icon="📊" color="blue" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { label: 'Manage Students', icon: <Users size={20} />, path: '/admin/students', color: 'bg-blue-600' },
          { label: 'Manage Teachers', icon: <GraduationCap size={20} />, path: '/admin/teachers', color: 'bg-purple-600' },
          { label: 'All Quizzes',     icon: <BookOpen size={20} />, path: '/admin/quizzes',  color: 'bg-green-600' },
          { label: 'Leaderboard',     icon: <Trophy size={20} />,   path: '/admin/leaderboard', color: 'bg-yellow-600' },
        ].map(a => (
          <a key={a.label} href={a.path}
            className={`${a.color} text-white rounded-xl p-5 flex items-center gap-3 hover:opacity-90 transition-all`}>
            {a.icon}
            <span className="font-semibold">{a.label}</span>
          </a>
        ))}
      </div>
    </Layout>
  )
}

export function AdminStudents() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => { adminAPI.students().then(r => setStudents(r.data)).catch(() => {}) }, [])

  const handleDelete = async id => {
    if (!window.confirm('Delete this student? This cannot be undone.')) return
    await adminAPI.deleteStudent(id)
    setStudents(p => p.filter(s => s.id !== id))
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">{students.length} registered students</p>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Name', 'Email', 'Registered', 'Action'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No students found.</td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 text-gray-400 text-sm">{i + 1}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                      {s.name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 text-sm">{s.email}</td>
                <td className="px-5 py-4 text-gray-400 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <button onClick={() => handleDelete(s.id)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                    <Trash2 size={13} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

export function AdminTeachers() {
  const [teachers, setTeachers] = useState([])

  useEffect(() => { adminAPI.teachers().then(r => setTeachers(r.data)).catch(() => {}) }, [])

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        <p className="text-gray-500 mt-1">{teachers.length} registered teachers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Name', 'Email', 'Registered'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {teachers.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">No teachers registered yet.</td></tr>
            ) : teachers.map((t, i) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 text-gray-400 text-sm">{i + 1}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">
                      {t.name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{t.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 text-sm">{t.email}</td>
                <td className="px-5 py-4 text-gray-400 text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

export function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => { adminAPI.quizzes().then(r => setQuizzes(r.data)).catch(() => {}) }, [])

  const handleDelete = async id => {
    if (!window.confirm('Delete this quiz permanently?')) return
    await adminAPI.deleteQuiz(id)
    setQuizzes(p => p.filter(q => q.id !== id))
  }

  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()))

  const statusColor = s =>
    s === 'published' ? 'bg-green-100 text-green-700' :
    s === 'draft'     ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Quizzes</h1>
          <p className="text-gray-500 mt-1">{quizzes.length} total quizzes</p>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search quizzes..."
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Title', 'Teacher ID', 'Status', 'Created', 'Action'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No quizzes found.</td></tr>
            ) : filtered.map(q => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-medium text-gray-900">{q.title}</td>
                <td className="px-5 py-4 text-gray-500 text-sm">#{q.teacher_id}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(q.status)}`}>{q.status}</span>
                </td>
                <td className="px-5 py-4 text-gray-400 text-sm">{new Date(q.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <button onClick={() => handleDelete(q.id)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                    <Trash2 size={13} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

export function AdminLeaderboard() {
  const [rows, setRows] = useState([])
  const medals = ['🥇', '🥈', '🥉']

  useEffect(() => { leaderboardAPI.overall().then(r => setRows(r.data)).catch(() => {}) }, [])

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overall Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Ranked by average score across all quizzes</p>
        </div>
      </div>

      {/* Top 3 podium */}
      {rows.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {[rows[1], rows[0], rows[2]].map((r, i) => {
            const heights = ['h-24', 'h-32', 'h-20']
            const colors  = ['bg-gray-100', 'bg-yellow-100', 'bg-orange-100']
            const textClr = ['text-gray-600', 'text-yellow-700', 'text-orange-700']
            return (
              <div key={r.student_id} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                  {r.name[0]}
                </div>
                <p className="text-sm font-semibold text-gray-800 max-w-[80px] text-center truncate">{r.name}</p>
                <p className={`text-xs font-bold ${textClr[i]}`}>{r.avg_score}%</p>
                <div className={`w-20 ${heights[i]} ${colors[i]} rounded-t-xl flex items-center justify-center text-2xl`}>
                  {medals[i === 1 ? 0 : i === 0 ? 1 : 2]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Rank', 'Student', 'Avg Score', 'Quizzes Completed'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">No data yet.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.student_id} className="hover:bg-gray-50">
                <td className="px-5 py-4 text-lg">{medals[i] || <span className="text-gray-500 font-medium text-sm">#{r.rank}</span>}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">
                      {r.name[0]}
                    </div>
                    <span className="font-medium text-gray-900">{r.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[100px]">
                      <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${r.avg_score}%` }} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.avg_score >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {r.avg_score}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500">{r.total_quizzes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
