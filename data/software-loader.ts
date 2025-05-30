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
  // In a real app, this could load from an API
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
  return data.tags;
} 