import React, { useState } from 'react'
import { SoftwareItem } from '../../../data/software-loader'
import { Tag } from '../../../lib/supabase'
import ProductCard from '../cards/ProductCard'
import FilterTabs from './FilterTabs'

interface ProductGridProps {
  softwareData: SoftwareItem[]
  availableFilterTags: string[]
  activeFilter: string
  savedFilters: Set<string>
  isAdmin: boolean
  draggedProductId: string | null
  isSavingOrder: boolean
  hoveredCard: string | null
  mousePosition: { x: number; y: number }
  productPublishedStatus: Record<string, boolean>
  productTagLoading: string | null
  showTagDropdown: string | null
  availableTags: Tag[]
  onFilterChange: (filter: string) => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>, tool: SoftwareItem) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  onDragEnd: () => void
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>, toolId: string) => void
  onMouseLeave: () => void
  onEditClick: (tool: SoftwareItem) => void
  onTogglePublished: (tool: SoftwareItem) => void
  onDeleteClick: (tool: SoftwareItem) => void
  onToggleProductTag: (productId: string, tagName: string) => void
  onSetShowTagDropdown: (productId: string | null) => void
  onGridMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  onGridMouseLeave: () => void
}

export default function ProductGrid({
  softwareData,
  availableFilterTags,
  activeFilter,
  savedFilters,
  isAdmin,
  draggedProductId,
  isSavingOrder,
  hoveredCard,
  mousePosition,
  productPublishedStatus,
  productTagLoading,
  showTagDropdown,
  availableTags,
  onFilterChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMouseMove,
  onMouseLeave,
  onEditClick,
  onTogglePublished,
  onDeleteClick,
  onToggleProductTag,
  onSetShowTagDropdown,
  onGridMouseMove,
  onGridMouseLeave
}: ProductGridProps) {
  return (
    <section 
      className="px-4 sm:px-6 pb-8 sm:pb-12 relative z-10"
      onMouseMove={onGridMouseMove}
      onMouseLeave={onGridMouseLeave}
    >
      <div className="max-w-7xl mx-auto">
        {/* Horizontal Scrollable Filter Tabs */}
        <FilterTabs
          availableFilterTags={availableFilterTags}
          activeFilter={activeFilter}
          savedFilters={savedFilters}
          isAdmin={isAdmin}
          onFilterChange={onFilterChange}
        />

        {/* Flex Layout - Responsive cards with refined spacing */}
        <div className="flex flex-row flex-wrap justify-center items-stretch gap-3 sm:gap-4 lg:gap-5 max-w-7xl mx-auto px-2 sm:px-0">
          {softwareData.map((tool, index) => {
            // Determine if drag and drop should be enabled
            const isDragEnabled = isAdmin && !isSavingOrder
            const isDraggedCard = draggedProductId === tool.id
            const isDropTarget = !!(draggedProductId && index === softwareData.findIndex(item => item.id === draggedProductId))
            
            return (
              <ProductCard
                key={tool.id}
                tool={tool}
                index={index}
                isAdmin={isAdmin}
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
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onEditClick={onEditClick}
                onTogglePublished={onTogglePublished}
                onDeleteClick={onDeleteClick}
                onToggleProductTag={onToggleProductTag}
                onSetShowTagDropdown={onSetShowTagDropdown}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}