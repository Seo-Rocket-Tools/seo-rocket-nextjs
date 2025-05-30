import { NextRequest, NextResponse } from 'next/server'
import { SoftwareData } from '../../../data/software-loader'

export async function POST(request: NextRequest) {
  try {
    const data: SoftwareData = await request.json()
    
    // On static hosting platforms like Netlify, we can't write to files
    // Return success but log that this is a read-only environment
    console.log('Static hosting detected - data cannot be persisted to file system')
    console.log('Updated data would be:', JSON.stringify(data, null, 2))
    
    return NextResponse.json({ 
      success: false, 
      message: 'Static hosting detected - use localStorage fallback' 
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
    // Load the static data
    const { loadSoftwareData } = await import('../../../data/software-loader')
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