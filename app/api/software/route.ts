import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { SoftwareData } from '../../../data/software-loader'

export async function POST(request: NextRequest) {
  try {
    const data: SoftwareData = await request.json()
    
    // Path to the software.json file
    const filePath = join(process.cwd(), 'data', 'software.json')
    
    // Write the updated data to the JSON file
    await writeFile(filePath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true, message: 'Data saved successfully' })
  } catch (error) {
    console.error('Error saving software data:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // This could be used to fetch the latest data if needed
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