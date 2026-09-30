import React from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 max-w-7xl mx-auto overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
