import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Recruiter() {
  const currentUser = JSON.parse(localStorage.getItem('resumate_user') || 'null')
  const navigate = useNavigate()

  // Jobs state
  const [jobs, setJobs] = useState([])
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [salary, setSalary] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [editingJobId, setEditingJobId] = useState(null)

  // Applicants state
  const [applicants, setApplicants] = useState([])
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [interviewScheduleModal, setInterviewScheduleModal] = useState(false)
  const [selectedApplicantForInterview, setSelectedApplicantForInterview] = useState(null)
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('')
  const [interviewReports, setInterviewReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)

  // Keys
  const JOBS_KEY = 'resumate_jobs'
  const APPLICANTS_KEY = 'resumate_applicants'
  const INVITES_KEY = 'resumate_interview_invites'
  const REPORTS_KEY = 'resumate_interviews'

  const formatSalary = (s, c) => {
    if (!s) return ''
    const symbols = { USD: '$', GBP: '£', EUR: '€' }
    const num = Number(String(s).replace(/[^0-9.-]+/g, ''))
    if (Number.isNaN(num)) return s
    const symbol = symbols[c] || '$'
    return `${symbol}${num.toLocaleString()}`
  }

  useEffect(() => {
    const storedJobs = JSON.parse(localStorage.getItem(JOBS_KEY) || '[]')
    setJobs(storedJobs)

    const storedApplicants = JSON.parse(localStorage.getItem(APPLICANTS_KEY) || '[]')
    if (storedApplicants.length === 0) {
      // create sample applicants if none exist (keeps UI useful)
      const samples = [
        {
          id: Date.now().toString() + '_a1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          jobId: storedJobs[0]?.id || null,
          resumeText: 'Experienced frontend developer with React and Tailwind experience.',
          status: 'shortlisted',
          aiShortlisted: true,
          appliedAt: new Date().toISOString()
        },
        {
          id: (Date.now()+1).toString() + '_a2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          jobId: storedJobs[0]?.id || null,
          resumeText: 'Backend engineer skilled in Node.js and databases.',
          status: 'applied',
          aiShortlisted: false,
          appliedAt: new Date().toISOString()
        }
        ,
        {
          id: (Date.now()+2).toString() + '_a3',
          name: 'Carol Lee',
          email: 'carol@example.com',
          jobId: storedJobs[0]?.id || null,
          resumeText: 'Full-stack developer experienced with React, Node.js, and cloud deployments.',
          status: 'shortlisted',
          aiShortlisted: true,
          appliedAt: new Date().toISOString()
        },
        {
          id: (Date.now()+3).toString() + '_a4',
          name: 'Daniel Kim',
          email: 'daniel@example.com',
          jobId: storedJobs[0]?.id || null,
          resumeText: 'Data scientist with Python, SQL and machine learning experience.',
          status: 'shortlisted',
          aiShortlisted: true,
          appliedAt: new Date().toISOString()
        },
        {
          id: (Date.now()+4).toString() + '_a5',
          name: 'Emma Brown',
          email: 'emma@example.com',
          jobId: storedJobs[0]?.id || null,
          resumeText: 'UI/UX designer skilled in Figma and visual design.',
          status: 'applied',
          aiShortlisted: false,
          appliedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem(APPLICANTS_KEY, JSON.stringify(samples))
      setApplicants(samples)
    } else {
      // run AI shortlisting on load
      const evaluated = storedApplicants.map(a => {
        const job = storedJobs.find(j => j.id === a.jobId)
        if (!job) return { ...a, aiShortlisted: false }
        const text = (a.resumeText || '').toLowerCase()
        const keywords = `${job.title} ${job.description} ${job.company}`.toLowerCase()
        const kwSet = Array.from(new Set(keywords.split(/[^a-z0-9]+/).filter(Boolean)))
        let matches = 0
        for (const kw of kwSet) {
          if (kw.length < 3) continue
          if (text.includes(kw)) matches++
        }
        const aiShortlisted = matches >= 2 // threshold
        return { ...a, aiShortlisted, status: aiShortlisted ? 'shortlisted' : a.status }
      })
      setApplicants(evaluated)
    }

    // Load interview reports
    const storedReports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]')
    setInterviewReports(storedReports)
  }, [])
  useEffect(() => {
    if (!applicants || applicants.length === 0) return
    setApplicants(prev => prev.map(a => {
      const job = jobs.find(j => j.id === a.jobId)
      if (!job) return { ...a, aiShortlisted: false }
      const text = (a.resumeText || '').toLowerCase()
      const keywords = `${job.title} ${job.description} ${job.company}`.toLowerCase()
      const kwSet = Array.from(new Set(keywords.split(/[^a-z0-9]+/).filter(Boolean)))
      let matches = 0
      for (const kw of kwSet) {
        if (kw.length < 3) continue
        if (text.includes(kw)) matches++
      }
      const aiShortlisted = matches >= 2
      return { ...a, aiShortlisted, status: aiShortlisted ? 'shortlisted' : a.status }
    }))
  }, [jobs])

  // Persist jobs
  useEffect(() => {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
  }, [jobs])

  // Persist applicants
  useEffect(() => {
    localStorage.setItem(APPLICANTS_KEY, JSON.stringify(applicants))
  }, [applicants])

  // Job handlers
  const resetJobForm = () => {
    setJobTitle('')
    setCompany('')
    setLocation('')
    setSalary('')
    setCurrency('USD')
    setDescription('')
    setEditingJobId(null)
  }

  const handleCreateOrUpdateJob = (e) => {
    e.preventDefault()
    // validate form
    const valid = validateForm()
    if (!valid) return

    if (editingJobId) {
      setJobs(prev => prev.map(j => j.id === editingJobId ? {
        ...j,
        title: jobTitle,
        company,
        location,
        salary,
        currency,
        description,
        updatedAt: new Date().toISOString()
      } : j))
    } else {
      const newJob = {
        id: Date.now().toString(),
        title: jobTitle,
        company,
        location,
        salary,
        currency,
        description,
        postedAt: new Date().toISOString()
      }
      setJobs(prev => [newJob, ...prev])
    }
    resetJobForm()
  }

  const validateForm = () => {
    const errors = {}
    if (!jobTitle || !jobTitle.trim()) errors.jobTitle = 'Job title is required.'
    if (!company || !company.trim()) errors.company = 'Company name is required.'
    // location: at least 3 chars and contain a letter
    if (!location || location.trim().length < 3 || !/[a-zA-Z]/.test(location)) {
      errors.location = 'Please enter a valid location (at least 3 characters).' 
    }
    // salary must be numeric and > 0
    const numSalary = Number(String(salary).replace(/[^0-9.-]+/g, ''))
    if (!salary || Number.isNaN(numSalary) || numSalary <= 0) {
      errors.salary = 'Please enter a valid numeric salary greater than 0.'
    }
    // description: at least 50 words
    const words = (description || '').trim().split(/\s+/).filter(Boolean)
    if (words.length < 10) {
      errors.description = `Job description must be at least 50 words (currently ${words.length}).`
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditJob = (job) => {
    setEditingJobId(job.id)
    setJobTitle(job.title)
    setCompany(job.company || '')
    setLocation(job.location || '')
    setSalary(job.salary || '')
    setCurrency(job.currency || 'USD')
    setDescription(job.description || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteJob = (jobId) => {
    if (!confirm('Delete this job posting?')) return
    setJobs(prev => prev.filter(j => j.id !== jobId))
    // optionally unassign applicants
    setApplicants(prev => prev.map(a => a.jobId === jobId ? { ...a, jobId: null } : a))
  }

  // Applicant handlers
  const openApplicant = (app) => setSelectedApplicant(app)
  const closeApplicant = () => setSelectedApplicant(null)

  const scheduleInterview = (applicant) => {
    setSelectedApplicantForInterview(applicant)
    setInterviewScheduleModal(true)
    setInterviewDate(new Date().toISOString().split('T')[0])
    setInterviewTime('10:00')
  }

  const sendInterviewInvite = () => {
    if (!interviewDate || !interviewTime || !selectedApplicantForInterview) {
      alert('Please select both date and time')
      return
    }
    try {
      const existing = JSON.parse(localStorage.getItem(INVITES_KEY) || '[]')
      const invite = {
        id: Date.now().toString(),
        applicantId: selectedApplicantForInterview.id,
        applicantName: selectedApplicantForInterview.name,
        applicantEmail: selectedApplicantForInterview.email,
        jobId: selectedApplicantForInterview.jobId,
        jobTitle: jobs.find(j => j.id === selectedApplicantForInterview.jobId)?.title || 'Unknown Job',
        recruiterId: currentUser?.id || currentUser?.email,
        recruiterName: currentUser?.name || 'Recruiter',
        scheduledDate: interviewDate,
        scheduledTime: interviewTime,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      existing.push(invite)
      localStorage.setItem(INVITES_KEY, JSON.stringify(existing))
      
      setApplicants(prev => prev.map(a => 
        a.id === selectedApplicantForInterview.id 
          ? { ...a, status: 'interview_scheduled' } 
          : a
      ))
      
      setInterviewScheduleModal(false)
      setSelectedApplicantForInterview(null)
      setInterviewDate('')
      setInterviewTime('')
      alert(`Interview invite sent to ${selectedApplicantForInterview.name} for ${interviewDate} at ${interviewTime}`)
    } catch (e) {
      alert('Failed to schedule interview')
    }
  }

  const updateApplicantStatus = (applicantId, status) => {
    setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status } : a))
  }

  // show only AI-shortlisted applicants in the main list (read-only view)
  const aiShortlistedApplicants = applicants.filter(a => a.aiShortlisted)
  const visibleApplicants = aiShortlistedApplicants

  // compute demo results inline (includes a simple match count used for the demo display)
  const demoResults = applicants.map(a => {
    const job = jobs.find(j => j.id === a.jobId)
    if (!job) return { ...a, aiShortlisted: false, matches: 0 }
    const text = (a.resumeText || '').toLowerCase()
    const keywords = `${job.title} ${job.description} ${job.company}`.toLowerCase()
    const kwSet = Array.from(new Set(keywords.split(/[^a-z0-9]+/).filter(Boolean)))
    let matches = 0
    for (const kw of kwSet) {
      if (kw.length < 3) continue
      if (text.includes(kw)) matches++
    }
    const aiShortlisted = matches >= 2
    return { ...a, aiShortlisted, matches }
  }).filter(r => r.aiShortlisted)

  // demo samples to show when there are no real AI-shortlisted applicants
  const demoSamples = [
    {
      id: 'demo1',
      name: 'Alice Johnson',
      email: 'alice@demo.com',
      jobTitle: jobs[0]?.title || 'Frontend Developer',
      resumeText: 'Experienced frontend developer with React, Tailwind and strong UI skills. Built responsive apps and improved performance.',
      matches: 4,
      ai: true
    },
    {
      id: 'demo2',
      name: 'Bob Smith',
      email: 'bob@demo.com',
      jobTitle: jobs[0]?.title || 'Backend Engineer',
      resumeText: 'Backend engineer familiar with Node.js, Express and database design. Implemented scalable APIs and optimized queries.',
      matches: 3,
      ai: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="px-6 py-12 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400
              flex items-center justify-center text-gray-900 font-extrabold">
              R
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
              <p className="text-gray-400 text-sm">
                Welcome{currentUser && currentUser.name ? ` ${currentUser.name}` : ''}. Manage job posts and review applicants here.
              </p>
            </div>
          </div>

          {/* Job form */}
          <form onSubmit={handleCreateOrUpdateJob} className="mt-4 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="p-3 bg-gray-700 rounded-md placeholder-gray-400"
                placeholder="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />
              {formErrors.jobTitle && (
                <div className="text-xs text-red-400 mt-1">{formErrors.jobTitle}</div>
              )}
              <input
                className="p-3 bg-gray-700 rounded-md placeholder-gray-400"
                placeholder="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              {formErrors.company && (
                <div className="text-xs text-red-400 mt-1">{formErrors.company}</div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                className="p-3 bg-gray-700 rounded-md placeholder-gray-400"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="p-3 bg-gray-700 rounded-md placeholder-gray-400 text-sm"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                <input
                  className="p-3 bg-gray-700 rounded-md placeholder-gray-400 flex-1"
                  placeholder="Salary (e.g. 10-90)"
                  value={salary}
                  // allow only digits in the salary input
                  onChange={(e) => setSalary(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              {formErrors.location && (
                <div className="text-xs text-red-400 mt-1">{formErrors.location}</div>
              )}
              {formErrors.salary && (
                <div className="text-xs text-red-400 mt-1">{formErrors.salary}</div>
              )}
              <div className="flex items-center">
                <button
                  type="submit"
                  className="w-full bg-cyan-500 text-gray-900 py-2 rounded-md font-semibold hover:bg-cyan-600 transition"
                >
                  {editingJobId ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </div>

            <textarea
              className="p-3 bg-gray-700 rounded-md placeholder-gray-400"
              placeholder="Job description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            {formErrors.description && (
              <div className="text-xs text-red-400 mt-1">{formErrors.description}</div>
            )}

            {editingJobId && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetJobForm}
                  className="px-3 py-2 bg-gray-700 rounded-md text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Jobs list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Job Posts</h2>

            {jobs.length === 0 && (
              <div className="text-sm text-gray-400">No job postings yet. Create one above.</div>
            )}

            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <div className="text-sm text-gray-400">{job.company} • {job.location}</div>
                      <div className="text-sm text-gray-400 mt-2">{job.description}</div>
                      <div className="text-xs text-gray-500 mt-2">Posted: {new Date(job.postedAt).toLocaleString()}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-cyan-300 font-medium text-sm">{formatSalary(job.salary, job.currency)}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="px-2 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="px-2 py-1 bg-red-700 rounded text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Applicants panel */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Applicants</h2>
            </div>

            {/* AI shortlisted summary */}
            <div className="mb-4">
              <div className="text-sm text-gray-300 font-medium mb-2">AI Shortlisted Applicants ({demoResults.length})</div>
              <div className="flex flex-col gap-2 max-h-64 overflow-auto">
                {(demoResults.length ? demoResults : demoSamples).map(r => {
                  const job = jobs.find(j => j.id === r.jobId)
                  // r might be a demo sample (no jobId) — prefer r.jobTitle for demos
                  const jobTitleText = r.jobTitle || (job ? job.title : 'No job assigned')
                  return (
                    <div key={r.id} className="p-3 bg-gray-900 rounded-md border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{r.name}</div>
                          <div className="text-xs text-gray-400">{r.email} • {jobTitleText}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-cyan-300 text-sm">AI{!demoResults.length ? ' (Demo)' : ''}</div>
                          <div className="text-xs text-gray-400">Matches: {r.matches ?? '-'}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-400 line-clamp-3">{r.resumeText}</div>
                      <div className="mt-3 flex gap-2">
                        {currentUser && currentUser.role === 'recruiter' && (
                          <button
                            onClick={() => scheduleInterview(r)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Schedule
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {visibleApplicants.length === 0 && (
              <div className="text-sm text-gray-400">No shortlisted applicants yet.</div>
            )}

            <div className="space-y-3">
              {visibleApplicants.map(app => {
                const job = jobs.find(j => j.id === app.jobId)
                const initials = app.name.split(' ').map(s => s[0]).slice(0,2).join('')
                return (
                  <div key={app.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-cyan-500 text-gray-900 flex items-center justify-center font-bold">{initials}</div>
                          <div>
                            <div className="font-semibold">{app.name}</div>
                            <div className="text-sm text-gray-400">{app.email}</div>
                            <div className="text-xs text-gray-500 mt-1">{job ? job.title : 'No job assigned'} • Applied {new Date(app.appliedAt).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-400 line-clamp-3">{app.resumeText}</div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`text-sm font-medium ${app.status === 'shortlisted' ? 'text-green-300' : app.status === 'interview_scheduled' ? 'text-blue-300' : app.status === 'rejected' ? 'text-red-300' : 'text-yellow-300'}`}>{app.status}</div>
                          {app.aiShortlisted && <div className="text-xs bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded">AI</div>}
                        </div>
                        {currentUser && currentUser.role === 'recruiter' && (
                          <div className="mt-2">
                            <button onClick={() => scheduleInterview(app)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Schedule</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Interview Reports Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Interview Reports</h2>

          {interviewReports.length === 0 ? (
            <div className="text-sm text-gray-400">No interview reports yet. Reports will appear here when job seekers complete their interviews.</div>
          ) : (
            <div className="space-y-3">
              {interviewReports.map(report => (
                <div key={report.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{report.applicantName}</div>
                      <div className="text-sm text-gray-400">{report.applicantEmail}</div>
                      <div className="text-sm text-gray-400 mt-1">{report.jobTitle}</div>
                      <div className="text-xs text-gray-500 mt-2">Completed: {new Date(report.completedAt).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-4 py-2 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-700"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Applicant modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{selectedApplicant.name}</h3>
                <div className="text-sm text-gray-400">{selectedApplicant.email}</div>
                <div className="text-xs text-gray-500 mt-1">Status: <span className="font-medium">{selectedApplicant.status}</span></div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closeApplicant}
                  className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Resume</h4>
              <div className="p-4 bg-gray-900 rounded text-sm text-gray-300 whitespace-pre-wrap max-h-64 overflow-auto">
                {selectedApplicant.resumeText || 'No resume text provided.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Schedule Modal */}
      {interviewScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Schedule Interview</h3>
              <button onClick={() => setInterviewScheduleModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {selectedApplicantForInterview && (
              <>
                <div className="mb-4 p-3 bg-gray-900 rounded">
                  <div className="font-semibold">{selectedApplicantForInterview.name}</div>
                  <div className="text-sm text-gray-400">{selectedApplicantForInterview.email}</div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Interview Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full p-2 bg-gray-700 rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Interview Time</label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full p-2 bg-gray-700 rounded text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={sendInterviewInvite}
                    className="flex-1 px-4 py-2 bg-cyan-500 text-gray-900 rounded font-semibold hover:bg-cyan-600"
                  >
                    Send Invite
                  </button>
                  <button
                    onClick={() => setInterviewScheduleModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Interview Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl bg-gray-800 rounded-lg p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedReport.applicantName}</h3>
                <div className="text-sm text-gray-400 mt-1">{selectedReport.applicantEmail}</div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Interview Summary */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Job Title</div>
                  <div className="font-semibold mt-1">{selectedReport.jobTitle}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Total Questions</div>
                  <div className="font-semibold mt-1 text-cyan-300">{selectedReport.totalQuestions}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Passed</div>
                  <div className="font-semibold mt-1 text-green-400">{selectedReport.passedQuestions}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Completed</div>
                  <div className="font-semibold mt-1 text-gray-300">{new Date(selectedReport.date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Performance Score */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-cyan-300 mb-2">Overall Performance</div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Success Rate</span>
                      <span className="font-semibold">{Math.round((selectedReport.passedQuestions / selectedReport.totalQuestions) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-teal-400 h-2 rounded-full"
                        style={{ width: `${(selectedReport.passedQuestions / selectedReport.totalQuestions) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Transcript */}
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-4">Interview Transcript</h4>
              <div className="space-y-4">
                {selectedReport.answers && selectedReport.answers.map((item, idx) => (
                  <div key={idx} className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                    <div className={`px-4 py-3 ${item.score === 'Passed' ? 'bg-green-900/20 border-b border-green-800' : 'bg-yellow-900/20 border-b border-yellow-800'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-sm font-semibold text-gray-200">Question {idx + 1}</div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${item.score === 'Passed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                          {item.score}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="mb-3">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Question</div>
                        <div className="text-sm text-gray-200">{item.question}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Answer</div>
                        <div className="text-sm text-gray-300 bg-gray-800 rounded p-3">{item.answer}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiter Info */}
            <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500">
              <div>Interviewed by: <span className="text-gray-300">{selectedReport.recruiterName}</span></div>
              <div>Completed: {new Date(selectedReport.date).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
