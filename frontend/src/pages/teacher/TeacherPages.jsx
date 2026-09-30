import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import { teacherAPI, pdfAPI, quizAPI, leaderboardAPI } from '../../services/api'
import {
  Sparkles,
  Upload,
  BookOpen,
  Users,
  BarChart3,
  Trophy,
  Plus,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileText,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── TEACHER DASHBOARD ──
export function TeacherDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      teacherAPI.analytics(),
      quizAPI.teacherQuizzes()
    ])
      .then(([aRes, qRes]) => {
        setAnalytics(aRes.data)
        setQuizzes(qRes.data)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Teacher Dashboard</h1>
          <p className="text-slate-500 text-xs mt-1">Manage classes, generate quizzes with AI, and track performance</p>
        </div>
        <Link
          to="/teacher/upload"
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
        >
          <Sparkles size={15} /> AI Quiz Maker
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Quizzes" value={analytics?.total_quizzes ?? 0} icon={<BookOpen size={20} />} color="purple" />
        <StatCard label="Active Classes" value={analytics?.total_classes ?? 0} icon={<Users size={20} />} color="blue" />
        <StatCard label="Enrolled Students" value={analytics?.total_students ?? 0} icon={<Users size={20} />} color="green" />
        <StatCard label="Average Score" value={analytics ? `${analytics.avg_score}%` : '0%'} icon={<Trophy size={20} />} color="orange" />
      </div>

      {/* Quick Action Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/teacher/upload"
          className="bg-purple-600 text-white p-6 rounded-3xl shadow-sm hover:shadow-md hover:bg-purple-700 transition-all flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base font-display">Generate Quiz from PDF</h3>
            <p className="text-purple-100 text-xs mt-1">Upload study notes & let AI formulate questions.</p>
          </div>
        </Link>

        <Link
          to="/teacher/classes"
          className="bg-indigo-600 text-white p-6 rounded-3xl shadow-sm hover:shadow-md hover:bg-indigo-700 transition-all flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base font-display">Manage Classes & Roster</h3>
            <p className="text-indigo-100 text-xs mt-1">Create cohorts and invite students.</p>
          </div>
        </Link>

        <Link
          to="/teacher/analytics"
          className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm hover:shadow-md hover:bg-slate-800 transition-all flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base font-display">Learning Analytics</h3>
            <p className="text-slate-400 text-xs mt-1">Review student submissions and metrics.</p>
          </div>
        </Link>
      </div>

      {/* Recent Quizzes List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 font-display">Your Quizzes</h2>
          <Link to="/teacher/quizzes" className="text-xs font-bold text-purple-600 hover:underline">
            View All ({quizzes.length})
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-8">No quizzes created yet. Use AI Quiz Maker to start.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {quizzes.slice(0, 5).map((q) => (
              <div key={q.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{q.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{q.question_count} questions</span>
                    <span>•</span>
                    <span className="capitalize">{q.difficulty}</span>
                    <span>•</span>
                    <span>{q.duration_minutes} mins</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                    q.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

// ── UPLOAD PDF & GENERATE QUIZ PAGE ──
export function UploadPDFPage() {
  const [pdfs, setPdfs] = useState([])
  const [selectedPdfId, setSelectedPdfId] = useState(null)
  const [topic, setTopic] = useState('')
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [numQuestions, setNumQuestions] = useState(5)
  const [durationMinutes, setDurationMinutes] = useState(15)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedQuiz, setGeneratedQuiz] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPdfs()
  }, [])

  const loadPdfs = () => {
    pdfAPI.list().then((res) => setPdfs(res.data)).catch((err) => console.error(err))
  }

  const handleUploadPdf = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await pdfAPI.upload(formData)
      setPdfs((prev) => [res.data, ...prev])
      setSelectedPdfId(res.data.id)
      setTopic(res.data.title)
      setTitle(`Quiz: ${res.data.title}`)
      setFile(null)
      setMessage('PDF uploaded and processed successfully!')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePdf = async (id) => {
    if (!window.confirm('Delete this PDF?')) return
    await pdfAPI.delete(id)
    setPdfs((p) => p.filter((x) => x.id !== id))
    if (selectedPdfId === id) setSelectedPdfId(null)
  }

  const handleGenerateQuiz = async (e) => {
    e.preventDefault()
    setGenerating(true)
    setMessage('')
    try {
      const res = await quizAPI.generate({
        pdf_id: selectedPdfId,
        topic: topic || 'General Topic',
        title: title || `Quiz: ${topic || 'New Quiz'}`,
        difficulty,
        num_questions: parseInt(numQuestions),
        duration_minutes: parseInt(durationMinutes)
      })
      setGeneratedQuiz(res.data)
      setMessage('Quiz generated successfully with AI! You can review or edit it below.')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Quiz generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const handlePublishGenerated = async () => {
    if (!generatedQuiz) return
    try {
      const res = await quizAPI.publish(generatedQuiz.id)
      setGeneratedQuiz(res.data)
      setMessage('Quiz published successfully! Students can now access it.')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-display">AI Quiz Maker</h1>
        <p className="text-slate-500 text-xs mt-1">Upload course materials or specify topics to formulate comprehensive MCQs</p>
      </div>

      {message && (
        <div className="p-4 mb-6 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* PDF Upload Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 font-display mb-4 flex items-center gap-2">
              <Upload size={18} className="text-purple-600" /> 1. Upload Study Material (PDF)
            </h2>

            <form onSubmit={handleUploadPdf} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-purple-400 transition-colors">
                <FileText size={36} className="text-slate-300 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0])}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-2">Max file size: 20MB (.pdf only)</p>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? 'Processing PDF...' : 'Upload & Extract Text'}
              </button>
            </form>
          </div>

          {/* Uploaded PDFs Library */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-display mb-3">Your Uploaded PDFs</h3>
            {pdfs.length === 0 ? (
              <p className="text-slate-400 text-xs">No PDFs uploaded yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {pdfs.map((p) => {
                  const isSelected = selectedPdfId === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPdfId(isSelected ? null : p.id)
                        if (!isSelected) {
                          setTopic(p.title)
                          setTitle(`Quiz: ${p.title}`)
                        }
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/80 text-purple-900'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText size={16} className={isSelected ? 'text-purple-600' : 'text-slate-400'} />
                        <span className="text-xs font-semibold truncate max-w-[200px]">{p.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">{p.page_count} pgs</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePdf(p.id)
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* AI Quiz Generation Form */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 font-display mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" /> 2. Configure & Generate
          </h2>

          <form onSubmit={handleGenerateQuiz} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Quiz Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Neural Networks"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Topic / Subject</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Deep Learning Architecture"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none capitalize"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Questions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Duration (Min)</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI is formulating questions...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Quiz with AI</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Real-time Generated Quiz Preview */}
      {generatedQuiz && (
        <div className="mt-8 bg-white rounded-3xl p-8 border border-purple-200 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-display">{generatedQuiz.title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  generatedQuiz.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {generatedQuiz.status}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {generatedQuiz.questions?.length} Questions • {generatedQuiz.duration_minutes} Minutes • Difficulty: {generatedQuiz.difficulty}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {generatedQuiz.status === 'draft' && (
                <button
                  type="button"
                  onClick={handlePublishGenerated}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Publish Quiz
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {generatedQuiz.questions?.map((q, idx) => (
              <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-700">Q{idx + 1}: {q.question_text}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {q.options?.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg text-xs border ${
                        opt === q.correct_answer
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="mt-2 text-[11px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-700">Explanation:</span> {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}

// ── TEACHER QUIZZES PAGE ──
export function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [classes, setClasses] = useState([])
  const [assignModal, setAssignModal] = useState(null) // selected quiz
  const [selectedClassId, setSelectedClassId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      quizAPI.teacherQuizzes(),
      teacherAPI.classes()
    ]).then(([qRes, cRes]) => {
      setQuizzes(qRes.data)
      setClasses(cRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const handlePublish = async (id) => {
    const res = await quizAPI.publish(id)
    setQuizzes((prev) => prev.map((q) => (q.id === id ? res.data : q)))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quiz?')) return
    await quizAPI.delete(id)
    setQuizzes((p) => p.filter((q) => q.id !== id))
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignModal || !selectedClassId) return
    await quizAPI.assign(assignModal.id, {
      class_id: parseInt(selectedClassId),
      due_date: dueDate ? new Date(dueDate).toISOString() : null
    })
    setAssignModal(null)
    setSelectedClassId('')
    setDueDate('')
    // Reload quizzes to reflect new assignment
    const res = await quizAPI.teacherQuizzes()
    setQuizzes(res.data)
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">My Quizzes</h1>
          <p className="text-slate-500 text-xs mt-1">Manage, publish, and assign quizzes to your classes</p>
        </div>
        <Link
          to="/teacher/upload"
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
        >
          <Plus size={15} /> Create New Quiz
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Quiz Title', 'Questions', 'Difficulty', 'Status', 'Assigned To', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {quizzes.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">No quizzes found.</td></tr>
            ) : (
              quizzes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{q.title}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-semibold">{q.question_count} Qs</td>
                  <td className="px-6 py-4 text-xs capitalize text-slate-600">{q.difficulty}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                      q.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {q.assignments?.length > 0 ? (
                      <span className="font-semibold text-purple-600">
                        {q.assignments.map((a) => a.class_name || 'Assigned').join(', ')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {q.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handlePublish(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAssignModal(q)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                      >
                        Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display mb-1">Assign Quiz</h3>
            <p className="text-slate-500 text-xs mb-4">{assignModal.title}</p>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Class</label>
                <select
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.class_name} ({c.subject})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20"
                >
                  Assign to Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

// ── TEACHER CLASSES PAGE ──
export function TeacherClasses() {
  const [classes, setClasses] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('')
  const [academicYear, setAcademicYear] = useState('2026-27')
  const [activeClassDetail, setActiveClassDetail] = useState(null)
  const [studentEmail, setStudentEmail] = useState('')

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = () => {
    teacherAPI.classes().then((res) => setClasses(res.data)).catch((err) => console.error(err))
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    await teacherAPI.createClass({ class_name: className, subject, academic_year: academicYear })
    setClassName('')
    setSubject('')
    setShowCreate(false)
    loadClasses()
  }

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Delete this class?')) return
    await teacherAPI.deleteClass(id)
    if (activeClassDetail?.id === id) setActiveClassDetail(null)
    loadClasses()
  }

  const handleViewDetail = async (id) => {
    const res = await teacherAPI.getClass(id)
    setActiveClassDetail(res.data)
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    if (!activeClassDetail || !studentEmail) return
    try {
      await teacherAPI.addStudentToClass(activeClassDetail.id, { student_email: studentEmail })
      setStudentEmail('')
      handleViewDetail(activeClassDetail.id)
      loadClasses()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add student')
    }
  }

  const handleRemoveStudent = async (studentId) => {
    if (!activeClassDetail) return
    await teacherAPI.removeStudentFromClass(activeClassDetail.id, studentId)
    handleViewDetail(activeClassDetail.id)
    loadClasses()
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">My Classes</h1>
          <p className="text-slate-500 text-xs mt-1">Organize student groups and course rosters</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
        >
          <Plus size={15} /> Create New Class
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <div className="lg:col-span-1 space-y-3">
          {classes.map((c) => {
            const isActive = activeClassDetail?.id === c.id
            return (
              <div
                key={c.id}
                onClick={() => handleViewDetail(c.id)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-2 ring-purple-600/10'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-sm">{c.class_name}</h3>
                  <span className="text-[11px] font-bold text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded-md">
                    {c.student_count} Students
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{c.subject}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Year: {c.academic_year}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClass(c.id)
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Class Details & Roster */}
        <div className="lg:col-span-2">
          {activeClassDetail ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">{activeClassDetail.class_name}</h2>
                  <p className="text-xs text-slate-500">{activeClassDetail.subject} • {activeClassDetail.academic_year}</p>
                </div>
              </div>

              {/* Add Student Form */}
              <form onSubmit={handleAddStudent} className="flex gap-2 mb-6">
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="Enter student's email (e.g. student@example.com)..."
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> Add Student
                </button>
              </form>

              {/* Roster Table */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Enrolled Students</h3>
              <div className="divide-y divide-slate-50">
                {activeClassDetail.students?.length === 0 ? (
                  <p className="text-slate-400 text-xs py-4 text-center">No students enrolled yet.</p>
                ) : (
                  activeClassDetail.students?.map((st) => (
                    <div key={st.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {st.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{st.name}</p>
                          <p className="text-[11px] text-slate-400">{st.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(st.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
              Select a class on the left to view its roster and manage enrolled students.
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display mb-4">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. CSE-A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Python Programming"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Academic Year</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026-27"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

// ── TEACHER ANALYTICS PAGE ──
export function TeacherAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.analytics()
      .then((res) => setAnalytics(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const classData = (analytics?.class_performance || []).map((c) => ({
    name: c.class_name,
    avg: c.avg_score,
    students: c.student_count
  }))

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-display">Performance Analytics</h1>
        <p className="text-slate-500 text-xs mt-1">Aggregated insights across all your quizzes and classes</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Attempts" value={analytics?.total_attempts ?? 0} icon={<CheckCircle2 size={20} />} color="blue" />
        <StatCard label="Platform Avg" value={analytics ? `${analytics.avg_score}%` : '0%'} icon={<Trophy size={20} />} color="purple" />
        <StatCard label="Pass Rate (≥60%)" value={analytics ? `${analytics.pass_rate}%` : '0%'} icon={<Sparkles size={20} />} color="green" />
        <StatCard label="Total Students" value={analytics?.total_students ?? 0} icon={<Users size={20} />} color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Class Average Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 font-display mb-4">Class Average Performance (%)</h2>
          {classData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">No class data yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Student Submissions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 font-display mb-4">Recent Submissions</h2>
          <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
            {analytics?.recent_attempts?.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">No quiz submissions recorded yet.</p>
            ) : (
              analytics?.recent_attempts?.map((a) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{a.student_name}</p>
                    <p className="text-[11px] text-slate-400">{a.quiz_title}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    a.percentage >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {a.percentage}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// ── TEACHER LEADERBOARD PAGE ──
export function TeacherLeaderboard() {
  const [rows, setRows] = useState([])
  const medals = ['🥇', '🥈', '🥉']

  useEffect(() => {
    leaderboardAPI.overall().then((res) => setRows(res.data)).catch((err) => console.error(err))
  }, [])

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Student Rankings</h1>
          <p className="text-slate-500 text-xs mt-0.5">Top performing students across all courses</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Rank', 'Student', 'Average Score', 'Quizzes Completed'].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs">No rankings data yet.</td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.student_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-base">
                    {medals[idx] || <span className="text-slate-400 text-xs font-bold">#{r.rank}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                        {r.name[0]}
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.avg_score >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {r.avg_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{r.total_quizzes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
