import { useState, useEffect, useCallback } from 'react'
import { 
  loadSoftwareData, 
  SoftwareItem, 
  SoftwareData,
  getSoftwareByTag, 
  getFeaturedSoftware
} from '../../data/software-loader'
import { getAvailableTagsFromProducts } from '../../lib/supabase'

interface UseProductDataProps {
  isAdmin: boolean
  authLoading: boolean
  disableRealtimeRefresh?: boolean
}

export function useProductData({ 
  isAdmin, 
  authLoading,
  disableRealtimeRefresh = false 
}: UseProductDataProps) {
  const [softwareData, setSoftwareData] = useState<SoftwareData | null>(null)
  const [filteredSoftware, setFilteredSoftware] = useState<SoftwareItem[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('Featured')
  const [isLoading, setIsLoading] = useState(true)
  const [availableFilterTags, setAvailableFilterTags] = useState<string[]>(['Featured', 'Free', 'All'])

  // Helper function to get available tags
  const getAvailableTagsForData = async (includeUnpublished: boolean = false): Promise<string[]> => {
    try {
      return await getAvailableTagsFromProducts(includeUnpublished)
    } catch (error) {
      console.error('Error getting available tags:', error)
      return ['Featured', 'Free', 'All']
    }
  }

  // Load available filter tags
  const loadAvailableFilterTags = useCallback(async () => {
    try {
      const tags = await getAvailableTagsForData(isAdmin)
      setAvailableFilterTags(tags)
    } catch (error) {
      console.error('Error loading available filter tags:', error)
      setAvailableFilterTags(['Featured', 'Free', 'All'])
    }
  }, [isAdmin])

  // Handle filter changes
  const handleFilterChange = useCallback((filter: string) => {
    if (!softwareData || authLoading) return
    setActiveFilter(filter)
    
    if (filter === 'Featured') {
      const featuredResults = getFeaturedSoftware(softwareData, isAdmin)
      console.log('Filter change - setting featured software with admin status:', isAdmin, 'Results:', featuredResults.length, 'items')
      setFilteredSoftware(featuredResults)
    } else {
      const tagResults = getSoftwareByTag(softwareData, filter, isAdmin)
      console.log('Filter change - setting tag software for', filter, 'with admin status:', isAdmin, 'Results:', tagResults.length, 'items')
      setFilteredSoftware(tagResults)
    }
  }, [softwareData, authLoading, isAdmin])

  // Realtime data refresh function
  const refreshData = useCallback(async () => {
    // Don't refresh data if auth is still loading
    if (authLoading) {
      console.log('Auth still loading, skipping realtime refresh...')
      return
    }
    
    // Don't refresh if realtime refresh is temporarily disabled
    if (disableRealtimeRefresh) {
      console.log('Realtime refresh temporarily disabled, skipping...')
      return
    }
    
    try {
      console.log('Refreshing data due to realtime update with admin status:', isAdmin)
      const data = await loadSoftwareData()
      setSoftwareData(data)
      
      // Also refresh available tags
      await loadAvailableFilterTags()
      
      // Update filtered software based on current filter
      if (activeFilter === 'Featured') {
        const featuredResults = getFeaturedSoftware(data, isAdmin)
        console.log('Setting featured software with admin status:', isAdmin, 'Results:', featuredResults.length, 'items')
        setFilteredSoftware(featuredResults)
      } else {
        const tagResults = getSoftwareByTag(data, activeFilter, isAdmin)
        console.log('Setting tag software for', activeFilter, 'with admin status:', isAdmin, 'Results:', tagResults.length, 'items')
        setFilteredSoftware(tagResults)
      }
      
      console.log('Data refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh software data:', error)
    }
  }, [activeFilter, isAdmin, authLoading, loadAvailableFilterTags, disableRealtimeRefresh])

  // Load software data on component mount
  useEffect(() => {
    async function loadData() {
      // Don't load data until auth state is resolved
      if (authLoading) {
        console.log('Auth still loading, skipping data load...')
        return
      }
      
      try {
        console.log('Loading software data with admin status:', isAdmin)
        const data = await loadSoftwareData()
        setSoftwareData(data)
        
        // Load available filter tags
        await loadAvailableFilterTags()
        
        const initialFeatured = getFeaturedSoftware(data, isAdmin)
        console.log('Initial load - setting featured software with admin status:', isAdmin, 'Results:', initialFeatured.length, 'items')
        setFilteredSoftware(initialFeatured)
        
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load software data:', error)
        setIsLoading(false)
      }
    }
    
    // Add a small delay to ensure auth state is stable
    const timer = setTimeout(loadData, 100)
    return () => clearTimeout(timer)
  }, [isAdmin, authLoading, loadAvailableFilterTags])

  // Reload data when page gains focus
  useEffect(() => {
    let focusTimer: NodeJS.Timeout
    let intervalTimer: NodeJS.Timeout
    
    const handleFocus = async () => {
      // Don't reload data if auth is still loading
      if (authLoading) {
        console.log('Auth still loading, skipping focus reload...')
        return
      }
      
      // Don't reload if realtime refresh is disabled (e.g., during drag operations)
      if (disableRealtimeRefresh) {
        console.log('Realtime refresh disabled, skipping focus reload...')
        return
      }
      
      // Debounce focus events
      clearTimeout(focusTimer)
      focusTimer = setTimeout(async () => {
        await refreshData()
      }, 1000)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'seo-rocket-software-data') {
        console.log('localStorage data changed, reloading...')
        handleFocus()
      }
    }

    // Only set up listeners if auth is resolved
    if (!authLoading) {
      window.addEventListener('focus', handleFocus)
      window.addEventListener('storage', handleStorageChange)
      
      // Also check for changes periodically (every 10 seconds)
      intervalTimer = setInterval(() => {
        if (document.hasFocus() && !disableRealtimeRefresh) {
          handleFocus()
        }
      }, 10000)

      return () => {
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('storage', handleStorageChange)
        clearTimeout(focusTimer)
        clearInterval(intervalTimer)
      }
    }
  }, [activeFilter, isAdmin, authLoading, loadAvailableFilterTags, disableRealtimeRefresh, refreshData])

  return {
    softwareData,
    filteredSoftware,
    setFilteredSoftware,
    activeFilter,
    isLoading,
    availableFilterTags,
    handleFilterChange,
    refreshData
  }
}