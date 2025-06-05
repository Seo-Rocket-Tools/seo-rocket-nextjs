import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const productsPath = join(process.cwd(), 'app', '(public)', 'products')
    
    // Read the products directory
    const entries = await readdir(productsPath, { withFileTypes: true })
    
    // Filter for directories (each directory represents a product page)
    const productUrls = entries
      .filter(entry => entry.isDirectory())
      .map(entry => `/products/${entry.name}`)
      .sort() // Sort alphabetically
    
    return NextResponse.json({ urls: productUrls })
  } catch (error) {
    console.error('Error reading products directory:', error)
    
    // Fallback to some default URLs if directory can't be read
    const fallbackUrls = [
      '/products/geocentric-plugin'
    ]
    
    return NextResponse.json({ 
      urls: fallbackUrls,
      error: 'Could not read products directory, using fallback URLs'
    })
  }
} 