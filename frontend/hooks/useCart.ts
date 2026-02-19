import { useEffect, useState } from 'react'
import formatPriceFromCents from '../lib/formatPrice'

type Price = { amount_cents: number }
type Stock = { qty_available?: number; qty_reserved?: number; status?: string }

export type CartEntry = {
  id: string
  title: string
  thumbnail?: string | null
  price?: Price | null
  stock?: Stock | null
  qty: number
  added_at?: string
}

const STORAGE_KEY = 'cart_v1'

function loadFromStorage(): CartEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartEntry[]
  } catch (e) {
    console.error('Failed to load cart', e)
    return []
  }
}

function saveToStorage(items: CartEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save cart', e)
  }
}

let storeItems: CartEntry[] = []
const subscribers = new Set<(items: CartEntry[]) => void>()

function notifySubscribers() {
  subscribers.forEach(s => {
    try { s(storeItems) } catch (e) { }
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY) {
      storeItems = loadFromStorage()
      notifySubscribers()
    }
  })
}

export default function useCart() {
  const [items, setItems] = useState<CartEntry[]>(storeItems)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = loadFromStorage()
      if (stored && stored.length && JSON.stringify(stored) !== JSON.stringify(storeItems)) {
        storeItems = stored
        notifySubscribers()
      }
    }
    const updater = (next: CartEntry[]) => setItems(next)
    subscribers.add(updater)
    setItems(storeItems)
    return () => { subscribers.delete(updater) }
  }, [])

  function persistAndNotify(nextItems: CartEntry[]) {
    // Merge with any remote changes to reduce cross-tab overwrite races.
    const remote = loadFromStorage()
    const nextMap = new Map(nextItems.map(i => [String(i.id), i]))
    const merged: CartEntry[] = [...nextItems]
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

  function findIndexForEntry(entry: Omit<CartEntry, 'qty'>) {
    const idStr = String(entry.id)
    // id exact match
    let idx = storeItems.findIndex(i => String(i.id) === idStr)
    if (idx !== -1) return idx

    // normalized title match
    if (entry.title) {
      const want = normalizeText(entry.title)
      idx = storeItems.findIndex(i => normalizeText(i.title) === want)
      if (idx !== -1) return idx
    }

    // thumbnail / image url match
    if (entry.thumbnail) {
      const wantThumb = extractFirstImageUrl(entry.thumbnail)
      idx = storeItems.findIndex(i => extractFirstImageUrl(i.thumbnail) === wantThumb)
      if (idx !== -1) return idx
    }

    return -1
  }

  function computeSubtotal(entry: CartEntry) {
    return entry.price ? (entry.price.amount_cents * entry.qty) : 0
  }

  function addOrUpdate(entry: Omit<CartEntry, 'qty'>, qty = 1): { ok: boolean; added: boolean; message?: string } {
    // Use normalized matching to find existing item (id, title, thumbnail)
    const idx = findIndexForEntry(entry)
    // Removed strict stock limiting
    // const avail = entry.stock?.qty_available ?? Infinity
    // const safeQty = Math.max(1, Math.min(qty, avail))
    const safeQty = Math.max(1, qty)

    if (idx !== -1) {
      // If the item exists, increment its qty by the requested amount
      const next = storeItems.map((i, j) => j === idx ? { ...i, qty: (i.qty || 0) + safeQty } : i)
      persistAndNotify(next)
      return { ok: true, added: false, message: 'Cart updated' }
    }

    const nextEntry: CartEntry = { ...entry, qty: safeQty, added_at: new Date().toISOString() }
    persistAndNotify([nextEntry, ...storeItems])
    return { ok: true, added: true }
  }

  function remove(id: string) {
    const next = storeItems.filter(i => String(i.id) !== String(id))
    persistAndNotify(next)
  }

  function updateQty(id: string, qty: number): { ok: boolean; message?: string } {
    const idx = storeItems.findIndex(i => String(i.id) === String(id))
    if (idx === -1) return { ok: false, message: 'Item not in cart' }
    // Removed strict stock limiting
    // const entry = storeItems[idx]
    // const avail = entry.stock?.qty_available ?? Infinity
    if (qty < 1) qty = 1
    // if (qty > avail) { ... }
    
    const next = storeItems.map(i => String(i.id) === String(id) ? { ...i, qty } : i)
    persistAndNotify(next)
    return { ok: true }
  }

  function clear() { persistAndNotify([]) }

  const totalCents = items.reduce((s, it) => s + computeSubtotal(it), 0)

  return {
    items,
    count: items.reduce((s, it) => s + it.qty, 0),
    totalCents,
    addOrUpdate,
    remove,
    updateQty,
    clear,
    formatPrice: (cents?: number | null) => cents != null ? formatPriceFromCents(cents) : 'Call for price'
  }
}
