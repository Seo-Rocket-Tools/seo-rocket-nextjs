import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'

export const metadata = {
  title: 'Sitemap | SEO Rocket',
  description: 'Find all pages on SEO Rocket website. Complete sitemap for easy navigation.',
}

interface SitemapItem {
  title: string
  url: string
  description: string
}

export default function SitemapPage() {
  const sitemapItems = getSitemapItems()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Sitemap
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover all pages and resources available on SEO Rocket
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {sitemapItems.map((section, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link 
                      href={item.url}
                      className="group flex flex-col hover:text-blue-400 transition-colors duration-300"
                    >
                      <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">
                        {item.title}
                      </span>
                      {item.description && (
                        <span className="text-sm text-gray-400 mt-1">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 text-purple-400">
            Additional Resources
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <a 
              href="https://seorocket.notion.site/seorocket/SEO-Rocket-Refund-Policy-cf90d3f98cdf4b0da5fe3e58bb75405a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-purple-400 transition-colors duration-300 font-medium"
            >
              Refund Policy ↗
            </a>
            <a 
              href="https://seorocket.notion.site/seorocket/SEO-Rocket-Refund-Policy-cf90d3f98cdf4b0da5fe3e58bb75405a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-purple-400 transition-colors duration-300 font-medium"
            >
              Privacy Policy ↗
            </a>
            <a 
              href="https://seorocket.notion.site/SEO-Rocket-Tools-Terms-and-Conditions-367d487eeb13438ab3bceecbfe2b27e6?pvs=4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-purple-400 transition-colors duration-300 font-medium"
            >
              Terms & Conditions ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function getSitemapItems(): Array<{ title: string; items: SitemapItem[] }> {
  const sections = [
    {
      title: "Main Pages",
      items: [
        {
          title: "Home",
          url: "/",
          description: "SEO Rocket homepage with all our tools and features"
        },
        {
          title: "HTML Sitemap",
          url: "/sitemap.html",
          description: "This page - complete site navigation"
        }
      ]
    }
  ]

  // Dynamically add pages from the (public) route group
  try {
    const publicDir = join(process.cwd(), 'app', '(public)')
    const dynamicPages = getDynamicSitemapItems(publicDir, '')
    
    if (dynamicPages.length > 0) {
      sections.push({
        title: "Products & Services",
        items: dynamicPages
      })
    }
  } catch (error) {
    console.log('Error generating dynamic sitemap items:', error)
  }

  return sections
}

function getDynamicSitemapItems(dir: string, route: string): SitemapItem[] {
  const items: SitemapItem[] = []
  
  try {
    const dirItems = readdirSync(dir)
    
    for (const item of dirItems) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Skip if it's a route group or excluded directory
        if (item.startsWith('(') && item.endsWith(')') || 
            ['admin', 'api', 'auth', 'login', 'register', 'forgot-password', 'reset-password'].includes(item)) {
          continue
        }
        
        const newRoute = route ? `${route}/${item}` : `/${item}`
        
        // Check if directory has a page file
        const pageFiles = ['page.tsx', 'page.js', 'page.ts']
        const hasPage = pageFiles.some(file => {
          try {
            statSync(join(fullPath, file))
            return true
          } catch {
            return false
          }
        })
        
        if (hasPage) {
          // Convert route to readable title
          const title = item
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          items.push({
            title,
            url: newRoute,
            description: `${title} page`
          })
        }
        
        // Recursively check subdirectories
        const subItems = getDynamicSitemapItems(fullPath, newRoute)
        items.push(...subItems)
      }
    }
  } catch (error) {
    console.log(`Error reading directory ${dir}:`, error)
  }
  
  return items
} 