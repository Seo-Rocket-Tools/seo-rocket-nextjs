import React from 'react'

interface AdminBarProps {
  userEmail?: string
  onShowTagManager: () => void
  onShowAddProduct: () => void
  onLogout: () => void
}

export default function AdminBar({ 
  userEmail, 
  onShowTagManager, 
  onShowAddProduct, 
  onLogout 
}: AdminBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-300">Admin Mode</span>
          </div>
          
          <button
            onClick={onShowTagManager}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-colors"
          >
            Tag Manager
          </button>
          
          <button
            onClick={onShowAddProduct}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-full transition-colors"
          >
            + Add Product
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Welcome, {userEmail}</span>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}