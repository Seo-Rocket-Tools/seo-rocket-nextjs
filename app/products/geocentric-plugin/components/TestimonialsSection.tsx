import React from 'react'
import Image from 'next/image'

interface Testimonial {
  name: string
  role: string
  company: string
  content: string
  avatar: string
}

export interface TestimonialsSectionProps {
  isDarkMode: boolean
  testimonials: Testimonial[]
  isTestimonialsHovered: boolean
  setIsTestimonialsHovered: (value: boolean) => void
  handleMouseLeave: () => void
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: () => void
  cardClasses: string
}

export default function TestimonialsSection({
  isDarkMode,
  testimonials,
  isTestimonialsHovered,
  setIsTestimonialsHovered,
  handleMouseLeave,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  cardClasses
}: TestimonialsSectionProps) {
  const scrollTestimonials = (direction: 'left' | 'right') => {
    const container = document.getElementById('testimonials-container')
    if (!container) return
    
    // Pause auto-scroll temporarily when user clicks arrows
    setIsTestimonialsHovered(true)
    setTimeout(() => setIsTestimonialsHovered(false), 2000) // Resume after 2 seconds
    
    const cardWidth = 350 + 32 // Card width (350px) + gap (32px from gap-8)
    
    if (direction === 'left') {
      container.scrollTo({
        left: Math.max(0, container.scrollLeft - cardWidth),
        behavior: 'smooth'
      })
    } else {
      container.scrollTo({
        left: container.scrollLeft + cardWidth,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Real Results from Real Users
          </h2>
          <p className={`text-lg sm:text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Over 1,100+ site activations and counting. See what our customers are saying about their ranking improvements.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Scrollable Container */}
          <div 
            id="testimonials-container"
            className="flex gap-8 overflow-x-auto scrollbar-hide px-12 sm:px-16 py-2 cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            onMouseEnter={() => setIsTestimonialsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Render testimonials twice for infinite scroll */}
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-[350px] p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${cardClasses}`}
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <Image
                      src={testimonial.avatar}
                      alt={`${testimonial.name} - ${testimonial.role} testimonial for Geocentric Plugin local SEO results`}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{testimonial.name}</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed text-sm`}>
                  {testimonial.content}
                </p>
              </div>
            ))}
          </div>

          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10" style={{
            background: isDarkMode 
              ? 'linear-gradient(to right, #000000 0%, rgba(0,0,0,0.8) 50%, transparent 100%)'
              : 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.8) 50%, transparent 100%)'
          }} />
          <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-10" style={{
            background: isDarkMode 
              ? 'linear-gradient(to left, #000000 0%, rgba(0,0,0,0.8) 50%, transparent 100%)'
              : 'linear-gradient(to left, #ffffff 0%, rgba(255,255,255,0.8) 50%, transparent 100%)'
          }} />

          {/* Left Arrow */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
            <button
              onClick={() => scrollTestimonials('left')}
              className={`w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                isDarkMode 
                  ? 'bg-black/80 border-white/20 text-white hover:bg-black hover:border-white/30' 
                  : 'bg-white/80 border-black/20 text-black hover:bg-white hover:border-black/30'
              } shadow-lg backdrop-blur-sm`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Right Arrow */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-50">
            <button
              onClick={() => scrollTestimonials('right')}
              className={`w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                isDarkMode 
                  ? 'bg-black/80 border-white/20 text-white hover:bg-black hover:border-white/30' 
                  : 'bg-white/80 border-black/20 text-black hover:bg-white hover:border-black/30'
              } shadow-lg backdrop-blur-sm`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
} 