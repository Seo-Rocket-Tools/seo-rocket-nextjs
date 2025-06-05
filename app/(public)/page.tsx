"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  loadSoftwareData, 
  SoftwareItem, 
  SoftwareData,
  getSoftwareByTag, 
  getFeaturedSoftware,
  getAvailableTags
} from '../../data/software-loader'
import { useRealtime } from '../../lib/useRealtime'
import Link from 'next/link'

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isGridHovered, setIsGridHovered] = useState(false)
  const [gridMousePosition, setGridMousePosition] = useState({ x: 0, y: 0 })
  const [softwareData, setSoftwareData] = useState<SoftwareData | null>(null)
  const [filteredSoftware, setFilteredSoftware] = useState<SoftwareItem[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('Featured')
  const [isLoading, setIsLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<{
    isConnected: boolean
    error: string | null
  }>({ isConnected: false, error: null })

  // State for available filter tags
  const [availableFilterTags, setAvailableFilterTags] = useState<string[]>(['Featured', 'Free', 'All'])

  // Setup realtime connection
  const { isConnected, error: realtimeError } = useRealtime({
    onProductChange: () => {
      console.log('Realtime update received, refreshing data')
      refreshData()
    },
    enabled: true
  })

  // Update realtime status when connection changes
  useEffect(() => {
    setRealtimeStatus({
      isConnected,
      error: realtimeError
    })
  }, [isConnected, realtimeError])

  const refreshData = useCallback(async () => {
    try {
      console.log('Refreshing data due to realtime update')
      const data = await loadSoftwareData()
      setSoftwareData(data)
      
      if (activeFilter === 'Featured') {
        const featuredResults = getFeaturedSoftware(data, false)
        console.log('Setting featured software, Results:', featuredResults.length, 'items')
        setFilteredSoftware(featuredResults)
      } else {
        const tagResults = getSoftwareByTag(data, activeFilter, false)
        console.log('Setting tag software for', activeFilter, 'Results:', tagResults.length, 'items')
        setFilteredSoftware(tagResults)
      }
      
      const availableTags = getAvailableTags(data, false)
      setAvailableFilterTags(availableTags)
      
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }, [activeFilter])

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        console.log('Loading software data')
        const data = await loadSoftwareData()
        setSoftwareData(data)
        
        const initialFeatured = getFeaturedSoftware(data, false)
        console.log('Initial load - setting featured software, Results:', initialFeatured.length, 'items')
        setFilteredSoftware(initialFeatured)
        
        const availableTags = getAvailableTags(data, false)
        setAvailableFilterTags(availableTags)
        
      } catch (error) {
        console.error('Error loading software data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle page focus refresh
  useEffect(() => {
    const handleFocus = async () => {
      try {
        console.log('Page focused, reloading software data')
        const data = await loadSoftwareData()
        setSoftwareData(data)
        
        if (activeFilter === 'Featured') {
          const focusFeatured = getFeaturedSoftware(data, false)
          console.log('Focus reload - setting featured software, Results:', focusFeatured.length, 'items')
          setFilteredSoftware(focusFeatured)
        } else {
          const focusTag = getSoftwareByTag(data, activeFilter, false)
          console.log('Focus reload - setting tag software for', activeFilter, 'Results:', focusTag.length, 'items')
          setFilteredSoftware(focusTag)
        }
        
        const availableTags = getAvailableTags(data, false)
        setAvailableFilterTags(availableTags)
        
      } catch (error) {
        console.error('Error on focus refresh:', error)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [activeFilter])

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    if (softwareData) {
      if (filter === 'Featured') {
        const featuredResults = getFeaturedSoftware(softwareData, false)
        console.log('Filter change - setting featured software, Results:', featuredResults.length, 'items')
        setFilteredSoftware(featuredResults)
      } else {
        const tagResults = getSoftwareByTag(softwareData, filter, false)
        console.log('Filter change - setting tag software for', filter, 'Results:', tagResults.length, 'items')
        setFilteredSoftware(tagResults)
      }
    }
  }

  const scrollFilters = (direction: 'left' | 'right') => {
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const scrollAmount = 150
    const newScrollLeft = direction === 'left' 
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount)
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
    
    setTimeout(() => updateScrollState(), 300)
  }

  const scrollBlogs = (direction: 'left' | 'right') => {
    const container = document.getElementById('blog-container')
    if (!container) return
    
    const scrollAmount = 320
    const newScrollLeft = direction === 'left' 
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount)
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  const updateScrollState = () => {
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const isScrollable = container.scrollWidth > container.clientWidth
    const isAtStart = container.scrollLeft <= 1
    const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 1
    
    setCanScrollLeft(isScrollable && !isAtStart)
    setCanScrollRight(isScrollable && !isAtEnd)
  }

  useEffect(() => {
    if (!softwareData) return
    
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const handleScroll = () => updateScrollState()
    const handleResize = () => updateScrollState()
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    
    const checkInitialState = () => updateScrollState()
    
    checkInitialState()
    setTimeout(checkInitialState, 100)
    setTimeout(checkInitialState, 500)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [softwareData])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, toolId: string) => {
    setHoveredCard(toolId)
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseLeave = () => {
    setHoveredCard(null)
  }

  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsGridHovered(true)
    // Get mouse position relative to the viewport
    setGridMousePosition({
      x: e.clientX,
      y: e.clientY,
    })
  }

  const handleGridMouseLeave = () => {
    setIsGridHovered(false)
  }

  const getCardTransform = (toolId: string) => {
    if (hoveredCard !== toolId) return 'rotateX(0deg) rotateY(0deg)'
    
    const rect = { width: 300, height: 200 }
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Fixed: Tilt towards mouse, not away from it
    const rotateX = -(mousePosition.y - centerY) / 10
    const rotateY = (mousePosition.x - centerX) / 10
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(15px)`
  }

  const getCardShadow = (toolId: string) => {
    if (hoveredCard !== toolId) {
      return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }
    
    // Enhanced shadow for hovered cards without the purple glow
    return '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <img
              src="/seo-rocket-light.svg"
              alt="SEO Rocket"
              className="mx-auto w-[160px] h-[48px] object-contain"
            />
          </div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, rgba(139, 69, 219, 0.3) 40%, transparent 70%)',
            top: '-400px',
            right: '-400px',
          }}
        />
        
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl transition-opacity duration-300 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(147, 51, 234, 0.06) 40%, transparent 60%)',
            opacity: isGridHovered ? 0.95 : 0,
            position: 'fixed',
            left: `${gridMousePosition.x - 300}px`,
            top: `${gridMousePosition.y - 300}px`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      </div>

      {/* Header Section */}
      <section className="px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="mb-6 sm:mb-8">
            <img
              src="/seo-rocket-light.svg"
              alt="SEO Rocket"
              className="mx-auto w-[160px] sm:w-[200px] h-[48px] sm:h-[60px] object-contain"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
            Automate Your
            <span className="block text-gray-400">Digital Workflow</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12 sm:mb-16 px-4 sm:px-0">
            Powerful web apps, Chrome extensions, and WordPress plugins designed for 
            <span className="text-white font-medium"> digital marketing agencies</span> and 
            <span className="text-white font-medium"> virtual assistants</span> who demand efficiency.
          </p>
        </div>
      </section>

      {/* Software Grid Section */}
      <section 
        className="px-4 sm:px-6 pb-8 sm:pb-12 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          {/* Filter Tabs */}
          <div className="relative mb-6 sm:mb-8 max-w-4xl mx-auto h-12 flex items-center">
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
                  onClick={() => handleFilterChange(filter)}
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
                </button>
              ))}
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-[1] pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/60 via-black/40 to-transparent z-[1] pointer-events-none" />

            <div className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-[100]">
              <button
                onClick={() => scrollFilters('left')}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  canScrollLeft 
                    ? 'bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 cursor-pointer' 
                    : 'bg-transparent border-white/10 text-white/40 cursor-not-allowed'
                }`}
                disabled={!canScrollLeft}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-[100]">
              <button
                onClick={() => scrollFilters('right')}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  canScrollRight 
                    ? 'bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 cursor-pointer' 
                    : 'bg-transparent border-white/10 text-white/40 cursor-not-allowed'
                }`}
                disabled={!canScrollRight}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Software Cards Grid */}
          <div 
            className="flex flex-row flex-wrap justify-center items-stretch gap-3 sm:gap-4 lg:gap-5 max-w-7xl mx-auto px-2 sm:px-0 transition-all duration-300"
            onMouseMove={handleGridMouseMove}
            onMouseLeave={handleGridMouseLeave}
          >
            {filteredSoftware.map((tool, index) => {
              return (
                <div 
                  key={tool.id}
                  className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.9375rem)] min-w-[280px] max-w-[320px] rounded-lg p-4 sm:p-6 relative flex flex-col group transition-all duration-300"
                  style={{
                    backgroundColor: hoveredCard === tool.id ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${hoveredCard === tool.id ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'}`,
                    transform: getCardTransform(tool.id),
                    boxShadow: getCardShadow(tool.id),
                    transition: 'all 0.3s ease-out'
                  }}
                  onMouseMove={(e) => handleMouseMove(e, tool.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* External Link Button - Always visible on hover */}
                  {hoveredCard === tool.id && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-[70]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          if (tool.url && tool.url !== '#') {
                            window.open(tool.url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 relative z-10 border border-transparent hover:border-white/20"
                        title="Open in new tab"
                      >
                        <img 
                          src="/newtab.svg" 
                          alt="Open in new tab" 
                          className="w-4 h-4"
                          style={{
                            filter: 'brightness(0) saturate(100%) invert(100%) opacity(0.8)',
                          }}
                        />
                      </button>
                    </div>
                  )}

                  {/* Main content */}
                  <div 
                    className="flex flex-col h-full cursor-pointer"
                    onClick={() => {
                      if (tool.url && tool.url !== '#') {
                        window.open(tool.url, '_blank', 'noopener,noreferrer')
                      }
                    }}
                  >
                    {/* Icon */}
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 transition-all duration-300">
                      {tool.icon}
                    </div>
                    
                    {/* Software Name */}
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-white transition-all duration-300">
                        {tool.name}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 flex-grow transition-all duration-300">
                      {tool.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {/* Free tag for free products */}
                      {tool.pricing === 'free' && (
                        <span 
                          className="px-3 py-1 text-xs font-medium rounded-full border"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            borderColor: 'rgba(34, 197, 94, 0.4)',
                            color: '#22c55e',
                          }}
                        >
                          Free
                        </span>
                      )}
                      
                      {/* Regular tags */}
                      {tool.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200"
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
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-purple-300 text-sm font-medium">Born from Frustration 😅</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                  We understand your
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> daily challenges</span>
                </h2>
                
                <p className="text-lg text-gray-300 leading-relaxed">
                  We're a team of digital marketing experts and developers who understand the daily challenges faced by 
                  <span className="text-white font-semibold"> agencies</span> and 
                  <span className="text-white font-semibold"> virtual assistants</span> in today's fast-paced digital landscape.
                </p>
                
                <p className="text-gray-400 leading-relaxed">
                  Born from real-world experience managing hundreds of client campaigns, SEO Rocket was created to solve the repetitive, 
                  time-consuming tasks that keep you from focusing on what matters most, delivering exceptional results for your clients.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">100+</div>
                  <div className="text-sm text-gray-400">Agencies Served</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">50k+</div>
                  <div className="text-sm text-gray-400">Hours Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">99%</div>
                  <div className="text-sm text-gray-400">Client Satisfaction</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
              
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Built for Speed</h4>
                      <p className="text-sm text-gray-400">Cut workflow time in half with tools designed for efficiency</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Agency Tested</h4>
                      <p className="text-sm text-gray-400">Used daily by agencies managing 50+ clients</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Always Evolving</h4>
                      <p className="text-sm text-gray-400">Continuous updates based on user feedback</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts/Blogs Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-end mb-12 sm:mb-16">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
                <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-purple-300 text-sm font-medium">Knowledge Base</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                Latest 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Insights</span>
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Exclusive strategies and insider knowledge from agency owners who've scaled to 100+ clients
              </p>
            </div>

            <div className="flex flex-col lg:items-end gap-4">
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Updated Weekly</span>
                </div>
                <div>
                  <span className="text-white font-semibold">12</span> Articles
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <article className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group h-full relative overflow-hidden">
                <div className="absolute top-6 right-6 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-full">
                  Featured
                </div>
                
                <div className="h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl mb-8 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10"></div>
                  <svg className="w-16 h-16 text-purple-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500/30 rounded-full blur-sm"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 bg-purple-500/20 rounded-full blur-lg"></div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                      Growth Strategy
                    </span>
                    <span className="text-xs text-gray-500">Featured • 12 min read</span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-purple-300 transition-colors leading-tight">
                    The $100K Agency Blueprint: How We Scaled Without Burnout
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed">
                    The exact step-by-step system we used to grow from $10K to $100K MRR in 18 months, including our complete tech stack, pricing strategy, and the automation workflows that saved us 40+ hours per week.
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">SR</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">SEO Rocket Team</div>
                        <div className="text-xs text-gray-500">Dec 15, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>1.2k views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>89</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div>
              <article className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group h-full">
                <div className="h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                    Chrome Extensions
                  </span>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    15 Must-Have Extensions for Digital Marketers
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Browser extensions that every agency should install to boost productivity and client results.
                  </p>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xs text-gray-500">5 min read</span>
                    <time className="text-xs text-gray-500">Dec 12, 2024</time>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />
            
            <div 
              id="blog-container"
              className="overflow-x-auto scrollbar-hide pb-4" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex gap-6 px-8" style={{ width: 'fit-content' }}>
                <article className="flex-shrink-0 w-72 bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                  <div className="h-40 bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-lg mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                      WordPress
                    </span>
                    <h3 className="text-lg font-semibold text-white group-hover:text-yellow-300 transition-colors">
                      WordPress Plugin Stack for Client Sites
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Essential plugins that every agency should install for optimal performance and security.
                    </p>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-gray-500">7 min read</span>
                      <time className="text-xs text-gray-500">Dec 8, 2024</time>
                    </div>
                  </div>
                </article>

                <article className="flex-shrink-0 w-72 bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                  <div className="h-40 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                      Analytics
                    </span>
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors">
                      Client Reporting That Actually Converts
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      How to create reports that showcase value and help you retain clients longer.
                    </p>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-gray-500">6 min read</span>
                      <time className="text-xs text-gray-500">Dec 5, 2024</time>
                    </div>
                  </div>
                </article>

                <article className="flex-shrink-0 w-72 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5"></div>
                  <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="relative space-y-3">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                      Coming Soon
                    </span>
                    <h3 className="text-lg font-semibold text-white">
                      Pricing Strategies That 10X Revenue
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      The psychology behind premium pricing and how to position your agency for high-value clients.
                    </p>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-purple-400">Next week</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <span>In progress</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-blue-300 text-sm font-medium">Let's Connect</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Scale Your Agency?</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Join 100+ agencies already using our tools to automate workflows and focus on growth. 
              Whether you need support or want to discuss custom solutions, we're here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300 h-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"></div>
                <div className="absolute top-6 right-6 w-12 h-12 bg-purple-500/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl"></div>
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        Get Direct Support
                      </h3>
                      <p className="text-gray-400 text-lg">
                        Questions about our tools? Technical support? We respond personally.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 text-sm font-medium">Online Now</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-semibold">seorockettools@gmail.com</div>
                          <div className="text-sm text-gray-400">Primary support email</div>
                        </div>
                      </div>
                      <a 
                        href="mailto:seorockettools@gmail.com"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        Send Email
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-white mb-1">&lt; 4h</div>
                        <div className="text-xs text-gray-400">Avg Response</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-white mb-1">24/7</div>
                        <div className="text-xs text-gray-400">Support Available</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-white mb-1">100%</div>
                        <div className="text-xs text-gray-400">Issues Resolved</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Custom Development</h4>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Need a tool built specifically for your agency? Let's discuss your requirements.
                </p>
                <a 
                  href="mailto:seorockettools@gmail.com?subject=Custom Development Inquiry"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                >
                  Start Project
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Partnership Opportunities</h4>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Interested in white-label solutions or affiliate partnerships?
                </p>
                <a 
                  href="mailto:seorockettools@gmail.com?subject=Partnership Inquiry"
                  className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                >
                  Explore Partnership
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Report Issues</h4>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Found a bug or have feedback? Help us improve our tools.
                </p>
                <a 
                  href="mailto:seorockettools@gmail.com?subject=Bug Report"
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                >
                  Report Issue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Common Questions</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/8 transition-colors cursor-pointer">
                  <div className="text-white font-medium mb-1">How quickly can you develop custom tools?</div>
                  <div className="text-gray-400 text-sm">Most custom projects are completed within 2-4 weeks.</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/8 transition-colors cursor-pointer">
                  <div className="text-white font-medium mb-1">Do you offer white-label solutions?</div>
                  <div className="text-gray-400 text-sm">Yes, we provide white-label versions for agency partners.</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/8 transition-colors cursor-pointer">
                  <div className="text-white font-medium mb-1">What's included in your support?</div>
                  <div className="text-gray-400 text-sm">Installation help, troubleshooting, and feature guidance.</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Why Agencies Trust Us</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Built by Agency Owners</div>
                    <div className="text-gray-400 text-sm">We understand your challenges because we've lived them.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Lightning Fast Support</div>
                    <div className="text-gray-400 text-sm">No outsourced support. Direct access to our development team.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Continuous Innovation</div>
                    <div className="text-gray-400 text-sm">Regular updates based on real agency feedback and requests.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 