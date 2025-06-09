import React, { useState } from 'react'
import { SoftwareItem } from '../../../data/software-loader'
import { Tag } from '../../../lib/supabase'

interface ProductCardProps {
  tool: SoftwareItem
  index: number
  isAdmin: boolean
  isDragEnabled: boolean
  isDraggedCard: boolean
  isDropTarget: boolean
  isSavingOrder: boolean
  hoveredCard: string | null
  mousePosition: { x: number; y: number }
  productPublishedStatus: Record<string, boolean>
  productTagLoading: string | null
  showTagDropdown: string | null
  availableTags: Tag[]
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
}

export default function ProductCard({
  tool,
  index,
  isAdmin,
  isDragEnabled,
  isDraggedCard,
  isDropTarget,
  isSavingOrder,
  hoveredCard,
  mousePosition,
  productPublishedStatus,
  productTagLoading,
  showTagDropdown,
  availableTags,
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
  onSetShowTagDropdown
}: ProductCardProps) {
  const getCardTransform = () => {
    if (hoveredCard !== tool.id) {
      return 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    }
    
    // Disable tilt animation in admin mode to prevent button interaction issues
    if (isAdmin) {
      return 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(8px)'
    }
    
    const rotateX = -mousePosition.y * 0.05
    const rotateY = mousePosition.x * 0.05
    
    // Debug: Make the effect more pronounced
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
  }

  const getCardShadow = () => {
    if (hoveredCard !== tool.id) {
      return '0 4px 8px rgba(0, 0, 0, 0.2)'
    }
    
    const shadowOffsetX = mousePosition.x * 0.02
    const shadowOffsetY = mousePosition.y * 0.02
    
    return `${shadowOffsetX}px ${8 + shadowOffsetY}px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)`
  }

  return (
    <div 
      onDragStart={(e) => onDragStart(e, tool)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      draggable={isDragEnabled}
      className={`w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.9375rem)] min-w-[280px] max-w-[320px] rounded-lg p-4 sm:p-6 relative flex flex-col group ${
        isDraggedCard ? 'opacity-40' : ''
      }`}
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
            : hoveredCard === tool.id
              ? getCardTransform()
              : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        boxShadow: isDropTarget
          ? '0 0 0 2px rgba(168, 85, 247, 0.5), 0 10px 20px rgba(168, 85, 247, 0.2)'
          : isDraggedCard 
            ? '0 4px 8px rgba(0, 0, 0, 0.1)'
            : getCardShadow(),
        transition: 'all 0.3s ease-out',
        transformStyle: 'preserve-3d',
        willChange: hoveredCard === tool.id ? 'transform, box-shadow' : 'auto',
        backfaceVisibility: 'hidden'
      }}
      onMouseMove={(e) => {
        if (!isSavingOrder) {
          onMouseMove(e, tool.id)
        }
      }}
      onMouseLeave={() => {
        if (!isSavingOrder) {
          onMouseLeave()
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
          title={isSavingOrder ? 'Please wait for the current operation to complete' : 'Drag to reorder'}
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
        {isAdmin && hoveredCard === tool.id && !isSavingOrder && (
          <>
            {/* Edit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onEditClick(tool)
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
                onTogglePublished(tool)
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
                onDeleteClick(tool)
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
        className={`flex flex-col h-full ${!isAdmin && !isSavingOrder ? 'cursor-pointer' : ''}`}
        onClick={!isAdmin && !isSavingOrder ? () => {
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
            {isAdmin && productPublishedStatus[tool.id] === false && (
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
                  transform: isAdmin ? 'translateZ(0px)' : 'translateZ(15px)',
                  position: 'relative'
                }}
              >
                <span className={`transition-all duration-200 ${isAdmin ? 'truncate group-hover/tag:max-w-[calc(100%-16px)]' : ''}`}>
                  {tag}
                </span>
                {/* Admin: X icon overlays on hover - Only show in admin mode and only on individual tag hover */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onToggleProductTag(tool.id, tag)
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
          {isAdmin && (
            <div className="relative z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onSetShowTagDropdown(showTagDropdown === tool.id ? null : tool.id)
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
                      onSetShowTagDropdown(null)
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
                          onToggleProductTag(tool.id, tag.name)
                          onSetShowTagDropdown(null)
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
}