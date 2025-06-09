"use client"

import React from 'react'
import { Tag } from '../../../../lib/supabase'
import TagBadge from './TagBadge'

interface TagSelectorProps {
  selectedTags: string[]
  availableTags: Tag[]
  onTagAdd: (tag: string) => void
  onTagRemove: (index: number) => void
}

export default function TagSelector({ 
  selectedTags, 
  availableTags, 
  onTagAdd, 
  onTagRemove 
}: TagSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 p-3 bg-gray-800 border border-gray-700 rounded-lg min-h-[44px]">
          {selectedTags.length === 0 ? (
            <span className="text-gray-500 text-sm">No tags selected</span>
          ) : (
            selectedTags.map((tag, index) => (
              <TagBadge
                key={index}
                tag={tag}
                variant="selected"
                onRemove={() => onTagRemove(index)}
              />
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {availableTags
            .filter(tag => !selectedTags.includes(tag.name))
            .map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onTagAdd(tag.name)}
                className="transition-colors"
              >
                <TagBadge tag={tag.name} variant="clickable" />
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}