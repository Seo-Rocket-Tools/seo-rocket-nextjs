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
import { Tag, supabase, getAvailableTagsFromProducts } from '../lib/supabase'
import { useAuth, signOut } from '../lib/useAuth'
import TagManagerModal from './components/modals/TagManagerModal'
import ProductFormModal, { ProductForm } from './components/modals/ProductFormModal'
import HeroSection from './components/sections/HeroSection'
import FilterTabs from './components/sections/FilterTabs'
import ProductCard from './components/cards/ProductCard'

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
  useRealtime({
    onProductChange: handleProductChange,
    onTagChange: handleTagChange,
    enabled: true
  })


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

  const handleProductFormChange = (updates: Partial<ProductForm>) => {
    setProductForm(prev => ({ ...prev, ...updates }))
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
      <HeroSection isAdmin={stableIsAdmin} />

      {/* Software Grid Section - Dynamic Layout */}
      <section 
        className="px-4 sm:px-6 pb-8 sm:pb-12 relative z-10"
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
      >
        <div className="max-w-7xl mx-auto">
          {/* Horizontal Scrollable Filter Tabs */}
          <FilterTabs
            availableFilterTags={availableFilterTags}
            activeFilter={activeFilter}
            savedFilters={savedFilters}
            isAdmin={stableIsAdmin}
            onFilterChange={handleFilterChange}
          />

          {/* Flex Layout - Responsive cards with refined spacing */}
          <div className="flex flex-row flex-wrap justify-center items-stretch gap-3 sm:gap-4 lg:gap-5 max-w-7xl mx-auto px-2 sm:px-0">
            {filteredSoftware.map((tool, index) => {
              // Determine if drag and drop should be enabled
              const isDragEnabled = stableIsAdmin && !isSavingOrder
              const isDraggedCard = draggedProductId === tool.id
              const isDropTarget = !!(draggedProductId && index === filteredSoftware.findIndex(item => item.id === draggedProductId))
              
              return (
                <ProductCard
                  key={tool.id}
                  tool={tool}
                  index={index}
                  isAdmin={stableIsAdmin}
                  isDragEnabled={isDragEnabled}
                  isDraggedCard={isDraggedCard}
                  isDropTarget={isDropTarget}
                  isSavingOrder={isSavingOrder}
                  hoveredCard={hoveredCard}
                  mousePosition={mousePosition}
                  productPublishedStatus={productPublishedStatus}
                  productTagLoading={productTagLoading}
                  showTagDropdown={showTagDropdown}
                  availableTags={availableTags}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleSimpleDrop}
                  onDragEnd={handleDragEnd}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onEditClick={openEditModal}
                  onTogglePublished={handleTogglePublished}
                  onDeleteClick={handleDeleteProduct}
                  onToggleProductTag={handleToggleProductTag}
                  onSetShowTagDropdown={setShowTagDropdown}
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* Tag Manager Modal */}
      {stableIsAdmin && showTagManager && (
        <TagManagerModal
          show={showTagManager}
          availableTags={availableTags}
          newTagName={newTagName}
          deletingTagId={deletingTagId}
          onClose={() => setShowTagManager(false)}
          onNewTagNameChange={setNewTagName}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />
      )}

      {/* Add/Edit Product Modal */}
      <ProductFormModal
        show={stableIsAdmin && (!!showAddProduct || !!showEditProduct)}
        mode={showAddProduct ? 'add' : 'edit'}
        productForm={productForm}
        availableTags={availableTags}
        isLoading={showAddProduct ? addProductLoading : editProductLoading}
        onClose={() => {
          setShowAddProduct(false)
          setShowEditProduct(null)
          resetProductForm()
        }}
        onFormChange={handleProductFormChange}
        onSubmit={(e) => {
          e.preventDefault()
          if (showEditProduct) {
            handleEditProduct(showEditProduct)
          } else {
            handleAddProduct()
          }
        }}
      />

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