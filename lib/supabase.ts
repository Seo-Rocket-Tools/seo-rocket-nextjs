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
  tags: string[] | string // Keep for backward compatibility during migration
  published: boolean
  featured: boolean
  free: boolean
  image_url: string
  created_at: string
  priority: number
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

export interface ProductTag {
  id: string
  product_id: string
  tag_id: string
  order_position: number
  created_at: string
}

export interface ProductWithTags extends Omit<Product, 'tags'> {
  product_tags: Array<{
    id: string
    tag_id: string
    order_position: number
    tag: Tag
  }>
}

// Database functions - Updated to use junction table by default
export async function getActiveProducts(): Promise<Product[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  // Try to use the old method first for backward compatibility
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('published', true)
    .order('priority', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

export async function getActiveProductsWithTags(): Promise<ProductWithTags[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_tags(
        id,
        tag_id,
        order_position,
        tag:tags(id, name, created_at)
      )
    `)
    .eq('published', true)
    .order('priority', { ascending: true })

  if (error) {
    console.error('Error fetching active products with tags:', error)
    return []
  }

  return data || []
}

export async function getAllProducts(): Promise<Product[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('priority', { ascending: true })

  if (error) {
    console.error('Error fetching all products:', error)
    return []
  }

  return data || []
}

export async function getAllProductsWithTags(): Promise<ProductWithTags[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_tags(
        id,
        tag_id,
        order_position,
        tag:tags(id, name, created_at)
      )
    `)
    .order('priority', { ascending: true })

  if (error) {
    console.error('Error fetching all products with tags:', error)
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
    .order('priority', { ascending: true })

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data || []
}

export async function getFeaturedProductsWithTags(): Promise<ProductWithTags[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_tags(
        id,
        tag_id,
        order_position,
        tag:tags(id, name, created_at)
      )
    `)
    .eq('published', true)
    .eq('featured', true)
    .order('priority', { ascending: true })

  if (error) {
    console.error('Error fetching featured products with tags:', error)
    return []
  }

  return data || []
}

export async function getProductsByTag(tagName: string, includeUnpublished: boolean = false): Promise<Product[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  if (tagName === 'All') {
    return includeUnpublished ? getAllProducts() : getActiveProducts()
  }
  
  if (tagName === 'Featured') {
    if (includeUnpublished) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .order('priority', { ascending: true })

      if (error) {
        console.error('Error fetching all featured products:', error)
        return []
      }

      return data || []
    } else {
      return getFeaturedProducts()
    }
  }

  if (tagName === 'Free') {
    const query = supabase
      .from('products')
      .select('*')
      .eq('free', true)
      .order('priority', { ascending: true })

    if (!includeUnpublished) {
      query.eq('published', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching free products:', error)
      return []
    }

    return data || []
  }

  // Try junction table approach first (for new system)
  try {
    const query = supabase
      .from('products')
      .select(`
        *,
        product_tags!inner(
          order_position,
          tag:tags!inner(name)
        )
      `)
      .eq('product_tags.tag.name', tagName)
      .order('product_tags.order_position', { ascending: true })

    if (!includeUnpublished) {
      query.eq('published', true)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      console.log('Successfully used junction table for tag:', tagName)
      return data
    }
    
    console.log('Junction table query returned no results or failed, falling back to array method for tag:', tagName)
  } catch (error) {
    console.log('Junction table approach failed, falling back to array method for tag:', tagName, error)
  }

  // Fallback to old array-based approach
  console.log('Using array-based fallback for tag:', tagName)
  const query = supabase
    .from('products')
    .select('*')
    .contains('tags', [tagName])
    .order('priority', { ascending: true })

  if (!includeUnpublished) {
    query.eq('published', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products by tag (array fallback):', error)
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

export async function getAvailableTagsFromProducts(includeUnpublished: boolean = false): Promise<string[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning default tags')
    return ['Featured', 'Free', 'All']
  }

  try {
    let query
    
    if (!includeUnpublished) {
      // Filter out tags from unpublished products
      query = supabase
        .from('product_tags')
        .select(`
          tag:tags(name),
          product:products!inner(published)
        `)
        .eq('products.published', true)
        .order('tags.name')
    } else {
      // Get all tags regardless of product publish status
      query = supabase
        .from('product_tags')
        .select(`
          tag:tags(name)
        `)
        .order('tags.name')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tags from junction table:', error)
      throw error
    }

    // Extract unique tag names
    const tagSet = new Set<string>()
    data?.forEach((item: any) => {
      if (item.tag?.name) {
        tagSet.add(item.tag.name)
      }
    })

    // Add system tags
    const systemTags = ['Featured', 'Free', 'All']
    const availableTags = [...systemTags, ...Array.from(tagSet).sort()]

    console.log('Available tags from junction table:', availableTags)
    return availableTags

  } catch (error) {
    console.error('Junction table approach failed, falling back to simple tag list:', error)
    
    // Fallback: get all tags from the tags table
    try {
      const { data: allTags, error: tagError } = await supabase
        .from('tags')
        .select('name')
        .order('name')

      if (!tagError && allTags) {
        const tagNames = allTags.map(tag => tag.name)
        const systemTags = ['Featured', 'Free', 'All']
        return [...systemTags, ...tagNames]
      }
    } catch (fallbackError) {
      console.error('Fallback tag fetch also failed:', fallbackError)
    }

    return ['Featured', 'Free', 'All']
  }
}

// New functions for managing product-tag relationships and ordering

export async function getProductsWithTagsByTag(tagName: string, includeUnpublished: boolean = false): Promise<ProductWithTags[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const query = supabase
    .from('products')
    .select(`
      *,
      product_tags!inner(
        id,
        tag_id,
        order_position,
        tag:tags!inner(id, name)
      )
    `)
    .eq('product_tags.tag.name', tagName)
    .order('product_tags.order_position', { ascending: true })

  if (!includeUnpublished) {
    query.eq('published', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products with tags:', error)
    return []
  }

  return data || []
}

export async function addProductToTag(productId: string, tagId: string, orderPosition?: number): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  // If no order position specified, add to the end
  if (orderPosition === undefined) {
    const { data: existingTags } = await supabase
      .from('product_tags')
      .select('order_position')
      .eq('tag_id', tagId)
      .order('order_position', { ascending: false })
      .limit(1)
    
    orderPosition = existingTags && existingTags.length > 0 ? existingTags[0].order_position + 1 : 0
  }

  const { error } = await supabase
    .from('product_tags')
    .insert({
      product_id: productId,
      tag_id: tagId,
      order_position: orderPosition
    })

  if (error) {
    console.error('Error adding product to tag:', error)
    return false
  }

  return true
}

export async function removeProductFromTag(productId: string, tagId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  const { error } = await supabase
    .from('product_tags')
    .delete()
    .eq('product_id', productId)
    .eq('tag_id', tagId)

  if (error) {
    console.error('Error removing product from tag:', error)
    return false
  }

  return true
}

export async function updateProductTagOrder(productId: string, tagId: string, newOrderPosition: number): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  const { error } = await supabase
    .from('product_tags')
    .update({ order_position: newOrderPosition })
    .eq('product_id', productId)
    .eq('tag_id', tagId)

  if (error) {
    console.error('Error updating product tag order:', error)
    return false
  }

  return true
}

export async function reorderProductsInTag(tagId: string, productIdOrder: string[]): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    // Update all products in the tag with new order positions
    const updates = productIdOrder.map((productId, index) => ({
      product_id: productId,
      tag_id: tagId,
      order_position: index
    }))

    // Use upsert to update order positions
    const { error } = await supabase
      .from('product_tags')
      .upsert(updates, { 
        onConflict: 'product_id,tag_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error reordering products in tag:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in reorderProductsInTag:', error)
    return false
  }
}

export async function getProductTagsByTag(tagId: string): Promise<ProductTag[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('product_tags')
    .select('*')
    .eq('tag_id', tagId)
    .order('order_position', { ascending: true })

  if (error) {
    console.error('Error fetching product tags:', error)
    return []
  }

  return data || []
} 