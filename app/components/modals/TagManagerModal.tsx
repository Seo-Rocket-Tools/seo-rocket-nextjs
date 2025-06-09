"use client"

import React from 'react'
import { Tag } from '../../../lib/supabase'
import ModalOverlay from '../common/modal/ModalOverlay'
import ModalContainer from '../common/modal/ModalContainer'
import ModalHeader from '../common/modal/ModalHeader'
import Button from '../common/buttons/Button'
import IconButton from '../common/buttons/IconButton'
import TextInput from '../common/Input/TextInput'

interface TagManagerModalProps {
  show: boolean
  availableTags: Tag[]
  newTagName: string
  deletingTagId: string | null
  onClose: () => void
  onNewTagNameChange: (value: string) => void
  onAddTag: () => void
  onRemoveTag: (tagId: string) => void
}

export default function TagManagerModal({
  show,
  availableTags,
  newTagName,
  deletingTagId,
  onClose,
  onNewTagNameChange,
  onAddTag,
  onRemoveTag
}: TagManagerModalProps) {
  if (!show) return null

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAddTag()
    }
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer>
        <div className="p-6">
          <ModalHeader title="Tag Manager" onClose={onClose} />

          {/* Add New Tag */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Add New Tag</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => onNewTagNameChange(e.target.value)}
                placeholder="Tag name"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={handleKeyDown}
              />
              <Button
                onClick={onAddTag}
                disabled={!newTagName.trim()}
                variant="primary"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Existing Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Existing Tags</label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {availableTags.map((tag) => (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  isDeleting={deletingTagId === tag.id}
                  onRemove={() => onRemoveTag(tag.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </ModalContainer>
    </ModalOverlay>
  )
}

// Sub-component for individual tag items
interface TagItemProps {
  tag: Tag
  isDeleting: boolean
  onRemove: () => void
}

function TagItem({ tag, isDeleting, onRemove }: TagItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
      <span className="text-white">{tag.name}</span>
      <IconButton
        onClick={onRemove}
        disabled={isDeleting}
        loading={isDeleting}
        loadingText="Deleting..."
        variant="danger"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
      />
    </div>
  )
}