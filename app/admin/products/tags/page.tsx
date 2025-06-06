'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getAllTags, getAllProductsWithTags, createTag, updateTag, deleteTag, reorderTags, getProductsInTagOrdered, reorderProductsInTagByIds, getProductsForSystemTag, reorderProductsForSystemTag, removeProductFromTag, updateProduct, Tag, ProductWithTags, addProductToTag, supabase } from '@/lib/supabase'

interface TagWithStats extends Tag {
  productCount: number
  products: ProductWithTags[]
  description?: string
}

function SortableProductItem({ 
  product, 
  getColorClasses,
  getTagColor,
  isSystemTag,
  systemTagType,
  handleRemoveFromTag,
  handleRemoveFromSystemTag,
  handleTogglePublish,
  togglingPublish,
  removingProduct
}: {
  product: ProductWithTags
  getColorClasses: (color: string) => { bg: string; text: string }
  getTagColor: (tag: TagWithStats) => string
  isSystemTag?: boolean
  systemTagType?: 'featured' | 'free' | 'all'
  handleRemoveFromTag?: (productId: string) => void
  handleRemoveFromSystemTag?: (productId: string, systemTagType: 'featured' | 'free' | 'all') => void
  handleTogglePublish?: (productId: string, newPublishedState: boolean) => void
  togglingPublish?: string | null
  removingProduct?: string | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 transition-colors ${
        isDragging 
          ? 'bg-gray-700/50 shadow-lg border border-gray-600 rounded-lg' 
          : 'hover:bg-gray-800/30'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        
        {/* Product Icon */}
        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
          {product.icon_url && product.icon_url.startsWith('http') ? (
            <img 
              src={product.icon_url} 
              alt={product.software_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">
              {product.icon_url || '📦'}
            </span>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex-1">
          <h4 className="text-white font-medium">{product.software_name}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{product.published ? 'Published' : 'Draft'}</span>
            {product.featured && (
              <>
                <span>•</span>
                <span className="text-yellow-400">Featured</span>
              </>
            )}
            {product.free && (
              <>
                <span>•</span>
                <span className="text-green-400">Free</span>
              </>
            )}
          </div>
        </div>
        
        {/* Action Button - Publish/Unpublish for All tag, Remove for others */}
        {isSystemTag && systemTagType === 'all' ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (handleTogglePublish && togglingPublish !== product.id) {
                handleTogglePublish(product.id, !product.published)
              }
            }}
            disabled={togglingPublish === product.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              product.published
                ? 'bg-gray-600/20 text-gray-400 border-gray-600/30 hover:bg-gray-600/30 hover:text-gray-300 hover:border-gray-500/50'
                : 'bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30 hover:text-blue-300 hover:border-blue-500/50'
            }`}
          >
            {togglingPublish === product.id ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                {product.published ? 'Unpublishing...' : 'Publishing...'}
              </>
            ) : product.published ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                Unpublish
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Publish
              </>
            )}
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (removingProduct !== product.id) {
                if (isSystemTag && systemTagType && handleRemoveFromSystemTag) {
                  handleRemoveFromSystemTag(product.id, systemTagType)
                } else if (handleRemoveFromTag) {
                  handleRemoveFromTag(product.id)
                }
              }
            }}
            disabled={removingProduct === product.id}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/20 text-red-400 border border-red-600/30 rounded-full hover:bg-red-600/30 hover:text-red-300 hover:border-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removingProduct === product.id ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Removing...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function SortableTagItem({ 
  tag, 
  openDropdown, 
  setOpenDropdown, 
  handleEditTag,
  handleDeleteTag,
  handleViewProducts,
  deleting,
  getColorClasses,
  getTagColor,
  formatDate 
}: {
  tag: TagWithStats
  openDropdown: string | null
  setOpenDropdown: (id: string | null) => void
  handleEditTag: (tag: TagWithStats) => void
  handleDeleteTag: (tag: TagWithStats) => void
  handleViewProducts: (tag: TagWithStats) => void
  deleting: string | null
  getColorClasses: (color: string) => { bg: string; text: string }
  getTagColor: (tag: TagWithStats) => string
  formatDate: (dateString: string) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-6 transition-colors cursor-pointer ${
        isDragging 
          ? 'bg-gray-700/50 shadow-lg border border-gray-600 rounded-lg' 
          : 'hover:bg-gray-800/30'
      }`}
      onClick={(e) => {
        // Only trigger if not clicking on drag handle or dropdown trigger/menu
        const target = e.target as Element
        if (!target.closest('[data-drag-handle]') && 
            !target.closest('[data-dropdown-trigger]') && 
            !target.closest('[data-dropdown-menu]')) {
          handleViewProducts(tag)
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            data-drag-handle
            className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          
          <div className={`w-12 h-12 ${getColorClasses(getTagColor(tag)).bg} rounded-lg flex items-center justify-center`}>
            <span className={`${getColorClasses(getTagColor(tag)).text} font-semibold`}>
              {tag.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{tag.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Created {formatDate(tag.created_at)}</span>
              <span>•</span>
              <span>{tag.description || 'No description'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Product count badge */}
          <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
            {tag.productCount} {tag.productCount === 1 ? 'Product' : 'Products'}
          </div>
          
          {/* Actions */}
          <div className="relative">
            <button 
              data-dropdown-trigger
              onClick={() => setOpenDropdown(openDropdown === tag.id ? null : tag.id)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {openDropdown === tag.id && (
              <div data-dropdown-menu className="absolute right-0 top-12 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleEditTag(tag)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
                >
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Tag
                </button>
                
                <button 
                  onClick={() => handleDeleteTag(tag)}
                  disabled={deleting === tag.id}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-3 disabled:opacity-50"
                >
                  {deleting === tag.id ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  {deleting === tag.id ? 'Deleting...' : 'Delete Tag'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductTagsPage() {
  const [tags, setTags] = useState<TagWithStats[]>([])
  const [products, setProducts] = useState<ProductWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addFormData, setAddFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: ''
  })
  const [creating, setCreating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTag, setEditingTag] = useState<TagWithStats | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: ''
  })
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [tagToDelete, setTagToDelete] = useState<TagWithStats | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  // Product management modal state
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedTag, setSelectedTag] = useState<TagWithStats | null>(null)
  const [selectedSystemTag, setSelectedSystemTag] = useState<{ name: string; type: 'featured' | 'free' | 'all' } | null>(null)
  const [tagProducts, setTagProducts] = useState<ProductWithTags[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [togglingPublish, setTogglingPublish] = useState<string | null>(null)
  const [removingProduct, setRemovingProduct] = useState<string | null>(null)

  // Add Product functionality state
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<ProductWithTags[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [loadingProductAdd, setLoadingProductAdd] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const [stats, setStats] = useState({
    totalTags: 0,
    taggedProducts: 0,
    avgProductsPerTag: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Trigger product search when search term changes
  useEffect(() => {
    if (productSearchTerm.trim()) {
      fetchAvailableProducts()
    } else {
      setAvailableProducts([])
    }
  }, [productSearchTerm])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const target = event.target as Element
        // Only close if clicking outside dropdown and dropdown trigger
        if (!target.closest('[data-dropdown-menu]') && !target.closest('[data-dropdown-trigger]')) {
          setOpenDropdown(null)
        }
      }
      
      // Close product search dropdown
      if (showProductDropdown) {
        const target = event.target as Element
        if (!target.closest('.product-search-container')) {
          setShowProductDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown, showProductDropdown])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all tags and products with tags
      const [tagsData, productsData] = await Promise.all([
        getAllTags(),
        getAllProductsWithTags()
      ])
      
      setProducts(productsData)
      
      // Calculate stats for each tag
      const tagsWithStats: TagWithStats[] = tagsData.map(tag => {
        const tagProducts = productsData.filter(product => 
          product.product_tags?.some(pt => pt.tag.id === tag.id)
        )
        
        // Sort products by their order_position for this specific tag
        const sortedTagProducts = tagProducts.sort((a, b) => {
          const aOrderPosition = a.product_tags?.find(pt => pt.tag.id === tag.id)?.order_position ?? 999
          const bOrderPosition = b.product_tags?.find(pt => pt.tag.id === tag.id)?.order_position ?? 999
          return aOrderPosition - bOrderPosition
        })
        
        return {
          ...tag,
          productCount: sortedTagProducts.length,
          products: sortedTagProducts
        }
      })
      
      setTags(tagsWithStats)
      
      // Calculate overall stats
      const totalTags = tagsWithStats.length
      const taggedProducts = productsData.filter(product => 
        product.product_tags && product.product_tags.length > 0
      ).length
      const avgProductsPerTag = totalTags > 0 ? 
        Math.round((taggedProducts / totalTags) * 10) / 10 : 0
      
      setStats({
        totalTags,
        taggedProducts,
        avgProductsPerTag
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAddFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug when name changes
      ...(name === 'name' ? { slug: generateSlug(value) } : {})
    }))
  }

  const handleCreateTag = async () => {
    if (!addFormData.name.trim()) return
    
    try {
      setCreating(true)
      const newTag = await createTag({
        name: addFormData.name.trim(),
        slug: addFormData.slug.trim(),
        description: addFormData.description.trim() || undefined,
        color: addFormData.color || undefined
      })
      
      if (newTag) {
        // Add to local state
        setTags(prev => [...prev, {
          ...newTag,
          productCount: 0,
          products: []
        }])
        
        setStats(prev => ({
          ...prev,
          totalTags: prev.totalTags + 1
        }))
        
        setAddFormData({ name: '', slug: '', description: '', color: '' })
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const handleEditTag = (tag: TagWithStats) => {
    setEditingTag(tag)
    setEditFormData({
      name: tag.name,
      slug: tag.slug || generateSlug(tag.name),
      description: tag.description || '',
      color: tag.color || ''
    })
    setShowEditModal(true)
    setOpenDropdown(null)
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug when name changes
      ...(name === 'name' ? { slug: generateSlug(value) } : {})
    }))
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !editFormData.name.trim()) return
    
    try {
      setUpdating(true)
      const success = await updateTag(editingTag.id, editFormData)
      
      if (success) {
        // Update local state
        setTags(prev => prev.map(tag => 
          tag.id === editingTag.id 
            ? { ...tag, ...editFormData }
            : tag
        ))
        
        setShowEditModal(false)
        setEditingTag(null)
        setEditFormData({ name: '', slug: '', description: '', color: '' })
      }
    } catch (error) {
      console.error('Error updating tag:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteTag = (tag: TagWithStats) => {
    setTagToDelete(tag)
    setDeleteConfirmText('')
    setOpenDropdown(null)
  }

  const handleViewProducts = async (tag: TagWithStats) => {
    setSelectedTag(tag)
    setSelectedSystemTag(null)
    setLoadingProducts(true)
    setShowProductModal(true)
    setOpenDropdown(null)
    setSavingOrder(false)
    setLastSaved(null)
    
    try {
      const products = await getProductsInTagOrdered(tag.id)
      
      // If getProductsInTagOrdered returns empty but we have products in the tag stats, use those as fallback
      if (products.length === 0 && tag.products && tag.products.length > 0) {
        setTagProducts(tag.products)
      } else {
        setTagProducts(products)
      }
    } catch (error) {
      console.error('Error fetching products for tag:', error)
      // Try fallback to tag.products if available
      if (tag.products && tag.products.length > 0) {
        setTagProducts(tag.products)
      } else {
        setTagProducts([])
      }
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleViewSystemTagProducts = async (systemTag: { name: string; type: 'featured' | 'free' | 'all' }) => {
    setSelectedSystemTag(systemTag)
    setSelectedTag(null)
    setLoadingProducts(true)
    setShowProductModal(true)
    setSavingOrder(false)
    setLastSaved(null)
    
    try {
      const products = await getProductsForSystemTag(systemTag.type)
      setTagProducts(products)
    } catch (error) {
      console.error('Error fetching products for system tag:', error)
      setTagProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!tagToDelete || deleteConfirmText !== tagToDelete.name) {
      return
    }

    try {
      setDeleting(tagToDelete.id)
      const success = await deleteTag(tagToDelete.id)
      
      if (success) {
        // Remove tag from local state
        setTags(prev => prev.filter(tag => tag.id !== tagToDelete.id))
        
        // Remove the tag from all products that have it
        setProducts(prev => prev.map(product => ({
          ...product,
          product_tags: product.product_tags?.filter(pt => pt.tag_id !== tagToDelete.id) || []
        })))
        
        // Update stats - recalculate tagged products count
        const updatedProducts = products.map(product => ({
          ...product,
          product_tags: product.product_tags?.filter(pt => pt.tag_id !== tagToDelete.id) || []
        }))
        
        const taggedProductsCount = updatedProducts.filter(product => 
          product.product_tags && product.product_tags.length > 0
        ).length
        
        setStats(prev => ({
          ...prev,
          totalTags: prev.totalTags - 1,
          taggedProducts: taggedProductsCount,
          avgProductsPerTag: prev.totalTags > 1 ? Math.round(taggedProductsCount / (prev.totalTags - 1) * 10) / 10 : 0
        }))
        
        setTagToDelete(null)
        setDeleteConfirmText('')
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleCancelDelete = () => {
    setTagToDelete(null)
    setDeleteConfirmText('')
    setDeleting(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = tags.findIndex((tag) => tag.id === active.id)
      const newIndex = tags.findIndex((tag) => tag.id === over?.id)

      const newTags = arrayMove(tags, oldIndex, newIndex)
      
      // Update local state immediately for smooth UX
      setTags(newTags)

      // Save new order to database
      try {
        const tagIds = newTags.map(tag => tag.id)
        await reorderTags(tagIds)
      } catch (error) {
        console.error('Error saving tag order:', error)
        // Revert local state on error
        setTags(tags)
      }
    }
  }

  const handleProductDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && (selectedTag || selectedSystemTag)) {
      const oldIndex = tagProducts.findIndex((product) => product.id === active.id)
      const newIndex = tagProducts.findIndex((product) => product.id === over?.id)

      const newProducts = arrayMove(tagProducts, oldIndex, newIndex)
      
      // Update local state immediately for smooth UX
      setTagProducts(newProducts)
      setSavingOrder(true)

      // Save new order to database
      try {
        const productIds = newProducts.map(product => product.id)
        
        if (selectedTag) {
          await reorderProductsInTagByIds(selectedTag.id, productIds)
        } else if (selectedSystemTag) {
          await reorderProductsForSystemTag(selectedSystemTag.type, productIds)
        }
        
        setLastSaved(new Date())
      } catch (error) {
        console.error('Error saving product order:', error)
        // Revert local state on error
        setTagProducts(tagProducts)
      } finally {
        setSavingOrder(false)
      }
    }
  }

  const handleRemoveFromTag = async (productId: string) => {
    if (!selectedTag) return

    try {
      setRemovingProduct(productId)
      
      // Remove from database
      await removeProductFromTag(productId, selectedTag.id)
      
      // Remove from local state
      setTagProducts(prev => prev.filter(product => product.id !== productId))
      
      // Update the main tags list to reflect new product count without full reload
      setTags(prev => prev.map(tag => 
        tag.id === selectedTag.id 
          ? { ...tag, productCount: tag.productCount - 1 }
          : tag
      ))
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error removing product from tag:', error)
    } finally {
      setRemovingProduct(null)
    }
  }

  const handleRemoveFromSystemTag = async (productId: string, systemTagType: 'featured' | 'free' | 'all') => {
    try {
      setRemovingProduct(productId)
      
      // Handle different system tag types
      switch (systemTagType) {
        case 'featured':
          await updateProduct(productId, { 
            featured: false, 
            featured_order: null 
          })
          break
        case 'free':
          await updateProduct(productId, { 
            free: false, 
            free_order: null 
          })
          break
        case 'all':
          // For 'all' tag, we don't remove - this is handled by handleTogglePublish
          return
      }
      
      // Remove from local state (except for 'all' tag)
      setTagProducts(prev => prev.filter(product => product.id !== productId))
      
      // Update main products list to reflect changes without full reload
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              featured: systemTagType === 'featured' ? false : product.featured,
              free: systemTagType === 'free' ? false : product.free
            }
          : product
      ))
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error removing product from system tag:', error)
    } finally {
      setRemovingProduct(null)
    }
  }

  const handleTogglePublish = async (productId: string, newPublishedState: boolean) => {
    try {
      setTogglingPublish(productId)
      
      // Update the product's published status
      await updateProduct(productId, { published: newPublishedState })
      
      // Update local state to reflect the change without removing the product
      setTagProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, published: newPublishedState }
          : product
      ))
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error toggling product publish status:', error)
    } finally {
      setTogglingPublish(null)
    }
  }

  // Add Product functionality
  const fetchAvailableProducts = async () => {
    if (!productSearchTerm.trim()) {
      setAvailableProducts([])
      return
    }

    try {
      setSearchingProducts(true)
      
      // Get all products
      const allProducts = await getAllProductsWithTags()
      
      // Filter out products that are already in this tag
      const currentProductIds = new Set(tagProducts.map(p => p.id))
      
      // Filter products based on search term and exclude already added products
      const filtered = allProducts.filter(product => {
        const matchesSearch = product.software_name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                             product.slug.toLowerCase().includes(productSearchTerm.toLowerCase())
        const notAlreadyAdded = !currentProductIds.has(product.id)
        
        return matchesSearch && notAlreadyAdded
      })
      
      setAvailableProducts(filtered)
    } catch (error) {
      console.error('Error fetching available products:', error)
      setAvailableProducts([])
    } finally {
      setSearchingProducts(false)
    }
  }

  const handleAddProductToTag = async (product: ProductWithTags) => {
    try {
      setLoadingProductAdd(true)
      setSavingOrder(true)
      
      // Clear search immediately
      setProductSearchTerm('')
      setShowProductDropdown(false)
      setAvailableProducts([])
      
      // Calculate the next order position for both custom tags and system tags
      let nextOrderPosition = 0
      
      if (selectedTag && supabase) {
        // For custom tags
        try {
          // Use same logic as addProductToTag function for consistency
          const { data: existingTags } = await supabase
            .from('product_tags')
            .select('order_position')
            .eq('tag_id', selectedTag.id)
            .order('order_position', { ascending: false })
            .limit(1)
          
          nextOrderPosition = existingTags && existingTags.length > 0 ? existingTags[0].order_position + 1 : 0
          console.log(`Tag "${selectedTag.name}" highest order position: ${existingTags?.[0]?.order_position ?? 'none'}, next position will be ${nextOrderPosition}`)
        } catch (error) {
          console.error('Error getting current max order position, falling back to count method:', error)
          // Fallback to count method
          try {
            const currentDbProducts = await getProductsInTagOrdered(selectedTag.id)
            nextOrderPosition = currentDbProducts.length
          } catch (fallbackError) {
            console.error('Error with count method, using UI state:', fallbackError)
            nextOrderPosition = tagProducts.length
          }
        }
      } else if (selectedSystemTag && supabase) {
        // For system tags, calculate order position from the appropriate field
        try {
          let orderField = ''
          switch (selectedSystemTag.type) {
            case 'featured':
              orderField = 'featured_order'
              break
            case 'free':
              orderField = 'free_order'
              break
            case 'all':
              orderField = 'all_order'
              break
          }
          
          if (orderField) {
            let query = supabase
              .from('products')
              .select(orderField)
            
            // Filter by the appropriate flag to only get products already in this system tag
            switch (selectedSystemTag.type) {
              case 'featured':
                query = query.eq('featured', true)
                break
              case 'free':
                query = query.eq('free', true)
                break
              case 'all':
                // For 'all' tag, include all products (no filter needed)
                break
            }
            
            const { data: existingProducts } = await query
              .order(orderField, { ascending: false })
              .limit(1)
            
            nextOrderPosition = existingProducts && existingProducts.length > 0 ? 
              ((existingProducts[0] as any)[orderField] ?? -1) + 1 : 0
            console.log(`System tag "${selectedSystemTag.name}" highest ${orderField} among ${selectedSystemTag.type} products: ${((existingProducts?.[0] as any)?.[orderField]) ?? 'none'}, next position will be ${nextOrderPosition}`)
          }
        } catch (error) {
          console.error('Error getting current max order position for system tag, using UI state:', error)
          nextOrderPosition = tagProducts.length
        }
      }
      
      // Perform the database update without optimistic updates
      let success = false
      
      if (selectedSystemTag) {
        // Handle system tags (except 'All' which doesn't need special handling for publish/unpublish)
        if (selectedSystemTag.type !== 'all') {
          switch (selectedSystemTag.type) {
            case 'featured':
              success = await updateProduct(product.id, { 
                featured: true, 
                featured_order: nextOrderPosition 
              })
              break
            case 'free':
              success = await updateProduct(product.id, { 
                free: true, 
                free_order: nextOrderPosition 
              })
              break
          }
        } else {
          success = true // 'All' tag doesn't need database changes for adding
        }
      } else if (selectedTag) {
        console.log('Adding product with order position:', nextOrderPosition)
        success = await addProductToTag(product.id, selectedTag.id, nextOrderPosition)
      }
      
      if (success) {
        console.log('Product added successfully to database')
        // Refresh the product list to show the updated state
        if (selectedTag) {
          const refreshedProducts = await getProductsInTagOrdered(selectedTag.id)
          setTagProducts(refreshedProducts)
        } else if (selectedSystemTag) {
          const refreshedProducts = await getProductsForSystemTag(selectedSystemTag.type)
          setTagProducts(refreshedProducts)
        }
        
        // Set last saved timestamp for the auto-saved indicator
        setLastSaved(new Date())
      } else {
        console.error('Failed to add product to tag')
      }
    } catch (error) {
      console.error('Error adding product to tag:', error)
    } finally {
      setLoadingProductAdd(false)
      setSavingOrder(false)
    }
  }

  const getTagColor = (tag: TagWithStats) => {
    // If tag has a color from database, use it
    if (tag.color) {
      return tag.color
    }
    
    // Fallback: Generate a color based on tag name
    const colors = [
      '#3B82F6', // blue
      '#10B981', // emerald  
      '#8B5CF6', // violet
      '#F59E0B', // amber
      '#EF4444', // red
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange
      '#EC4899', // pink
      '#6366F1', // indigo
    ]
    
    // Simple hash function to get consistent color for same tag name
    let hash = 0
    for (let i = 0; i < tag.name.length; i++) {
      hash = tag.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  const getColorClasses = (color: string) => {
    // Convert hex color to Tailwind-like classes for background and text
    const colorMap: { [key: string]: { bg: string; text: string } } = {
      '#3B82F6': { bg: 'bg-blue-600/20', text: 'text-blue-400' },
      '#10B981': { bg: 'bg-emerald-600/20', text: 'text-emerald-400' },
      '#8B5CF6': { bg: 'bg-violet-600/20', text: 'text-violet-400' },
      '#F59E0B': { bg: 'bg-amber-600/20', text: 'text-amber-400' },
      '#EF4444': { bg: 'bg-red-600/20', text: 'text-red-400' },
      '#06B6D4': { bg: 'bg-cyan-600/20', text: 'text-cyan-400' },
      '#84CC16': { bg: 'bg-lime-600/20', text: 'text-lime-400' },
      '#F97316': { bg: 'bg-orange-600/20', text: 'text-orange-400' },
      '#EC4899': { bg: 'bg-pink-600/20', text: 'text-pink-400' },
      '#6366F1': { bg: 'bg-indigo-600/20', text: 'text-indigo-400' },
    }
    
    return colorMap[color] || { bg: 'bg-blue-600/20', text: 'text-blue-400' }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Product Tags</h1>
            <p className="text-gray-400 mt-1">Loading tag data...</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
            <span>Loading tags and statistics...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Product Tags</h1>
          <p className="text-gray-400 mt-1">
            Manage product tags - click on any tag to view and reorder its products
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tag
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400">🏷️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalTags}</p>
              <p className="text-gray-400 text-sm">Total Tags</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400">📦</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.taggedProducts}</p>
              <p className="text-gray-400 text-sm">Tagged Products</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.avgProductsPerTag}</p>
              <p className="text-gray-400 text-sm">Avg Products/Tag</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tags List */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">All Tags</h2>
          <p className="text-gray-400 text-sm mt-1">
            Click on any tag to view and reorder its products
          </p>
        </div>

        {/* System Tags Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-6 pt-4">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">System Tags</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {[
              { name: 'Featured', color: '#F59E0B', description: 'Showcase premium products', type: 'featured' as const },
              { name: 'Free', color: '#22C55E', description: 'Free products and tools', type: 'free' as const },
              { name: 'All', color: '#3B82F6', description: 'All published products', type: 'all' as const }
            ].map((systemTag) => (
              <div 
                key={systemTag.name} 
                className="p-6 bg-gray-900/30 border-l-4 border-amber-500/50 cursor-pointer hover:bg-gray-800/40 transition-colors"
                onClick={() => handleViewSystemTagProducts({ name: systemTag.name, type: systemTag.type })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* System Tag Indicator */}
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
                      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{systemTag.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                          SYSTEM
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{systemTag.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Product count badge - calculate dynamically */}
                    <div className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-full text-sm font-medium">
                      {(() => {
                        if (systemTag.name === 'Featured') {
                          return products.filter(p => p.featured && p.published).length
                        } else if (systemTag.name === 'Free') {
                          return products.filter(p => p.free && p.published).length
                        } else if (systemTag.name === 'All') {
                          return products.filter(p => p.published).length
                        }
                        return 0
                      })()} {(() => {
                        const count = (() => {
                          if (systemTag.name === 'Featured') {
                            return products.filter(p => p.featured && p.published).length
                          } else if (systemTag.name === 'Free') {
                            return products.filter(p => p.free && p.published).length
                          } else if (systemTag.name === 'All') {
                            return products.filter(p => p.published).length
                          }
                          return 0
                        })()
                        return count === 1 ? 'Product' : 'Products'
                      })()}
                    </div>
                    
                    {/* Locked indicator */}
                    <div className="p-2 text-gray-500 cursor-not-allowed" title="System tags cannot be modified">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Tags Section */}
        <div className="mb-3 px-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Custom Tags</h3>
          </div>
        </div>

        {tags.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Custom Tags Yet</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Create your first custom tag to start organizing your products. 
              Tags help users find related products more easily.
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all"
            >
              Create First Tag
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tags.map(tag => tag.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-gray-800">
                {tags.map((tag) => (
                  <SortableTagItem
                    key={tag.id}
                    tag={tag}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    handleEditTag={handleEditTag}
                    handleDeleteTag={handleDeleteTag}
                    handleViewProducts={handleViewProducts}
                    deleting={deleting}
                    getColorClasses={getColorClasses}
                    getTagColor={getTagColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Tag Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Add New Tag</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setAddFormData({ name: '', slug: '', description: '', color: '' })
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tag Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tag Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={addFormData.name}
                  onChange={handleAddInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tag name"
                  required
                  autoFocus
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug (Auto-generated)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addFormData.slug}
                    readOnly
                    className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="slug-auto-generated"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(addFormData.slug)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                    title="Copy slug"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={addFormData.description}
                  onChange={handleAddInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter tag description (optional)"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { name: 'Blue', value: '#3B82F6' },
                    { name: 'Emerald', value: '#10B981' },
                    { name: 'Purple', value: '#8B5CF6' },
                    { name: 'Orange', value: '#F97316' },
                    { name: 'Red', value: '#EF4444' },
                    { name: 'Cyan', value: '#06B6D4' },
                    { name: 'Pink', value: '#EC4899' },
                    { name: 'Indigo', value: '#6366F1' },
                    { name: 'Yellow', value: '#F59E0B' },
                    { name: 'Green', value: '#22C55E' }
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setAddFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-[20px] h-[20px] rounded border-2 transition-all hover:scale-105 ${
                        addFormData.color === color.value 
                          ? 'border-white shadow-lg ring-2 ring-white/20' 
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {addFormData.color === color.value && (
                        <svg className="w-3 h-3 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setAddFormData({ name: '', slug: '', description: '', color: '' })
                }}
                disabled={creating}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTag}
                disabled={creating || !addFormData.name.trim()}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {creating ? 'Creating...' : 'Create Tag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {showEditModal && editingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Edit Tag</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingTag(null)
                  setEditFormData({ name: '', slug: '', description: '', color: '' })
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tag Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tag Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tag name"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug (Auto-generated)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editFormData.slug}
                    readOnly
                    className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="slug-auto-generated"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(editFormData.slug)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                    title="Copy slug"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter tag description (optional)"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { name: 'Blue', value: '#3B82F6' },
                    { name: 'Emerald', value: '#10B981' },
                    { name: 'Purple', value: '#8B5CF6' },
                    { name: 'Orange', value: '#F97316' },
                    { name: 'Red', value: '#EF4444' },
                    { name: 'Cyan', value: '#06B6D4' },
                    { name: 'Pink', value: '#EC4899' },
                    { name: 'Indigo', value: '#6366F1' },
                    { name: 'Yellow', value: '#F59E0B' },
                    { name: 'Green', value: '#22C55E' }
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-[20px] h-[20px] rounded border-2 transition-all hover:scale-105 ${
                        editFormData.color === color.value 
                          ? 'border-white shadow-lg ring-2 ring-white/20' 
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {editFormData.color === color.value && (
                        <svg className="w-3 h-3 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingTag(null)
                  setEditFormData({ name: '', slug: '', description: '', color: '' })
                }}
                disabled={updating}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTag}
                disabled={updating || !editFormData.name.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {updating ? 'Updating...' : 'Update Tag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tagToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Are you sure?</h3>
                  <p className="text-sm text-gray-400">
                    This action cannot be undone. This will permanently delete the tag and remove it from all products.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${getColorClasses(getTagColor(tagToDelete)).bg} rounded flex items-center justify-center`}>
                      <span className={`${getColorClasses(getTagColor(tagToDelete)).text} font-semibold text-sm`}>
                        {tagToDelete.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-medium">{tagToDelete.name}</span>
                    <span className="text-gray-400 text-sm">({tagToDelete.productCount} {tagToDelete.productCount === 1 ? 'product' : 'products'})</span>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-3">
                  To confirm deletion, type{' '}
                  <code className="px-2 py-1 bg-gray-700 rounded text-white font-mono text-xs">
                    {tagToDelete.name}
                  </code>{' '}
                  in the box below:
                </p>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type tag name to confirm"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={!!deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={!!deleting || deleteConfirmText !== tagToDelete.name}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Tag'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Management Modal */}
      {showProductModal && (selectedTag || selectedSystemTag) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full h-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Manage Products in "{selectedTag?.name || selectedSystemTag?.name}"
                  {selectedSystemTag && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                      SYSTEM
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-gray-400 text-sm">
                    {selectedSystemTag 
                      ? `Drag and drop to reorder products for ${selectedSystemTag.name.toLowerCase()} listing`
                      : 'Drag and drop to reorder products within this tag'
                    }
                  </p>
                  {savingOrder && (
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                      <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  )}
                  {lastSaved && !savingOrder && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Auto-saved</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProductModal(false)
                  setSelectedTag(null)
                  setSelectedSystemTag(null)
                  setTagProducts([])
                  setRemovingProduct(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
              {/* Add Product Section - Show for all tags except "All" */}
              {(!selectedSystemTag || selectedSystemTag.type !== 'all') && !loadingProducts && (
                <div className="mb-6 bg-gray-900/30 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product to {selectedTag?.name || selectedSystemTag?.name}
                  </h3>
                  
                  <div className="relative product-search-container">
                    <input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => {
                        setProductSearchTerm(e.target.value)
                        setShowProductDropdown(true)
                      }}
                      onFocus={() => {
                        setShowProductDropdown(true)
                        if (productSearchTerm.trim()) {
                          fetchAvailableProducts()
                        }
                      }}
                      placeholder="Search products to add..."
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Product Dropdown */}
                    {showProductDropdown && productSearchTerm.trim() && (
                      <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {searchingProducts ? (
                          <div className="px-4 py-3 text-gray-400 text-center">
                            <div className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Searching products...
                          </div>
                        ) : availableProducts.length > 0 ? (
                          availableProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleAddProductToTag(product)}
                              disabled={loadingProductAdd}
                              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center gap-3 border-b border-gray-700 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {/* Product Icon */}
                              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {product.icon_url && product.icon_url.startsWith('http') ? (
                                  <img 
                                    src={product.icon_url} 
                                    alt={product.software_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg">
                                    {product.icon_url || '📦'}
                                  </span>
                                )}
                              </div>
                              
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  {product.software_name}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  {product.slug}
                                </div>
                              </div>
                              
                              {/* Status Badges */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {product.featured && (
                                  <span className="px-1.5 py-0.5 text-xs bg-yellow-600/20 text-yellow-400 rounded">
                                    Featured
                                  </span>
                                )}
                                {product.free && (
                                  <span className="px-1.5 py-0.5 text-xs bg-green-600/20 text-green-400 rounded">
                                    Free
                                  </span>
                                )}
                                {!product.published && (
                                  <span className="px-1.5 py-0.5 text-xs bg-gray-600/20 text-gray-400 rounded">
                                    Draft
                                  </span>
                                )}
                              </div>
                              
                              {/* Add Button */}
                              {loadingProductAdd ? (
                                <div className="flex items-center gap-1 text-blue-400 flex-shrink-0">
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-xs">Adding...</span>
                                </div>
                              ) : (
                                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-400 text-center text-sm">
                            No products found matching "{productSearchTerm}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                    <span>Loading products...</span>
                  </div>
                </div>
              ) : tagProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V7a2 2 0 012-2h2a2 2 0 012 2v0M9 7v2m3-2v2m3-2v2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Products Found</h3>
                  <p className="text-gray-400">This tag doesn't have any products assigned to it yet.</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">
                      Products ({tagProducts.length})
                    </h3>
                    <div className="text-sm text-gray-400">
                      Ordered by position in tag
                    </div>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleProductDragEnd}
                  >
                    <SortableContext items={tagProducts.map(product => product.id)} strategy={verticalListSortingStrategy}>
                      <div className="bg-gray-900/50 rounded-lg divide-y divide-gray-800">
                        {tagProducts.map((product) => (
                          <SortableProductItem
                            key={product.id}
                            product={product}
                            getColorClasses={getColorClasses}
                            getTagColor={getTagColor}
                            isSystemTag={!!selectedSystemTag}
                            systemTagType={selectedSystemTag?.type}
                            handleRemoveFromTag={handleRemoveFromTag}
                            handleRemoveFromSystemTag={handleRemoveFromSystemTag}
                            handleTogglePublish={handleTogglePublish}
                            togglingPublish={togglingPublish}
                            removingProduct={removingProduct}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                {savingOrder ? (
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving changes...</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Changes saved automatically</span>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    Changes save automatically when you reorder
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setShowProductModal(false)
                  setSelectedTag(null)
                  setSelectedSystemTag(null)
                  setTagProducts([])
                  setLastSaved(null)
                  setSavingOrder(false)
                  setRemovingProduct(null)
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 