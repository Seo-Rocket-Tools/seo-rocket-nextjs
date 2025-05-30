"use client"

import { useState, useEffect } from 'react'
import { loadSoftwareData, getActiveSoftware, getSoftwareByTag, getAvailableTags, SoftwareData, SoftwareItem, getFeaturedSoftware } from '../data/software-loader'

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isGridHovered, setIsGridHovered] = useState(false)
  const [gridMousePosition, setGridMousePosition] = useState({ x: 0, y: 0 })
  const [softwareData, setSoftwareData] = useState<SoftwareData | null>(null)
  const [filteredSoftware, setFilteredSoftware] = useState<SoftwareItem[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('Featured')
  const [isLoading, setIsLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Load software data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await loadSoftwareData()
        setSoftwareData(data)
        setFilteredSoftware(getFeaturedSoftware(data))
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load software data:', error)
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Reload data when page gains focus (e.g., coming back from admin panel)
  useEffect(() => {
    const handleFocus = async () => {
      try {
        console.log('Page focused, reloading software data...')
        const data = await loadSoftwareData()
        console.log('Loaded data with tags:', data.tags)
        console.log('Available tags from getAvailableTags:', getAvailableTags(data))
        setSoftwareData(data)
        // Maintain current filter when refreshing data
        if (activeFilter === 'Featured') {
          setFilteredSoftware(getFeaturedSoftware(data))
        } else {
          setFilteredSoftware(getSoftwareByTag(data, activeFilter))
        }
      } catch (error) {
        console.error('Failed to reload software data:', error)
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'seo-rocket-software-data') {
        console.log('localStorage data changed, reloading...')
        handleFocus()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)
    
    // Also check for changes periodically (every 5 seconds)
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        handleFocus()
      }
    }, 5000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [activeFilter])

  // Handle filter changes
  const handleFilterChange = (filter: string) => {
    if (!softwareData) return
    setActiveFilter(filter)
    setFilteredSoftware(getSoftwareByTag(softwareData, filter))
  }

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
    
    console.log('Scroll State:', {
      scrollLeft: container.scrollLeft,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
      isScrollable,
      isAtStart,
      isAtEnd,
      canScrollLeft: isScrollable && !isAtStart,
      canScrollRight: isScrollable && !isAtEnd
    })
  }

  // Check scroll state on mount and resize
  useEffect(() => {
    if (!softwareData) return
    
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const handleScroll = () => {
      console.log('Scroll event triggered')
      updateScrollState()
    }
    
    const handleResize = () => {
      console.log('Resize event triggered')
      updateScrollState()
    }
    
    // Add event listeners
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    
    // Initial check with multiple attempts to ensure container is ready
    const checkInitialState = () => {
      console.log('Checking initial scroll state')
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
  }, [softwareData])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setMousePosition({ x, y })
    setHoveredCard(index)
  }

  const handleMouseLeave = () => {
    setHoveredCard(null)
    setMousePosition({ x: 0, y: 0 })
  }

  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setGridMousePosition({ x, y })
    setIsGridHovered(true)
  }

  const handleGridMouseLeave = () => {
    setIsGridHovered(false)
    setGridMousePosition({ x: 0, y: 0 })
  }

  const getCardTransform = (index: number) => {
    if (hoveredCard !== index) return 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    
    const tiltX = (mousePosition.y / 25) * -1
    const tiltY = mousePosition.x / 25
    
    return `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`
  }

  const getCardShadow = (index: number) => {
    if (hoveredCard !== index) {
      return '0 8px 30px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(255, 255, 255, 0.1)'
    }
    
    const shadowX = mousePosition.x / 8
    const shadowY = mousePosition.y / 8
    
    return `${shadowX}px ${shadowY + 25}px 50px rgba(0, 0, 0, 0.5), 0 10px 40px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
  }

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading software...</p>
        </div>
      </main>
    )
  }

  // Show error state
  if (!softwareData) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load software data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Glow Effect */}
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

      {/* Header Section */}
      <section className="px-6 py-12 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/logo-light.svg"
              alt="SEO Rocket"
              className="mx-auto w-[200px] h-[60px] object-contain"
            />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Automate Your
            <span className="block text-gray-400">Digital Workflow</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-16">
            Powerful web apps, Chrome extensions, and WordPress plugins designed for 
            <span className="text-white font-medium"> digital marketing agencies</span> and 
            <span className="text-white font-medium"> virtual assistants</span> who demand efficiency.
          </p>
        </div>
      </section>

      {/* Software Grid Section - Dynamic Layout */}
      <section 
        className="px-6 pb-12 relative z-10"
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
      >
        <div className="max-w-7xl mx-auto">
          {/* Horizontal Scrollable Filter Tabs */}
          <div className="relative mb-8 max-w-4xl mx-auto h-12 flex items-center">
            {/* Scrollable Filter Container */}
            <div 
              id="filter-container"
              className="flex gap-3 overflow-x-auto scrollbar-hide px-16 py-2 flex-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {getAvailableTags(softwareData).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className="px-4 py-2 text-sm font-medium rounded-full border transition-all duration-300 cursor-pointer hover:scale-105 whitespace-nowrap flex-shrink-0"
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
                </button>
              ))}
            </div>

            {/* Gradient Overlays - Lower z-index */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-[1] pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-[1] pointer-events-none" />

            {/* Left Arrow - Highest z-index */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-[100]">
              <button
                onClick={() => {
                  console.log('Left arrow clicked, canScrollLeft:', canScrollLeft)
                  scrollFilters('left')
                }}
                className={`w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  canScrollLeft 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer' 
                    : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                }`}
                disabled={!canScrollLeft}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Right Arrow - Highest z-index */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-[100]">
              <button
                onClick={() => {
                  console.log('Right arrow clicked, canScrollRight:', canScrollRight)
                  scrollFilters('right')
                }}
                className={`w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  canScrollRight 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer' 
                    : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                }`}
                disabled={!canScrollRight}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Flex Layout - 4 cards per row with wrapping */}
          <div className="flex flex-row flex-wrap justify-center items-stretch gap-3 max-w-7xl mx-auto">
            {filteredSoftware.map((tool, index) => (
              <div 
                key={tool.id}
                className="w-[calc(25%-0.5625rem)] min-w-[280px] rounded-lg p-6 transition-all duration-500 ease-out cursor-pointer relative flex flex-col"
                style={{
                  backgroundColor: hoveredCard === index ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${hoveredCard === index ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'}`,
                  transform: getCardTransform(index),
                  boxShadow: getCardShadow(index),
                  transformStyle: 'preserve-3d',
                }}
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                  if (tool.url && tool.url !== '#') {
                    window.open(tool.url, '_blank', 'noopener,noreferrer')
                  }
                }}
              >
                {/* New Tab Icon - Only appears on hover */}
                {hoveredCard === index && (
                  <img 
                    src="/newtab.svg" 
                    alt="Open in new tab" 
                    className="absolute top-4 right-4 w-4 h-4 transition-all duration-500"
                    style={{
                      transform: 'translateZ(15px)',
                      filter: 'brightness(0) saturate(100%) invert(100%) opacity(0.8)',
                    }}
                  />
                )}

                {/* Icon */}
                <div 
                  className="text-4xl mb-4 transition-transform duration-500"
                  style={{
                    transform: hoveredCard === index ? 'translateZ(12px)' : 'translateZ(0px)',
                  }}
                >
                  {tool.icon}
                </div>
                
                {/* Software Name */}
                <h3 
                  className="text-xl font-semibold text-white mb-3 transition-transform duration-500"
                  style={{
                    transform: hoveredCard === index ? 'translateZ(8px)' : 'translateZ(0px)',
                  }}
                >
                  {tool.name}
                </h3>
                
                {/* Description */}
                <p 
                  className="text-gray-400 text-sm leading-relaxed mb-4 flex-grow transition-transform duration-500"
                  style={{
                    transform: hoveredCard === index ? 'translateZ(6px)' : 'translateZ(0px)',
                  }}
                >
                  {tool.description}
                </p>
                
                {/* Tags - Always at the bottom */}
                <div 
                  className="flex flex-wrap gap-2 mt-auto transition-transform duration-500"
                  style={{
                    transform: hoveredCard === index ? 'translateZ(10px)' : 'translateZ(0px)',
                  }}
                >
                  {tool.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="px-3 py-1 text-xs font-medium rounded-full border"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="px-6 py-12 pt-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <a 
              href="https://seorocket.notion.site/seorocket/SEO-Rocket-Refund-Policy-cf90d3f98cdf4b0da5fe3e58bb75405a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-sm font-medium"
            >
              Refund Policy
            </a>
            <a 
              href="https://seorocket.notion.site/seorocket/SEO-Rocket-Refund-Policy-cf90d3f98cdf4b0da5fe3e58bb75405a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-sm font-medium"
            >
              Privacy Policy
            </a>
            <a 
              href="https://seorocket.notion.site/SEO-Rocket-Tools-Terms-and-Conditions-367d487eeb13438ab3bceecbfe2b27e6?pvs=4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-sm font-medium"
            >
              Terms & Conditions
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              All Rights Reserved Copyright 2025 - Designed by SEO Rocket. 💗
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
} 