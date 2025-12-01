import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function InterviewBot() {
  const [applicants, setApplicants] = useState([])
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [interviewInvite, setInterviewInvite] = useState(null)
  const [jobData, setJobData] = useState(null)
  const [aiQuestions, setAiQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [isJobSeeker, setIsJobSeeker] = useState(false)
  const messagesEndRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  // AI question bank based on job type
  const getAIQuestions = (jobTitle, jobDescription) => {
    const title = (jobTitle || '').toLowerCase()
    const desc = (jobDescription || '').toLowerCase()
    
    let questions = [
      "Tell me about your most recent project and what you learned from it.",
      "How do you handle challenges or obstacles in your work?",
      "Describe a time you had to work with a difficult team member.",
      "What are your career goals for the next 3-5 years?"
    ]
    
    if (title.includes('frontend') || title.includes('react') || title.includes('developer')) {
      questions.push(
        "Explain the component lifecycle in React.",
        "How do you optimize performance in web applications?",
        "Tell me about responsive design and mobile-first approaches.",
        "What CSS frameworks or tools have you used?"
      )
    }
    
    if (title.includes('backend') || title.includes('node') || title.includes('server')) {
      questions.push(
        "Explain REST API design principles.",
        "How do you handle database optimization?",
        "Tell me about error handling and logging in production systems.",
        "What is your experience with microservices or scalable systems?"
      )
    }
    
    if (title.includes('full') || title.includes('stack')) {
      questions.push(
        "Explain the full development lifecycle from frontend to backend.",
        "How do you manage state in a full-stack application?",
        "Tell me about your experience with databases and data modeling."
      )
    }
    
    if (title.includes('data') || title.includes('scientist')) {
      questions.push(
        "How do you approach data cleaning and preprocessing?",
        "Explain a machine learning model you've built.",
        "How do you handle missing data?"
      )
    }
    
    return questions
  }

  // load current user and shortlisted applicants
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('resumate_user') || 'null')
      setCurrentUser(u)
      const role = (u?.role || '').toLowerCase()
      const isSeeker = role === 'job seeker' || (role !== 'recruiter' && role !== 'admin')
      setIsJobSeeker(isSeeker)
      
      // Check if there's a scheduled interview invite for this user (job seeker)
      const hasInvite = location?.state?.inviteId
      
      // Allow access if: recruiter role OR job seeker with a valid invite
      if (role !== 'recruiter' && !hasInvite) {
        // non-recruiter users without invite get redirected away
        navigate('/')
        return
      }
    } catch {}

    const apps = JSON.parse(localStorage.getItem('resumate_applicants') || '[]')
    const shortlisted = apps.filter(a => a.aiShortlisted)
    setApplicants(shortlisted)

    // check if there's a scheduled interview invite passed in location state
    if (location?.state?.inviteId) {
      const invites = JSON.parse(localStorage.getItem('resumate_interview_invites') || '[]')
      const invite = invites.find(inv => inv.id === location.state.inviteId)
      if (invite) {
        setInterviewInvite(invite)
        // find the applicant
        let applicant = apps.find(a => a.id === invite.applicantId)
        
        // if applicant not found in apps, create one from invite data
        if (!applicant) {
          applicant = {
            id: invite.applicantId,
            name: invite.applicantName,
            email: invite.applicantEmail,
            status: 'interview_scheduled'
          }
        }
        
        setSelectedApplicant(applicant)
        
        // find the job data
        const jobs = JSON.parse(localStorage.getItem('resumate_jobs') || '[]')
        const job = jobs.find(j => j.id === invite.jobId)
        setJobData(job)
      }
    }
  }, [location?.state?.inviteId, navigate])

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // auto-select applicant if navigated here with state.applicantId
  useEffect(() => {
    try {
      const applicantId = location?.state?.applicantId
      if (!applicantId || !applicants || applicants.length === 0) return
      const found = applicants.find(a => a.id === applicantId)
      if (found) selectApplicant(found)
    } catch (e) {}
  }, [applicants, location])

  const selectApplicant = (app) => {
    setSelectedApplicant(app)
    setMessages([
      { id: Date.now(), sender: 'system', text: `Selected candidate: ${app.name} — ${app.email}` },
      { id: Date.now()+1, sender: 'candidate', text: `Hello, I'm ${app.name}. I'm ready for the interview.` }
    ])
    setIsInterviewActive(false)
  }

  const startInterview = () => {
    if (!selectedApplicant) return

    // Generate AI questions based on job title
    const questions = getAIQuestions(jobData?.title || '', jobData?.description || '')
    setAiQuestions(questions)
    setCurrentQuestionIndex(0)
    setAnswers([])
    setInterviewCompleted(false)
    
    setIsInterviewActive(true)
    setMessages([
      { id: Date.now(), sender: 'system', text: `Welcome to your interview for ${jobData?.title || 'the position'}!` },
      { id: Date.now() + 1, sender: 'system', text: `You will be asked ${questions.length} questions. Take your time to answer each one.` }
    ])

    // Show first question after a short delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'interviewer', 
        text: questions[0],
        isAIGenerated: true
      }])
    }, 800)
  }

  const submitInterviewReport = () => {
    // Create interview report
    try {
      const interviewsKey = 'resumate_interviews'
      const existing = JSON.parse(localStorage.getItem(interviewsKey) || '[]')
      
      // Score answers based on length and relevance (simple heuristic)
      const scoredAnswers = answers.map(ans => {
        const wordCount = ans.answer.split(/\s+/).length
        const isRelevant = wordCount >= 10 // At least 10 words
        const score = isRelevant ? 'Passed' : 'Need Improvement'
        return {
          ...ans,
          score
        }
      })
      
      const report = {
        id: Date.now().toString(),
        applicantId: selectedApplicant.id,
        applicantName: selectedApplicant.name,
        applicantEmail: selectedApplicant.email,
        intervieweeId: currentUser?.id || currentUser?.email,
        intervieweeName: currentUser?.name,
        recruiterId: interviewInvite?.recruiterId,
        recruiterName: interviewInvite?.recruiterName,
        jobId: interviewInvite?.jobId,
        jobTitle: jobData?.title || interviewInvite?.jobTitle,
        date: new Date().toISOString(),
        answers: scoredAnswers,
        totalQuestions: aiQuestions.length,
        passedQuestions: scoredAnswers.filter(a => a.score === 'Passed').length,
        status: 'completed'
      }
      
      existing.unshift(report)
      localStorage.setItem(interviewsKey, JSON.stringify(existing))

      // Update interview invite status to completed
      if (interviewInvite) {
        const invitesKey = 'resumate_interview_invites'
        const invites = JSON.parse(localStorage.getItem(invitesKey) || '[]')
        const updated = invites.map(inv => inv.id === interviewInvite.id ? { ...inv, status: 'completed', reportId: report.id } : inv)
        localStorage.setItem(invitesKey, JSON.stringify(updated))
      }

      alert('Interview submitted successfully! Your report has been sent to the recruiter.')
      navigate('/profile')
    } catch (e) {
      console.error('Error submitting interview:', e)
      alert('Error submitting interview. Please try again.')
    }
  }

  const simulateCandidateReply = (question, applicant) => {
    // lightweight heuristic: if question contains keywords from resumeText, return longer reply
    const text = (applicant.resumeText || '').toLowerCase()
    const q = question.toLowerCase()
    let score = 0
    for (const word of q.split(/[^a-z0-9]+/).filter(Boolean)) {
      if (text.includes(word) && word.length > 3) score += 1
    }
    if (score >= 2) {
      return `In my experience ${applicant.name} I worked on similar tasks: ${applicant.resumeText.slice(0, 140)}...`
    }
    if (q.includes('challenge') || q.includes('problem')) return 'I faced a challenge where I had to... (describe approach and result)'
    return "That's a good question — I would approach it by first understanding requirements, then iterating on a prototype and validating with tests."
  }

  const sendQuestion = (e) => {
    e.preventDefault()
    if (!isInterviewActive || !input.trim() || !selectedApplicant) return

    const answer = input.trim()
    // add applicant's answer
    setMessages(prev => [...prev, { id: Date.now(), sender: 'candidate', text: answer }])
    
    // store the answer
    setAnswers(prev => [...prev, {
      question: aiQuestions[currentQuestionIndex],
      answer: answer,
      timestamp: new Date().toISOString()
    }])
    
    setInput('')

    // Check if there are more questions
    if (currentQuestionIndex < aiQuestions.length - 1) {
      // Show next question after a short delay
      setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'interviewer', 
          text: aiQuestions[nextIndex],
          isAIGenerated: true
        }])
      }, 600)
    } else {
      // All questions answered - interview complete
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'system', 
          text: 'Thank you for completing the interview! Your responses have been recorded.'
        }])
        setIsInterviewActive(false)
        setInterviewCompleted(true)
      }, 600)
    }
  }

  const clearSelection = () => {
    setSelectedApplicant(null)
    setMessages([])
    setIsInterviewActive(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {isJobSeeker && interviewInvite ? (
          // Job Seeker Interview Mode
          <div className="bg-gray-800 rounded-lg flex flex-col h-[700px]">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-cyan-600 to-cyan-800">
              <h1 className="text-2xl font-bold mb-1">Interview for {interviewInvite.jobTitle}</h1>
              <p className="text-cyan-100">Conducted by {interviewInvite.recruiterName}</p>
              {isInterviewActive && (
                <div className="mt-3 text-sm text-cyan-200">
                  Question {currentQuestionIndex + 1} of {aiQuestions.length}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!isInterviewActive && !interviewCompleted && (
                <div className="text-center py-12">
                  <div className="text-cyan-300 text-lg mb-4">Ready to begin your interview?</div>
                  <p className="text-gray-400 mb-6">You will be asked {getAIQuestions(jobData?.title || '', jobData?.description || '').length} questions.</p>
                  <button
                    onClick={startInterview}
                    className="px-8 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 text-lg"
                  >
                    Start Interview
                  </button>
                </div>
              )}

              {(isInterviewActive || interviewCompleted) && messages.map(message => (
                <div key={message.id} className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-lg ${
                    message.sender === 'interviewer' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : message.sender === 'candidate' 
                      ? 'bg-cyan-500 text-gray-900 rounded-bl-none' 
                      : 'bg-gray-700 text-gray-100 w-full text-center'
                  }`}>
                    {message.text}
                  </div>
                </div>
              ))}

              {interviewCompleted && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-600/30 rounded-lg text-center">
                  <div className="text-green-400 text-lg font-semibold mb-2">Interview Completed!</div>
                  <p className="text-gray-300 text-sm">Your answers are being reviewed by the recruiter.</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {isInterviewActive && !interviewCompleted && (
              <form onSubmit={sendQuestion} className="p-4 border-t border-gray-700 bg-gray-900">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your answer here..."
                    className="flex-1 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-700 flex gap-3 justify-between bg-gray-900">
              {interviewCompleted && (
                <>
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    Back to Profile
                  </button>
                  <button
                    onClick={submitInterviewReport}
                    className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                  >
                    Submit Report to Recruiter
                  </button>
                </>
              )}
              {!isInterviewActive && !interviewCompleted && (
                <button
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          // Recruiter View (unchanged for backward compatibility)
          <div className="grid md:grid-cols-3 gap-8">
            {/* Sidebar - Applicants list */}
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-cyan-500 text-gray-900 px-3 py-2 rounded-full font-bold">RC</div>
                <div>
                  <div className="text-cyan-300 font-semibold">Interview Conductor</div>
                  <div className="text-gray-400 text-sm">Conduct interviews for shortlisted candidates</div>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-3">Shortlisted Candidates</h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {applicants.length === 0 && (
                  <div className="text-sm text-gray-400">No shortlisted candidates available.</div>
                )}
                {applicants.map(app => (
                  <div key={app.id} className={`p-3 rounded border ${selectedApplicant?.id === app.id ? 'border-cyan-500 bg-gray-900' : 'border-gray-700 bg-gray-900'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{app.name}</div>
                        <div className="text-xs text-gray-400">{app.email}</div>
                        <div className="text-xs text-gray-500 mt-1">Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}</div>
                      </div>
                      <div className="text-sm text-gray-300">{app.status || 'shortlisted'}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => selectApplicant(app)} className="px-3 py-1 bg-cyan-500 text-gray-900 rounded text-sm">Select</button>
                      <button onClick={() => {
                        selectApplicant(app)
                      }} className="px-3 py-1 bg-gray-700 rounded text-sm">Preview</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Interview Area */}
            <div className="md:col-span-2 bg-gray-800 rounded-lg flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Conductor</h3>
                    <p className="text-gray-400 text-sm">{selectedApplicant ? `${selectedApplicant.name} — ${selectedApplicant.email}` : 'Select a candidate to begin'}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${isInterviewActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                    {isInterviewActive ? 'Live' : 'Idle'}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedApplicant ? (
                  messages.map(message => (
                    <div key={message.id} className={`flex ${message.sender === 'interviewer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-lg ${message.sender === 'interviewer' ? 'bg-cyan-500 text-gray-900' : message.sender === 'candidate' ? 'bg-gray-700 text-gray-100' : 'bg-gray-600 text-gray-100'}`}>
                        {message.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-400">No candidate selected. Choose one from the left to begin.</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendQuestion} className="p-4 border-t border-gray-700">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isInterviewActive ? "Type your question to the candidate..." : "Start interview to enable input..."}
                    disabled={!isInterviewActive || !selectedApplicant}
                    className="flex-1 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                  />
                  <button type="submit" disabled={!isInterviewActive || !selectedApplicant || !input.trim()} className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50">Send</button>
                </div>
              </form>

              <div className="p-4 border-t border-gray-700 flex gap-2">
                <button onClick={startInterview} className="px-4 py-2 bg-cyan-500 text-gray-900 rounded font-semibold hover:bg-cyan-600">Start Interview</button>
                <button onClick={() => clearSelection()} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">Clear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}