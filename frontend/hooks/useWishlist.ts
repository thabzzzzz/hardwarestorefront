import { useEffect, useState } from 'react'
import formatPriceFromCents from '../lib/formatPrice'

type Price = { amount_cents: number }
type Stock = { qty_available?: number; qty_reserved?: number; status?: string }

export type WishlistEntry = {
  id: string
  title: string
  thumbnail?: string | null
  price?: Price | null
  stock?: Stock | null
  qty: number
  added_at?: string
  tag?: 'gift' | 'research' | 'none'
  priority?: 'low' | 'medium' | 'high'
}

const STORAGE_KEY = 'wishlist_v1'

function loadFromStorage(): WishlistEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WishlistEntry[]
  } catch (e) {
    console.error('Failed to load wishlist', e)
    return []
  }
}

function saveToStorage(items: WishlistEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save wishlist', e)
  }
}

// Shared in-memory store so multiple hook consumers stay in sync
// IMPORTANT: do NOT read localStorage at module load time — that creates a
// server/client mismatch during SSR. Initialize empty and load storage on
// first client effect instead.
let storeItems: WishlistEntry[] = []
const subscribers = new Set<(items: WishlistEntry[]) => void>()

function notifySubscribers() {
  subscribers.forEach(s => {
    try { s(storeItems) } catch (e) { /* ignore subscriber errors */ }
  })
}

// Keep store in sync when other tabs modify localStorage
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY) {
      storeItems = loadFromStorage()
      notifySubscribers()
    }
  })
}

export default function useWishlist() {
  const [items, setItems] = useState<WishlistEntry[]>(storeItems)

  useEffect(() => {
    // On client mount, initialize from localStorage once. This avoids a
    // server/client HTML mismatch (hydration error) where the server renders
    // an empty wishlist but the client reads localStorage at module load and
    // renders a different value before hydration.
    if (typeof window !== 'undefined') {
      const stored = loadFromStorage()
      if (stored && stored.length && JSON.stringify(stored) !== JSON.stringify(storeItems)) {
        storeItems = stored
        notifySubscribers()
      }
    }
    // subscribe to shared store updates
    const updater = (next: WishlistEntry[]) => setItems(next)
    subscribers.add(updater)
    // ensure initial sync
    setItems(storeItems)
    return () => { subscribers.delete(updater) }
  }, [])

  function computeSubtotal(entry: WishlistEntry) {
    return entry.price ? (entry.price.amount_cents * entry.qty) : 0
  }

  function persistAndNotify(nextItems: WishlistEntry[]) {
    storeItems = nextItems
    saveToStorage(storeItems)
    notifySubscribers()
  }

  function addOrUpdate(entry: Omit<WishlistEntry, 'qty'>, qty = 1) {
    const id = entry.id
    const found = storeItems.find(i => i.id === id)
    if (found) {
      const next = storeItems.map(i => i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock?.qty_available ?? qty)) } : i)
      persistAndNotify(next)
      return
    }
    const nextEntry: WishlistEntry = { ...entry, qty: Math.max(1, qty), added_at: new Date().toISOString(), tag: entry.tag ?? 'none', priority: entry.priority ?? 'low' }
    persistAndNotify([nextEntry, ...storeItems])
  }

  function remove(id: string) {
    const next = storeItems.filter(i => i.id !== id)
    persistAndNotify(next)
  }

  function toggle(entry: Omit<WishlistEntry, 'qty'>) {
    const id = entry.id
    const found = storeItems.find(i => i.id === id)
    if (found) {
      persistAndNotify(storeItems.filter(i => i.id !== id))
      return
    }
    persistAndNotify([{ ...entry, qty: 1, added_at: new Date().toISOString(), tag: entry.tag ?? 'none', priority: entry.priority ?? 'low' }, ...storeItems])
  }

  function isWished(id: string) {
    return storeItems.some(i => i.id === id)
  }

  function updateQty(id: string, qty: number): { ok: boolean; message?: string } {
    const idx = storeItems.findIndex(i => i.id === id)
    if (idx === -1) return { ok: false, message: 'Item not in wishlist' }
    const entry = storeItems[idx]
    const avail = entry.stock?.qty_available ?? Infinity
    if (qty < 1) qty = 1
    if (qty > avail) {
      const corrected = storeItems.map(i => i.id === id ? { ...i, qty: Math.max(1, avail === Infinity ? i.qty : avail) } : i)
      persistAndNotify(corrected)
      return { ok: false, message: `Only ${avail} available` }
    }
    const next = storeItems.map(i => i.id === id ? { ...i, qty } : i)
    persistAndNotify(next)
    return { ok: true }
  }

  function updateMeta(id: string, fields: Partial<Pick<WishlistEntry, 'tag' | 'priority'>>) {
    const next = storeItems.map(i => i.id === id ? { ...i, ...fields } : i)
    persistAndNotify(next)
  }

  const totalCents = storeItems.reduce((s, it) => s + computeSubtotal(it), 0)

  return {
    items,
    count: items.length,
    totalCents,
    addOrUpdate,
    remove,
    toggle,
    isWished,
    updateQty,
    updateMeta,
    formatPrice: (cents?: number | null) => cents != null ? formatPriceFromCents(cents) : 'Call for price'
  }
}
