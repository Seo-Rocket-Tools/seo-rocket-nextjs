"use client"

import { useState } from 'react'

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isGridHovered, setIsGridHovered] = useState(false)
  const [gridMousePosition, setGridMousePosition] = useState({ x: 0, y: 0 })

  const softwareTools = [
    {
      icon: "🚀",
      name: "SEO Automator",
      description: "Automate keyword research, rank tracking, and competitor analysis with our powerful SEO toolkit.",
      tags: ["SEO", "Productivity"]
    },
    {
      icon: "📊",
      name: "Analytics Dashboard",
      description: "Centralized reporting dashboard that pulls data from all your marketing channels in real-time.",
      tags: ["Productivity", "Free"]
    },
    {
      icon: "🎯",
      name: "Lead Generator",
      description: "Chrome extension that finds contact information and builds prospect lists while you browse.",
      tags: ["Chrome Extension", "Productivity"]
    },
    {
      icon: "📱",
      name: "Social Scheduler",
      description: "WordPress plugin for automated social media posting across multiple platforms and clients.",
      tags: ["WordPress Plugin", "Productivity"]
    },
    {
      icon: "💬",
      name: "Client Communicator",
      description: "Streamline client communication with automated reports, proposals, and project updates.",
      tags: ["Productivity", "Free"]
    },
    {
      icon: "⚡",
      name: "Workflow Engine",
      description: "Build custom automation workflows that connect your favorite marketing tools and apps.",
      tags: ["Productivity", "SEO"]
    },
    {
      icon: "🔗",
      name: "API Connector",
      description: "Seamlessly integrate multiple platforms and automate data flow between your favorite tools.",
      tags: ["Productivity", "Chrome Extension"]
    }
  ];

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

      {/* Software Grid Section - Clean Masonry Layout */}
      <section 
        className="px-6 pb-12 relative z-10"
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
      >
        <div className="max-w-7xl mx-auto">
          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["All", "SEO", "Productivity", "Free", "Chrome Extension", "WordPress Plugin"].map((filter, index) => (
              <button
                key={index}
                className="px-4 py-2 text-sm font-medium rounded-full border transition-all duration-300 cursor-pointer hover:scale-105"
                style={{
                  backgroundColor: index === 0 ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: index === 0 ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.15)',
                  color: index === 0 ? '#000000' : '#d1d5db',
                }}
                onMouseEnter={(e) => {
                  if (index !== 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== 0) {
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

          {/* Row 1: 4 cards full width */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {softwareTools.slice(0, 4).map((tool, index) => (
              <div 
                key={index}
                className="rounded-lg p-6 transition-all duration-500 ease-out cursor-pointer relative"
                style={{
                  backgroundColor: hoveredCard === index ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${hoveredCard === index ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'}`,
                  transform: getCardTransform(index),
                  boxShadow: getCardShadow(index),
                  transformStyle: 'preserve-3d',
                }}
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={handleMouseLeave}
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
                  className="text-gray-400 text-sm leading-relaxed mb-4 transition-transform duration-500"
                  style={{
                    transform: hoveredCard === index ? 'translateZ(6px)' : 'translateZ(0px)',
                  }}
                >
                  {tool.description}
                </p>
                
                {/* Tags */}
                <div 
                  className="flex flex-wrap gap-2 transition-transform duration-500"
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

          {/* Row 2: 3 cards centered */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full">
              {softwareTools.slice(4, 7).map((tool, index) => {
                const actualIndex = index + 4; // Adjust for hover state
                return (
                  <div 
                    key={actualIndex}
                    className="rounded-lg p-6 transition-all duration-500 ease-out cursor-pointer relative"
                    style={{
                      backgroundColor: hoveredCard === actualIndex ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${hoveredCard === actualIndex ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'}`,
                      transform: getCardTransform(actualIndex),
                      boxShadow: getCardShadow(actualIndex),
                      transformStyle: 'preserve-3d',
                    }}
                    onMouseMove={(e) => handleMouseMove(e, actualIndex)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* New Tab Icon - Only appears on hover */}
                    {hoveredCard === actualIndex && (
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
                        transform: hoveredCard === actualIndex ? 'translateZ(12px)' : 'translateZ(0px)',
                      }}
                    >
                      {tool.icon}
                    </div>
                    
                    {/* Software Name */}
                    <h3 
                      className="text-xl font-semibold text-white mb-3 transition-transform duration-500"
                      style={{
                        transform: hoveredCard === actualIndex ? 'translateZ(8px)' : 'translateZ(0px)',
                      }}
                    >
                      {tool.name}
                    </h3>
                    
                    {/* Description */}
                    <p 
                      className="text-gray-400 text-sm leading-relaxed mb-4 transition-transform duration-500"
                      style={{
                        transform: hoveredCard === actualIndex ? 'translateZ(6px)' : 'translateZ(0px)',
                      }}
                    >
                      {tool.description}
                    </p>
                    
                    {/* Tags */}
                    <div 
                      className="flex flex-wrap gap-2 transition-transform duration-500"
                      style={{
                        transform: hoveredCard === actualIndex ? 'translateZ(10px)' : 'translateZ(0px)',
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
                );
              })}
            </div>
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