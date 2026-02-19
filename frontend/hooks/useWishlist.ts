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
  tag?: 'gift' | 'research' | 'none' | 'upgrade' | 'new_build'
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
    // Merge with remote to avoid overwriting concurrent tab changes.
    const remote = loadFromStorage()
    const nextMap = new Map(nextItems.map(i => [String(i.id), i]))
    const merged: WishlistEntry[] = [...nextItems]
    for (const r of remote) {
      const key = String(r.id)
      if (!nextMap.has(key)) merged.push(r)
    }
    storeItems = merged
    saveToStorage(storeItems)
    notifySubscribers()
  }

  function normalizeText(s?: string | null) {
    if (!s) return ''
    return String(s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/["'`\[\]\(\)\.,\/\\]/g, '').replace(/[^\w\s-]/g, '')
  }

  function extractFirstImageUrl(raw?: string | null) {
    if (!raw) return ''
    let t = String(raw).trim()
    t = t.replace(/\\\//g, '/')
    while ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('"') && t.endsWith('"'))) {
      t = t.slice(1, -1).trim()
    }
    const m = t.match(/https?:\/\/[^"'\s,]+?\.(?:jpg|jpeg|png|webp|gif)/i)
    if (m) return m[0]
    return t
  }

  function findIndexForEntry(entry: Omit<WishlistEntry, 'qty'>) {
    const idStr = String(entry.id)
    let idx = storeItems.findIndex(i => String(i.id) === idStr)
    if (idx !== -1) return idx
    if (entry.title) {
      const want = normalizeText(entry.title)
      idx = storeItems.findIndex(i => normalizeText(i.title) === want)
      if (idx !== -1) return idx
    }
    if (entry.thumbnail) {
      const wantThumb = extractFirstImageUrl(entry.thumbnail)
      idx = storeItems.findIndex(i => extractFirstImageUrl(i.thumbnail) === wantThumb)
      if (idx !== -1) return idx
    }
    return -1
  }

  function addOrUpdate(entry: Omit<WishlistEntry, 'qty'>, qty = 1) {
    const idx = findIndexForEntry(entry)
    if (idx !== -1) {
      // merge metadata but do not change qty here (wishlist page controls qty)
      const next = storeItems.map((i, j) => j === idx ? { ...i, tag: entry.tag ?? i.tag, priority: entry.priority ?? i.priority } : i)
      persistAndNotify(next)
      return { ok: true, added: false, message: 'Already in wishlist' }
    }
    const nextEntry: WishlistEntry = { ...entry, qty: Math.max(1, qty), added_at: new Date().toISOString(), tag: entry.tag ?? 'none', priority: entry.priority ?? 'low' }
    persistAndNotify([nextEntry, ...storeItems])
    return { ok: true, added: true }
  }

  function remove(id: string) {
    const next = storeItems.filter(i => String(i.id) !== String(id))
    persistAndNotify(next)
  }

  function toggle(entry: Omit<WishlistEntry, 'qty'>) {
    const idx = findIndexForEntry(entry)
    if (idx !== -1) {
      persistAndNotify(storeItems.filter((_, j) => j !== idx))
      return
    }
    persistAndNotify([{ ...entry, qty: 1, added_at: new Date().toISOString(), tag: entry.tag ?? 'none', priority: entry.priority ?? 'low' }, ...storeItems])
  }

    function isWished(idOrValue: string) {
    // allow passing id or check by title/thumb via callers that pass an id
    return storeItems.some(i => String(i.id) === String(idOrValue))
  }

  function updateQty(id: string, qty: number): { ok: boolean; message?: string } {
    const idx = storeItems.findIndex(i => String(i.id) === String(id))
    if (idx === -1) return { ok: false, message: 'Item not in wishlist' }
    // Removed strict stock limiting so users may adjust wishlist quantities
    // regardless of the current reported availability. Server-side checks
    // should validate availability at checkout.
    if (qty < 1) qty = 1
    const next = storeItems.map(i => String(i.id) === String(id) ? { ...i, qty } : i)
    persistAndNotify(next)
    return { ok: true }
  }

  function updateMeta(id: string, fields: Partial<Pick<WishlistEntry, 'tag' | 'priority'>>) {
    const next = storeItems.map(i => String(i.id) === String(id) ? { ...i, ...fields } : i)
    persistAndNotify(next)
  }

  function clear() { persistAndNotify([]) }

  const totalCents = items.reduce((s, it) => s + computeSubtotal(it), 0)

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
    clear,
    formatPrice: (cents?: number | null) => cents != null ? formatPriceFromCents(cents) : 'Call for price'
  }
}
