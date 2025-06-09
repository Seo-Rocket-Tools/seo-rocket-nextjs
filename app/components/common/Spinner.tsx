"use client"

import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'white' | 'blue' | 'red' | 'current'
}

export default function Spinner({ size = 'md', color = 'current' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  const colorClasses = {
    white: 'border-white',
    blue: 'border-blue-400',
    red: 'border-red-400',
    current: 'border-current'
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
    />
  )
}