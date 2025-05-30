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

export async function loadSoftwareData(): Promise<SoftwareData> {
  // First check localStorage for admin changes (static hosting support)
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem('seo-rocket-software-data')
      if (savedData) {
        console.log('Loading data from localStorage (admin changes detected)')
        return JSON.parse(savedData)
      }
    } catch (error) {
      console.log('Error reading localStorage, falling back to API')
    }
  }

  // Always load fresh data from the JSON file via API
  try {
    // Add timestamp to bypass any caching
    const timestamp = Date.now();
    const response = await fetch(`/api/software?t=${timestamp}`, { cache: 'no-store' });
    if (response.ok) {
      console.log('Loading data from API')
      return await response.json();
    }
  } catch (error) {
    console.log('API not available, falling back to static import');
  }
  
  // Fallback to static import if API is not available
  console.log('Loading data from static import')
  const softwareData = await import('./software.json');
  return softwareData.default as SoftwareData;
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