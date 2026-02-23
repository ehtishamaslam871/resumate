import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

export default function InterviewBot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [chatError, setChatError] = useState(null)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  // Load current user
  useEffect(() => {
    try {
      const u = JSON.parse(
        localStorage.getItem('resumate_user') ||
        localStorage.getItem('user') ||
        'null'
      )
      if (!u) {
        navigate('/auth')
        return
      }
      setCurrentUser(u)

      // Welcome message
      setMessages([{
        id: Date.now(),
        sender: 'ai',
        text: `Hello ${u?.name || 'there'}! I'm your AI Career Assistant. I can help you with:\n\n• Resume tips and improvements\n• Interview preparation\n• Career advice and guidance\n• Job search strategies\n• Skill development recommendations\n\nHow can I help you today?`
      }])
    } catch {
      navigate('/auth')
    }
  }, [navigate])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setChatError(null)

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: userMessage
    }])

    setLoading(true)

    try {
      // Call backend AI chat endpoint
      const response = await api.chat.sendMessage(
        userMessage,
        'career_assistant',
        null
      )

      if (response.response) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'ai',
          text: response.response,
          model: response.model,
          inferenceTime: response.inferenceTime
        }])
      } else {
        throw new Error('No response from AI')
      }
    } catch (err) {
      console.error('Chat error:', err)
      // Provide fallback response when AI is unavailable
      const fallbackResponse = getFallbackResponse(userMessage)
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: fallbackResponse,
        isFallback: true
      }])
      setChatError('AI model is currently unavailable. Showing cached responses.')
    } finally {
      setLoading(false)
    }
  }

  // Fallback responses when AI is unavailable
  const getFallbackResponse = (message) => {
    const msg = message.toLowerCase()
    if (msg.includes('resume') || msg.includes('cv')) {
      return "Here are some resume tips:\n\n• Keep it concise — ideally 1-2 pages\n• Use action verbs (built, designed, led, implemented)\n• Quantify achievements with numbers and metrics\n• Tailor your resume to each job description\n• Include a professional summary at the top\n• List relevant skills prominently\n• Proofread carefully for errors\n\nUpload your resume on ResuMate for an AI-powered analysis!"
    }
    if (msg.includes('interview')) {
      return "Interview preparation tips:\n\n• Research the company and role thoroughly\n• Practice the STAR method (Situation, Task, Action, Result)\n• Prepare questions to ask the interviewer\n• Review common behavioral questions\n• Practice coding challenges for technical roles\n• Dress appropriately and arrive early\n• Follow up with a thank-you note\n\nTry our AI Interview feature to practice with AI-generated questions!"
    }
    if (msg.includes('skill') || msg.includes('learn')) {
      return "Skill development advice:\n\n• Identify in-demand skills in your target industry\n• Take online courses (Coursera, Udemy, freeCodeCamp)\n• Build projects to demonstrate your skills\n• Contribute to open-source projects\n• Get certifications relevant to your field\n• Practice regularly and track your progress\n• Network and learn from industry professionals"
    }
    if (msg.includes('job') || msg.includes('career') || msg.includes('search')) {
      return "Job search strategies:\n\n• Optimize your LinkedIn profile\n• Network actively — attend events and connect online\n• Apply to jobs that match 60-70% of requirements\n• Customize your resume for each application\n• Follow up after applications\n• Consider informational interviews\n• Use job boards and company career pages\n\nCheck our Jobs section for AI-matched recommendations!"
    }
    return "I'm here to help with career advice, resume tips, interview preparation, and job search strategies. Feel free to ask me anything about your career journey!\n\nNote: The AI model is currently loading. Please try again in a moment for more detailed, personalized responses."
  }

  const quickPrompts = [
    "How can I improve my resume?",
    "Help me prepare for a technical interview",
    "What skills are in demand for software developers?",
    "Tips for salary negotiation",
    "How to write a cover letter"
  ]

  const handleQuickPrompt = (prompt) => {
    setInput(prompt)
  }

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      sender: 'ai',
      text: `Chat cleared! How can I help you today, ${currentUser?.name || 'there'}?`
    }])
    setChatError(null)
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      {/* Background decorations */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-dark-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">AI Career Assistant</h1>
              <p className="text-gray-400">AI Career Assistant — Ask anything about careers, resumes, and interviews</p>
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-4 py-2 bg-dark-800/50 border border-neon-cyan/20 rounded-lg text-sm text-gray-300 hover:border-neon-cyan/50 hover:text-neon-cyan transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="card-glass rounded-2xl flex flex-col h-[600px] overflow-hidden border border-neon-cyan/20">
          {/* Chat Header */}
          <div className="p-4 border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse"></div>
              <span className="text-sm text-gray-300 font-medium">AI Assistant Online</span>
            </div>
            <button
              onClick={clearChat}
              className="text-gray-400 hover:text-neon-cyan transition flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Clear Chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                    message.sender === 'user'
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50'
                      : 'bg-neon-purple/20 border border-neon-purple/50'
                  }`}>
                    {message.sender === 'user'
                      ? <svg className="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      : <svg className="w-4 h-4 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    }
                  </div>
                  {/* Message bubble */}
                  <div className={`p-4 rounded-xl ${
                    message.sender === 'user'
                      ? 'bg-neon-cyan/20 border border-neon-cyan/30 text-gray-100'
                      : 'bg-dark-800/50 border border-dark-600 text-gray-200'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
                    {message.inferenceTime && (
                      <div className="mt-2 text-xs text-gray-500">
                        Response time: {message.inferenceTime.toFixed(1)}s
                      </div>
                    )}
                    {message.isFallback && (
                      <div className="mt-2 text-xs text-yellow-500">
                        Cached response — AI model loading
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-600">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Thinking...
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {chatError && (
            <div className="px-6 py-2 bg-yellow-500/10 border-t border-yellow-500/30 text-yellow-400 text-xs text-center">
              {chatError}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-4 border-t border-neon-cyan/20 bg-dark-900/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about careers, resumes, interviews..."
                disabled={loading}
                className="input-modern flex-1 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-primary px-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}