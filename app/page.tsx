"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  loadSoftwareData, 
  SoftwareItem, 
  SoftwareData,
  getSoftwareByTag, 
  getFeaturedSoftware
} from '../data/software-loader'
import { useRealtime } from '../lib/useRealtime'
import { Product, Tag, supabase, getAvailableTagsFromProducts } from '../lib/supabase'
import { useAuth, signOut } from '../lib/useAuth'
import Link from 'next/link'
import TagOrdering from '../components/TagOrdering'

export default function Home() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  
  // Stabilize admin status to prevent unnecessary reloads
  const [stableIsAdmin, setStableIsAdmin] = useState<boolean>(false)
  
  useEffect(() => {
    if (!authLoading) {
      setStableIsAdmin(isAdmin)
    }
  }, [isAdmin, authLoading])
  
  // Debug logging for admin state changes
  useEffect(() => {
    console.log('Auth state changed:', { user: !!user, authLoading, isAdmin, stableIsAdmin })
  }, [user, authLoading, isAdmin, stableIsAdmin])

  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isGridHovered, setIsGridHovered] = useState(false)
  const [gridMousePosition, setGridMousePosition] = useState({ x: 0, y: 0 })
  const [softwareData, setSoftwareData] = useState<SoftwareData | null>(null)
  const [filteredSoftware, setFilteredSoftware] = useState<SoftwareItem[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('Featured')
  const [isLoading, setIsLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<{
    isConnected: boolean
    error: string | null
  }>({ isConnected: false, error: null })

  // Admin state
  const [showTagManager, setShowTagManager] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState<string | null>(null)
  const [showTagOrdering, setShowTagOrdering] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState<string | null>(null)
  const [productPublishedStatus, setProductPublishedStatus] = useState<Record<string, boolean>>({})
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null)
  const [productTagLoading, setProductTagLoading] = useState<string | null>(null)
  const [editProductLoading, setEditProductLoading] = useState(false)
  const [addProductLoading, setAddProductLoading] = useState(false)

  // Product form state
  const [productForm, setProductForm] = useState({
    software_name: '',
    description: '',
    emoji: '',
    url: '',
    tags: [] as string[],
    published: true,
    featured: false,
    free: false,
    image_url: '',
    priority: 100,
    slug: ''
  })

  // State for available filter tags
  const [availableFilterTags, setAvailableFilterTags] = useState<string[]>(['Featured', 'Free', 'All'])

  // Load tags for admin
  const loadTags = useCallback(async () => {
    if (!supabase || !stableIsAdmin) return
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')
    
    if (!error && data) {
      setAvailableTags(data)
    }
  }, [stableIsAdmin])

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
      const tags = await getAvailableTagsForData(stableIsAdmin)
      setAvailableFilterTags(tags)
    } catch (error) {
      console.error('Error loading available filter tags:', error)
      setAvailableFilterTags(['Featured', 'Free', 'All'])
    }
  }, [stableIsAdmin])

  // Realtime data refresh function
  const refreshData = useCallback(async () => {
    // Don't refresh data if auth is still loading
    if (authLoading) {
      console.log('Auth still loading, skipping realtime refresh...')
      return
    }
    
    try {
      console.log('Refreshing data due to realtime update with admin status:', stableIsAdmin)
      const data = await loadSoftwareData()
      setSoftwareData(data)
      
      // Also refresh available tags
      await loadAvailableFilterTags()
      
      // Update filtered software based on current filter
      if (activeFilter === 'Featured') {
        const featuredResults = getFeaturedSoftware(data, stableIsAdmin)
        console.log('Setting featured software with admin status:', stableIsAdmin, 'Results:', featuredResults.length, 'items')
        setFilteredSoftware(featuredResults)
      } else {
        const tagResults = getSoftwareByTag(data, activeFilter, stableIsAdmin)
        console.log('Setting tag software for', activeFilter, 'with admin status:', stableIsAdmin, 'Results:', tagResults.length, 'items')
        setFilteredSoftware(tagResults)
      }
      
      console.log('Data refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh software data:', error)
    }
  }, [activeFilter, stableIsAdmin, authLoading, loadAvailableFilterTags])

  // Handle realtime product changes
  const handleProductChange = useCallback((payload: any) => {
    console.log('Product change detected:', payload.eventType, payload)
    // Debounce rapid changes
    setTimeout(() => refreshData(), 500)
  }, [refreshData])

  // Handle realtime tag changes
  const handleTagChange = useCallback((payload: any) => {
    console.log('Tag change detected:', payload.eventType, payload)
    // Debounce rapid changes
    setTimeout(() => {
      refreshData()
      loadTags()
    }, 500)
  }, [refreshData, loadTags])

  // Set up realtime subscriptions
  const { isConnected, error, reconnect } = useRealtime({
    onProductChange: handleProductChange,
    onTagChange: handleTagChange,
    enabled: true
  })

  // Update realtime status
  useEffect(() => {
    setRealtimeStatus({ isConnected, error })
  }, [isConnected, error])

  // Load software data on component mount
  useEffect(() => {
    async function loadData() {
      // Don't load data until auth state is resolved
      if (authLoading) {
        console.log('Auth still loading, skipping data load...')
        return
      }
      
      try {
        console.log('Loading software data with admin status:', stableIsAdmin)
        const data = await loadSoftwareData()
        setSoftwareData(data)
        
        // Load available filter tags
        await loadAvailableFilterTags()
        
        const initialFeatured = getFeaturedSoftware(data, stableIsAdmin)
        console.log('Initial load - setting featured software with admin status:', stableIsAdmin, 'Results:', initialFeatured.length, 'items')
        setFilteredSoftware(initialFeatured)
        
        // Load published status for admin
        if (stableIsAdmin && supabase) {
          console.log('Loading published status for admin...')
          const { data: products } = await supabase
            .from('products')
            .select('slug, published')
          
          if (products) {
            const statusMap: Record<string, boolean> = {}
            products.forEach(product => {
              statusMap[product.slug] = product.published
            })
            setProductPublishedStatus(statusMap)
            console.log('Published status loaded:', statusMap)
          }
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load software data:', error)
        setIsLoading(false)
      }
    }
    
    // Add a small delay to ensure auth state is stable
    const timer = setTimeout(loadData, 100)
    return () => clearTimeout(timer)
  }, [stableIsAdmin, authLoading, loadAvailableFilterTags])

  // Load tags when user becomes admin
  useEffect(() => {
    if (stableIsAdmin && !authLoading) {
      loadTags()
    }
  }, [stableIsAdmin, authLoading, loadTags])

  // Reload data when page gains focus (e.g., coming back from admin panel)
  useEffect(() => {
    let focusTimer: NodeJS.Timeout
    let intervalTimer: NodeJS.Timeout
    
    const handleFocus = async () => {
      // Don't reload data if auth is still loading
      if (authLoading) {
        console.log('Auth still loading, skipping focus reload...')
        return
      }
      
      // Debounce focus events
      clearTimeout(focusTimer)
      focusTimer = setTimeout(async () => {
        try {
          console.log('Page focused, reloading software data with admin status:', stableIsAdmin)
          const data = await loadSoftwareData()
          
          // Load available filter tags
          await loadAvailableFilterTags()
          console.log('Loaded data and available tags')
          
          setSoftwareData(data)
          // Maintain current filter when refreshing data
          if (activeFilter === 'Featured') {
            const focusFeatured = getFeaturedSoftware(data, stableIsAdmin)
            console.log('Focus reload - setting featured software with admin status:', stableIsAdmin, 'Results:', focusFeatured.length, 'items')
            setFilteredSoftware(focusFeatured)
          } else {
            const focusTag = getSoftwareByTag(data, activeFilter, stableIsAdmin)
            console.log('Focus reload - setting tag software for', activeFilter, 'with admin status:', stableIsAdmin, 'Results:', focusTag.length, 'items')
            setFilteredSoftware(focusTag)
          }
        } catch (error) {
          console.error('Failed to reload software data:', error)
        }
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
      
      // Also check for changes periodically (every 10 seconds instead of 5)
      intervalTimer = setInterval(() => {
        if (document.hasFocus()) {
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
  }, [activeFilter, stableIsAdmin, authLoading, loadAvailableFilterTags])

  // Handle filter changes
  const handleFilterChange = (filter: string) => {
    if (!softwareData || authLoading) return
    setActiveFilter(filter)
    
    if (filter === 'Featured') {
      const featuredResults = getFeaturedSoftware(softwareData, stableIsAdmin)
      console.log('Filter change - setting featured software with admin status:', stableIsAdmin, 'Results:', featuredResults.length, 'items')
      setFilteredSoftware(featuredResults)
    } else {
      const tagResults = getSoftwareByTag(softwareData, filter, stableIsAdmin)
      console.log('Filter change - setting tag software for', filter, 'with admin status:', stableIsAdmin, 'Results:', tagResults.length, 'items')
      setFilteredSoftware(tagResults)
    }
  }

  // Handle filter scroll
  const scrollFilters = (direction: 'left' | 'right') => {
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const scrollAmount = 200
    const newScrollLeft = direction === 'left' 
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount)
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
    
    // Update scroll state after a brief delay to account for smooth scrolling
    setTimeout(() => updateScrollState(), 300)
  }

  // Update scroll state
  const updateScrollState = () => {
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const isScrollable = container.scrollWidth > container.clientWidth
    const isAtStart = container.scrollLeft <= 1 // Small threshold for floating point precision
    const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 1
    
    setCanScrollLeft(isScrollable && !isAtStart)
    setCanScrollRight(isScrollable && !isAtEnd)
    
    console.log('Scroll State:', {
      scrollLeft: container.scrollLeft,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
      isScrollable,
      isAtStart,
      isAtEnd,
      canScrollLeft: isScrollable && !isAtStart,
      canScrollRight: isScrollable && !isAtEnd
    })
  }

  // Check scroll state on mount and resize
  useEffect(() => {
    if (!softwareData) return
    
    const container = document.getElementById('filter-container')
    if (!container) return
    
    const handleScroll = () => {
      console.log('Scroll event triggered')
      updateScrollState()
    }
    
    const handleResize = () => {
      console.log('Resize event triggered')
      updateScrollState()
    }
    
    // Add event listeners
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    
    // Initial check with multiple attempts to ensure container is ready
    const checkInitialState = () => {
      console.log('Checking initial scroll state')
      updateScrollState()
    }
    
    // Check immediately and with delays
    checkInitialState()
    setTimeout(checkInitialState, 100)
    setTimeout(checkInitialState, 500)
    setTimeout(checkInitialState, 1000)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [softwareData])

  // Admin functions
  const handleLogout = async () => {
    await signOut()
  }

  const handleAddTag = async () => {
    if (!supabase || !newTagName.trim()) return
    
    const { error } = await supabase
      .from('tags')
      .insert({ name: newTagName.trim() })
    
    if (!error) {
      setNewTagName('')
      loadTags()
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!supabase || deletingTagId) return
    
    setDeletingTagId(tagId)
    
    try {
      console.log('Removing tag with ID:', tagId)
      
      // First, delete all product-tag relationships from the junction table
      const { error: junctionError } = await supabase
        .from('product_tags')
        .delete()
        .eq('tag_id', tagId)
      
      if (junctionError) {
        console.error('Error deleting from product_tags junction table:', junctionError)
        return
      }
      
      console.log('Successfully deleted all product_tags relationships for tag:', tagId)
      
      // Then, delete the tag from the tags table
      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)
      
      if (!deleteError) {
        console.log('Tag deleted successfully, refreshing data...')
        // Refresh both tags and software data
        await loadTags()
        await refreshData()
      } else {
        console.error('Error deleting tag:', deleteError)
      }
    } catch (error) {
      console.error('Error in handleRemoveTag:', error)
    } finally {
      setDeletingTagId(null)
    }
  }

  const resetProductForm = () => {
    setProductForm({
      software_name: '',
      description: '',
      emoji: '',
      url: '',
      tags: [],
      published: true,
      featured: false,
      free: false,
      image_url: '',
      priority: 100,
      slug: ''
    })
  }

  const handleAddProduct = async () => {
    if (!supabase || !productForm.software_name.trim() || addProductLoading) return
    
    setAddProductLoading(true)
    
    try {
      console.log('Adding new product with form data:', productForm)
      
      const slug = productForm.slug || productForm.software_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      // Insert the product (excluding tags)
      const { tags, ...productInsertData } = productForm
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          ...productInsertData,
          slug
        })
        .select('id')
        .single()
      
      if (insertError || !newProduct) {
        console.error('Error inserting product:', insertError)
        return
      }
      
      const newProductId = newProduct.id
      console.log('Successfully created product with ID:', newProductId)
      
      // Handle tags separately using junction table
      if (productForm.tags && productForm.tags.length > 0) {
        console.log('Adding tags to new product:', productForm.tags)
        
        // Get tag IDs for all the selected tags
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', productForm.tags)
        
        if (tagError) {
          console.error('Error fetching tag IDs:', tagError)
          return
        }
        
        // Create tag relationships with order positions
        const tagRelationships = tagData?.map((tag, index) => ({
          product_id: newProductId,
          tag_id: tag.id,
          order_position: index
        })) || []
        
        if (tagRelationships.length > 0) {
          const { error: insertTagsError } = await supabase
            .from('product_tags')
            .insert(tagRelationships)
          
          if (insertTagsError) {
            console.error('Error adding tags to new product:', insertTagsError)
            return
          }
          
          console.log('Successfully added tags to new product')
        }
      }
      
      console.log('Product creation completed successfully')
      resetProductForm()
      setShowAddProduct(false)
      await refreshData()
      
    } catch (error) {
      console.error('Error in handleAddProduct:', error)
    } finally {
      setAddProductLoading(false)
    }
  }

  const handleEditProduct = async (productId: string) => {
    if (!supabase || !productForm.software_name.trim() || editProductLoading) return
    
    setEditProductLoading(true)
    
    try {
      console.log('Editing product:', productId, 'with form data:', productForm)
      
      // Get the actual product ID from the database using the slug
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productId)
        .single()
      
      if (productError || !productData) {
        console.error('Error fetching product for edit:', productError)
        return
      }
      
      const actualProductId = productData.id
      console.log('Found product ID for edit:', actualProductId)
      
      // Update the product (excluding tags)
      const { tags, ...productUpdateData } = productForm
      const { error: updateError } = await supabase
        .from('products')
        .update(productUpdateData)
        .eq('id', actualProductId)
      
      if (updateError) {
        console.error('Error updating product:', updateError)
        return
      }
      
      console.log('Successfully updated product, now updating tags...')
      
      // Handle tags separately using junction table
      // First, remove all existing tag relationships for this product
      const { error: deleteTagsError } = await supabase
        .from('product_tags')
        .delete()
        .eq('product_id', actualProductId)
      
      if (deleteTagsError) {
        console.error('Error removing existing tags:', deleteTagsError)
        return
      }
      
      // Then, add new tag relationships
      if (productForm.tags && productForm.tags.length > 0) {
        console.log('Adding tags:', productForm.tags)
        
        // Get tag IDs for all the selected tags
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', productForm.tags)
        
        if (tagError) {
          console.error('Error fetching tag IDs:', tagError)
          return
        }
        
        // Create tag relationships with order positions
        const tagRelationships = tagData?.map((tag, index) => ({
          product_id: actualProductId,
          tag_id: tag.id,
          order_position: index
        })) || []
        
        if (tagRelationships.length > 0) {
          const { error: insertTagsError } = await supabase
            .from('product_tags')
            .insert(tagRelationships)
          
          if (insertTagsError) {
            console.error('Error adding new tags:', insertTagsError)
            return
          }
          
          console.log('Successfully added new tags')
        }
      }
      
      console.log('Product edit completed successfully')
      resetProductForm()
      setShowEditProduct(null)
      await refreshData()
      
    } catch (error) {
      console.error('Error in handleEditProduct:', error)
    } finally {
      setEditProductLoading(false)
    }
  }

  const handleTogglePublished = async (product: SoftwareItem) => {
    if (!supabase) return
    
    // Get the actual product from database using the slug/id
    const { data: dbProduct } = await supabase
      .from('products')
      .select('published')
      .eq('slug', product.id)
      .single()
    
    if (dbProduct) {
      const newPublishedStatus = !dbProduct.published
      const { error } = await supabase
        .from('products')
        .update({ published: newPublishedStatus })
        .eq('slug', product.id)
      
      if (!error) {
        // Update local status
        setProductPublishedStatus(prev => ({
          ...prev,
          [product.id]: newPublishedStatus
        }))
        refreshData()
      }
    }
  }

  const handleDeleteProduct = async (product: SoftwareItem) => {
    if (!supabase) return
    
    const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)
    if (!confirmed) return
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('slug', product.id)
    
    if (!error) {
      // Remove from local status tracking
      setProductPublishedStatus(prev => {
        const newStatus = { ...prev }
        delete newStatus[product.id]
        return newStatus
      })
      // Refresh data to remove from UI
      refreshData()
    } else {
      alert('Failed to delete product. Please try again.')
    }
  }

  const handleToggleProductTag = async (productId: string, tagName: string) => {
    if (!supabase || productTagLoading) return
    
    setProductTagLoading(productId)
    
    try {
      console.log('Toggling tag:', tagName, 'for product:', productId)
      
      // First, get the tag ID from the tag name
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single()
      
      if (tagError || !tagData) {
        console.error('Error fetching tag ID:', tagError)
        return
      }
      
      const tagId = tagData.id
      console.log('Found tag ID:', tagId)
      
      // Get the actual product ID from the database using the slug
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productId)
        .single()
      
      if (productError || !productData) {
        console.error('Error fetching product ID:', productError)
        return
      }
      
      const actualProductId = productData.id
      console.log('Found product ID:', actualProductId)
      
      // Check if the relationship already exists
      const { data: existingRelation, error: checkError } = await supabase
        .from('product_tags')
        .select('id')
        .eq('product_id', actualProductId)
        .eq('tag_id', tagId)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing relationship:', checkError)
        return
      }
      
      if (existingRelation) {
        // Relationship exists, remove it
        console.log('Removing tag relationship')
        const { error: deleteError } = await supabase
          .from('product_tags')
          .delete()
          .eq('product_id', actualProductId)
          .eq('tag_id', tagId)
        
        if (deleteError) {
          console.error('Error removing tag relationship:', deleteError)
          return
        }
        
        console.log('Successfully removed tag relationship')
      } else {
        // Relationship doesn't exist, add it
        console.log('Adding tag relationship')
        
        // Get the highest order position for this tag
        const { data: maxOrderData } = await supabase
          .from('product_tags')
          .select('order_position')
          .eq('tag_id', tagId)
          .order('order_position', { ascending: false })
          .limit(1)
        
        const nextOrderPosition = maxOrderData && maxOrderData.length > 0 
          ? maxOrderData[0].order_position + 1 
          : 0
        
        const { error: insertError } = await supabase
          .from('product_tags')
          .insert({
            product_id: actualProductId,
            tag_id: tagId,
            order_position: nextOrderPosition
          })
        
        if (insertError) {
          console.error('Error adding tag relationship:', insertError)
          return
        }
        
        console.log('Successfully added tag relationship')
      }
      
      // Refresh the data to show the changes
      await refreshData()
      
    } catch (error) {
      console.error('Error toggling product tag:', error)
    } finally {
      setProductTagLoading(null)
    }
  }

  const openEditModal = (product: SoftwareItem) => {
    // Get the actual published status for this product
    const actualPublishedStatus = productPublishedStatus[product.id] ?? true // fallback to true if not found
    
    setProductForm({
      software_name: product.name,
      description: product.description,
      emoji: product.icon,
      url: product.url,
      tags: Array.isArray(product.tags) ? product.tags : [],
      published: actualPublishedStatus, // Use actual published status from database
      featured: product.featured || false,
      free: product.pricing === 'free',
      image_url: '', // Not available in SoftwareItem
      priority: product.priority || 100,
      slug: product.id || '' // SoftwareItem.id is the slug
    })
    setShowEditProduct(product.id)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, toolId: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setMousePosition({ x, y })
    setHoveredCard(toolId)
  }

  const handleMouseLeave = () => {
    setHoveredCard(null)
    setMousePosition({ x: 0, y: 0 })
  }

  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setGridMousePosition({ x, y })
    setIsGridHovered(true)
  }

  const handleGridMouseLeave = () => {
    setIsGridHovered(false)
    setGridMousePosition({ x: 0, y: 0 })
  }

  const getCardTransform = (toolId: string) => {
    if (hoveredCard !== toolId) return 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    
    // Disable tilt animation in admin mode to prevent button interaction issues
    if (stableIsAdmin) {
      return 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(8px)'
    }
    
    const rotateX = -mousePosition.y * 0.05
    const rotateY = mousePosition.x * 0.05
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`
  }

  const getCardShadow = (toolId: string) => {
    if (hoveredCard !== toolId) {
      return '0 4px 8px rgba(0, 0, 0, 0.2)'
    }
    
    const shadowOffsetX = mousePosition.x * 0.02
    const shadowOffsetY = mousePosition.y * 0.02
    
    return `${shadowOffsetX}px ${8 + shadowOffsetY}px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)`
  }

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    )
  }

  // Show error state
  if (!softwareData) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load software data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Admin Bar */}
      {stableIsAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300">Admin Mode</span>
              </div>
              
              <button
                onClick={() => setShowTagManager(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-colors"
              >
                Tag Manager
              </button>
              
              <button
                onClick={() => setShowTagOrdering(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-full transition-colors"
              >
                Tag Ordering
              </button>
              
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-full transition-colors"
              >
                + Add Product
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Glow Effect */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Single Top-Right Purple Glow - Half Cut Off */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, rgba(139, 69, 219, 0.3) 40%, transparent 70%)',
            top: '-400px',
            right: '-400px',
          }}
        />
        
        {/* Interactive Grid Glow - Follows Mouse */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-300 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)',
            opacity: isGridHovered ? 0.2 : 0,
            left: isGridHovered ? `${gridMousePosition.x - 300}px` : '10%',
            top: isGridHovered ? `${gridMousePosition.y - 300 + 600}px` : '60%',
            transform: 'translate(0, 0)',
          }}
        />
      </div>

      {/* Header Section */}
      <section className={`px-4 sm:px-6 py-8 sm:py-12 relative z-10 ${stableIsAdmin ? 'pt-20' : ''}`}>
        <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="mb-6 sm:mb-8">
            <img
              src="/logo-light.svg"
              alt="SEO Rocket"
              className="mx-auto w-[160px] sm:w-[200px] h-[48px] sm:h-[60px] object-contain"
            />
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
            Automate Your
            <span className="block text-gray-400">Digital Workflow</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12 sm:mb-16 px-4 sm:px-0">
            Powerful web apps, Chrome extensions, and WordPress plugins designed for 
            <span className="text-white font-medium"> digital marketing agencies</span> and 
            <span className="text-white font-medium"> virtual assistants</span> who demand efficiency.
          </p>
        </div>
      </section>

      {/* Software Grid Section - Dynamic Layout */}
      <section 
        className="px-4 sm:px-6 pb-8 sm:pb-12 relative z-10"
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
      >
        <div className="max-w-7xl mx-auto">
          {/* Horizontal Scrollable Filter Tabs */}
          <div className="relative mb-6 sm:mb-8 max-w-4xl mx-auto h-12 flex items-center">
            {/* Scrollable Filter Container */}
            <div 
              id="filter-container"
              className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide px-12 sm:px-16 py-2 flex-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {availableFilterTags.map((filter: string) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full border transition-all duration-300 cursor-pointer hover:scale-105 whitespace-nowrap flex-shrink-0 min-h-[40px] flex items-center"
                  style={{
                    backgroundColor: activeFilter === filter ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: activeFilter === filter ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.15)',
                    color: activeFilter === filter ? '#000000' : '#d1d5db',
                  }}
                  onMouseEnter={(e) => {
                    if (activeFilter !== filter) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeFilter !== filter) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.color = '#d1d5db';
                    }
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Gradient Overlays - Lower z-index */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-[1] pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-[1] pointer-events-none" />

            {/* Left Arrow - Highest z-index */}
            <div className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-[100]">
              <button
                onClick={() => {
                  console.log('Left arrow clicked, canScrollLeft:', canScrollLeft)
                  scrollFilters('left')
                }}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  canScrollLeft 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer' 
                    : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                }`}
                disabled={!canScrollLeft}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Right Arrow - Highest z-index */}
            <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-[100]">
              <button
                onClick={() => {
                  console.log('Right arrow clicked, canScrollRight:', canScrollRight)
                  scrollFilters('right')
                }}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  canScrollRight 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer' 
                    : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                }`}
                disabled={!canScrollRight}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Flex Layout - Responsive cards with refined spacing */}
          <div className="flex flex-row flex-wrap justify-center items-stretch gap-3 sm:gap-4 lg:gap-5 max-w-7xl mx-auto px-2 sm:px-0">
            {filteredSoftware.map((tool, index) => {
              // Debug logging for each product
              console.log(`Rendering card ${index + 1}: ${tool.name}`)
              console.log('  - Tool tags:', tool.tags, Array.isArray(tool.tags), tool.tags?.length)
              console.log('  - Tool object:', tool)
              
              return (
                <div 
                  key={tool.id}
                  className={`w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.9375rem)] min-w-[280px] max-w-[320px] rounded-lg p-4 sm:p-6 transition-all duration-500 ease-out relative flex flex-col ${
                    !stableIsAdmin ? 'cursor-pointer' : ''
                  }`}
                  style={{
                    backgroundColor: hoveredCard === tool.id ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${hoveredCard === tool.id ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'}`,
                    transform: stableIsAdmin ? 'none' : getCardTransform(tool.id),
                    boxShadow: getCardShadow(tool.id),
                  }}
                  onMouseMove={(e) => handleMouseMove(e, tool.id)}
                  onMouseLeave={handleMouseLeave}
                  onClick={!stableIsAdmin ? () => {
                    if (tool.url && tool.url !== '#') {
                      window.open(tool.url, '_blank', 'noopener,noreferrer')
                    }
                  } : undefined}
                >
                  {/* Admin controls and external link */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                    {/* Admin Icon Buttons Panel - Order: Edit, Publish/Unpublish, Delete, New Tab */}
                    {stableIsAdmin && hoveredCard === tool.id && (
                      <>
                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(tool)
                          }}
                          className="p-1 hover:bg-blue-500/20 rounded transition-colors relative z-10"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-blue-400 hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Publish/Unpublish Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTogglePublished(tool)
                          }}
                          className="p-1 hover:bg-blue-500/20 rounded transition-colors relative z-10"
                          title={productPublishedStatus[tool.id] === false ? 'Publish' : 'Unpublish'}
                        >
                          {productPublishedStatus[tool.id] === false ? (
                            <svg className="w-4 h-4 text-green-400 hover:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-yellow-400 hover:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProduct(tool)
                          }}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors relative z-10"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-red-400 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* New Tab Icon - Always visible on hover, clickable for link */}
                    {hoveredCard === tool.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (tool.url && tool.url !== '#') {
                            window.open(tool.url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors relative z-10"
                        title="Open in new tab"
                      >
                        <img 
                          src="/newtab.svg" 
                          alt="Open in new tab" 
                          className="w-4 h-4"
                          style={{
                            filter: 'brightness(0) saturate(100%) invert(100%) opacity(0.8)',
                          }}
                        />
                      </button>
                    )}
                  </div>

                  {/* Icon */}
                  <div 
                    className="text-3xl sm:text-4xl mb-3 sm:mb-4 transition-transform duration-500"
                  >
                    {tool.icon}
                  </div>
                  
                  {/* Software Name with Unpublished Indicator */}
                  <div className="mb-2 sm:mb-3">
                    <div 
                      className="flex flex-wrap items-center gap-2 transition-transform duration-500"
                    >
                      <h3 className="text-lg sm:text-xl font-semibold text-white">
                        {tool.name}
                      </h3>
                      {/* Unpublished Indicator - Only show in admin mode when product is unpublished */}
                      {stableIsAdmin && productPublishedStatus[tool.id] === false && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
                          Unpublished
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p 
                    className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 flex-grow transition-transform duration-500"
                  >
                    {tool.description}
                  </p>
                  
                  {/* Tags - Always at the bottom */}
                  <div 
                    className="flex flex-wrap gap-2 mt-auto transition-transform duration-500"
                  >
                    {/* Free tag for free products */}
                    {tool.pricing === 'free' && (
                      <span 
                        className="px-3 py-1 text-xs font-medium rounded-full border"
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.2)',
                          borderColor: 'rgba(34, 197, 94, 0.4)',
                          color: '#22c55e',
                        }}
                      >
                        Free
                      </span>
                    )}
                    
                    {/* Regular tags from database */}
                    {tool.tags.map((tag, tagIndex) => (
                      <div key={tagIndex} className="relative group z-10">
                        <span 
                          className="px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 inline-flex items-center relative overflow-hidden"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            transform: stableIsAdmin ? 'translateZ(0px)' : 'translateZ(15px)',
                            position: 'relative'
                          }}
                        >
                          <span className={`transition-all duration-200 ${stableIsAdmin ? 'truncate group-hover:max-w-[calc(100%-13px)]' : ''}`}>
                            {tag}
                          </span>
                          {/* Admin: X icon overlays on hover - Only show in admin mode */}
                          {stableIsAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleToggleProductTag(tool.id, tag)
                              }}
                              className="absolute right-1 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-400 hover:text-red-300 w-4 h-4 flex items-center justify-center text-sm font-bold"
                              disabled={productTagLoading === tool.id}
                              style={{
                                transform: 'translateY(-50%)',
                                position: 'absolute',
                                zIndex: 10
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      </div>
                    ))}

                    {/* Admin: Add Tag Button */}
                    {stableIsAdmin && (
                      <div className="relative z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            setShowTagDropdown(showTagDropdown === tool.id ? null : tool.id)
                          }}
                          disabled={productTagLoading === tool.id}
                          className="relative z-10 px-3 py-1 text-xs font-medium rounded-full border border-dashed border-gray-500 text-gray-400 hover:border-gray-300 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 min-w-[28px] min-h-[28px] justify-center bg-black/20 hover:bg-black/40"
                          style={{
                            position: 'relative'
                          }}
                        >
                          {productTagLoading === tool.id ? (
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '+'
                          )}
                        </button>

                        {/* Tag Dropdown - Portal-style with fixed positioning */}
                        {showTagDropdown === tool.id && (
                          <>
                            {/* Click-away backdrop */}
                            <div 
                              className="fixed inset-0 z-[9998]" 
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowTagDropdown(null)
                              }}
                              style={{ 
                                backgroundColor: 'transparent',
                                cursor: 'default'
                              }}
                            />
                            {/* Dropdown content */}
                            <div 
                              className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-[150px] max-h-[200px] overflow-y-auto"
                              style={{ 
                                zIndex: 9999,
                                position: 'absolute'
                              }}
                            >
                              {availableTags.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    handleToggleProductTag(tool.id, tag.name)
                                    setShowTagDropdown(null)
                                  }}
                                  disabled={productTagLoading === tool.id}
                                  className={`w-full px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 hover:bg-gray-600 ${
                                    tool.tags.includes(tag.name)
                                      ? 'text-green-400 bg-green-500/10'
                                      : 'text-white'
                                  }`}
                                  style={{
                                    position: 'relative',
                                    zIndex: 10000
                                  }}
                                >
                                  {tag.name} {tool.tags.includes(tag.name) ? '✓' : ''}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="px-4 sm:px-6 py-8 sm:py-12 pt-16 sm:pt-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-6 sm:mb-8">
            <a 
              href="https://seorocket.notion.site/seorocket/SEO-Rocket-Refund-Policy-cf90d3f98cdf4b0da5fe3e58bb75405a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-xs sm:text-sm font-medium"
            >
              Refund Policy
            </a>
            <a 
              href="https://seorocket.notion.site/seorocket/SEO-Rocket-Refund-Policy-cf90d3f98cdf4b0da5fe3e58bb75405a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-xs sm:text-sm font-medium"
            >
              Privacy Policy
            </a>
            <a 
              href="https://seorocket.notion.site/SEO-Rocket-Tools-Terms-and-Conditions-367d487eeb13438ab3bceecbfe2b27e6?pvs=4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors duration-300 text-xs sm:text-sm font-medium"
            >
              Terms & Conditions
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-gray-500 text-xs sm:text-sm px-4">
              All Rights Reserved Copyright 2025 - Designed by SEO Rocket. 💗
            </p>
          </div>
        </div>
      </footer>

      {/* Tag Manager Modal */}
      {stableIsAdmin && showTagManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Tag Manager</h2>
                <button
                  onClick={() => setShowTagManager(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Add New Tag */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Add New Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag()
                      }
                    }}
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTagName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Existing Tags</label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span className="text-white">{tag.name}</span>
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        disabled={deletingTagId === tag.id}
                        className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {deletingTagId === tag.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Deleting...</span>
                          </>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {stableIsAdmin && (showAddProduct || showEditProduct) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {showAddProduct ? 'Add New Product' : 'Edit Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddProduct(false)
                    setShowEditProduct(null)
                    resetProductForm()
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault()
                if (showEditProduct) {
                  handleEditProduct(showEditProduct)
                } else {
                  handleAddProduct()
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Software Name *</label>
                    <input
                      type="text"
                      value={productForm.software_name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, software_name: e.target.value }))}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Emoji</label>
                    <input
                      type="text"
                      value={productForm.emoji}
                      onChange={(e) => setProductForm(prev => ({ ...prev, emoji: e.target.value }))}
                      placeholder="🚀"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                    <input
                      type="url"
                      value={productForm.url}
                      onChange={(e) => setProductForm(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Slug</label>
                    <input
                      type="text"
                      value={productForm.slug}
                      onChange={(e) => setProductForm(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="auto-generated from name"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Tag Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-800 border border-gray-700 rounded-lg min-h-[44px]">
                      {productForm.tags.length === 0 ? (
                        <span className="text-gray-500 text-sm">No tags selected</span>
                      ) : (
                        productForm.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                setProductForm(prev => ({
                                  ...prev,
                                  tags: prev.tags.filter((_, i) => i !== index)
                                }))
                              }}
                              className="ml-1 text-blue-300 hover:text-blue-100"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {availableTags
                        .filter(tag => !productForm.tags.includes(tag.name))
                        .map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setProductForm(prev => ({
                                ...prev,
                                tags: [...prev.tags, tag.name]
                              }))
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700/60 hover:bg-gray-600 text-gray-300 border border-gray-600 transition-colors"
                          >
                            {tag.name}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.published}
                      onChange={(e) => setProductForm(prev => ({ ...prev, published: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Published</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Featured</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.free}
                      onChange={(e) => setProductForm(prev => ({ ...prev, free: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Free</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProduct(false)
                      setShowEditProduct(null)
                      resetProductForm()
                    }}
                    disabled={editProductLoading || addProductLoading}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editProductLoading || addProductLoading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {(editProductLoading || addProductLoading) && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {showAddProduct 
                      ? (addProductLoading ? 'Adding Product...' : 'Add Product')
                      : (editProductLoading ? 'Updating Product...' : 'Update Product')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tag Ordering Modal */}
      {showTagOrdering && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Tag-Based Product Ordering</h2>
                <button
                  onClick={() => setShowTagOrdering(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <TagOrdering isAdmin={stableIsAdmin} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
} 