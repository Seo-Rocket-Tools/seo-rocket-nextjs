import { MetadataRoute } from 'next'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://seorocket.dev'
  
  // Static pages that should always be included
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/sitemap.html`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]

  // Dynamically find pages from the (public) route group
  const dynamicPages = getDynamicPages(baseUrl)

  return [...staticPages, ...dynamicPages]
}

function getDynamicPages(baseUrl: string) {
  const pages: MetadataRoute.Sitemap = []
  
  try {
    // Get pages from the (public) route group
    const publicDir = join(process.cwd(), 'app', '(public)')
    const publicPages = getRoutesFromDirectory(publicDir, '', baseUrl)
    pages.push(...publicPages)
    
    // Add other public routes that are not in the (public) group
    // but should be included (excluding admin, auth, api, etc.)
    
  } catch (error) {
    console.log('Error generating dynamic sitemap:', error)
  }
  
  return pages
}

function getRoutesFromDirectory(dir: string, route: string, baseUrl: string): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = []
  
  try {
    const items = readdirSync(dir)
    
    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Skip if it's a route group (starts and ends with parentheses)
        if (item.startsWith('(') && item.endsWith(')')) {
          continue
        }
        
        // Skip admin, auth, and API routes
        if (['admin', 'api', 'auth', 'login', 'register', 'forgot-password', 'reset-password'].includes(item)) {
          continue
        }
        
        const newRoute = route ? `${route}/${item}` : `/${item}`
        
        // Check if directory has a page.tsx or page.js file
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
          pages.push({
            url: `${baseUrl}${newRoute}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          })
        }
        
        // Recursively check subdirectories
        const subPages = getRoutesFromDirectory(fullPath, newRoute, baseUrl)
        pages.push(...subPages)
      }
    }
  } catch (error) {
    console.log(`Error reading directory ${dir}:`, error)
  }
  
  return pages
} 