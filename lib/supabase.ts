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
  url: string
  tags: string[] | string // Keep for backward compatibility during migration
  published: boolean
  featured: boolean
  free: boolean
  image_url?: string // Optional since this field might not exist in database
  icon_url: string
  created_at: string
  priority: number
  featured_order: number
  free_order: number
  all_order: number
}

export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  order_index: number
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
    .order('all_order', { ascending: true })

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
    .order('all_order', { ascending: true })

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
    .order('all_order', { ascending: true })

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
        tag:tags(id, name, slug, description, color, created_at)
      )
    `)
    .order('all_order', { ascending: true })

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
    .order('featured_order', { ascending: true })

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
    .order('featured_order', { ascending: true })

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
        .order('featured_order', { ascending: true })

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
      .order('free_order', { ascending: true })

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
    .select('id, name, slug, description, color, order_index, created_at')
    .order('order_index', { ascending: true })

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

  // First, get the product IDs that have the specific tag, along with their order positions
  const { data: productTagsData, error: productTagsError } = await supabase
    .from('product_tags')
    .select(`
      product_id,
      order_position,
      tag:tags!inner(name)
    `)
    .eq('tag.name', tagName)
    .order('order_position', { ascending: true })

  if (productTagsError) {
    console.error('Error fetching product_tags for tag:', productTagsError)
    return []
  }

  if (!productTagsData || productTagsData.length === 0) {
    return []
  }

  // Extract product IDs and create a map of product_id -> order_position
  const productIds = productTagsData.map(pt => pt.product_id)
  const orderPositions = new Map(productTagsData.map(pt => [pt.product_id, pt.order_position]))

  // Now fetch the full products with ALL their tags
  const query = supabase
    .from('products')
    .select(`
      *,
      product_tags(
        id,
        tag_id,
        order_position,
        tag:tags(id, name)
      )
    `)
    .in('id', productIds)

  if (!includeUnpublished) {
    query.eq('published', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products with all tags:', error)
    return []
  }

  if (!data) return []

  // Sort by the order_position from the specific tag we're filtering by
  const sortedData = data.sort((a, b) => {
    const aPosition = orderPositions.get(a.id) ?? 999
    const bPosition = orderPositions.get(b.id) ?? 999
    return aPosition - bPosition
  })

  return sortedData
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

export async function reorderProductsInTag(tagId: string, productSlugOrder: string[]): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    // First, convert slugs to actual product IDs
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, slug')
      .in('slug', productSlugOrder)

    if (fetchError) {
      console.error('Error fetching product IDs from slugs:', fetchError)
      return false
    }

    if (!products || products.length !== productSlugOrder.length) {
      console.error('Could not find all products for the provided slugs')
      return false
    }

    // Create a slug-to-ID mapping
    const slugToIdMap: Record<string, string> = {}
    products.forEach(product => {
      slugToIdMap[product.slug] = product.id
    })

    // Update all products in the tag with new order positions
    const updates = productSlugOrder.map((slug, index) => ({
      product_id: slugToIdMap[slug],
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

export async function getProductsInTagOrdered(tagId: string): Promise<ProductWithTags[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('product_tags')
    .select(`
      id,
      product_id,
      tag_id,
      order_position,
      created_at,
      product:products (
        id,
        software_name,
        slug,
        description,
        url,
        published,
        featured,
        free,
        icon_url,
        created_at,
        priority,
        featured_order,
        free_order,
        all_order
      ),
      tag:tags (
        id,
        name,
        slug,
        description,
        color,
        created_at
      )
    `)
    .eq('tag_id', tagId)
    .order('order_position', { ascending: true })

  if (error) {
    console.error('Error fetching products in tag:', error)
    return []
  }

  // Transform the data to match ProductWithTags interface
  const products: ProductWithTags[] = (data || [])
    .filter(item => item.product) // Filter out any null products
    .map((item: any) => ({
      id: item.product.id,
      software_name: item.product.software_name,
      slug: item.product.slug,
      description: item.product.description,
      url: item.product.url,
      published: item.product.published,
      featured: item.product.featured,
      free: item.product.free,
      image_url: undefined, // Field doesn't exist in database
      icon_url: item.product.icon_url,
      created_at: item.product.created_at,
      priority: item.product.priority,
      featured_order: item.product.featured_order,
      free_order: item.product.free_order,
      all_order: item.product.all_order,
      product_tags: [{
        id: item.id,
        tag_id: item.tag_id,
        order_position: item.order_position,
        tag: item.tag
      }]
    }))

  return products
}

export async function reorderProductsInTagByIds(tagId: string, productIds: string[]): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    // Update each product's order_position based on the new order
    const updates = productIds.map((productId, index) => 
      supabase
        .from('product_tags')
        .update({ order_position: index })
        .eq('tag_id', tagId)
        .eq('product_id', productId)
    )

    const results = await Promise.all(updates)
    
    // Check if any update failed
    for (const result of results) {
      if (result.error) {
        console.error('Error updating product order in tag:', result.error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in reorderProductsInTagByIds:', error)
    return false
  }
}

export async function getProductsForSystemTag(systemTagType: 'featured' | 'free' | 'all'): Promise<ProductWithTags[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  let query = supabase
    .from('products')
    .select(`
      *,
      product_tags (
        id,
        tag_id,
        order_position,
        tag:tags (*)
      )
    `)

  // Add specific filters based on system tag type
  switch (systemTagType) {
    case 'featured':
      query = query.eq('published', true).eq('featured', true)
      break
    case 'free':
      query = query.eq('published', true).eq('free', true)
      break
    case 'all':
      // For 'all' tag, include both published and unpublished products in admin
      // No additional filter needed
      break
  }

  // Order by the appropriate field
  switch (systemTagType) {
    case 'featured':
      query = query.order('featured_order', { ascending: true })
      break
    case 'free':
      query = query.order('free_order', { ascending: true })
      break
    case 'all':
      query = query.order('all_order', { ascending: true })
      break
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products for system tag:', error)
    return []
  }

  return data || []
}

export async function reorderProductsForSystemTag(
  systemTagType: 'featured' | 'free' | 'all', 
  productIds: string[]
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    const orderField = `${systemTagType}_order`
    
    // Update each product's order field based on the new order
    const updates = productIds.map((productId, index) => 
      supabase
        .from('products')
        .update({ [orderField]: index })
        .eq('id', productId)
    )

    const results = await Promise.all(updates)
    
    // Check if any update failed
    for (const result of results) {
      if (result.error) {
        console.error('Error updating product order for system tag:', result.error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in reorderProductsForSystemTag:', error)
    return false
  }
}

export async function updateProduct(productId: string, updates: Partial<{
  software_name: string
  slug: string
  description: string
  url: string
  published: boolean
  featured: boolean
  free: boolean
  icon_url: string
  featured_order: number | null
  free_order: number | null
  all_order: number | null
}>): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)

    if (error) {
      console.error('Error updating product:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateProduct:', error)
    return false
  }
}

export async function createTag(tagData: {
  name: string
  slug?: string
  description?: string
  color?: string
}): Promise<Tag | null> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }

  // Generate slug if not provided
  if (!tagData.slug) {
    tagData.slug = tagData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Get next order_index (should be the length of existing tags)
  const { count } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })

  const orderIndex = count ?? 0

  const { data, error } = await supabase
    .from('tags')
    .insert({ 
      ...tagData,
      order_index: orderIndex
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating tag:', error)
    return null
  }

  return data
}

export async function updateTag(tagId: string, updates: Partial<{
  name: string
  slug: string
  description: string
  color: string
}>): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    const { error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)

    if (error) {
      console.error('Error updating tag:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateTag:', error)
    return false
  }
}

export async function reorderTags(tagIds: string[]): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    // Update each tag's order_index based on the new order
    const updates = tagIds.map((tagId, index) => 
      supabase
        .from('tags')
        .update({ order_index: index })
        .eq('id', tagId)
    )

    const results = await Promise.all(updates)
    
    // Check if any update failed
    for (const result of results) {
      if (result.error) {
        console.error('Error updating tag order:', result.error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in reorderTags:', error)
    return false
  }
}

export async function deleteTag(tagId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    // First, get the order_index of the tag being deleted
    const { data: tagToDelete, error: fetchError } = await supabase
      .from('tags')
      .select('order_index')
      .eq('id', tagId)
      .single()

    if (fetchError) {
      console.error('Error fetching tag to delete:', fetchError)
      return false
    }

    // Delete all product-tag relationships for this tag
    const { error: relationError } = await supabase
      .from('product_tags')
      .delete()
      .eq('tag_id', tagId)

    if (relationError) {
      console.error('Error deleting product-tag relationships:', relationError)
      return false
    }

    // Delete the tag itself
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (deleteError) {
      console.error('Error deleting tag:', deleteError)
      return false
    }

    // Update order_index for all tags that come after the deleted tag
    // Decrement their order_index by 1 to fill the gap
    const { data: tagsToUpdate } = await supabase
      .from('tags')
      .select('id, order_index')
      .gt('order_index', tagToDelete.order_index)

    if (tagsToUpdate && tagsToUpdate.length > 0) {
      const updatePromises = tagsToUpdate.map(tag => 
        supabase
          .from('tags')
          .update({ order_index: tag.order_index - 1 })
          .eq('id', tag.id)
      )

      const updateResults = await Promise.all(updatePromises)
      
      for (const result of updateResults) {
        if (result.error) {
          console.error('Error updating order index:', result.error)
          return false
        }
      }
    }



    return true
  } catch (error) {
    console.error('Error in deleteTag:', error)
    return false
  }
}

export async function deleteProduct(productId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    // First delete all product-tag relationships
    const { error: tagError } = await supabase
      .from('product_tags')
      .delete()
      .eq('product_id', productId)

    if (tagError) {
      console.error('Error deleting product tags:', tagError)
      return false
    }

    // Then delete the product
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (productError) {
      console.error('Error deleting product:', productError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteProduct:', error)
    return false
  }
}

export async function createProduct(productData: {
  software_name: string
  slug: string
  description: string
  url: string
  published: boolean
  featured: boolean
  free: boolean
  icon_url?: string
}): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select('id')
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('Error in createProduct:', error)
    return null
  }
}

export async function uploadProductIcon(file: File, productId: string): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }

  try {
    // Create a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId}-${Date.now()}.${fileExt}`
    const filePath = `icons/${fileName}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-icons')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading icon:', uploadError)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-icons')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error in uploadProductIcon:', error)
    return null
  }
}

export async function deleteProductIcon(iconUrl: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return false
  }

  try {
    // Extract file path from URL
    const url = new URL(iconUrl)
    const pathSegments = url.pathname.split('/')
    const filePath = pathSegments.slice(-2).join('/') // Get 'icons/filename.ext'

    const { error } = await supabase.storage
      .from('product-icons')
      .remove([filePath])

    if (error) {
      console.error('Error deleting icon:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteProductIcon:', error)
    return false
  }
}

// Helper function to resize image to 200x200
export function resizeImage(file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Set canvas size to desired dimensions
      canvas.width = maxWidth
      canvas.height = maxHeight

      // Calculate scaling to maintain aspect ratio and fill the square
      const scale = Math.max(maxWidth / img.width, maxHeight / img.height)
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale

      // Center the image
      const x = (maxWidth - scaledWidth) / 2
      const y = (maxHeight - scaledHeight) / 2

      // Draw scaled image (no background fill to preserve transparency)
      if (ctx) {
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
      }

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: 'image/png',
            lastModified: Date.now()
          })
          resolve(resizedFile)
        } else {
          reject(new Error('Failed to create blob'))
        }
      }, 'image/png', 0.9)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    
    // Create object URL and load image
    const objectUrl = URL.createObjectURL(file)
    img.src = objectUrl
  })
}

// Helper function to check if image needs cropping and get dimensions
export function getImageInfo(file: File): Promise<{
  width: number
  height: number
  isSquare: boolean
  aspectRatio: number
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const width = img.width
      const height = img.height
      const isSquare = Math.abs(width - height) < 5 // Allow 5px tolerance
      const aspectRatio = width / height
      
      resolve({
        width,
        height,
        isSquare,
        aspectRatio
      })
      
      URL.revokeObjectURL(img.src)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
    
    const objectUrl = URL.createObjectURL(file)
    img.src = objectUrl
  })
}

// Helper function to crop image based on crop coordinates
export function cropImage(
  file: File, 
  cropData: { x: number; y: number; width: number; height: number },
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Set canvas size to desired output dimensions
      canvas.width = maxWidth
      canvas.height = maxHeight

      if (ctx) {
        // Draw the cropped portion of the image, scaled to fill the canvas
        ctx.drawImage(
          img,
          cropData.x, cropData.y, cropData.width, cropData.height, // Source rectangle
          0, 0, maxWidth, maxHeight // Destination rectangle
        )
      }

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], file.name, {
            type: 'image/png',
            lastModified: Date.now()
          })
          resolve(croppedFile)
        } else {
          reject(new Error('Failed to create blob'))
        }
      }, 'image/png', 0.9)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    
    const objectUrl = URL.createObjectURL(file)
    img.src = objectUrl
  })
} 