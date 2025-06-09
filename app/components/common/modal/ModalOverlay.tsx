"use client"

import React from 'react'

interface ModalOverlayProps {
  children: React.ReactNode
  onClick?: () => void
}

export default function ModalOverlay({ children, onClick }: ModalOverlayProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClick}
    >
      {children}
    </div>
  )
}