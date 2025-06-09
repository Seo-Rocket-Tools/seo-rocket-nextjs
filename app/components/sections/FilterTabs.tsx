import React, { useEffect, useState } from 'react'

interface FilterTabsProps {
  availableFilterTags: string[]
  activeFilter: string
  savedFilters: Set<string>
  isAdmin: boolean
  onFilterChange: (filter: string) => void
}

export default function FilterTabs({
  availableFilterTags,
  activeFilter,
  savedFilters,
  isAdmin,
  onFilterChange
}: FilterTabsProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Handle filter scroll
  const scrollFilters = (direction: 'left' | 'right') => {
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const scrollAmount = 200
    const newScrollLeft = direction === 'left' 
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount)
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
    
    // Update scroll state after a brief delay to account for smooth scrolling
    setTimeout(() => updateScrollState(), 300)
  }

  // Update scroll state
  const updateScrollState = () => {
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const isScrollable = container.scrollWidth > container.clientWidth
    const isAtStart = container.scrollLeft <= 1 // Small threshold for floating point precision
    const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 1
    
    setCanScrollLeft(isScrollable && !isAtStart)
    setCanScrollRight(isScrollable && !isAtEnd)
  }

  // Check scroll state on mount and resize
  useEffect(() => {
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const handleScroll = () => {
      updateScrollState()
    }
    
    const handleResize = () => {
      updateScrollState()
    }
    
    // Add event listeners
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    
    // Initial check with multiple attempts to ensure container is ready
    const checkInitialState = () => {
      updateScrollState()
    }
    
    // Check immediately and with delays
    checkInitialState()
    setTimeout(checkInitialState, 100)
    setTimeout(checkInitialState, 500)
    setTimeout(checkInitialState, 1000)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [availableFilterTags])

  return (
    <div className="relative mb-6 sm:mb-8 max-w-4xl mx-auto h-12 flex items-center">
      {/* Scrollable Filter Container */}
      <div 
        id="filter-container"
        className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide px-12 sm:px-16 py-2 flex-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {availableFilterTags.map((filter: string) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full border transition-all duration-300 cursor-pointer hover:scale-105 whitespace-nowrap flex-shrink-0 min-h-[40px] flex items-center relative"
            style={{
              backgroundColor: activeFilter === filter ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: activeFilter === filter ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.15)',
              color: activeFilter === filter ? '#000000' : '#d1d5db',
            }}
            onMouseEnter={(e) => {
              if (activeFilter !== filter) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeFilter !== filter) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#d1d5db';
              }
            }}
          >
            {filter}
            {/* Saved order indicator */}
            {isAdmin && savedFilters.has(filter) && (
              <span className="ml-1.5 w-1.5 h-1.5 bg-green-400 rounded-full" title="Custom order saved" />
            )}
          </button>
        ))}
      </div>

      {/* Gradient Overlays - Lower z-index */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-[1] pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-[1] pointer-events-none" />

      {/* Left Arrow - Highest z-index */}
      <div className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-[100]">
        <button
          onClick={() => scrollFilters('left')}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-all duration-300 flex items-center justify-center ${
            canScrollLeft 
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer' 
              : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
          }`}
          disabled={!canScrollLeft}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Right Arrow - Highest z-index */}
      <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-[100]">
        <button
          onClick={() => scrollFilters('right')}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-all duration-300 flex items-center justify-center ${
            canScrollRight 
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer' 
              : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
          }`}
          disabled={!canScrollRight}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}