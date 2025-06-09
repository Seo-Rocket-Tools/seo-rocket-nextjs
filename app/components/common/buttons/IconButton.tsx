"use client"

import React from 'react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'danger' | 'ghost'
  size?: 'sm' | 'md'
  loading?: boolean
  icon: React.ReactNode
  loadingText?: string
}

export default function IconButton({ 
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  icon,
  loadingText,
  ...props
}: IconButtonProps) {
  const variantClasses = {
    danger: 'text-red-400 hover:text-red-300',
    ghost: 'text-gray-400 hover:text-white'
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: ''
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${variantClasses[variant]} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {loadingText && <span className="text-xs">{loadingText}</span>}
        </>
      ) : (
        icon
      )}
    </button>
  )
}