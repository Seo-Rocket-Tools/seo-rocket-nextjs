import React from 'react'

interface SuccessNotificationProps {
  message: string
}

export default function SuccessNotification({ message }: SuccessNotificationProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-green-900/95 backdrop-blur-sm rounded-lg border border-green-700 shadow-xl">
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-300 font-medium">{message}</span>
      </div>
    </div>
  )
}