"use client"

import React from 'react'
import { Tag } from '../../../lib/supabase'
import ModalOverlay from '../common/modal/ModalOverlay'
import ModalContainer from '../common/modal/ModalContainer'
import ModalHeader from '../common/modal/ModalHeader'
import Button from '../common/buttons/Button'
import TextInput from '../common/Input/TextInput'
import TextArea from '../common/Input/TextArea'
import Checkbox from '../common/Input/Checkbox'
import TagSelector from '../common/tags/TagSelector'

export interface ProductForm {
  software_name: string
  description: string
  emoji: string
  url: string
  tags: string[]
  published: boolean
  featured: boolean
  free: boolean
  image_url: string
  priority: number
  slug: string
}

interface ProductFormModalProps {
  show: boolean
  mode: 'add' | 'edit'
  productForm: ProductForm
  availableTags: Tag[]
  isLoading: boolean
  onClose: () => void
  onFormChange: (updates: Partial<ProductForm>) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function ProductFormModal({
  show,
  mode,
  productForm,
  availableTags,
  isLoading,
  onClose,
  onFormChange,
  onSubmit
}: ProductFormModalProps) {
  if (!show) return null

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer maxWidth="2xl">
        <div className="p-6">
          <ModalHeader 
            title={mode === 'add' ? 'Add New Product' : 'Edit Product'} 
            onClose={onClose} 
          />

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Software Name *"
                value={productForm.software_name}
                onChange={(e) => onFormChange({ software_name: e.target.value })}
                required
              />

              <TextInput
                label="Emoji"
                value={productForm.emoji}
                onChange={(e) => onFormChange({ emoji: e.target.value })}
                placeholder="🚀"
              />
            </div>

            <TextArea
              label="Description"
              value={productForm.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="URL"
                type="url"
                value={productForm.url}
                onChange={(e) => onFormChange({ url: e.target.value })}
              />

              <TextInput
                label="Slug"
                value={productForm.slug}
                onChange={(e) => onFormChange({ slug: e.target.value })}
                placeholder="auto-generated from name"
              />
            </div>

            <TagSelector
              selectedTags={productForm.tags}
              availableTags={availableTags}
              onTagAdd={(tag) => onFormChange({ tags: [...productForm.tags, tag] })}
              onTagRemove={(index) => onFormChange({ 
                tags: productForm.tags.filter((_, i) => i !== index) 
              })}
            />

            <div className="flex flex-wrap gap-4">
              <Checkbox
                label="Published"
                checked={productForm.published}
                onChange={(e) => onFormChange({ published: e.target.checked })}
              />

              <Checkbox
                label="Featured"
                checked={productForm.featured}
                onChange={(e) => onFormChange({ featured: e.target.checked })}
              />

              <Checkbox
                label="Free"
                checked={productForm.free}
                onChange={(e) => onFormChange({ free: e.target.checked })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={isLoading}
                className="px-6"
              >
                {mode === 'add' 
                  ? (isLoading ? 'Adding Product...' : 'Add Product')
                  : (isLoading ? 'Updating Product...' : 'Update Product')
                }
              </Button>
            </div>
          </form>
        </div>
      </ModalContainer>
    </ModalOverlay>
  )
}