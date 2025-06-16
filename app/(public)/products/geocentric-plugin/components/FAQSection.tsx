import React from 'react'

interface FAQ {
  question: string
  answer: string
}

export interface FAQSectionProps {
  isDarkMode: boolean
  faqs: FAQ[]
  openFaq: number | null
  setOpenFaq: (index: number | null) => void
}

export default function FAQSection({
  isDarkMode,
  faqs,
  openFaq,
  setOpenFaq
}: FAQSectionProps) {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-2xl overflow-hidden ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className={`w-full px-6 py-6 text-left flex items-center justify-between transition-colors ${
                  isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}
              >
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <svg
                  className={`w-6 h-6 transition-transform duration-300 ${
                    openFaq === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === index && (
                <div className={`px-6 pb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="leading-relaxed">
                    {faq.answer.split('\n').map((line, lineIndex) => (
                      <React.Fragment key={lineIndex}>
                        {line}
                        {lineIndex < faq.answer.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 