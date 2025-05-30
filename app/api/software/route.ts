import { NextRequest, NextResponse } from 'next/server'
import { loadSoftwareData } from '../../../data/software-loader'
import { supabase, Product } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        message: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.' 
      })
    }
    
    // Handle adding/updating software items in Supabase
    if (data.software && Array.isArray(data.software)) {
      for (const item of data.software) {
        const productData: Partial<Product> = {
          software_name: item.name,
          slug: item.id,
          description: item.description,
          emoji: item.icon,
          url: item.url,
          tags: item.tags.join(', '),
          published: item.status === 'active',
          featured: item.featured,
          free: item.pricing === 'free',
          image_url: '' // Default empty, can be updated later
        }

        // Use upsert to insert or update
        const { error } = await supabase
          .from('products')
          .upsert(productData, { onConflict: 'slug' })

        if (error) {
          console.error('Error upserting product:', error)
          return NextResponse.json(
            { success: false, message: 'Failed to save product data' },
            { status: 500 }
          )
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data saved successfully to Supabase' 
    })
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Load data from Supabase
    const data = await loadSoftwareData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error loading software data:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load data' },
      { status: 500 }
    )
  }
} 