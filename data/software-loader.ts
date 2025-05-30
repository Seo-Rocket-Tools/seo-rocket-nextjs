import { getActiveProducts, getFeaturedProducts, getProductsByTag, getAvailableTagsFromProducts, Product, supabase } from '../lib/supabase'

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
}

export interface SoftwareData {
  metadata: {
    lastUpdated: string;
    version: string;
    totalSoftware: number;
  };
  software: SoftwareItem[];
  tags: string[];
}

// Convert Supabase Product to SoftwareItem
function convertProductToSoftwareItem(product: Product): SoftwareItem {
  console.log('Converting product:', product.software_name, 'Tags field:', product.tags)
  
  let tagsArray: string[] = []
  
  if (product.tags) {
    if (Array.isArray(product.tags)) {
      // Tags are already an array from the database
      tagsArray = product.tags.filter(tag => tag && tag.trim().length > 0)
    } else if (typeof product.tags === 'string') {
      // Tags are a comma-separated string (fallback)
      tagsArray = product.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
  }
  
  console.log('Processed tags array:', tagsArray)
  
  return {
    id: product.slug,
    name: product.software_name,
    icon: product.emoji,
    description: product.description,
    tags: tagsArray,
    status: 'active', // All published products are active
    releaseDate: new Date(product.created_at).toISOString().split('T')[0],
    featured: product.featured,
    url: product.url,
    pricing: product.free ? 'free' : 'premium' // Map free boolean to pricing
  }
}

export async function loadSoftwareData(): Promise<SoftwareData> {
  // Check if Supabase is configured
  if (!supabase) {
    throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }

  console.log('Loading products from Supabase...')
  const products = await getActiveProducts()
  console.log('Loaded products:', products)
  
  const tags = await getAvailableTagsFromProducts()
  console.log('Loaded tags:', tags)
  
  const softwareItems = products.map(convertProductToSoftwareItem)
  console.log('Converted software items:', softwareItems)
  
  return {
    metadata: {
      lastUpdated: new Date().toISOString().split('T')[0],
      version: '2.0.0',
      totalSoftware: softwareItems.length
    },
    software: softwareItems,
    tags: tags
  }
}

export function getActiveSoftware(data: SoftwareData): SoftwareItem[] {
  return data.software.filter(item => item.status === 'active');
}

export function getFeaturedSoftware(data: SoftwareData): SoftwareItem[] {
  return data.software.filter(item => item.featured && item.status === 'active');
}

export function getSoftwareByTag(data: SoftwareData, tag: string): SoftwareItem[] {
  if (tag === 'All') return getActiveSoftware(data);
  if (tag === 'Featured') return getFeaturedSoftware(data);
  if (tag === 'Free') return data.software.filter(item => 
    item.pricing === 'free' && item.status === 'active'
  );
  return data.software.filter(item => 
    item.tags.includes(tag) && item.status === 'active'
  );
}

export function getAvailableTags(data: SoftwareData): string[] {
  // Start with the predefined tags array
  const predefinedTags = [...data.tags];
  
  // Collect all unique tags from software items (for active software only)
  const dynamicTags = new Set<string>();
  data.software
    .filter(item => item.status === 'active')
    .forEach(item => {
      item.tags.forEach(tag => dynamicTags.add(tag));
    });
  
  // Merge predefined and dynamic tags, keeping the original order for system tags
  const systemTags = ['Featured', 'Free', 'All']; // These should always come first
  const otherPredefinedTags = predefinedTags.filter(tag => !systemTags.includes(tag));
  const newDynamicTags = Array.from(dynamicTags).filter(tag => 
    !predefinedTags.includes(tag) && !systemTags.includes(tag)
  );
  
  // Return in order: System tags, predefined tags, new dynamic tags
  return [...systemTags, ...otherPredefinedTags, ...newDynamicTags];
}

// Direct Supabase query functions for better performance when needed
export async function getSoftwareByTagDirect(tag: string): Promise<SoftwareItem[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const products = await getProductsByTag(tag)
  return products.map(convertProductToSoftwareItem)
}

export async function getFeaturedSoftwareDirect(): Promise<SoftwareItem[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const products = await getFeaturedProducts()
  return products.map(convertProductToSoftwareItem)
} 