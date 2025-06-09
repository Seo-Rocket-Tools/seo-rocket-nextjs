import React from 'react'

interface HeroSectionProps {
  isAdmin?: boolean
}

export default function HeroSection({ isAdmin = false }: HeroSectionProps) {
  return (
    <section className={`px-4 sm:px-6 py-8 sm:py-12 relative z-10 ${isAdmin ? 'pt-20' : ''}`}>
      <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* Logo */}
        <div className="mb-6 sm:mb-8">
          <img
            src="/seo-rocket-light.svg"
            alt="SEO Rocket"
            className="mx-auto w-[160px] sm:w-[200px] h-[48px] sm:h-[60px] object-contain"
          />
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
          Automate Your
          <span className="block text-gray-400">Digital Workflow</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12 sm:mb-16 px-4 sm:px-0">
          Powerful web apps, Chrome extensions, and WordPress plugins designed for 
          <span className="text-white font-medium"> digital marketing agencies</span> and 
          <span className="text-white font-medium"> virtual assistants</span> who demand efficiency.
        </p>
      </div>
    </section>
  )
}