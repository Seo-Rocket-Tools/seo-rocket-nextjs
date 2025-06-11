'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getAllProductsWithTags, ProductWithTags, updateProduct, getAllTags, Tag, addProductToTag, removeProductFromTag, createTag, deleteProduct, createProduct, uploadProductIcon, deleteProductIcon, resizeImage, getImageInfo, cropImage } from '@/lib/supabase'
import Cropper from 'react-easy-crop'

interface EditProductFormData {
  software_name: string
  slug: string
  description: string
  url: string
  published: boolean
  featured: boolean
  free: boolean
  icon_url: string
}

export default function ProductsManagerPage() {
  const [products, setProducts] = useState<ProductWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<ProductWithTags | null>(null)
  const [editFormData, setEditFormData] = useState<EditProductFormData>({
    software_name: '',
    slug: '',
    description: '',
    url: '',
    published: false,
    featured: false,
    free: false,
    icon_url: ''
  })
  const [urlSearchTerm, setUrlSearchTerm] = useState('')
  const [showUrlDropdown, setShowUrlDropdown] = useState(false)
  const [availableUrls, setAvailableUrls] = useState<string[]>([])
  const [urlsLoading, setUrlsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Tag management state
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [currentProductTags, setCurrentProductTags] = useState<Tag[]>([])
  const [tagSearchTerm, setTagSearchTerm] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [tagsLoading, setTagsLoading] = useState(false)
  
  // Delete confirmation state
  const [productToDelete, setProductToDelete] = useState<ProductWithTags | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  
  // Add product state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addFormData, setAddFormData] = useState<EditProductFormData>({
    software_name: '',
    slug: '',
    description: '',
    url: '',
    published: false,
    featured: false,
    free: false,
    icon_url: ''
  })
  const [addProductTags, setAddProductTags] = useState<Tag[]>([])
  const [creating, setCreating] = useState(false)
  
  // Icon upload state
  const [editIconFile, setEditIconFile] = useState<File | null>(null)
  const [editIconPreview, setEditIconPreview] = useState<string | null>(null)
  const [editIconUploading, setEditIconUploading] = useState(false)
  const [addIconFile, setAddIconFile] = useState<File | null>(null)
  const [addIconPreview, setAddIconPreview] = useState<string | null>(null)
  const [addIconUploading, setAddIconUploading] = useState(false)
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImageFile, setCropImageFile] = useState<File | null>(null)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState<'edit' | 'add'>('add')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; aspectRatio: number } | null>(null)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'featured' | 'free'>('all')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    featured: 0,
    free: 0
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const urlDropdownRef = useRef<HTMLDivElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProducts()
    fetchAvailableUrls()
    fetchAllTags()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
      if (urlDropdownRef.current && !urlDropdownRef.current.contains(event.target as Node)) {
        setShowUrlDropdown(false)
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditingProduct(null)
        setShowUrlDropdown(false)
        setShowTagDropdown(false)
        setProductToDelete(null)
        setDeleteConfirmText('')
        setShowAddModal(false)
        resetAddForm()
      }
    }

    if (editingProduct || productToDelete || showAddModal) {
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [editingProduct, productToDelete, showAddModal])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await getAllProductsWithTags()
      setProducts(data)
      
      // Calculate stats
      const total = data.length
      const published = data.filter(p => p.published).length
      const featured = data.filter(p => p.featured).length
      const free = data.filter(p => p.free).length
      
      setStats({ total, published, featured, free })
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUrls = async () => {
    try {
      setUrlsLoading(true)
      const response = await fetch('/api/products/urls')
      const data = await response.json()
      
      if (data.urls) {
        setAvailableUrls(data.urls)
      }
      
      if (data.error) {
        console.warn('API warning:', data.error)
      }
    } catch (error) {
      console.error('Error fetching available URLs:', error)
      // Fallback to a basic URL if API fails
      setAvailableUrls(['/products/geocentric-plugin'])
    } finally {
      setUrlsLoading(false)
    }
  }

  const fetchAllTags = async () => {
    try {
      setTagsLoading(true)
      const tags = await getAllTags()
      setAllTags(tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setTagsLoading(false)
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

  const getStatusBadge = (product: ProductWithTags) => {
    const badges = []
    
    if (product.published) {
      badges.push(
        <span key="published" className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded-full">
          Published
        </span>
      )
    } else {
      badges.push(
        <span key="draft" className="px-2 py-1 text-xs bg-gray-600/20 text-gray-400 rounded-full">
          Draft
        </span>
      )
    }
    
    if (product.featured) {
      badges.push(
        <span key="featured" className="px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded-full">
          Featured
        </span>
      )
    }
    
    if (product.free) {
      badges.push(
        <span key="free" className="px-2 py-1 text-xs bg-purple-600/20 text-purple-400 rounded-full">
          Free
        </span>
      )
    }
    
    return badges
  }

  const handleOptionsClick = (productId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setOpenDropdown(openDropdown === productId ? null : productId)
  }

  const handleEditProduct = (product: ProductWithTags) => {
    setEditFormData({
      software_name: product.software_name,
      slug: product.slug || generateSlug(product.software_name),
      description: product.description,
      url: product.url,
      published: product.published,
      featured: product.featured,
      free: product.free,
      icon_url: product.icon_url || ''
    })
    setUrlSearchTerm(product.url)
    
    // Set current product tags
    const productTags = product.product_tags?.map(pt => pt.tag) || []
    setCurrentProductTags(productTags)
    
    // Reset icon upload state
    setEditIconFile(null)
    if (editIconPreview) {
      URL.revokeObjectURL(editIconPreview)
      setEditIconPreview(null)
    }
    
    setEditingProduct(product)
    setOpenDropdown(null)
    setSaveError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      // Auto-generate slug when software_name changes
      ...(name === 'software_name' ? { slug: generateSlug(value) } : {})
    }))
  }

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUrlSearchTerm(value)
    setEditFormData(prev => ({ ...prev, url: value }))
    setShowUrlDropdown(true)
  }

  const handleUrlSelect = (url: string) => {
    setUrlSearchTerm(url)
    setEditFormData(prev => ({ ...prev, url }))
    setShowUrlDropdown(false)
  }

  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearchTerm(e.target.value)
    setShowTagDropdown(true)
  }

  const handleAddTag = async (tag: Tag) => {
    // Check if tag is already added
    if (currentProductTags.find(t => t.id === tag.id)) {
      return
    }
    
    setCurrentProductTags(prev => [...prev, tag])
    setTagSearchTerm('')
    setShowTagDropdown(false)
  }

  const handleCreateAndAddTag = async () => {
    if (!tagSearchTerm.trim()) return
    
    // Check if tag already exists
    const existingTag = allTags.find(tag => tag.name.toLowerCase() === tagSearchTerm.toLowerCase())
    if (existingTag) {
      handleAddTag(existingTag)
      return
    }
    
    // Create new tag
    const newTag = await createTag({ name: tagSearchTerm.trim() })
    if (newTag) {
      setAllTags(prev => [...prev, newTag])
      setCurrentProductTags(prev => [...prev, newTag])
      setTagSearchTerm('')
      setShowTagDropdown(false)
    }
  }

  const handleRemoveTag = (tagToRemove: Tag) => {
    setCurrentProductTags(prev => prev.filter(tag => tag.id !== tagToRemove.id))
  }

  const handleTogglePublish = async (product: ProductWithTags) => {
    try {
      setSaving(true)
      setOpenDropdown(null)
      
      const success = await updateProduct(product.id, { 
        published: !product.published 
      })
      
      if (success) {
        // Refresh the products list to show updated data
        await fetchProducts()
      } else {
        console.error('Failed to toggle publish status')
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = (product: ProductWithTags) => {
    setProductToDelete(product)
    setDeleteConfirmText('')
    setOpenDropdown(null)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete || deleteConfirmText !== productToDelete.software_name) {
      return
    }

    try {
      setDeleting(true)
      
      const success = await deleteProduct(productToDelete.id)
      
      if (success) {
        // Refresh the products list
        await fetchProducts()
        setProductToDelete(null)
        setDeleteConfirmText('')
      } else {
        console.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setProductToDelete(null)
    setDeleteConfirmText('')
  }

  const resetAddForm = () => {
    setAddFormData({
      software_name: '',
      slug: '',
      description: '',
      url: '',
      published: false,
      featured: false,
      free: false,
      icon_url: ''
    })
    setAddProductTags([])
    setUrlSearchTerm('')
    setTagSearchTerm('')
    setShowUrlDropdown(false)
    setShowTagDropdown(false)
    setSaveError(null)
    
    // Clean up icon upload state
    setAddIconFile(null)
    if (addIconPreview) {
      URL.revokeObjectURL(addIconPreview)
      setAddIconPreview(null)
    }
  }

  const handleAddProduct = () => {
    resetAddForm()
    setShowAddModal(true)
  }

  const handleCreateProduct = async () => {
    try {
      setCreating(true)
      setSaveError(null)
      
      let finalFormData = { ...addFormData }
      
      // Upload icon if provided
      if (addIconFile) {
        setAddIconUploading(true)
        // Create product first to get ID for icon upload
        const tempProductId = await createProduct(finalFormData)
        
        if (!tempProductId) {
          setSaveError('Failed to create product')
          return
        }
        
        // Upload icon
        const iconUrl = await uploadProductIcon(addIconFile, tempProductId)
        if (iconUrl) {
          // Update product with icon URL
          await updateProduct(tempProductId, { icon_url: iconUrl })
          finalFormData.icon_url = iconUrl
        }
        
        // Add tags to the product
        for (const tag of addProductTags) {
          await addProductToTag(tempProductId, tag.id)
        }
        
        setAddIconUploading(false)
      } else {
        // Create product without icon
        const productId = await createProduct(finalFormData)
        
        if (!productId) {
          setSaveError('Failed to create product')
          return
        }

        // Add tags to the product
        for (const tag of addProductTags) {
          await addProductToTag(productId, tag.id)
        }
      }

      // Refresh the products list
      await fetchProducts()
      
      // Close modal and reset form
      setShowAddModal(false)
      resetAddForm()
    } catch (error) {
      console.error('Error creating product:', error)
      setSaveError('Failed to create product')
    } finally {
      setCreating(false)
      setAddIconUploading(false)
    }
  }

  const handleAddFormTagRemove = (tagToRemove: Tag) => {
    setAddProductTags(prev => prev.filter(tag => tag.id !== tagToRemove.id))
  }

  const handleAddFormTagAdd = async (tag: Tag) => {
    if (!addProductTags.find(t => t.id === tag.id)) {
      setAddProductTags(prev => [...prev, tag])
    }
    setTagSearchTerm('')
    setShowTagDropdown(false)
  }

  const handleAddFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setAddFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      // Auto-generate slug when software_name changes
      ...(name === 'software_name' ? { slug: generateSlug(value) } : {})
    }))
  }

  const filteredUrls = availableUrls.filter(url =>
    url.toLowerCase().includes(urlSearchTerm.toLowerCase())
  )

  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()) &&
    !currentProductTags.find(ct => ct.id === tag.id)
  )

  // Filter products based on search and filter criteria
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        product.software_name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.url.toLowerCase().includes(searchLower) ||
        product.product_tags?.some(pt => pt.tag.name.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }

    // Status filter
    switch (statusFilter) {
      case 'published':
        if (!product.published) return false
        break
      case 'draft':
        if (product.published) return false
        break
      case 'featured':
        if (!product.featured) return false
        break
      case 'free':
        if (!product.free) return false
        break
      case 'all':
      default:
        break
    }

    // Tag filter
    if (selectedTagFilter) {
      const hasTag = product.product_tags?.some(pt => pt.tag.name === selectedTagFilter)
      if (!hasTag) return false
    }

    return true
  })

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProduct) return
    
    try {
      setSaving(true)
      setSaveError(null)
      
      let finalFormData = { ...editFormData }
      
      // Handle icon upload if new icon was selected
      if (editIconFile) {
        setEditIconUploading(true)
        
        // Delete old icon if it exists
        if (editingProduct.icon_url) {
          await deleteProductIcon(editingProduct.icon_url)
        }
        
        // Upload new icon
        const iconUrl = await uploadProductIcon(editIconFile, editingProduct.id)
        if (iconUrl) {
          finalFormData.icon_url = iconUrl
        }
        
        setEditIconUploading(false)
      }
      
      // Update basic product info
      const success = await updateProduct(editingProduct.id, finalFormData)
      
      if (success) {
        // Update tags - first remove all existing tags, then add current ones
        const existingTagIds = editingProduct.product_tags?.map(pt => pt.tag.id) || []
        const currentTagIds = currentProductTags.map(tag => tag.id)
        
        // Remove tags that are no longer selected
        for (const tagId of existingTagIds) {
          if (!currentTagIds.includes(tagId)) {
            await removeProductFromTag(editingProduct.id, tagId)
          }
        }
        
        // Add new tags
        for (const tag of currentProductTags) {
          if (!existingTagIds.includes(tag.id)) {
            await addProductToTag(editingProduct.id, tag.id)
          }
        }
        
        // Refresh the products list to show updated data
        await fetchProducts()
        setEditingProduct(null)
        setUrlSearchTerm('')
        setShowUrlDropdown(false)
        setCurrentProductTags([])
        setTagSearchTerm('')
      } else {
        setSaveError('Failed to update product. Please try again.')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      setSaveError('An error occurred while updating the product.')
    } finally {
      setSaving(false)
      setEditIconUploading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setUrlSearchTerm('')
    setShowUrlDropdown(false)
    setSaveError(null)
    setCurrentProductTags([])
    setTagSearchTerm('')
    setShowTagDropdown(false)
  }

  // Icon upload handlers
  const handleEditIconChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveError('Please select an image file')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setSaveError('Image file size must be less than 5MB')
        return
      }

      // Check image dimensions
      const imgInfo = await getImageInfo(file)
      
      if (!imgInfo.isSquare) {
        // Image is not square, show crop modal
        setCropImageFile(file)
        setCropImageUrl(URL.createObjectURL(file))
        setCropMode('edit')
        setImageInfo(imgInfo)
        
        // Reset crop state
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedAreaPixels(null)
        
        setShowCropModal(true)
        setSaveError(null)
      } else {
        // Image is square, proceed with direct resize
        const resizedFile = await resizeImage(file, 200, 200)
        setEditIconFile(resizedFile)
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(resizedFile)
        setEditIconPreview(previewUrl)
        setSaveError(null)
      }
    } catch (error) {
      console.error('Error processing image:', error)
      setSaveError('Failed to process image')
    }
  }

  const handleAddIconChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveError('Please select an image file')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setSaveError('Image file size must be less than 5MB')
        return
      }

      // Check image dimensions
      const imgInfo = await getImageInfo(file)
      
      if (!imgInfo.isSquare) {
        // Image is not square, show crop modal
        setCropImageFile(file)
        setCropImageUrl(URL.createObjectURL(file))
        setCropMode('add')
        setImageInfo(imgInfo)
        
        // Reset crop state
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedAreaPixels(null)
        
        setShowCropModal(true)
        setSaveError(null)
      } else {
        // Image is square, proceed with direct resize
        const resizedFile = await resizeImage(file, 200, 200)
        setAddIconFile(resizedFile)
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(resizedFile)
        setAddIconPreview(previewUrl)
        setSaveError(null)
      }
    } catch (error) {
      console.error('Error processing image:', error)
      setSaveError('Failed to process image')
    }
  }

  const handleRemoveEditIcon = () => {
    setEditIconFile(null)
    if (editIconPreview) {
      URL.revokeObjectURL(editIconPreview)
      setEditIconPreview(null)
    }
    // Reset form data icon_url if we're removing a newly uploaded icon
    if (editIconFile) {
      setEditFormData(prev => ({ ...prev, icon_url: '' }))
    }
  }

  const handleRemoveAddIcon = () => {
    setAddIconFile(null)
    if (addIconPreview) {
      URL.revokeObjectURL(addIconPreview)
      setAddIconPreview(null)
    }
    setAddFormData(prev => ({ ...prev, icon_url: '' }))
  }

  // Crop modal handlers
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createCroppedImage = useCallback(
    async (imageSrc: string, pixelCrop: any): Promise<File> => {
      const image = new Image()
      image.src = imageSrc
      await new Promise((resolve) => {
        image.onload = resolve
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Set canvas size to desired output (200x200)
      canvas.width = 200
      canvas.height = 200

      // Draw cropped image
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        200,
        200
      )

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Canvas is empty')
          }
          const file = new File([blob], cropImageFile?.name || 'cropped-image.png', {
            type: 'image/png',
            lastModified: Date.now()
          })
          resolve(file)
        }, 'image/png', 0.9)
      })
    },
    [cropImageFile]
  )

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !cropImageUrl) return

    try {
      const croppedFile = await createCroppedImage(cropImageUrl, croppedAreaPixels)
      
      if (cropMode === 'edit') {
        setEditIconFile(croppedFile)
        const previewUrl = URL.createObjectURL(croppedFile)
        // Cleanup old preview
        if (editIconPreview) {
          URL.revokeObjectURL(editIconPreview)
        }
        setEditIconPreview(previewUrl)
      } else {
        setAddIconFile(croppedFile)
        const previewUrl = URL.createObjectURL(croppedFile)
        // Cleanup old preview
        if (addIconPreview) {
          URL.revokeObjectURL(addIconPreview)
        }
        setAddIconPreview(previewUrl)
      }
      
      // Close crop modal and cleanup
      handleCropCancel()
      setSaveError(null)
      
      // Reset file inputs for next use
      const editFileInput = document.getElementById('edit-icon-input') as HTMLInputElement
      const addFileInput = document.getElementById('add-icon-input') as HTMLInputElement
      if (editFileInput) editFileInput.value = ''
      if (addFileInput) addFileInput.value = ''
    } catch (error) {
      console.error('Error cropping image:', error)
      setSaveError('Failed to crop image')
    }
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setCropImageFile(null)
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl)
      setCropImageUrl(null)
    }
    setImageInfo(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    
    // Reset file inputs so they can be used again
    const editFileInput = document.getElementById('edit-icon-input') as HTMLInputElement
    const addFileInput = document.getElementById('add-icon-input') as HTMLInputElement
    if (editFileInput) editFileInput.value = ''
    if (addFileInput) addFileInput.value = ''
  }

  return (
    <div className="space-y-6">
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
      `}</style>
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Products Manager</h1>
          <p className="text-gray-400 mt-1">
            Manage all your software products, tools, and extensions
          </p>
        </div>
        
        <button 
          onClick={handleAddProduct}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          + Add Product
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400">📦</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-gray-400 text-sm">Total Products</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.published}</p>
              <p className="text-gray-400 text-sm">Published</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <span className="text-yellow-400">⭐</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.featured}</p>
              <p className="text-gray-400 text-sm">Featured</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400">🆓</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.free}</p>
              <p className="text-gray-400 text-sm">Free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search products by name, description, URL, or tags..."
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                showFilters 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              Filters
              {(statusFilter !== 'all' || selectedTagFilter) && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {(statusFilter !== 'all' ? 1 : 0) + (selectedTagFilter ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-700">
              {/* Status Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="featured">Featured</option>
                  <option value="free">Free</option>
                </select>
              </div>

              {/* Tag Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Tag</label>
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag.id} value={tag.name}>{tag.name}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(statusFilter !== 'all' || selectedTagFilter || searchTerm) && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300 opacity-0">Clear</label>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setSelectedTagFilter('')
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Showing {filteredProducts.length} of {products.length} products
              {searchTerm && ` for "${searchTerm}"`}
              {statusFilter !== 'all' && ` • ${statusFilter}`}
              {selectedTagFilter && ` • tagged "${selectedTagFilter}"`}
            </span>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
        <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-400">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {products.length === 0 ? '📦' : '🔍'}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {products.length === 0 ? 'No Products Found' : 'No Matching Products'}
            </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
              {products.length === 0 
                ? 'Get started by adding your first product to the database.'
                : 'Try adjusting your search terms or filters to find products.'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || selectedTagFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setSelectedTagFilter('')
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="border-b border-gray-800 p-6 pb-4">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400">
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Tags</div>
                <div className="col-span-1">Created</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Products List */}
            <div className="divide-y divide-gray-800">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-6 hover:bg-gray-800/50 transition-colors relative">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Product Info */}
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl overflow-hidden">
                          {product.icon_url ? (
                            <img src={product.icon_url} alt={product.software_name} className="w-full h-full object-cover" />
                          ) : (
                            <span>📦</span>
                          )}
            </div>
                        <div>
                          <h3 className="font-semibold text-white">{product.software_name}</h3>
                          <p className="text-sm text-gray-400 truncate max-w-xs">{product.description}</p>
                          {product.url && (
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              {product.url}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {getStatusBadge(product)}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {product.product_tags?.map((productTag) => (
                          <span
                            key={productTag.id}
                            className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full"
                          >
                            {productTag.tag.name}
                          </span>
                        ))}
                        {(!product.product_tags || product.product_tags.length === 0) && (
                          <span className="px-2 py-1 text-xs bg-gray-600/20 text-gray-400 rounded-full">
                            No tags
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-1 text-sm text-gray-400">
                      {formatDate(product.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 relative" ref={openDropdown === product.id ? dropdownRef : null}>
                      <button
                        onClick={(e) => handleOptionsClick(product.id, e)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Product options"
                      >
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdown === product.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit Product
                            </button>
                            
                            <button
                              onClick={() => handleTogglePublish(product)}
                              disabled={saving}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                product.published 
                                  ? 'text-yellow-400 hover:text-yellow-300' 
                                  : 'text-green-400 hover:text-green-300'
                              }`}
                            >
                              {product.published ? (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                    />
                                  </svg>
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  Publish
                                </>
                              )}
                            </button>

                            <div className="border-t border-gray-700 my-1"></div>

                            <button
                              onClick={() => handleDeleteProduct(product)}
                              disabled={saving || deleting}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Delete Product
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-white">Edit Product</h2>
                <p className="text-sm text-gray-400">Update product information and settings</p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitEdit} className="p-6 space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="software_name"
                  value={editFormData.software_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
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
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter product description"
                />
              </div>

                {/* URL Field with Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL
                    {urlsLoading && (
                      <span className="text-xs text-gray-500 ml-2">(Loading available URLs...)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={urlSearchTerm}
                      onChange={handleUrlInputChange}
                      onFocus={() => setShowUrlDropdown(true)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search or select a product URL..."
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* URL Dropdown */}
                  {showUrlDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {urlsLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          Loading available URLs...
                        </div>
                      ) : filteredUrls.length > 0 ? (
                        filteredUrls.map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => handleUrlSelect(url)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700 last:border-b-0"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="font-mono text-blue-400">{url}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-400">
                          No matching URLs found
                          {availableUrls.length === 0 && !urlsLoading && (
                            <div className="text-xs mt-1">
                              No product directories found in /products/
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Icon (200x200px recommended)
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Icon Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {/* Checkerboard pattern background for transparency */}
                        <div className="absolute inset-0 bg-gray-600 opacity-30" style={{
                          backgroundImage: 'repeating-conic-gradient(#374151 0% 25%, #4b5563 25% 50%)',
                          backgroundSize: '8px 8px'
                        }}></div>
                        {editIconPreview ? (
                          <img 
                            src={editIconPreview} 
                            alt="Icon preview" 
                            className="w-full h-full object-cover relative z-10"
                          />
                        ) : editFormData.icon_url ? (
                          <img 
                            src={editFormData.icon_url} 
                            alt="Current icon" 
                            className="w-full h-full object-cover relative z-10"
                          />
                        ) : (
                          <span className="text-2xl relative z-10">📦</span>
                        )}
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <input
                            id="edit-icon-input"
                            type="file"
                            accept="image/*"
                            onChange={handleEditIconChange}
                            className="hidden"
                            disabled={editIconUploading}
                          />
                          <span className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {editIconUploading ? 'Uploading...' : 'Upload Icon'}
                          </span>
                        </label>

                        {(editIconPreview || editFormData.icon_url) && (
                          <button
                            type="button"
                            onClick={handleRemoveEditIcon}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                            disabled={editIconUploading}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400">
                        Upload a square image (PNG, JPG, WebP). Image will be automatically resized to 200x200px.
                      </p>
                      
                      {editIconUploading && (
                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          Uploading icon...
                        </div>
                      )}
          </div>
        </div>
      </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="published"
                      checked={editFormData.published}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Published</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={editFormData.featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Featured</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="free"
                      checked={editFormData.free}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Free</span>
                  </label>
        </div>

                {/* Tags Section */}
                <div className="space-y-4">
                  <div className="relative" ref={tagDropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={tagSearchTerm}
                      onChange={(e) => {
                        setTagSearchTerm(e.target.value)
                        setShowTagDropdown(true)
                      }}
                      onFocus={() => {
                        setShowTagDropdown(true)
                        if (allTags.length === 0) {
                          fetchAllTags()
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search or create tags..."
                    />

                    {/* Tag Dropdown */}
                    {showTagDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {tagsLoading ? (
                          <div className="px-4 py-3 text-gray-400 text-center">
                            <div className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading tags...
        </div>
                        ) : (
                          <>
                            {/* Create new tag option */}
                            {tagSearchTerm.trim() && !allTags.some(tag => 
                              tag.name.toLowerCase() === tagSearchTerm.toLowerCase()
                            ) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const newTag = await createTag({ name: tagSearchTerm.trim() })
                                  if (newTag) {
                                    setAllTags(prev => [...prev, newTag])
                                    handleAddTag(newTag)
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700"
                              >
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Create tag: "<span className="font-semibold text-green-400">{tagSearchTerm}</span>"</span>
                              </button>
                            )}
                            
                            {/* Existing tags */}
                            {(() => {
                              const filteredTags = allTags.filter(tag => 
                                tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()) &&
                                !currentProductTags.find(t => t.id === tag.id)
                              )
                              
                              return filteredTags.length > 0 ? (
                                filteredTags.map((tag) => (
                                  <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => handleAddTag(tag)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700 last:border-b-0"
                                  >
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c1.1045695 0 2 .8954305 2 2v1.1320754M7 7v1.1320754M7 7H3v11a2 2 0 002 2h11a2 2 0 002-2v-7.1320754" />
                                    </svg>
                                    <span className="text-blue-400">{tag.name}</span>
                                  </button>
                                ))
                              ) : tagSearchTerm.trim() ? (
                                <div className="px-3 py-2 text-sm text-gray-400">
                                  No matching tags found
      </div>
                              ) : allTags.filter(tag => !currentProductTags.find(t => t.id === tag.id)).length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-400">
                                  All available tags are already selected
                                </div>
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-400">
                                  Start typing to search or create tags
                                </div>
                              )
                            })()}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Selected Tags
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      {currentProductTags.length > 0 ? (
                        currentProductTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full border border-blue-600/30"
                          >
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 text-blue-400 hover:text-red-400 transition-colors"
                              title="Remove tag"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No tags selected</span>
                      )}
                    </div>
                  </div>
                </div>

              {/* Error Display */}
              {saveError && (
                <div className="p-4 bg-red-600/20 border border-red-600/50 rounded-lg">
                  <p className="text-red-400 text-sm">{saveError}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center gap-3 pt-6 border-t border-gray-700">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Delete Product</h3>
              <button
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Are you sure?</h3>
                  <p className="text-sm text-gray-400">
                    This action cannot be undone. This will permanently delete the product.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                      {productToDelete.icon_url ? (
                        <img src={productToDelete.icon_url} alt={productToDelete.software_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">📦</span>
                      )}
                    </div>
                    <span className="text-white font-medium">{productToDelete.software_name}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-3">
                  To confirm deletion, type{' '}
                  <code className="px-2 py-1 bg-gray-700 rounded text-white font-mono text-xs">
                    {productToDelete.software_name}
                  </code>{' '}
                  in the box below:
                </p>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type product name to confirm"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting || deleteConfirmText !== productToDelete.software_name}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateProduct(); }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Add New Product</h2>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetAddForm(); }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="software_name"
                    value={addFormData.software_name}
                    onChange={handleAddFormInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={addFormData.description}
                    onChange={handleAddFormInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter product description"
                  />
                </div>

                {/* URL Field with Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL
                    {urlsLoading && (
                      <span className="text-xs text-gray-500 ml-2">(Loading available URLs...)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={urlSearchTerm}
                      onChange={(e) => {
                        setAddFormData(prev => ({ ...prev, url: e.target.value }))
                        setUrlSearchTerm(e.target.value)
                        if (e.target.value.length > 0) {
                          setShowUrlDropdown(true)
                          if (availableUrls.length === 0) {
                            fetchAvailableUrls()
                          }
                        } else {
                          setShowUrlDropdown(false)
                        }
                      }}
                      onFocus={() => {
                        setShowUrlDropdown(true)
                        if (availableUrls.length === 0) {
                          fetchAvailableUrls()
                        }
                      }}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search or select a product URL..."
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* URL Dropdown */}
                  {showUrlDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {urlsLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          Loading available URLs...
                        </div>
                      ) : availableUrls.filter(url => 
                        url.toLowerCase().includes(urlSearchTerm.toLowerCase())
                      ).length > 0 ? (
                        availableUrls
                          .filter(url => url.toLowerCase().includes(urlSearchTerm.toLowerCase()))
                          .map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => {
                                setAddFormData(prev => ({ ...prev, url }))
                                setUrlSearchTerm(url)
                                setShowUrlDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700 last:border-b-0"
                            >
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span className="font-mono text-blue-400">{url}</span>
                            </button>
                          ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-400">
                          No matching URLs found
                          {availableUrls.length === 0 && !urlsLoading && (
                            <div className="text-xs mt-1">
                              No product directories found in /products/
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Icon (200x200px recommended)
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Icon Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {/* Checkerboard pattern background for transparency */}
                        <div className="absolute inset-0 bg-gray-600 opacity-30" style={{
                          backgroundImage: 'repeating-conic-gradient(#374151 0% 25%, #4b5563 25% 50%)',
                          backgroundSize: '8px 8px'
                        }}></div>
                        {addIconPreview ? (
                          <img 
                            src={addIconPreview} 
                            alt="Icon preview" 
                            className="w-full h-full object-cover relative z-10"
                          />
                        ) : (
                          <span className="text-2xl relative z-10">📦</span>
                        )}
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <input
                            id="add-icon-input"
                            type="file"
                            accept="image/*"
                            onChange={handleAddIconChange}
                            className="hidden"
                            disabled={addIconUploading}
                          />
                          <span className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {addIconUploading ? 'Uploading...' : 'Upload Icon'}
                          </span>
                        </label>

                        {addIconPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveAddIcon}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                            disabled={addIconUploading}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400">
                        Upload a square image (PNG, JPG, WebP). Image will be automatically resized to 200x200px.
                      </p>
                      
                      {addIconUploading && (
                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          Uploading icon...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="published"
                      checked={addFormData.published}
                      onChange={handleAddFormInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Published</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={addFormData.featured}
                      onChange={handleAddFormInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Featured</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="free"
                      checked={addFormData.free}
                      onChange={handleAddFormInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Free</span>
                  </label>
                </div>

                {/* Tags Section */}
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tags
                    </label>
                                         <input
                       type="text"
                       value={tagSearchTerm}
                       onChange={(e) => {
                         setTagSearchTerm(e.target.value)
                         setShowTagDropdown(true)
                       }}
                       onFocus={() => {
                         setShowTagDropdown(true)
                         if (allTags.length === 0) {
                           fetchAllTags()
                         }
                       }}
                       className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="Search or create tags..."
                     />

                    {/* Tag Dropdown */}
                    {showTagDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {tagsLoading ? (
                          <div className="px-4 py-3 text-gray-400 text-center">
                            <div className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading tags...
                          </div>
                        ) : (
                          <>
                            {/* Create new tag option */}
                            {tagSearchTerm.trim() && !allTags.some(tag => 
                              tag.name.toLowerCase() === tagSearchTerm.toLowerCase()
                            ) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const newTag = await createTag({ name: tagSearchTerm.trim() })
                                  if (newTag) {
                                    setAllTags(prev => [...prev, newTag])
                                    handleAddFormTagAdd(newTag)
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700"
                              >
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Create tag: "<span className="font-semibold text-green-400">{tagSearchTerm}</span>"</span>
                              </button>
                            )}
                            
                                                         {/* Existing tags */}
                             {(() => {
                               const filteredTags = allTags.filter(tag => 
                                 tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()) &&
                                 !addProductTags.find(t => t.id === tag.id)
                               )
                               
                               return filteredTags.length > 0 ? (
                                 filteredTags.map((tag) => (
                                   <button
                                     key={tag.id}
                                     type="button"
                                     onClick={() => handleAddFormTagAdd(tag)}
                                     className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700 last:border-b-0"
                                   >
                                     <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c1.1045695 0 2 .8954305 2 2v1.1320754M7 7v1.1320754M7 7H3v11a2 2 0 002 2h11a2 2 0 002-2v-7.1320754" />
                                     </svg>
                                     <span className="text-blue-400">{tag.name}</span>
                                   </button>
                                 ))
                               ) : tagSearchTerm.trim() ? (
                                 <div className="px-3 py-2 text-sm text-gray-400">
                                   No matching tags found
                                 </div>
                               ) : allTags.filter(tag => !addProductTags.find(t => t.id === tag.id)).length === 0 ? (
                                 <div className="px-3 py-2 text-sm text-gray-400">
                                   All available tags are already selected
                                 </div>
                               ) : (
                                 <div className="px-3 py-2 text-sm text-gray-400">
                                   Start typing to search or create tags
                                 </div>
                               )
                             })()}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Selected Tags
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      {addProductTags.length > 0 ? (
                        addProductTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full border border-blue-600/30"
                          >
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => handleAddFormTagRemove(tag)}
                              className="ml-1 text-blue-400 hover:text-red-400 transition-colors"
                              title="Remove tag"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No tags selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {saveError && (
                <div className="mx-6 mb-6 p-4 bg-red-600/20 border border-red-600/50 rounded-lg">
                  <p className="text-red-400 text-sm">{saveError}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center gap-3 p-6 border-t border-gray-700">
                <button
                  type="submit"
                  disabled={creating || !addFormData.software_name.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creating && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {creating ? 'Creating...' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetAddForm(); }}
                  disabled={creating}
                  className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCropModal && cropImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-white">Crop Image</h2>
                <p className="text-sm text-gray-400">
                  Drag to move and scroll to zoom. The selected area will be cropped to a square.
                </p>
              </div>
              <button
                onClick={handleCropCancel}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Cropper */}
                <div className="flex-1">
                  <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
                    <Cropper
                      image={cropImageUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      cropShape="rect"
                      showGrid={true}
                      style={{
                        containerStyle: {
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#111827'
                        }
                      }}
                    />
                  </div>
                  
                  {/* Zoom Control - Below Image */}
                  <div className="mt-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                        Zoom: {zoom.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Panel */}
                <div className="lg:w-48 space-y-3">
                  <div>
                    <h3 className="text-base font-medium text-white mb-2">Image Info</h3>
                  </div>

                  {imageInfo && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Original:</span>
                        <span className="text-white">{imageInfo.width} × {imageInfo.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Output:</span>
                        <span className="text-white">200 × 200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Aspect:</span>
                        <span className="text-white">1:1 (Square)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={handleCropCancel}
                className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                disabled={!croppedAreaPixels}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 