import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { quizAPI } from '../../services/api'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react'

export default function QuizPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()

  const [quizData, setQuizData] = useState(null)
  const [attemptId, setAttemptId] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { [question_id]: selected_option }
  const [timeLeft, setTimeLeft] = useState(0) // seconds
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const timerRef = useRef(null)

  useEffect(() => {
    // Start quiz attempt
    quizAPI.start(quizId)
      .then((res) => {
        const data = res.data
        setQuizData(data)
        setAttemptId(data.attempt_id)
        const totalSecs = (data.duration_minutes || 15) * 60
        setTimeLeft(totalSecs)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to start quiz')
      })
      .finally(() => setLoading(false))

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [quizId])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmitQuiz(true) // Auto submit on timer expiry
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [timeLeft])

  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }))
  }

  const handleSubmitQuiz = async (isAuto = false) => {
    if (submitting) return
    setSubmitting(true)
    setShowConfirm(false)

    try {
      const res = await quizAPI.submit(quizId, { answers })
      const result = res.data

      // Trigger confetti celebratory effect!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      navigate(`/student/result/${result.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-sm">Preparing your quiz questions...</p>
        </div>
      </div>
    )
  }

  if (error && !quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Quiz Unavailable</h2>
          <p className="text-slate-500 text-xs mb-6">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const questions = quizData?.questions || []
  const currentQ = questions[currentIdx]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
  const isTimeRunningLow = timeLeft < 120 // less than 2 minutes

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top sticky Quiz Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-900 font-display truncate max-w-md">
              {quizData?.title}
            </h1>
            <span className="text-xs text-slate-400 font-medium">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown Badge */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm ${
              isTimeRunningLow
                ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm shadow-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={13} />
              <span>Submit Quiz</span>
            </button>
          </div>
        </div>

        {/* Top Progress bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-purple-600 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Question Arena */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 grid lg:grid-cols-4 gap-8">
        {/* Question Panel */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs border border-purple-100">
                  Question {currentIdx + 1}
                </span>
                {answers[currentQ.id] && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    <CheckCircle2 size={13} /> Answered
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug mb-6 font-display">
                {currentQ.question_text}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options?.map((option, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx)
                  const isSelected = answers[currentQ.id] === option

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, option)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/80 text-purple-900 ring-2 ring-purple-500/20 font-semibold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {letter}
                      </div>
                      <span className="text-sm leading-relaxed">{option}</span>
                    </button>
                  )
                })}
              </div>

              {/* Bottom Nav Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((p) => Math.max(p - 1, 0))}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                {currentIdx < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((p) => Math.min(p + 1, totalQuestions - 1))}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold text-xs text-white flex items-center gap-1.5 transition-colors"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold text-xs text-white flex items-center gap-1.5 transition-colors"
                  >
                    Review & Submit <Send size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Navigation Matrix */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Questions Overview
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id]
                const isCurrent = idx === currentIdx

                let btnStyle = 'border-slate-200 text-slate-600 hover:bg-slate-50'
                if (isAnswered) {
                  btnStyle = 'border-purple-600 bg-purple-600 text-white font-bold'
                }
                if (isCurrent) {
                  btnStyle = isAnswered
                    ? 'border-purple-700 bg-purple-700 text-white ring-2 ring-purple-300 font-bold'
                    : 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-300 font-bold'
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Answered:</span>
                <span className="font-bold text-purple-600">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Remaining:</span>
                <span className="font-bold text-slate-700">{totalQuestions - answeredCount}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">Ready to Submit?</h3>
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              You have answered <span className="font-bold text-purple-600">{answeredCount}</span> of <span className="font-bold">{totalQuestions}</span> questions. Once submitted, your answers will be evaluated immediately.
            </p>

            {answeredCount < totalQuestions && (
              <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>You still have unanswered questions!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Back to Quiz
              </button>
              <button
                type="button"
                onClick={() => handleSubmitQuiz(false)}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
              >
                {submitting ? 'Evaluating...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
