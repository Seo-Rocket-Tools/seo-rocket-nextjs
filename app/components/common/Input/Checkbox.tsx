"use client"

import React from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Checkbox({ 
  label,
  className = '',
  ...props
}: CheckboxProps) {
  return (
    <label className="flex items-center">
      <input
        type="checkbox"
        className={`mr-2 ${className}`}
        {...props}
      />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  )
}