import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using fallback to JSON data.')
  console.warn('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Types based on the database schema
export interface Product {
  id: string
  software_name: string
  slug: string
  description: string
  emoji: string
  url: string
  tags: string[] | string // Support both array and string formats for flexibility
  published: boolean
  featured: boolean
  free: boolean
  image_url: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

// Database functions
export async function getActiveProducts(): Promise<Product[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data || []
}

export async function getProductsByTag(tagName: string): Promise<Product[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  if (tagName === 'All') {
    return getActiveProducts()
  }
  
  if (tagName === 'Featured') {
    return getFeaturedProducts()
  }

  if (tagName === 'Free') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('published', true)
      .eq('free', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching free products:', error)
      return []
    }

    return data || []
  }

  // Use PostgreSQL array contains operator for array-based tags
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('published', true)
    .contains('tags', [tagName])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by tag:', error)
    return []
  }

  return data || []
}

export async function getAllTags(): Promise<Tag[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  return data || []
}

export async function getAvailableTagsFromProducts(): Promise<string[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning default tags')
    return ['Featured', 'Free', 'All']
  }

  const products = await getActiveProducts()
  const tagSet = new Set<string>()
  
  // Extract tags from products - handle both array and string formats
  products.forEach(product => {
    if (product.tags) {
      let tags: string[] = []
      
      if (Array.isArray(product.tags)) {
        // Tags are already an array
        tags = product.tags.filter(tag => tag && tag.trim().length > 0)
      } else if (typeof product.tags === 'string') {
        // Tags are a comma-separated string
        tags = product.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }
      
      tags.forEach(tag => tagSet.add(tag))
    }
  })
  
  // Get predefined tags from tags table
  const predefinedTags = await getAllTags()
  const predefinedTagNames = predefinedTags.map(tag => tag.name)
  
  // Combine system tags, predefined tags, and dynamic tags
  const systemTags = ['Featured', 'Free', 'All']
  const dynamicTags = Array.from(tagSet).filter(tag => 
    !predefinedTagNames.includes(tag) && !systemTags.includes(tag)
  )
  
  return [...systemTags, ...predefinedTagNames, ...dynamicTags]
} 