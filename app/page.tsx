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
  const [orderSaveSuccess, setOrderSaveSuccess] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState<string | null>(null)
  const [productPublishedStatus, setProductPublishedStatus] = useState<Record<string, boolean>>({})
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null)
  const [productTagLoading, setProductTagLoading] = useState<string | null>(null)
  const [editProductLoading, setEditProductLoading] = useState(false)
  const [addProductLoading, setAddProductLoading] = useState(false)

  // Simple drag and drop state
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [disableRealtimeRefresh, setDisableRealtimeRefresh] = useState(false)

  // Simple drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: SoftwareItem) => {
    if (!stableIsAdmin || isSavingOrder) return
    setDraggedProductId(item.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleSimpleDrop = async (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    
    if (!stableIsAdmin || !draggedProductId || isSavingOrder || !supabase) {
      setDraggedProductId(null)
      return
    }

    const sourceIndex = filteredSoftware.findIndex(item => item.id === draggedProductId)
    if (sourceIndex === targetIndex || sourceIndex === -1) {
      setDraggedProductId(null)
      return
    }

    // Reorder items
    const reorderedItems = [...filteredSoftware]
    const [movedItem] = reorderedItems.splice(sourceIndex, 1)
    reorderedItems.splice(targetIndex, 0, movedItem)

    // Update UI immediately
    setFilteredSoftware(reorderedItems)
    setIsSavingOrder(true)
    setDisableRealtimeRefresh(true)

    try {
      // Update database based on filter type
      if (activeFilter === 'Featured') {
        const updates = reorderedItems.map((item, index) => 
          supabase!.from('products').update({ featured_order: index }).eq('slug', item.id)
        )
        await Promise.all(updates)
      } else if (activeFilter === 'Free') {
        const updates = reorderedItems.map((item, index) => 
          supabase!.from('products').update({ free_order: index }).eq('slug', item.id)
        )
        await Promise.all(updates)
      } else if (activeFilter === 'All') {
        const updates = reorderedItems.map((item, index) => 
          supabase!.from('products').update({ all_order: index }).eq('slug', item.id)
        )
        await Promise.all(updates)
      } else {
        // Handle custom tags
        const tag = availableTags.find(t => t.name === activeFilter)
        if (tag) {
          // Get product IDs from slugs
          const slugs = reorderedItems.map(item => item.id)
          const { data: products } = await supabase!
            .from('products')
            .select('id, slug')
            .in('slug', slugs)
          
          if (products) {
            const slugToId = new Map(products.map(p => [p.slug, p.id]))
            const upsertData = reorderedItems.map((item, index) => ({
              product_id: slugToId.get(item.id),
              tag_id: tag.id,
              order_position: index
            })).filter(item => item.product_id)

            await supabase!
              .from('product_tags')
              .upsert(upsertData, {
                onConflict: 'product_id,tag_id',
                ignoreDuplicates: false
              })
          }
        }
      }

      // Show success message
      setOrderSaveSuccess(`${activeFilter} order saved`)
      setTimeout(() => setOrderSaveSuccess(null), 3000)
      
      // Mark filter as saved
      setSavedFilters(prev => {
        const newSet = new Set(prev)
        newSet.add(activeFilter)
        return newSet
      })

      // Re-enable realtime refresh after delay
      setTimeout(() => {
        setDisableRealtimeRefresh(false)
        refreshData()
      }, 1000)

    } catch (error) {
      console.error('Error saving order:', error)
      // Revert on error
      const originalOrder = activeFilter === 'Featured' 
        ? getFeaturedSoftware(softwareData!, stableIsAdmin)
        : getSoftwareByTag(softwareData!, activeFilter, stableIsAdmin)
      setFilteredSoftware(originalOrder)
    } finally {
      setIsSavingOrder(false)
      setDraggedProductId(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedProductId(null)
  }

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
  const [savedFilters, setSavedFilters] = useState<Set<string>>(new Set())
  
  // Blog scroll state
  const [canScrollBlogLeft, setCanScrollBlogLeft] = useState(false)
  const [canScrollBlogRight, setCanScrollBlogRight] = useState(false)

  // Load saved filters from localStorage on mount
  useEffect(() => {
    if (stableIsAdmin && typeof window !== 'undefined') {
      const saved = localStorage.getItem('seo-rocket-saved-filter-orders')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSavedFilters(new Set(parsed))
        } catch (e) {
          console.error('Failed to parse saved filter orders:', e)
        }
      }
    }
  }, [stableIsAdmin])

  // Save filters to localStorage when they change
  useEffect(() => {
    if (stableIsAdmin && typeof window !== 'undefined' && savedFilters.size > 0) {
      localStorage.setItem('seo-rocket-saved-filter-orders', JSON.stringify(Array.from(savedFilters)))
    }
  }, [savedFilters, stableIsAdmin])

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
    
    // Don't refresh if realtime refresh is temporarily disabled
    if (disableRealtimeRefresh) {
      console.log('Realtime refresh temporarily disabled, skipping...')
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
  }, [activeFilter, stableIsAdmin, authLoading, loadAvailableFilterTags, disableRealtimeRefresh])

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
      
      // Don't reload if realtime refresh is disabled (e.g., during drag operations)
      if (disableRealtimeRefresh) {
        console.log('Realtime refresh disabled, skipping focus reload...')
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
  }, [activeFilter, stableIsAdmin, authLoading, loadAvailableFilterTags, disableRealtimeRefresh])

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

  // Handle blog scroll
  const scrollBlogs = (direction: 'left' | 'right') => {
    const container = document.getElementById('blog-container')
    if (!container) return
    
    const scrollAmount = 320 // Width of one blog card plus gap
    const newScrollLeft = direction === 'left' 
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount)
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
    
    // Update scroll state after a brief delay to account for smooth scrolling
    setTimeout(() => updateBlogScrollState(), 300)
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

  // Update blog scroll state
  const updateBlogScrollState = () => {
    const container = document.getElementById('blog-container')
    if (!container) return
    
    const isScrollable = container.scrollWidth > container.clientWidth
    const isAtStart = container.scrollLeft <= 1
    const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 1
    
    setCanScrollBlogLeft(isScrollable && !isAtStart)
    setCanScrollBlogRight(isScrollable && !isAtEnd)
  }

  // Check scroll state on mount and resize
  useEffect(() => {
    if (!softwareData) return
    
    const container = document.getElementById('filter-container')
    const blogContainer = document.getElementById('blog-container')
    if (!container) return
    
    const handleScroll = () => {
      console.log('Scroll event triggered')
      updateScrollState()
    }
    
    const handleBlogScroll = () => {
      updateBlogScrollState()
    }
    
    const handleResize = () => {
      console.log('Resize event triggered')
      updateScrollState()
      updateBlogScrollState()
    }
    
    // Add event listeners
    container.addEventListener('scroll', handleScroll, { passive: true })
    if (blogContainer) {
      blogContainer.addEventListener('scroll', handleBlogScroll, { passive: true })
    }
    window.addEventListener('resize', handleResize)
    
    // Initial check with multiple attempts to ensure container is ready
    const checkInitialState = () => {
      console.log('Checking initial scroll state')
      updateScrollState()
      updateBlogScrollState()
    }
    
    // Check immediately and with delays
    checkInitialState()
    setTimeout(checkInitialState, 100)
    setTimeout(checkInitialState, 500)
    setTimeout(checkInitialState, 1000)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (blogContainer) {
        blogContainer.removeEventListener('scroll', handleBlogScroll)
      }
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
              src="/seo-rocket-light.svg"
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
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full border transition-all duration-300 cursor-pointer hover:scale-105 whitespace-nowrap flex-shrink-0 min-h-[40px] flex items-center relative"
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
                  {/* Saved order indicator */}
                  {stableIsAdmin && savedFilters.has(filter) && (
                    <span className="ml-1.5 w-1.5 h-1.5 bg-green-400 rounded-full" title="Custom order saved" />
                  )}
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
          <div className="flex flex-row flex-wrap justify-center items-stretch gap-3 sm:gap-4 lg:gap-5 max-w-7xl mx-auto px-2 sm:px-0 transition-all duration-300">
            {filteredSoftware.map((tool, index) => {
              // Debug logging for each product
              console.log(`Rendering card ${index + 1}: ${tool.name}`)
              console.log('  - Tool tags:', tool.tags, Array.isArray(tool.tags), tool.tags?.length)
              console.log('  - Tool object:', tool)
              
              // Determine if drag and drop should be enabled
              const isDragEnabled = stableIsAdmin && !isSavingOrder
              const isDraggedCard = draggedProductId === tool.id
              const isDropTarget = draggedProductId && index === filteredSoftware.findIndex(item => item.id === draggedProductId)
              
              return (
                <div 
                  key={tool.id}
                  onDragStart={(e) => handleDragStart(e, tool)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleSimpleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  draggable={isDragEnabled}
                  className={`drag-drop-card w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.9375rem)] min-w-[280px] max-w-[320px] rounded-lg p-4 sm:p-6 relative flex flex-col group transition-all duration-300 ${
                    isDraggedCard ? 'opacity-40 scale-95' : ''
                  } ${isDropTarget ? 'scale-105' : ''} ${isSavingOrder ? 'drag-drop-saving' : ''}`}
                  style={{
                    backgroundColor: isDropTarget
                      ? 'rgba(168, 85, 247, 0.15)'
                      : isDraggedCard 
                        ? 'rgba(147, 51, 234, 0.1)'
                        : hoveredCard === tool.id 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${
                      isDropTarget
                        ? 'rgba(168, 85, 247, 0.5)'
                        : isDraggedCard 
                          ? 'rgba(147, 51, 234, 0.3)'
                          : hoveredCard === tool.id 
                            ? 'rgba(255, 255, 255, 0.25)' 
                            : 'rgba(255, 255, 255, 0.15)'
                    }`,
                    transform: isDropTarget
                      ? 'scale(1.05)'
                      : isDraggedCard 
                        ? 'scale(0.95)'
                        : getCardTransform(tool.id),
                    boxShadow: isDropTarget
                      ? '0 0 0 2px rgba(168, 85, 247, 0.5), 0 10px 20px rgba(168, 85, 247, 0.2)'
                      : isDraggedCard 
                        ? '0 4px 8px rgba(0, 0, 0, 0.1)'
                        : getCardShadow(tool.id),
                    transition: isSavingOrder ? 'all 0.2s ease-out' : 'all 0.3s ease-out'
                  }}
                  onMouseMove={(e) => {
                    if (!isSavingOrder) {
                      handleMouseMove(e, tool.id)
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isSavingOrder) {
                      handleMouseLeave()
                    }
                  }}
                >
                  {/* Drag Handle - Enhanced and more accessible */}
                  {isDragEnabled && (
                    <div 
                      className={`absolute top-3 left-3 z-[80] p-2 rounded-lg transition-all duration-200 select-none ${
                        isSavingOrder
                          ? 'bg-gray-800/40 opacity-50 cursor-not-allowed'
                          : isDraggedCard 
                            ? 'bg-purple-600/90 shadow-lg scale-110 cursor-grabbing' 
                            : 'bg-gray-800/60 hover:bg-gray-700/80 opacity-0 group-hover:opacity-100 cursor-grab'
                      } backdrop-blur-sm`}
                      title={isSavingOrder ? 'Please wait for the current operation to complete' : `Drag to reorder in ${activeFilter}`}
                      onMouseDown={(e) => {
                        // Prevent any other mouse events from interfering
                        e.stopPropagation()
                      }}
                    >
                      <svg 
                        className={`w-4 h-4 transition-all duration-200 pointer-events-none ${
                          isDraggedCard 
                            ? 'text-white' 
                            : 'text-gray-400 group-hover:text-gray-200'
                        }`}
                        fill="none" 
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                      </svg>
                      
                      {/* Subtle hover effect */}
                      {!isDraggedCard && (
                        <div className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      )}
                      
                      {/* Glowing effect when dragging */}
                      {isDraggedCard && (
                        <div className="absolute inset-0 rounded-lg bg-purple-400/30 animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* Admin controls and external link */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-[70]">
                    {/* Admin Icon Buttons Panel */}
                    {stableIsAdmin && hoveredCard === tool.id && !isSavingOrder && (
                      <>
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            openEditModal(tool)
                          }}
                          className="p-2 hover:bg-blue-500/20 rounded-lg transition-all duration-200 relative z-10 border border-transparent hover:border-blue-500/30"
                          title="Edit Product"
                        >
                          <svg className="w-4 h-4 text-blue-400 hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Publish/Unpublish Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleTogglePublished(tool)
                          }}
                          className="p-2 hover:bg-yellow-500/20 rounded-lg transition-all duration-200 relative z-10 border border-transparent hover:border-yellow-500/30"
                          title={productPublishedStatus[tool.id] === false ? 'Publish Product' : 'Unpublish Product'}
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleDeleteProduct(tool)
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 relative z-10 border border-transparent hover:border-red-500/30"
                          title="Delete Product"
                        >
                          <svg className="w-4 h-4 text-red-400 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* External Link Button - Always visible on hover */}
                    {hoveredCard === tool.id && !isSavingOrder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          if (tool.url && tool.url !== '#') {
                            window.open(tool.url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 relative z-10 border border-transparent hover:border-white/20"
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

                  {/* Loading indicator when saving drag order */}
                  {isSavingOrder && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-[90] pointer-events-none">
                      <div className="bg-gray-900/90 rounded-lg p-2 shadow-lg">
                        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                  )}

                  {/* Dragging overlay effect */}
                  {isSavingOrder && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg pointer-events-none" />
                  )}

                  {/* Main content - wrapped in clickable div for non-admin users */}
                  <div 
                    className={`flex flex-col h-full ${!stableIsAdmin && !isSavingOrder ? 'cursor-pointer' : ''}`}
                    onClick={!stableIsAdmin && !isSavingOrder ? () => {
                      if (tool.url && tool.url !== '#') {
                        window.open(tool.url, '_blank', 'noopener,noreferrer')
                      }
                    } : undefined}
                  >
                    {/* Icon */}
                    <div 
                      className={`text-3xl sm:text-4xl mb-3 sm:mb-4 transition-all duration-300 ${
                        isSavingOrder ? 'scale-110 brightness-110' : ''
                      }`}
                    >
                      {tool.icon}
                    </div>
                    
                    {/* Software Name with Unpublished Indicator */}
                    <div className="mb-2 sm:mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-lg sm:text-xl font-semibold text-white transition-all duration-300 ${
                          isSavingOrder ? 'text-purple-200' : ''
                        }`}>
                          {tool.name}
                        </h3>
                        {/* Unpublished Indicator */}
                        {stableIsAdmin && productPublishedStatus[tool.id] === false && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
                            Unpublished
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`text-gray-400 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 flex-grow transition-all duration-300 ${
                      isSavingOrder ? 'text-gray-300' : ''
                    }`}>
                      {tool.description}
                    </p>
                    
                    {/* Tags - Always at the bottom */}
                    <div className="flex flex-wrap gap-2 mt-auto">
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
                        <div key={tagIndex} className="relative group/tag z-10">
                          <span 
                            className="px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 inline-flex items-center relative overflow-hidden hover:bg-white/15 hover:border-white/30"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              color: '#ffffff',
                              transform: stableIsAdmin ? 'translateZ(0px)' : 'translateZ(15px)',
                              position: 'relative'
                            }}
                          >
                            <span className={`transition-all duration-200 ${stableIsAdmin ? 'truncate group-hover/tag:max-w-[calc(100%-16px)]' : ''}`}>
                              {tag}
                            </span>
                            {/* Admin: X icon overlays on hover - Only show in admin mode and only on individual tag hover */}
                            {stableIsAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  handleToggleProductTag(tool.id, tag)
                                }}
                                className="absolute right-1 top-1/2 opacity-0 group-hover/tag:opacity-100 transition-opacity duration-200 text-red-400 hover:text-red-300 w-4 h-4 flex items-center justify-center text-sm font-bold z-10"
                                disabled={productTagLoading === tool.id}
                                style={{
                                  transform: 'translateY(-50%)',
                                  position: 'absolute'
                                }}
                                title="Remove tag"
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
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
            {/* Left Column - Text Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-purple-300 text-sm font-medium">Born from Frustration 😅</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                  We understand your
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> daily challenges</span>
                </h2>
                
                <p className="text-lg text-gray-300 leading-relaxed">
                  We're a team of digital marketing experts and developers who understand the daily challenges faced by 
                  <span className="text-white font-semibold"> agencies</span> and 
                  <span className="text-white font-semibold"> virtual assistants</span> in today's fast-paced digital landscape.
                </p>
                
                <p className="text-gray-400 leading-relaxed">
                  Born from real-world experience managing hundreds of client campaigns, SEO Rocket was created to solve the repetitive, 
                  time-consuming tasks that keep you from focusing on what matters most, delivering exceptional results for your clients.
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">100+</div>
                  <div className="text-sm text-gray-400">Agencies Served</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">50k+</div>
                  <div className="text-sm text-gray-400">Hours Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">99%</div>
                  <div className="text-sm text-gray-400">Client Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Elements */}
            <div className="relative">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
              
              {/* Main Card */}
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                {/* Top Section - Team Avatar Placeholder */}
                <div className="flex items-center justify-center mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Feature Grid */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Built for Speed</h4>
                      <p className="text-sm text-gray-400">Cut workflow time in half with tools designed for efficiency</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Agency Tested</h4>
                      <p className="text-sm text-gray-400">Used daily by agencies managing 50+ clients</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Always Evolving</h4>
                      <p className="text-sm text-gray-400">Continuous updates based on user feedback</p>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-400 mb-3">Trusted by marketing professionals worldwide</p>
                  <div className="flex justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">5.0 rating from our users</p>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500/30 rounded-full blur-sm"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-blue-500/20 rounded-full blur-lg"></div>
            </div>
          </div>

          {/* Bottom Quote Section */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl p-8 sm:p-12 text-center backdrop-blur-sm">
            <svg className="w-12 h-12 text-purple-400 mx-auto mb-6 opacity-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
            <blockquote className="text-xl sm:text-2xl font-medium text-white mb-4 italic">
              "We built the tools we wished existed when we were drowning in repetitive tasks"
            </blockquote>
            <p className="text-gray-400">— The SEO Rocket Team</p>
          </div>
        </div>
      </section>

      {/* Recent Posts/Blogs Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-end mb-12 sm:mb-16">
            {/* Left Column - Header Content */}
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
                <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-purple-300 text-sm font-medium">Knowledge Base</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                Latest 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Insights</span>
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Exclusive strategies and insider knowledge from agency owners who've scaled to 100+ clients
              </p>
            </div>

            {/* Right Column - Navigation & Stats */}
            <div className="flex flex-col lg:items-end gap-4">
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Updated Weekly</span>
                </div>
                <div>
                  <span className="text-white font-semibold">12</span> Articles
                </div>
              </div>
              <div className="flex justify-end items-center gap-4">
                <button 
                  onClick={() => scrollBlogs('left')}
                  disabled={!canScrollBlogLeft}
                  className={`w-12 h-12 rounded-full border transition-all duration-300 flex items-center justify-center ${
                    canScrollBlogLeft 
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer' 
                      : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => scrollBlogs('right')}
                  disabled={!canScrollBlogRight}
                  className={`w-12 h-12 rounded-full border transition-all duration-300 flex items-center justify-center ${
                    canScrollBlogRight 
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 cursor-pointer' 
                      : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Premium Blog Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Featured Post - Large */}
            <div className="lg:col-span-2">
              <article className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group h-full relative overflow-hidden">
                {/* Featured Badge */}
                <div className="absolute top-6 right-6 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-full">
                  Featured
                </div>
                
                {/* Visual Header */}
                <div className="h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl mb-8 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10"></div>
                  <svg className="w-16 h-16 text-purple-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {/* Floating Elements */}
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500/30 rounded-full blur-sm"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 bg-purple-500/20 rounded-full blur-lg"></div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                      Growth Strategy
                    </span>
                    <span className="text-xs text-gray-500">Featured • 12 min read</span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-purple-300 transition-colors leading-tight">
                    The $100K Agency Blueprint: How We Scaled Without Burnout
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed">
                    The exact step-by-step system we used to grow from $10K to $100K MRR in 18 months, including our complete tech stack, pricing strategy, and the automation workflows that saved us 40+ hours per week.
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">SR</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">SEO Rocket Team</div>
                        <div className="text-xs text-gray-500">Dec 15, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>1.2k views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>89</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Secondary Post */}
            <div>
              <article className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group h-full">
                <div className="h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                    Chrome Extensions
                  </span>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    15 Must-Have Extensions for Digital Marketers
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Browser extensions that every agency should install to boost productivity and client results.
                  </p>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xs text-gray-500">5 min read</span>
                    <time className="text-xs text-gray-500">Dec 12, 2024</time>
                  </div>
                </div>
              </article>
            </div>
          </div>

          {/* Horizontal Scrollable Additional Posts */}
          <div className="relative">
            {/* Gradient Overlays for Faded Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />
            
            {/* Scrollable Container */}
            <div 
              id="blog-container"
              className="overflow-x-auto scrollbar-hide pb-4" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex gap-6 px-8" style={{ width: 'fit-content' }}>
                {/* Blog Card 1 */}
                <article className="flex-shrink-0 w-72 bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                  <div className="h-40 bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-lg mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                      WordPress
                    </span>
                    <h3 className="text-lg font-semibold text-white group-hover:text-yellow-300 transition-colors">
                      WordPress Plugin Stack for Client Sites
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Essential plugins that every agency should install for optimal performance and security.
                    </p>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-gray-500">7 min read</span>
                      <time className="text-xs text-gray-500">Dec 8, 2024</time>
                    </div>
                  </div>
                </article>

                {/* Blog Card 2 */}
                <article className="flex-shrink-0 w-72 bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                  <div className="h-40 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                      Analytics
                    </span>
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors">
                      Client Reporting That Actually Converts
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      How to create reports that showcase value and help you retain clients longer.
                    </p>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-gray-500">6 min read</span>
                      <time className="text-xs text-gray-500">Dec 5, 2024</time>
                    </div>
                  </div>
                </article>

                {/* Coming Soon Card */}
                <article className="flex-shrink-0 w-72 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5"></div>
                  <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="relative space-y-3">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                      Coming Soon
                    </span>
                    <h3 className="text-lg font-semibold text-white">
                      Pricing Strategies That 10X Revenue
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      The psychology behind premium pricing and how to position your agency for high-value clients.
                    </p>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-purple-400">Next week</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <span>In progress</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-blue-300 text-sm font-medium">Let's Connect</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Scale Your Agency?</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Join 100+ agencies already using our tools to automate workflows and focus on growth. 
              Whether you need support or want to discuss custom solutions, we're here to help.
            </p>
          </div>

          {/* Contact Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Primary Contact Card - Email */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300 h-full relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"></div>
                <div className="absolute top-6 right-6 w-12 h-12 bg-purple-500/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl"></div>
                
                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        Get Direct Support
                      </h3>
                      <p className="text-gray-400 text-lg">
                        Questions about our tools? Technical support? We respond personally.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 text-sm font-medium">Online Now</span>
                    </div>
                  </div>

                  {/* Contact Methods */}
                  <div className="space-y-6">
                    {/* Primary Email */}
                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-semibold">seorockettools@gmail.com</div>
                          <div className="text-sm text-gray-400">Primary support email</div>
                        </div>
                      </div>
                      <a 
                        href="mailto:seorockettools@gmail.com"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        Send Email
                      </a>
                    </div>

                    {/* Response Time Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-white mb-1">&lt; 4h</div>
                        <div className="text-xs text-gray-400">Avg Response</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-white mb-1">24/7</div>
                        <div className="text-xs text-gray-400">Support Available</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-white mb-1">100%</div>
                        <div className="text-xs text-gray-400">Issues Resolved</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Options */}
            <div className="space-y-6">
              {/* Custom Solutions Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Custom Development</h4>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Need a tool built specifically for your agency? Let's discuss your requirements.
                </p>
                <a 
                  href="mailto:seorockettools@gmail.com?subject=Custom Development Inquiry"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                >
                  Start Project
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Partnership Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Partnership Opportunities</h4>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Interested in white-label solutions or affiliate partnerships?
                </p>
                <a 
                  href="mailto:seorockettools@gmail.com?subject=Partnership Inquiry"
                  className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                >
                  Explore Partnership
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Bug Report Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300 group">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Report Issues</h4>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Found a bug or have feedback? Help us improve our tools.
                </p>
                <a 
                  href="mailto:seorockettools@gmail.com?subject=Bug Report"
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                >
                  Report Issue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section - FAQ & Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* FAQ Quick Access */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Common Questions</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/8 transition-colors cursor-pointer">
                  <div className="text-white font-medium mb-1">How quickly can you develop custom tools?</div>
                  <div className="text-gray-400 text-sm">Most custom projects are completed within 2-4 weeks.</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/8 transition-colors cursor-pointer">
                  <div className="text-white font-medium mb-1">Do you offer white-label solutions?</div>
                  <div className="text-gray-400 text-sm">Yes, we provide white-label versions for agency partners.</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/8 transition-colors cursor-pointer">
                  <div className="text-white font-medium mb-1">What's included in your support?</div>
                  <div className="text-gray-400 text-sm">Installation help, troubleshooting, and feature guidance.</div>
                </div>
              </div>
            </div>

            {/* Contact Stats & Trust Signals */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Why Agencies Trust Us</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Built by Agency Owners</div>
                    <div className="text-gray-400 text-sm">We understand your challenges because we've lived them.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Lightning Fast Support</div>
                    <div className="text-gray-400 text-sm">No outsourced support. Direct access to our development team.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Continuous Innovation</div>
                    <div className="text-gray-400 text-sm">Regular updates based on real agency feedback and requests.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Notification */}
      {orderSaveSuccess && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-green-900/95 backdrop-blur-sm rounded-lg border border-green-700 shadow-xl">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-300 font-medium">{orderSaveSuccess}</span>
          </div>
        </div>
      )}
    </main>
  )
} 