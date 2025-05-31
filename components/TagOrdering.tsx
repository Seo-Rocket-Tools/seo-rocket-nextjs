'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  supabase, 
  Tag, 
  Product, 
  ProductWithTags,
  getProductsWithTagsByTag,
  reorderProductsInTag,
  addProductToTag,
  removeProductFromTag,
  getAllProducts
} from '../lib/supabase'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd'

interface TagOrderingProps {
  isAdmin: boolean
}

export default function TagOrdering({ isAdmin }: TagOrderingProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [productsInTag, setProductsInTag] = useState<ProductWithTags[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load all tags
  const loadTags = useCallback(async () => {
    if (!supabase || !isAdmin) return

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (!error && data) {
      setTags(data)
    }
  }, [isAdmin])

  // Load all products for adding to tags
  const loadAllProducts = useCallback(async () => {
    if (!supabase || !isAdmin) return

    const products = await getAllProducts()
    setAllProducts(products)
  }, [isAdmin])

  // Load products for selected tag
  const loadProductsForTag = useCallback(async (tag: Tag) => {
    if (!supabase || !isAdmin) return

    setLoading(true)
    try {
      const products = await getProductsWithTagsByTag(tag.name, true)
      setProductsInTag(products)

      // Calculate available products (not in this tag)
      const productsInTagIds = new Set(products.map(p => p.id))
      const available = allProducts.filter(p => !productsInTagIds.has(p.id))
      setAvailableProducts(available)
    } catch (error) {
      console.error('Error loading products for tag:', error)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, allProducts])

  // Handle drag and drop reordering
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedTag) return

    const items = Array.from(productsInTag)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update UI immediately
    setProductsInTag(items)

    // Save to database
    setSaving(true)
    try {
      const productIdOrder = items.map(p => p.id)
      await reorderProductsInTag(selectedTag.id, productIdOrder)
    } catch (error) {
      console.error('Error saving order:', error)
      // Revert on error
      await loadProductsForTag(selectedTag)
    } finally {
      setSaving(false)
    }
  }

  // Add product to tag
  const handleAddProductToTag = async (productId: string) => {
    if (!selectedTag) return

    setSaving(true)
    try {
      await addProductToTag(productId, selectedTag.id)
      await loadProductsForTag(selectedTag)
    } catch (error) {
      console.error('Error adding product to tag:', error)
    } finally {
      setSaving(false)
    }
  }

  // Remove product from tag
  const handleRemoveProductFromTag = async (productId: string) => {
    if (!selectedTag) return

    setSaving(true)
    try {
      await removeProductFromTag(productId, selectedTag.id)
      await loadProductsForTag(selectedTag)
    } catch (error) {
      console.error('Error removing product from tag:', error)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadTags()
    loadAllProducts()
  }, [loadTags, loadAllProducts])

  useEffect(() => {
    if (selectedTag) {
      loadProductsForTag(selectedTag)
    }
  }, [selectedTag, loadProductsForTag])

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Tag-Based Product Ordering</h2>
        <p className="text-gray-400 mb-6">
          Manage the order of products within each tag. Drag and drop to reorder products within a tag.
        </p>

        {/* Tag Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Tag</label>
          <select
            value={selectedTag?.id || ''}
            onChange={(e) => {
              const tag = tags.find(t => t.id === e.target.value)
              setSelectedTag(tag || null)
            }}
            className="w-full max-w-md px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a tag...</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>

        {selectedTag && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products in Tag */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Products in "{selectedTag.name}" 
                {saving && <span className="text-yellow-400 ml-2">(Saving...)</span>}
              </h3>
              
              {loading ? (
                <div className="text-gray-400">Loading...</div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="products-in-tag">
                    {(provided: DroppableProvided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {productsInTag.map((product, index) => (
                          <Draggable
                            key={product.id}
                            draggableId={product.id}
                            index={index}
                          >
                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-between ${
                                  snapshot.isDragging ? 'opacity-50' : ''
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">{product.emoji}</span>
                                  <div>
                                    <div className="text-white font-medium">{product.software_name}</div>
                                    <div className="text-gray-400 text-sm">Order: {index + 1}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveProductFromTag(product.id)}
                                  className="text-red-400 hover:text-red-300 px-2 py-1 rounded"
                                  disabled={saving}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}

              {productsInTag.length === 0 && !loading && (
                <div className="text-gray-400 text-center py-8">
                  No products in this tag yet.
                </div>
              )}
            </div>

            {/* Available Products */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Available Products</h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableProducts.map(product => (
                  <div
                    key={product.id}
                    className="p-3 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{product.emoji}</span>
                      <div>
                        <div className="text-white font-medium">{product.software_name}</div>
                        <div className="text-gray-400 text-sm">
                          {product.published ? 'Published' : 'Draft'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddProductToTag(product.id)}
                      className="text-blue-400 hover:text-blue-300 px-2 py-1 rounded"
                      disabled={saving}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>

              {availableProducts.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  All products are already in this tag.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 