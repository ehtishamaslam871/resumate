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
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      {/* Animated background */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {isJobSeeker && interviewInvite ? (
          // Job Seeker Interview Mode
          <div className="card-glass rounded-2xl flex flex-col h-[700px] overflow-hidden border border-neon-cyan/20">
            {/* Header */}
            <div className="p-8 border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10">
              <h1 className="text-3xl font-bold mb-2 text-gray-100">Interview for {interviewInvite.jobTitle}</h1>
              <p className="text-neon-cyan font-semibold">Conducted by {interviewInvite.recruiterName}</p>
              {isInterviewActive && (
                <div className="mt-4 inline-block px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/50 rounded-lg text-sm text-neon-cyan font-medium">
                  Question {currentQuestionIndex + 1} of {aiQuestions.length}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {!isInterviewActive && !interviewCompleted && (
                <div className="text-center py-16">
                  <div className="text-neon-cyan text-xl font-bold mb-4">Ready to begin your interview?</div>
                  <p className="text-gray-400 mb-8 text-lg">You will be asked {getAIQuestions(jobData?.title || '', jobData?.description || '').length} questions. Take your time to provide thoughtful answers.</p>
                  <button
                    onClick={startInterview}
                    className="btn-primary px-8 py-3 text-lg font-bold shadow-lg shadow-neon-cyan/50"
                  >
                    Start Interview
                  </button>
                </div>
              )}

              {(isInterviewActive || interviewCompleted) && messages.map(message => (
                <div key={message.id} className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-xl ${
                    message.sender === 'interviewer' 
                      ? 'bg-neon-blue/20 border border-neon-blue/50 text-gray-100 rounded-br-none' 
                      : message.sender === 'candidate' 
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-gray-100 rounded-bl-none' 
                      : 'bg-dark-800/50 border border-dark-600 text-gray-300 w-full text-center'
                  }`}>
                    {message.text}
                  </div>
                </div>
              ))}

              {interviewCompleted && (
                <div className="mt-6 p-6 bg-neon-green/10 border border-neon-green/50 rounded-xl text-center">
                  <div className="text-neon-green text-lg font-bold mb-2">✓ Interview Completed!</div>
                  <p className="text-gray-300">Your answers are being reviewed by the recruiter.</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {isInterviewActive && !interviewCompleted && (
              <form onSubmit={sendQuestion} className="p-6 border-t border-neon-cyan/20 bg-dark-900/50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your answer here..."
                    className="input-modern flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="btn-primary px-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Footer Actions */}
            <div className="p-6 border-t border-neon-cyan/20 flex gap-3 justify-between bg-dark-900/50">
              {interviewCompleted && (
                <>
                  <button
                    onClick={() => navigate('/profile')}
                    className="btn-secondary px-6 font-bold"
                  >
                    Back to Profile
                  </button>
                  <button
                    onClick={submitInterviewReport}
                    className="px-6 py-2 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 rounded-lg font-bold hover:shadow-lg hover:shadow-neon-green/50 transition"
                  >
                    Submit Report
                  </button>
                </>
              )}
              {!isInterviewActive && !interviewCompleted && (
                <button
                  onClick={() => navigate('/profile')}
                  className="btn-secondary px-6 font-bold"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          // Recruiter View
          <div className="grid md:grid-cols-3 gap-8">
            {/* Sidebar - Applicants list */}
            <div className="card-glass rounded-2xl p-8 border border-neon-cyan/20 md:col-span-1 h-fit">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-bold text-lg">RC</div>
                <div>
                  <div className="font-bold text-neon-cyan">Interview Conductor</div>
                  <div className="text-gray-400 text-sm">Manage candidate interviews</div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-6 text-gray-100">Shortlisted Candidates</h3>
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {applicants.length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-8">No shortlisted candidates available.</div>
                )}
                {applicants.map(app => (
                  <div key={app.id} className={`p-4 rounded-lg border transition-all ${selectedApplicant?.id === app.id ? 'bg-neon-cyan/10 border-neon-cyan/50' : 'bg-dark-800/50 border-dark-600 hover:border-neon-cyan/30'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-100">{app.name}</div>
                        <div className="text-xs text-neon-cyan">{app.email}</div>
                        <div className="text-xs text-gray-500 mt-1">Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}</div>
                      </div>
                      <div className="text-xs font-semibold bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded">{app.status || 'Shortlisted'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => selectApplicant(app)} className="flex-1 btn-primary text-xs py-2 font-bold">Select</button>
                      <button className="flex-1 btn-secondary text-xs py-2 font-bold">Preview</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Interview Area */}
            <div className="card-glass rounded-2xl flex flex-col h-[700px] overflow-hidden border border-neon-cyan/20 md:col-span-2">
              <div className="p-6 border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-100">Interview Conductor</h3>
                    <p className="text-neon-cyan font-semibold mt-1">{selectedApplicant ? `${selectedApplicant.name} — ${selectedApplicant.email}` : 'Select a candidate to begin'}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${isInterviewActive ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'bg-dark-700/50 text-gray-400 border border-dark-600'}`}>
                    {isInterviewActive ? '● Live' : '○ Idle'}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {selectedApplicant ? (
                  messages.length > 0 ? (
                    messages.map(message => (
                      <div key={message.id} className={`flex ${message.sender === 'interviewer' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-xl ${message.sender === 'interviewer' ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-gray-100' : message.sender === 'candidate' ? 'bg-neon-blue/20 border border-neon-blue/50 text-gray-100' : 'bg-dark-800/50 border border-dark-600 text-gray-300'}`}>
                        {message.text}
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-16">No messages yet. Start the interview to begin.</div>
                  )
                ) : (
                  <div className="text-center text-gray-400 text-lg py-16">Select a candidate from the left to begin.</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendQuestion} className="p-6 border-t border-neon-cyan/20 bg-dark-900/50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isInterviewActive ? "Type your question..." : "Start interview to enable input..."}
                    disabled={!isInterviewActive || !selectedApplicant}
                    className="input-modern flex-1 disabled:opacity-50"
                  />
                  <button type="submit" disabled={!isInterviewActive || !selectedApplicant || !input.trim()} className="btn-primary px-6 font-bold disabled:opacity-50">Send</button>
                </div>
              </form>

              <div className="p-6 border-t border-neon-cyan/20 flex gap-3 bg-dark-900/50">
                <button onClick={startInterview} className="btn-primary flex-1 font-bold">Start Interview</button>
                <button onClick={() => clearSelection()} className="btn-secondary flex-1 font-bold">Clear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}