import React from 'react'

interface BackgroundEffectsProps {
  isGridHovered: boolean
  gridMousePosition: { x: number; y: number }
}

export default function BackgroundEffects({ 
  isGridHovered, 
  gridMousePosition 
}: BackgroundEffectsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Single Top-Right Purple Glow - Half Cut Off */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, rgba(139, 69, 219, 0.3) 40%, transparent 70%)',
          top: '-400px',
          right: '-400px',
        }}
      />
      
      {/* Interactive Grid Glow - Follows Mouse */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-300 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)',
          opacity: isGridHovered ? 0.2 : 0,
          left: isGridHovered ? `${gridMousePosition.x - 300}px` : '10%',
          top: isGridHovered ? `${gridMousePosition.y - 300 + 600}px` : '60%',
          transform: 'translate(0, 0)',
        }}
      />
    </div>
  )
}