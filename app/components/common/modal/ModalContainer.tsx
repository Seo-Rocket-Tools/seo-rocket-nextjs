"use client"

import React from 'react'

interface ModalContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

export default function ModalContainer({ 
  children, 
  maxWidth = 'md',
  className = ''
}: ModalContainerProps) {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  return (
    <div 
      className={`bg-gray-900 border border-gray-800 rounded-xl ${maxWidthClasses[maxWidth]} w-full max-h-[80vh] overflow-y-auto ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}