import { getActiveProducts, getFeaturedProducts, getProductsByTag, getAvailableTagsFromProducts, getAllProducts, Product, supabase, ProductWithTags, getProductsWithTagsByTag, getActiveProductsWithTags, getAllProductsWithTags, getFeaturedProductsWithTags, getAllTags } from '../lib/supabase'

export interface SoftwareItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
  status: 'active' | 'beta' | 'coming-soon' | 'deprecated';
  releaseDate: string;
  featured: boolean;
  url: string;
  pricing: 'free' | 'premium' | 'freemium';
  priority: number;
  featured_order: number;
  free_order: number;
  all_order: number;
}

export interface SoftwareData {
  software: SoftwareItem[];
  metadata: {
    totalSoftware: number;
    lastUpdated: string;
  };
}

// Convert Supabase Product to SoftwareItem (legacy fallback)
function convertProductToSoftwareItem(product: Product): SoftwareItem {
  console.log('Converting product (legacy):', product.software_name)
  console.log('  - Raw tags field:', product.tags, typeof product.tags)
  console.log('  - Published:', product.published, typeof product.published)
  console.log('  - Full product object:', product)
  
  let tagsArray: string[] = []
  
  if (product.tags) {
    if (Array.isArray(product.tags)) {
      // Tags are already an array from the database
      tagsArray = product.tags.filter(tag => tag && tag.trim().length > 0)
      console.log('  - Processed as array:', tagsArray)
    } else if (typeof product.tags === 'string') {
      // Tags are a comma-separated string (fallback)
      tagsArray = product.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      console.log('  - Processed as string:', tagsArray)
    } else {
      console.log('  - Tags field is not array or string:', typeof product.tags)
    }
  } else {
    console.log('  - No tags field found on product')
  }
  
  console.log('  - Final tags array:', tagsArray)
  
  const result = {
    id: product.slug,
    name: product.software_name,
    icon: product.icon_url || '📦',
    description: product.description,
    tags: tagsArray,
    status: (product.published ? 'active' : 'coming-soon') as 'active' | 'beta' | 'coming-soon' | 'deprecated',
    releaseDate: new Date(product.created_at).toISOString().split('T')[0],
    featured: product.featured,
    url: product.url,
    pricing: (product.free ? 'free' : 'premium') as 'free' | 'premium' | 'freemium',
    priority: product.priority ?? 100, // Include priority with fallback
    featured_order: product.featured_order ?? 0,
    free_order: product.free_order ?? 0,
    all_order: product.all_order ?? 0
  }
  
  console.log('  - Final SoftwareItem:', result)
  return result
}

// Convert ProductWithTags to SoftwareItem (new junction table structure)
function convertProductWithTagsToSoftwareItem(product: ProductWithTags): SoftwareItem {
  console.log('Converting product with tags:', product.software_name, 'Product tags:', product.product_tags)
  
  // Extract tag names from junction table data, ordered by order_position
  const tagsArray = product.product_tags
    .sort((a, b) => a.order_position - b.order_position)
    .map(pt => pt.tag.name)
    .filter(tag => tag && tag.trim().length > 0)
  
  console.log('Processed tags from junction table:', tagsArray)
  
  return {
    id: product.slug,
    name: product.software_name,
    icon: product.icon_url || '📦',
    description: product.description,
    tags: tagsArray,
    status: product.published ? 'active' : 'coming-soon',
    releaseDate: new Date(product.created_at).toISOString().split('T')[0],
    featured: product.featured,
    url: product.url,
    pricing: product.free ? 'free' : 'premium',
    priority: product.priority ?? 100,
    featured_order: product.featured_order ?? 0,
    free_order: product.free_order ?? 0,
    all_order: product.all_order ?? 0
  }
}

