import React from 'react'
import Navbar from '../components/Navbar'
import { NavLink } from 'react-router-dom'

export default function Error404() {
  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      <Navbar />

      {/* Animated background blobs */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-4xl mx-auto px-6 py-20 flex items-center justify-center min-h-[85vh]">
        <div className="text-center w-full">
          {/* Card Glass Container */}
          <div className="card-glass p-12 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="bg-gradient-to-br from-neon-cyan to-neon-purple text-dark-950 px-3 py-2 rounded-full font-bold text-sm">
                RM
              </div>
              <span className="text-gradient font-semibold text-lg">ResuMate</span>
            </div>

            {/* Error Number */}
            <h1 className="text-9xl font-bold text-gradient mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-100 mb-6">Page Not Found</h2>
            
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              The page you're looking for doesn't exist. It might have been moved or deleted. Let's get you back on track.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NavLink
                to="/"
                className="btn-primary"
              >
                Go Home
              </NavLink>

              <NavLink
                to="/contact"
                className="btn-secondary"
              >
                Contact Support
              </NavLink>
            </div>

            <p className="text-gray-500 text-sm mt-8">
              Use the navigation menu to explore our website
            </p>
          </div>
        </div>
      </main>

      <footer className="card-glass py-8 text-center text-gray-400 border-t border-neon-cyan/10 mt-auto">
        <p>© {new Date().getFullYear()} ResuMate — All rights reserved.</p>
      </footer>
    </div>
  )
}