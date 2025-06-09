"use client"

import React from 'react'

interface TagBadgeProps {
  tag: string
  onRemove?: () => void
  variant?: 'default' | 'selected' | 'clickable'
}

export default function TagBadge({ 
  tag, 
  onRemove, 
  variant = 'default' 
}: TagBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-700/60 text-gray-300 border-gray-600',
    selected: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    clickable: 'bg-gray-700/60 hover:bg-gray-600 text-gray-300 border-gray-600 cursor-pointer'
  }

  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${variantClasses[variant]}`}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-current hover:opacity-80"
        >
          ×
        </button>
      )}
    </span>
  )
}