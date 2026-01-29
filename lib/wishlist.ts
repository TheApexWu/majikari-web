/**
 * Wishlist Management with localStorage
 * 
 * CONCEPT: localStorage
 * ─────────────────────
 * localStorage is a browser API for storing key-value pairs.
 * 
 * Key facts:
 * - Persists until user clears browser data
 * - 5-10MB limit per domain
 * - Synchronous (blocks the thread)
 * - Only stores strings (must JSON.stringify objects)
 * - Only available in browser (not during server rendering)
 * 
 * Why use it for MVP:
 * - Zero backend required
 * - Works offline
 * - Users can save items without creating an account
 * - Easy to migrate to database later
 */

const WISHLIST_KEY = 'majikari_wishlist'

/**
 * CONCEPT: Type Safety for localStorage
 * ─────────────────────────────────────
 * localStorage returns strings or null.
 * We parse it into a typed array for safety.
 */

export interface WishlistItem {
  id: string
  addedAt: string  // ISO date string
}

/**
 * Get all wishlist item IDs
 * 
 * PATTERN: Safe localStorage Read
 * 1. Check if window exists (might be server-side)
 * 2. Get the value
 * 3. Parse JSON with fallback
 */
export function getWishlist(): WishlistItem[] {
  // Guard: Don't run on server
  if (typeof window === 'undefined') {
    return []
  }
  
  try {
    const stored = localStorage.getItem(WISHLIST_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    // Corrupted data? Reset it.
    console.error('Failed to parse wishlist:', error)
    localStorage.removeItem(WISHLIST_KEY)
    return []
  }
}

/**
 * Check if an item is in the wishlist
 */
export function isInWishlist(itemId: string): boolean {
  const wishlist = getWishlist()
  return wishlist.some(item => item.id === itemId)
}

/**
 * Add an item to the wishlist
 * 
 * PATTERN: Immutable Update
 * We create a new array instead of mutating the existing one.
 * This makes React state updates predictable.
 */
export function addToWishlist(itemId: string): WishlistItem[] {
  if (typeof window === 'undefined') return []
  
  const wishlist = getWishlist()
  
  // Don't add duplicates
  if (wishlist.some(item => item.id === itemId)) {
    return wishlist
  }
  
  const newWishlist: WishlistItem[] = [
    ...wishlist,
    { id: itemId, addedAt: new Date().toISOString() }
  ]
  
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist))
  return newWishlist
}

/**
 * Remove an item from the wishlist
 */
export function removeFromWishlist(itemId: string): WishlistItem[] {
  if (typeof window === 'undefined') return []
  
  const wishlist = getWishlist()
  const newWishlist = wishlist.filter(item => item.id !== itemId)
  
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist))
  return newWishlist
}

/**
 * Toggle an item in the wishlist
 * Returns the new state (true = added, false = removed)
 */
export function toggleWishlist(itemId: string): boolean {
  if (isInWishlist(itemId)) {
    removeFromWishlist(itemId)
    return false
  } else {
    addToWishlist(itemId)
    return true
  }
}

/**
 * Clear the entire wishlist
 */
export function clearWishlist(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(WISHLIST_KEY)
}

/**
 * Get wishlist count
 */
export function getWishlistCount(): number {
  return getWishlist().length
}

/**
 * CONCEPT: React Hook for Wishlist
 * ─────────────────────────────────
 * This is a custom hook that syncs React state with localStorage.
 * 
 * Why a hook?
 * - Encapsulates the localStorage logic
 * - Provides reactive state updates
 * - Can be reused across components
 * 
 * This would go in a separate file (hooks/useWishlist.ts) in a larger app,
 * but we'll define the pattern here for reference.
 */

/*
Usage in a React component:

import { useState, useEffect } from 'react'
import { getWishlist, toggleWishlist } from '@/lib/wishlist'

function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  
  // Load on mount
  useEffect(() => {
    setWishlist(getWishlist())
  }, [])
  
  // Toggle function that updates state
  const toggle = (itemId: string) => {
    toggleWishlist(itemId)
    setWishlist(getWishlist())
  }
  
  const isWishlisted = (itemId: string) => 
    wishlist.some(item => item.id === itemId)
  
  return { wishlist, toggle, isWishlisted, count: wishlist.length }
}
*/
