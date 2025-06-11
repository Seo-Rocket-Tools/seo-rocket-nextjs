"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import './critical.css'

// Import types for the dynamic components
import type { TestimonialsSectionProps } from './components/TestimonialsSection'
import type { FAQSectionProps } from './components/FAQSection'

// Dynamically import heavy components with proper types
const TestimonialsSection = dynamic<TestimonialsSectionProps>(() => import('./components/TestimonialsSection'), {
  loading: () => (
    <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-96 rounded-xl"></div>
  ),
  ssr: false
})

const FAQSection = dynamic<FAQSectionProps>(() => import('./components/FAQSection'), {
  loading: () => (
    <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-96 rounded-xl"></div>
  ),
  ssr: false
})

export default function GeocentricPluginPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isPriceAnnual, setIsPriceAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [canScrollTestimonialsLeft, setCanScrollTestimonialsLeft] = useState(false)
  const [canScrollTestimonialsRight, setCanScrollTestimonialsRight] = useState(false)
  const [isTestimonialsHovered, setIsTestimonialsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 })
  const [hoveredBenefit, setHoveredBenefit] = useState<number | null>(null)
  const [benefitMousePosition, setBenefitMousePosition] = useState({ x: 0, y: 0 })
  const [isBenefitsHovered, setIsBenefitsHovered] = useState(false)
  const [benefitsMousePosition, setBenefitsMousePosition] = useState({ x: 0, y: 0 })

  // Theme switcher effect similar to home page
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
    
    // Add smooth scroll to HTML
    document.documentElement.style.scrollBehavior = 'smooth'
    
    return () => {
      // Cleanup on unmount
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  // Auto-scroll testimonials
  useEffect(() => {
    if (isTestimonialsHovered || isDragging) return

    const interval = setInterval(() => {
      const container = document.getElementById('testimonials-container')
      if (!container) return

      // Linear scroll by 1px
      container.scrollLeft += 1
      
      // Check if we've scrolled past the first set of testimonials
      const cardWidth = container.clientWidth / 3
      const totalOriginalWidth = cardWidth * 6 // 6 testimonials
      
      if (container.scrollLeft >= totalOriginalWidth) {
        // Instantly jump back to the beginning (no smooth scroll)
        container.scrollLeft = 0
      }
    }, 30) // Smooth 30ms intervals for linear movement

    return () => clearInterval(interval)
  }, [isTestimonialsHovered, isDragging])

  // Testimonials scroll event listeners
  useEffect(() => {
    const container = document.getElementById('testimonials-container')
    if (!container) return

    const handleScroll = () => updateTestimonialsScrollState()
    const handleResize = () => updateTestimonialsScrollState()

    container.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    // Initial state check
    setTimeout(() => updateTestimonialsScrollState(), 100)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  // Scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Get purchase URL based on plan and billing frequency
  const getPurchaseUrl = (planName: string) => {
    const baseUrl = 'http://seorockettools.gumroad.com/l/'
    const suffix = '?&wanted=true'
    
    switch (planName.toLowerCase()) {
      case 'business':
        return isPriceAnnual 
          ? `${baseUrl}geocentric-plugin-business-annual${suffix}`
          : `${baseUrl}geocentric-plugin-business-monthly${suffix}`
      case 'professional':
        return isPriceAnnual 
          ? `${baseUrl}geocentric-plugin-professional-annual${suffix}`
          : `${baseUrl}geocentric-plugin-professional-monthly${suffix}`
      case 'agency':
        return `${baseUrl}geocentric-plugin-agency-lifetime${suffix}`
      default:
        return '#'
    }
  }

  // FAQ data
  const faqs = [
    {
      question: "What specific location data does the Geocentric Plugin automatically pull?",
      answer: "The plugin pulls 7 comprehensive data types for any location: real-time local weather conditions, detailed area history and population demographics, neighborhood breakdowns with local insights, curated things to do and attractions, public transportation including bus stops and routes, turn-by-turn driving directions from competitor locations to your business, and interactive local maps. All data is sourced from Google and other authoritative APIs to ensure accuracy and reliability."
    },
    {
      question: "How quickly will I see SEO improvements after installing the plugin?",
      answer: "Most users see initial improvements within 1-2 weeks, with significant ranking boosts typically occurring within 30 days. The embedded location data creates immediate relevance signals that Google recognizes, helping establish your site's local authority. However, results can vary based on competition level, existing site authority, and how many location pages you create."
    },
    {
      question: "Is the plugin compatible with my website platform?",
      answer: "The Geocentric Plugin is designed exclusively for WordPress websites. It integrates seamlessly with WordPress through shortcodes and widgets, ensuring optimal performance and compatibility. For non-WordPress sites, you'll need to migrate to WordPress or consider our other SEO tools that may be platform-agnostic."
    },
    {
      question: "How fresh and accurate is the location data?",
      answer: "All data is pulled in real-time or refreshed daily depending on the data type. Weather information updates every few hours, while demographic and business data refreshes weekly. Historical information and neighborhood details are verified against multiple authoritative sources. If you notice any outdated information, our support team can trigger manual updates."
    },
    {
      question: "Can I customize which data appears on my location pages?",
      answer: "You have control over which of the 7 data types to display and can customize the basic layout and styling to match your brand. However, the plugin automatically selects the most relevant neighborhoods and local information based on your chosen location. Maps display with standard settings optimized for local SEO impact."
    },
    {
      question: "Do you offer a free trial, and what's the setup process like?",
      answer: "Yes, we offer free trials on request - just contact our support team. Setup typically takes 5-10 minutes: install the WordPress plugin, enter your target locations, choose your data preferences, and embed the content using shortcodes. No coding knowledge required. Our team provides setup assistance and can even handle the initial configuration for agency clients."
    },
    {
      question: "What happens if I want to target multiple cities or expand later?",
      answer: "Easy! You can add unlimited locations with any plan. Simply enter new cities/towns in the WordPress dashboard, and the plugin automatically pulls all relevant data. This is perfect for businesses with multiple service areas, franchises, or agencies managing clients across different markets. Bulk location import is available for larger implementations."
    },
    {
      question: "Is there white-label licensing available for agencies and resellers?",
      answer: "Yes! We offer white-label solutions for agencies, allowing you to rebrand the plugin and offer it to your clients under your own name. Volume discounts are available for bulk purchases. Contact our team to discuss custom pricing, co-branding options, and agency partnership opportunities."
    }
  ]

  // Benefits data
  const benefits = [
    {
      icon: "🌤️",
      title: "Rich Location Data from Google",
      description: "Automatically pulls local weather, history, population, neighborhoods, things to do, bus stops, and driving directions for any city or town you choose."
    },
    {
      icon: "🗺️",
      title: "Interactive Maps & Directions",
      description: "Embed local maps and driving directions from competitors to your business location, creating valuable location-specific content that Google recognizes."
    },
    {
      icon: "🎯",
      title: "SEO Relevance Signals",
      description: "All embedded data creates strong relevance signals to Google, showing your website's connection to the local area and boosting your local search rankings."
    },
    {
      icon: "⚡",
      title: "One-Click Implementation",
      description: "Simply choose your target location and embed all the data instantly. No manual research or content creation needed - everything is automated."
    }
  ]

  // Testimonials data
  const testimonials = [
    {
      name: "Casey Odom",
      role: "SEO Specialist",
      company: "Digital Marketing",
      content: "I created location and neighborhood pages for a client using the geocentric plugin. Got them indexed, and within three days I am pulling top spot in organic in almost All locations, and in one instance, top TWO spots. Very impressed with the results.",
      avatar: "/testimonials/casey odom.png"
    },
    {
      name: "Ceasar Sal",
      role: "SEO Professional",
      company: "Local SEO Expert",
      content: "I tested it on an all red geogrid, plumbing site. The plugin pulled the geo-data automagically and all I had to do is embed it to my service area page. After a week, the geogrid went from all red to yellow. After another week, the geogrid is now having greens!",
      avatar: "/testimonials/ceasar Sal.png"
    },
    {
      name: "Leandra Nash",
      role: "Agency Owner",
      company: "SEO Agency",
      content: "I tested it on a pet shop site that was languishing on page 4. In a matter of days, it's now top of page 2. And all I had to do was install and relax. I'm impressed and so is my team. It's a no-brainer, really.",
      avatar: "/testimonials/Leandra Nash.png"
    },
    {
      name: "Griffin Baxter",
      role: "Digital Marketing Manager",
      company: "TechFlow Solutions",
      content: "Been running this on my roofing client's site for 2 months now. The local pack rankings jumped from nowhere to consistently showing in the top 3. The weather data and neighborhood info really made the location pages stand out to Google.",
      avatar: "/testimonials/Griffin Baxter.png"
    },
    {
      name: "Simeon Holt",
      role: "Freelance SEO Consultant",
      company: "Martinez Digital",
      content: "Just finished implementing this for a dental practice with 5 locations. Each location page now has local history, things to do, and driving directions embedded. All 5 locations are now ranking on page 1 for their local keywords.",
      avatar: "/testimonials/Simeon Holt.png"
    },
    {
      name: "John Anderson",
      role: "Marketing Director",
      company: "Home Services Group",
      content: "We manage 15+ contractor websites and this plugin has been a game changer. What used to take our team hours of manual location research - population data, local attractions, bus routes - now happens automatically. ROI has been incredible.",
      avatar: "/testimonials/John Anderson.png"
    }
  ]

  // Testimonials scroll functions
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

  const updateTestimonialsScrollState = () => {
    const container = document.getElementById('testimonials-container')
    if (!container) return
    
    // Always enable arrows for continuous loop
    setCanScrollTestimonialsLeft(true)
    setCanScrollTestimonialsRight(true)
  }

  // Drag scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = document.getElementById('testimonials-container')
    if (!container) return
    
    setIsDragging(true)
    setDragStart({
      x: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft
    })
    container.style.cursor = 'grabbing'
    container.style.userSelect = 'none'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const container = document.getElementById('testimonials-container')
    if (!container) return
    
    e.preventDefault()
    const x = e.pageX - container.offsetLeft
    const walk = (x - dragStart.x) * 2 // Multiply for faster scroll
    container.scrollLeft = dragStart.scrollLeft - walk
  }

  const handleMouseUp = () => {
    const container = document.getElementById('testimonials-container')
    if (container) {
      container.style.cursor = 'grab'
      container.style.userSelect = 'auto'
    }
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    const container = document.getElementById('testimonials-container')
    if (container) {
      container.style.cursor = 'grab'
      container.style.userSelect = 'auto'
    }
    setIsDragging(false)
    setIsTestimonialsHovered(false)
  }

  // Benefit card tilt animation handlers
  const handleBenefitMouseMove = (e: React.MouseEvent<HTMLDivElement>, benefitIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setBenefitMousePosition({ x, y })
    setHoveredBenefit(benefitIndex)
  }

  const handleBenefitMouseLeave = () => {
    setHoveredBenefit(null)
    setBenefitMousePosition({ x: 0, y: 0 })
  }

  // Benefits container hover handlers (like homepage grid)
  const handleBenefitsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setBenefitsMousePosition({ x, y })
    setIsBenefitsHovered(true)
  }

  const handleBenefitsMouseLeave = () => {
    setIsBenefitsHovered(false)
    setBenefitsMousePosition({ x: 0, y: 0 })
  }

  const getBenefitCardTransform = (benefitIndex: number) => {
    if (hoveredBenefit !== benefitIndex) return 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    
    const rotateX = -benefitMousePosition.y * 0.05
    const rotateY = benefitMousePosition.x * 0.05
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`
  }

  const getBenefitCardShadow = (benefitIndex: number) => {
    if (hoveredBenefit !== benefitIndex) {
      return '0 4px 8px rgba(0, 0, 0, 0.2)'
    }
    
    const shadowOffsetX = benefitMousePosition.x * 0.02
    const shadowOffsetY = benefitMousePosition.y * 0.02
    
    return `${shadowOffsetX}px ${8 + shadowOffsetY}px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)`
  }

  // Pricing data
  const pricing = [
    {
      name: "Business",
      description: "Perfect for small businesses and startups",
      monthlyPrice: 19,
      annualPrice: 190,
      lifetimePrice: null,
      features: [
        "1 Site Activation",
        "7 types of location data",
        "Weather & local history",
        "Neighborhoods & attractions",
        "Maps & driving directions",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      description: "Ideal for growing businesses and professionals",
      monthlyPrice: 49,
      annualPrice: 490,
      lifetimePrice: null,
      features: [
        "100 Site Activations",
        "All 7 types of location data",
        "Weather, history, population",
        "Bus stops & directions",
        "Bulk location embedding",
        "Priority email support"
      ],
      popular: true
    },
    {
      name: "Agency",
      description: "Built for agencies and large organizations",
      monthlyPrice: null,
      annualPrice: null,
      lifetimePrice: 297,
      features: [
        "200 Site Activations",
        "Unlimited location pages",
        "All data types included",
        "White-label options",
        "Priority support",
        "Bulk activation tools"
      ],
      popular: false
    }
  ]

  const themeClasses = isDarkMode 
    ? "bg-black text-white" 
    : "bg-white text-black"

  const cardClasses = isDarkMode
    ? "bg-white/5 border-white/10 hover:bg-white/10"
    : "bg-black/5 border-black/10 hover:bg-black/10"

  return (
    <>
      <Head>
        <title>Geocentric Plugin - WordPress Local SEO Plugin | Embed Google Location Data for Better Rankings</title>
        <meta name="description" content="Boost local SEO with Geocentric Plugin for WordPress. Automatically embed Google location data: weather, demographics, maps, directions. 1,100+ activations. Start free trial." />
        <meta name="keywords" content="local SEO plugin, WordPress SEO, location data, Google maps, local search rankings, geocentric plugin, SEO tools" />
        <meta property="og:title" content="Geocentric Plugin - WordPress Local SEO Plugin | Embed Google Location Data" />
        <meta property="og:description" content="Boost local SEO with Geocentric Plugin for WordPress. Automatically embed Google location data: weather, demographics, maps, directions. 1,100+ activations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://seorockettools.com/products/geocentric-plugin" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Geocentric Plugin - WordPress Local SEO Plugin" />
        <meta name="twitter:description" content="Boost local SEO with Geocentric Plugin. Automatically embed Google location data for better local search rankings." />
        <link rel="canonical" href="https://seorockettools.com/products/geocentric-plugin" />
        
        {/* Preload critical assets */}
        <link
          rel="preload"
          href={isDarkMode ? "/seo-rocket-light.svg" : "/seo-rocket-dark.svg"}
          as="image"
        />
        <link
          rel="preload"
          href="/geocentric-demo.gif"
          as="image"
        />
      </Head>
      
      <main className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
        {/* Theme Switcher */}
        <div className="fixed top-6 left-6 z-50 flex gap-3">
          {/* Back to Home Button */}
          <Link
            href="/"
            className={`px-4 py-3 rounded-full border transition-all duration-300 flex items-center gap-2 ${
              isDarkMode 
                ? "bg-white/10 border-white/20 text-white hover:bg-white/20" 
                : "bg-black/10 border-black/20 text-black hover:bg-black/20"
            }`}
            title="Back to homepage"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back to home</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full border transition-all duration-300 ${
              isDarkMode 
                ? "bg-white/10 border-white/20 text-white hover:bg-white/20" 
                : "bg-black/10 border-black/20 text-black hover:bg-black/20"
            }`}
            title="Toggle theme"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Hero Section with Critical CSS Classes */}
        <header className="hero-section px-4 sm:px-6 py-16 sm:py-24 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Logo with Critical CSS */}
            <div className="logo-container mb-12 sm:mb-16 text-center">
              <Link href="/">
                <Image
                  src={isDarkMode ? "/seo-rocket-light.svg" : "/seo-rocket-dark.svg"}
                  alt="SEO Rocket Tools - Professional WordPress SEO Plugins and Local Search Optimization Software"
                  width={200}
                  height={60}
                  className="mx-auto w-[160px] sm:w-[200px] h-[48px] sm:h-[60px] object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Centered content layout with Critical CSS */}
            <div className="text-center space-y-12 sm:space-y-16">
              {/* Title and Description with Critical CSS */}
              <div className="space-y-8 sm:space-y-10 max-w-5xl mx-auto">
                <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                  Geocentric{' '}
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Plugin
                  </span>
                </h1>
                
                <p className={`hero-description text-xl leading-relaxed max-w-4xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Choose any city or town and <strong className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>instantly embed</strong> <strong className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>hyper-relevant location data</strong> from <strong className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>Google</strong>: local weather, history & population, neighborhoods, things to do, bus stops, driving directions, and local maps. 
                  Create location pages that <strong className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>Google loves</strong> for <strong className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>maximum SEO impact</strong>.
                </p>

                <div className="hero-cta flex justify-center pt-6">
                  <button 
                    onClick={scrollToPricing}
                    className={`group relative px-8 py-4 text-lg font-semibold rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden ${
                      isDarkMode 
                        ? "border-white/20 text-white hover:border-white/40" 
                        : "border-black/20 text-black hover:border-black/40"
                    }`}
                  >
                    {/* Button background gradient */}
                    <div className={`absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                      isDarkMode 
                        ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10" 
                        : "bg-gradient-to-r from-purple-500/5 to-blue-500/5"
                    }`}></div>
                    
                    {/* Button text */}
                    <span className="relative z-10 flex items-center gap-2">
                      Start for Free
                      <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>

              {/* Demo Showcase with Critical CSS */}
              <div className="relative max-w-6xl mx-auto pt-4 sm:pt-6">
                <div className="relative group">
                  {isDarkMode && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/8 to-blue-500/8 rounded-3xl blur-3xl scale-105 opacity-50 group-hover:opacity-70 transition-all duration-700"></div>
                  )}
                  
                  <div className={`relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border transition-all duration-500 hover:shadow-2xl ${
                    isDarkMode 
                      ? 'border-white/5 shadow-black/20 hover:border-white/10' 
                      : 'border-black/5 shadow-black/10 hover:border-black/10'
                  }`}>
                    <Image
                      src="/geocentric-demo.gif"
                      alt="Geocentric WordPress Plugin demo showing automatic Google location data embedding for local SEO - weather, demographics, maps, and directions integration workflow"
                      width={1200}
                      height={675}
                      className="w-full h-auto object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Key Benefits Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                7 Types of Location Data, Instantly Embedded
              </h2>
              <p className={`text-lg sm:text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Choose any location and automatically pull comprehensive data from Google and other sources. Every piece of content strengthens your site's local relevance signals.
              </p>
            </div>

            {/* Benefits Grid with Container Hover Effect */}
            <div 
              className="relative"
              onMouseMove={handleBenefitsMouseMove}
              onMouseLeave={handleBenefitsMouseLeave}
            >
              {/* Floating Glow Effect - Follows Mouse */}
              <div 
                className="absolute w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-300 ease-out pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)',
                  opacity: isBenefitsHovered ? 0.2 : 0,
                  left: isBenefitsHovered ? `${benefitsMousePosition.x - 300}px` : '20%',
                  top: isBenefitsHovered ? `${benefitsMousePosition.y - 300}px` : '40%',
                  transform: 'translate(0, 0)',
                  zIndex: -1
                }}
              />

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${cardClasses}`}
                    style={{
                      transform: getBenefitCardTransform(index),
                      boxShadow: getBenefitCardShadow(index),
                    }}
                    onMouseMove={(e) => handleBenefitMouseMove(e, index)}
                    onMouseLeave={handleBenefitMouseLeave}
                  >
                    <div className="text-4xl mb-4">{benefit.icon}</div>
                    <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section - Dynamically Loaded */}
        <Suspense fallback={
          <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-96 rounded-xl">
            <div className="max-w-6xl mx-auto px-4 py-16">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        }>
          <TestimonialsSection 
            isDarkMode={isDarkMode}
            testimonials={testimonials}
            isTestimonialsHovered={isTestimonialsHovered}
            setIsTestimonialsHovered={setIsTestimonialsHovered}
            handleMouseLeave={handleMouseLeave}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            handleMouseUp={handleMouseUp}
            cardClasses={cardClasses}
          />
        </Suspense>

        {/* Pricing Section */}
        <section id="pricing-section" className="px-4 sm:px-6 py-16 sm:py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className={`text-lg sm:text-xl max-w-3xl mx-auto mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Choose the perfect plan for your needs. Start with 1 site activation or scale up to 200+ sites for agencies.
              </p>

              {/* Premium Pricing Toggle */}
              <div className="relative mb-6 sm:mb-8 max-w-md mx-auto">
                <div className={`relative p-1.5 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 shadow-lg shadow-black/20' 
                    : 'bg-black/5 border-black/10 shadow-lg shadow-black/5'
                }`}>
                  {/* Sliding Background Indicator */}
                  <div 
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-500 ease-out shadow-lg ${
                      isDarkMode 
                        ? 'bg-white shadow-white/20' 
                        : 'bg-black shadow-black/20'
                    }`}
                    style={{
                      transform: isPriceAnnual ? 'translateX(calc(100% + 12px))' : 'translateX(0)',
                    }}
                  />
                  
                  {/* Toggle Buttons */}
                  <div className="relative flex">
                    <button
                      onClick={() => setIsPriceAnnual(false)}
                      className={`flex-1 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 relative z-10 ${
                        !isPriceAnnual 
                          ? (isDarkMode ? 'text-black' : 'text-white')
                          : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-black/70 hover:text-black/90')
                      }`}
                    >
                      Monthly
                    </button>
                    
                    <button
                      onClick={() => setIsPriceAnnual(true)}
                      className={`flex-1 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${
                        isPriceAnnual 
                          ? (isDarkMode ? 'text-black' : 'text-white')
                          : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-black/70 hover:text-black/90')
                      }`}
                    >
                      Annual
                      {/* Premium Savings Badge */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                        isPriceAnnual
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-100'
                          : isDarkMode
                            ? 'bg-emerald-500/20 text-emerald-400 scale-95'
                            : 'bg-emerald-500/20 text-emerald-600 scale-95'
                      }`}>
                        Save 17%
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Subtle glow effect when annual is selected */}
                {isPriceAnnual && (
                  <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-xl scale-110 -z-10 opacity-60"></div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricing.map((plan, index) => (
                <div
                  key={index}
                  className={`p-8 rounded-2xl border transition-all duration-300 hover:scale-105 relative flex flex-col h-full ${
                    plan.popular 
                      ? (isDarkMode ? 'border-purple-500/50 bg-purple-500/10' : 'border-purple-500/50 bg-purple-500/10')
                      : cardClasses
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {plan.description}
                    </p>
                    <div className="text-4xl font-bold mb-2">
                      {plan.lifetimePrice ? (
                        <>
                          ${plan.lifetimePrice}
                          <span className="text-lg font-normal"> lifetime</span>
                        </>
                      ) : (
                        <>
                          ${isPriceAnnual ? Math.round((plan.annualPrice || 0) / 12) : plan.monthlyPrice}
                          <span className="text-lg font-normal">/month</span>
                        </>
                      )}
                    </div>
                    {!plan.lifetimePrice && isPriceAnnual && plan.annualPrice && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Billed annually
                      </p>
                    )}
                    {plan.lifetimePrice && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        One-time payment
                      </p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => window.open(getPurchaseUrl(plan.name), '_blank', 'noopener,noreferrer')}
                    className={`w-full py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 mt-auto ${
                      plan.popular 
                        ? (isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800')
                        : (isDarkMode ? 'border border-white/20 text-white hover:bg-white/10' : 'border border-black/20 text-black hover:bg-black/10')
                    }`}
                  >
                    {plan.lifetimePrice ? 'Get Started' : 'Start for Free'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section - Dynamically Loaded */}
        <Suspense fallback={
          <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-96 rounded-xl">
            <div className="max-w-4xl mx-auto px-4 py-16">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        }>
          <FAQSection 
            isDarkMode={isDarkMode}
            faqs={faqs}
            openFaq={openFaq}
            setOpenFaq={setOpenFaq}
          />
        </Suspense>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Dominate Local Search?
            </h2>
            <p className={`text-lg sm:text-xl mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Join 1,100+ successful site activations. Start embedding hyper-relevant location data and watch your local rankings soar.
            </p>
            <div className="flex justify-center">
              <button 
                onClick={scrollToPricing}
                className={`group relative px-8 py-4 text-lg font-semibold rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden ${
                  isDarkMode 
                    ? "border-white/20 text-white hover:border-white/40" 
                    : "border-black/20 text-black hover:border-black/40"
                }`}
              >
                {/* Button background gradient */}
                <div className={`absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10" 
                    : "bg-gradient-to-r from-purple-500/5 to-blue-500/5"
                }`}></div>
                
                {/* Button text */}
                <span className="relative z-10 flex items-center gap-2">
                  Start for Free
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}