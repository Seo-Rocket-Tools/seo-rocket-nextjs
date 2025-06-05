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
import { getAllTags, getAllProductsWithTags, createTag, updateTag, reorderTags, Tag, ProductWithTags } from '@/lib/supabase'

interface TagWithStats extends Tag {
  productCount: number
  products: ProductWithTags[]
  description?: string
}

function SortableTagItem({ 
  tag, 
  openDropdown, 
  setOpenDropdown, 
  handleEditTag,
  getColorClasses,
  getTagColor,
  formatDate 
}: {
  tag: TagWithStats
  openDropdown: string | null
  setOpenDropdown: (id: string | null) => void
  handleEditTag: (tag: TagWithStats) => void
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
      className={`p-6 transition-colors ${
        isDragging 
          ? 'bg-gray-700/50 shadow-lg border border-gray-600 rounded-lg' 
          : 'hover:bg-gray-800/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
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
                
                <button className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Tag
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
  const [newTagName, setNewTagName] = useState('')
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

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
        
        return {
          ...tag,
          productCount: tagProducts.length,
          products: tagProducts
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      setCreating(true)
      const newTag = await createTag(newTagName.trim())
      
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
        
        setNewTagName('')
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
            Manage product tags and organize products within each tag
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
            Click on a tag to manage product ordering within that tag
          </p>
        </div>

        {tags.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Tags Yet</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Create your first tag to start organizing your products. 
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
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Add New Tag</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewTagName('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tag name"
                  autoFocus
                />
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewTagName('')
                  }}
                  disabled={creating}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={creating || !newTagName.trim()}
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
    </div>
  )
} 