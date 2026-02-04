const WISHLIST_KEY = 'majikari_wishlist'

export interface WishlistItem {
  id: string
  addedAt: string
}

export function getWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(WISHLIST_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    localStorage.removeItem(WISHLIST_KEY)
    return []
  }
}

export function isInWishlist(itemId: string): boolean {
  return getWishlist().some(item => item.id === itemId)
}

export function addToWishlist(itemId: string): WishlistItem[] {
  if (typeof window === 'undefined') return []
  const wishlist = getWishlist()
  if (wishlist.some(item => item.id === itemId)) return wishlist
  const newWishlist: WishlistItem[] = [
    ...wishlist,
    { id: itemId, addedAt: new Date().toISOString() }
  ]
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist))
  return newWishlist
}

export function removeFromWishlist(itemId: string): WishlistItem[] {
  if (typeof window === 'undefined') return []
  const newWishlist = getWishlist().filter(item => item.id !== itemId)
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist))
  return newWishlist
}

export function toggleWishlist(itemId: string): boolean {
  if (isInWishlist(itemId)) {
    removeFromWishlist(itemId)
    return false
  } else {
    addToWishlist(itemId)
    return true
  }
}

export function clearWishlist(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(WISHLIST_KEY)
}

export function getWishlistCount(): number {
  return getWishlist().length
}
