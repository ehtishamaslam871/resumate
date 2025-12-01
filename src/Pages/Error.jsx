import React from 'react'
import Navbar from '../components/Navbar'
import { NavLink } from 'react-router-dom'

export default function Error404() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-cyan-500 text-gray-900 px-3 py-2 rounded-full font-bold">
              RM
            </div>
            <span className="text-cyan-300 font-medium">ResuMate</span>
          </div>

          {/* Error Content */}
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 max-w-2xl mx-auto">
            <h1 className="text-8xl font-bold text-cyan-400 mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
            
            <p className="text-gray-300 mb-8">
              The page you're looking for doesn't exist. It might have been moved or deleted.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NavLink
                to="/"
                className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-medium hover:bg-cyan-600"
              >
                Go Home
              </NavLink>

              <NavLink
                to="/contact"
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Contact Support
              </NavLink>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              Use the navigation menu to explore our website
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 py-6 text-center text-gray-400 border-t border-gray-700 mt-auto">
        <p>© {new Date().getFullYear()} ResuMate — All rights reserved.</p>
      </footer>
    </div>
  )
}