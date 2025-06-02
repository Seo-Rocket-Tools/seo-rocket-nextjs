"use client"

export default function Footer() {
  return (
    <footer className="px-4 sm:px-6 py-8 sm:py-12 pt-16 sm:pt-24 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Footer Links */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-6 sm:mb-8">
          <a 
            href="https://seorocket.notion.site/seorocket/SEO-Rocket-Refund-Policy-cf90d3f98cdf4b0da5fe3e58bb75405a"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-xs sm:text-sm font-medium"
          >
            Refund Policy
          </a>
          <a 
            href="https://seorocket.notion.site/seorocket/SEO-Rocket-Refund-Policy-cf90d3f98cdf4b0da5fe3e58bb75405a"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-xs sm:text-sm font-medium"
          >
            Privacy Policy
          </a>
          <a 
            href="https://seorocket.notion.site/SEO-Rocket-Tools-Terms-and-Conditions-367d487eeb13438ab3bceecbfe2b27e6?pvs=4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-xs sm:text-sm font-medium"
          >
            Terms & Conditions
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-gray-500 text-xs sm:text-sm px-4">
            All Rights Reserved Copyright 2025 - Designed by SEO Rocket. 💗
          </p>
        </div>
      </div>
    </footer>
  )
} 