export async function loadSoftwareData(): Promise<SoftwareData> {
  try {
    console.log('Loading software data using junction table approach...')
    
    // Try new junction table approach first
    try {
      const productsWithTags = await getAllProductsWithTags()
      console.log('Successfully loaded products with junction table:', productsWithTags.length)
      
      const softwareItems = productsWithTags.map(convertProductWithTagsToSoftwareItem)
      
      console.log('Loaded software data (junction table):', {
        totalItems: softwareItems.length,
        sample: softwareItems.slice(0, 2)
      })
      
      return {
        software: softwareItems,
        metadata: {
          totalSoftware: softwareItems.length,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      }
    } catch (junctionError) {
      console.log('Junction table approach failed, falling back to legacy approach:', junctionError)
    }
    
    // Fallback to legacy approach
    const products = await getAllProducts()
    const softwareItems = products.map(convertProductToSoftwareItem)
    
    console.log('Loaded software data (legacy fallback):', {
      totalItems: softwareItems.length,
      sample: softwareItems.slice(0, 2)
    })
    
    return {
      software: softwareItems,
      metadata: {
        totalSoftware: softwareItems.length,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    }
  } catch (error) {
    console.error('Error loading software data from Supabase:', error)
    return {
      software: [],
      metadata: {
        totalSoftware: 0,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    }
  }
}

export async function loadSoftwareDataByTag(tagName: string, includeUnpublished: boolean = false): Promise<SoftwareData> {
  try {
    // Try new junction table approach first
    if (supabase) {
      try {
        const productsWithTags = await getProductsWithTagsByTag(tagName, includeUnpublished)
        const softwareItems = productsWithTags.map(convertProductWithTagsToSoftwareItem)
        
        console.log('Loaded software data by tag (junction table):', {
          tag: tagName,
          totalItems: softwareItems.length,
          sample: softwareItems.slice(0, 2)
        })
        
        return {
          software: softwareItems,
          metadata: {
            totalSoftware: softwareItems.length,
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        }
      } catch (error) {
        console.log('Junction table query failed, falling back to old method:', error)
      }
    }
    
    // Fallback to old array-based approach
    const products = await getProductsByTag(tagName, includeUnpublished)
    const softwareItems = products.map(convertProductToSoftwareItem)
    
    console.log('Loaded software data by tag (fallback):', {
      tag: tagName,
      totalItems: softwareItems.length,
      sample: softwareItems.slice(0, 2)
    })
    
    return {
      software: softwareItems,
      metadata: {
        totalSoftware: softwareItems.length,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    }
  } catch (error) {
    console.error('Error loading software data by tag:', error)
    return {
      software: [],
      metadata: {
        totalSoftware: 0,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    }
  }
}

export async function loadFeaturedSoftwareData(): Promise<SoftwareData> {
  try {
    const products = await getFeaturedProducts()
    
    const softwareItems = products.map(convertProductToSoftwareItem)
    
    console.log('Loaded featured software data:', {
      totalItems: softwareItems.length,
      sample: softwareItems.slice(0, 2)
    })
    
    return {
      software: softwareItems,
      metadata: {
        totalSoftware: softwareItems.length,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    }
  } catch (error) {
    console.error('Error loading featured software data from Supabase:', error)
    return {
      software: [],
      metadata: {
        totalSoftware: 0,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    }
  }
}

export function getActiveSoftware(data: SoftwareData): SoftwareItem[] {
  return data.software
    .filter(item => item.status === 'active')
    .sort((a, b) => (a.all_order ?? 100) - (b.all_order ?? 100));
}

export function getFeaturedSoftware(data: SoftwareData, isAdmin: boolean = false): SoftwareItem[] {
  return isAdmin
    ? data.software.filter(item => item.featured).sort((a, b) => (a.featured_order ?? 100) - (b.featured_order ?? 100))
    : data.software.filter(item => item.featured && item.status === 'active').sort((a, b) => (a.featured_order ?? 100) - (b.featured_order ?? 100));
}

export async function getSoftwareByTag(data: SoftwareData, tag: string, isAdmin: boolean = false): Promise<SoftwareItem[]> {
  let filtered: SoftwareItem[] = [];
  
  if (tag === 'All') {
    filtered = isAdmin ? data.software : data.software.filter(item => item.status === 'active');
    // Sort by all_order for 'All' filter
    return filtered.sort((a, b) => (a.all_order ?? 100) - (b.all_order ?? 100));
  } else if (tag === 'Featured') {
    filtered = isAdmin 
      ? data.software.filter(item => item.featured)
      : data.software.filter(item => item.featured && item.status === 'active');
    // Sort by featured_order for 'Featured' filter
    return filtered.sort((a, b) => (a.featured_order ?? 100) - (b.featured_order ?? 100));
  } else if (tag === 'Free') {
    filtered = isAdmin
      ? data.software.filter(item => item.pricing === 'free')
      : data.software.filter(item => item.pricing === 'free' && item.status === 'active');
    // Sort by free_order for 'Free' filter
    return filtered.sort((a, b) => (a.free_order ?? 100) - (b.free_order ?? 100));
  } else {
    // For custom tags, get the ordered products directly from database using junction table
    try {
      const orderedProducts = await getProductsWithTagsByTag(tag, isAdmin);
      const orderedSoftwareItems = orderedProducts.map(convertProductWithTagsToSoftwareItem);
      
      // Filter for published status if not admin
      if (!isAdmin) {
        return orderedSoftwareItems.filter(item => item.status === 'active');
      }
      
      return orderedSoftwareItems;
    } catch (error) {
      console.error('Error getting ordered products for tag, falling back to priority sorting:', error);
      
      // Fallback to in-memory filtering and priority sorting
      filtered = isAdmin
        ? data.software.filter(item => item.tags.includes(tag))
        : data.software.filter(item => item.tags.includes(tag) && item.status === 'active');
      
      return filtered.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    }
  }
}

export async function getAvailableTags(data: SoftwareData, isAdmin: boolean = false): Promise<string[]> {
  // System tags that should always come first
  const systemTags = ['Featured', 'Free', 'All'];
  
  try {
    // Get ordered tags from database
    const orderedTags = await getAllTags();
    
    // Collect all unique tags from software items to check which ones are actually used
    const usedTags = new Set<string>();
    const itemsToProcess = isAdmin ? data.software : data.software.filter(item => item.status === 'active');
    
    itemsToProcess.forEach(item => {
      item.tags.forEach(tag => {
        if (!systemTags.includes(tag)) {
          usedTags.add(tag);
        }
      });
    });
    
    // Filter ordered tags to only include ones that are actually used by products
    // and maintain the database order
    const orderedUsedTags = orderedTags
      .filter(tag => usedTags.has(tag.name))
      .map(tag => tag.name);
    
    // Return in order: System tags first, then database-ordered dynamic tags
    return [...systemTags, ...orderedUsedTags];
    
  } catch (error) {
    console.error('Error loading ordered tags, falling back to alphabetical:', error);
    
    // Fallback to the original logic if database query fails
    const dynamicTags = new Set<string>();
    const itemsToProcess = isAdmin ? data.software : data.software.filter(item => item.status === 'active');
    
    itemsToProcess.forEach(item => {
      item.tags.forEach(tag => {
        if (!systemTags.includes(tag)) {
          dynamicTags.add(tag);
        }
      });
    });
    
    return [...systemTags, ...Array.from(dynamicTags).sort()];
  }
}

// Direct Supabase query functions for better performance when needed
export async function getSoftwareByTagDirect(tag: string, includeUnpublished: boolean = false): Promise<SoftwareItem[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const products = await getProductsByTag(tag, includeUnpublished)
  return products.map(convertProductToSoftwareItem)
}

export async function getFeaturedSoftwareDirect(): Promise<SoftwareItem[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const products = await getFeaturedProducts()
  return products.map(convertProductToSoftwareItem)
} 