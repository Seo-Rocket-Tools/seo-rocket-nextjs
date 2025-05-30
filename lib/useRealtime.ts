import { useEffect, useState, useCallback } from 'react'
import { supabase, Product, Tag } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// Simplified types for realtime events
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: any
  old?: any
  table: string
  schema: string
}

interface UseRealtimeOptions {
  onProductChange?: (payload: RealtimePayload) => void
  onTagChange?: (payload: RealtimePayload) => void
  enabled?: boolean
}

interface UseRealtimeReturn {
  isConnected: boolean
  error: string | null
  reconnect: () => void
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const { onProductChange, onTagChange, enabled = true } = options
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const setupRealtimeSubscription = useCallback(() => {
    if (!supabase || !enabled) {
      console.log('Supabase not configured or realtime disabled')
      return null
    }

    try {
      // Create a unique channel name
      const channelName = `products-tags-${Date.now()}`
      const newChannel = supabase.channel(channelName)

      // Subscribe to products table changes
      if (onProductChange) {
        newChannel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'products'
            },
            (payload) => {
              console.log('Product change received:', payload)
              onProductChange(payload as RealtimePayload)
            }
          )
      }

      // Subscribe to tags table changes
      if (onTagChange) {
        newChannel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tags'
            },
            (payload) => {
              console.log('Tag change received:', payload)
              onTagChange(payload as RealtimePayload)
            }
          )
      }

      // Handle connection status
      newChannel
        .on('presence', { event: 'sync' }, () => {
          console.log('Realtime connection synced')
          setIsConnected(true)
          setError(null)
        })
        .on('presence', { event: 'join' }, () => {
          console.log('Realtime connection joined')
          setIsConnected(true)
          setError(null)
        })
        .on('presence', { event: 'leave' }, () => {
          console.log('Realtime connection left')
          setIsConnected(false)
        })

      // Subscribe to the channel
      newChannel.subscribe((status) => {
        console.log('Realtime subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setError(null)
          console.log('Successfully subscribed to realtime updates')
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setError('Failed to connect to realtime channel')
          console.error('Realtime subscription error')
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setError('Realtime connection timed out')
          console.error('Realtime subscription timed out')
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          console.log('Realtime connection closed')
        }
      })

      return newChannel
    } catch (err) {
      console.error('Error setting up realtime subscription:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsConnected(false)
      return null
    }
  }, [onProductChange, onTagChange, enabled])

  const reconnect = useCallback(() => {
    console.log('Attempting to reconnect to realtime...')
    
    // Clean up existing channel
    if (channel) {
      channel.unsubscribe()
      setChannel(null)
    }
    
    // Reset state
    setIsConnected(false)
    setError(null)
    
    // Set up new subscription
    const newChannel = setupRealtimeSubscription()
    setChannel(newChannel)
  }, [channel, setupRealtimeSubscription])

  useEffect(() => {
    if (!enabled) {
      console.log('Realtime disabled, skipping subscription')
      return
    }

    console.log('Setting up realtime subscription...')
    const newChannel = setupRealtimeSubscription()
    setChannel(newChannel)

    // Cleanup function
    return () => {
      if (newChannel) {
        console.log('Cleaning up realtime subscription...')
        newChannel.unsubscribe()
      }
    }
  }, [setupRealtimeSubscription, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        console.log('Component unmounting, cleaning up realtime subscription...')
        channel.unsubscribe()
      }
    }
  }, [channel])

  return {
    isConnected,
    error,
    reconnect
  }
}

// Higher-level hooks for specific use cases
export function useProductsRealtime(onProductsChange: (products: Product[]) => void) {
  const [products, setProducts] = useState<Product[]>([])

  const handleProductChange = useCallback((payload: RealtimePayload) => {
    setProducts(currentProducts => {
      let newProducts = [...currentProducts]
      
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            newProducts.push(payload.new as Product)
            console.log('Product inserted:', payload.new)
          }
          break
        case 'UPDATE':
          if (payload.new) {
            const index = newProducts.findIndex(p => p.id === payload.new.id)
            if (index !== -1) {
              newProducts[index] = payload.new as Product
              console.log('Product updated:', payload.new)
            }
          }
          break
        case 'DELETE':
          if (payload.old) {
            newProducts = newProducts.filter(p => p.id !== payload.old.id)
            console.log('Product deleted:', payload.old)
          }
          break
      }
      
      // Only call the callback if products actually changed
      if (JSON.stringify(newProducts) !== JSON.stringify(currentProducts)) {
        onProductsChange(newProducts)
      }
      
      return newProducts
    })
  }, [onProductsChange])

  const realtimeState = useRealtime({
    onProductChange: handleProductChange
  })

  return {
    ...realtimeState,
    products
  }
}

export function useTagsRealtime(onTagsChange: (tags: Tag[]) => void) {
  const [tags, setTags] = useState<Tag[]>([])

  const handleTagChange = useCallback((payload: RealtimePayload) => {
    setTags(currentTags => {
      let newTags = [...currentTags]
      
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            newTags.push(payload.new as Tag)
            console.log('Tag inserted:', payload.new)
          }
          break
        case 'UPDATE':
          if (payload.new) {
            const index = newTags.findIndex(t => t.id === payload.new.id)
            if (index !== -1) {
              newTags[index] = payload.new as Tag
              console.log('Tag updated:', payload.new)
            }
          }
          break
        case 'DELETE':
          if (payload.old) {
            newTags = newTags.filter(t => t.id !== payload.old.id)
            console.log('Tag deleted:', payload.old)
          }
          break
      }
      
      // Only call the callback if tags actually changed
      if (JSON.stringify(newTags) !== JSON.stringify(currentTags)) {
        onTagsChange(newTags)
      }
      
      return newTags
    })
  }, [onTagsChange])

  const realtimeState = useRealtime({
    onTagChange: handleTagChange
  })

  return {
    ...realtimeState,
    tags
  }
} 