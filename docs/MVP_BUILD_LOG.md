# Majikari MVP Build Log

*Started: January 28, 2026 ~10pm*
*Goal: Demo-ready for Christian call tomorrow*

---

## What We're Building

**Two-page MVP:**

1. **Landing + Calculator** — Paste link, see total cost (UI exists, need API)
2. **Discovery Feed** — Browse 1,500 items, filter, save to wishlist

---

## Architecture Decisions & Trade-offs

### Decision 1: Static JSON vs Database

**Options:**
- A) Load items from PostgreSQL database
- B) Load items from static JSON file

**Choice: B (Static JSON)**

**Why:**
- No database setup needed (faster to ship)
- 1,500 items = ~1MB JSON (fine for browser)
- Can migrate to DB later without changing UI

**Trade-off:**
- Can't do complex queries (OK for MVP)
- Can't update items without redeploying (OK for MVP)
- No user accounts yet (wishlists use localStorage)

**Concept to retain:** Always pick the simplest thing that works for your current stage. Premature optimization kills startups.

---

### Decision 2: Client-side vs Server-side Rendering

**Options:**
- A) Server Components (Next.js RSC) — Data fetched on server, HTML sent to browser
- B) Client Components — Data fetched in browser, rendered with JavaScript

**Choice: A for item list, B for interactive filters**

**Why:**
- Server Components = faster initial load, better SEO
- Client Components = needed for interactivity (filters, wishlist)

**The pattern:**
```
page.tsx (Server) → Loads JSON, passes to components
  └── ItemGrid.tsx (Client) → Handles filters, wishlist interactions
```

**Concept to retain:** In Next.js 14, default is Server Components. Add "use client" only when you need interactivity (state, effects, browser APIs).

---

### Decision 3: Styling Approach

**Options:**
- A) Tailwind CSS (utility classes)
- B) CSS Modules (scoped CSS files)
- C) Styled Components (CSS-in-JS)

**Choice: A (Tailwind)**

**Why:**
- Already set up in the project
- Fastest to iterate
- No context switching between files

**Trade-off:**
- HTML gets verbose with many classes
- Harder to read for CSS purists

**Concept to retain:** For MVPs, optimize for iteration speed, not code beauty.

---

### Decision 4: State Management for Wishlist

**Options:**
- A) React useState + localStorage
- B) Zustand (lightweight state library)
- C) Redux (heavy state library)
- D) Server-side with database

**Choice: A (useState + localStorage)**

**Why:**
- Zero dependencies to install
- Works offline
- Persists across page refreshes
- Can migrate to DB later

**Pattern:**
```typescript
// On mount: load from localStorage
useEffect(() => {
  const saved = localStorage.getItem('wishlist')
  if (saved) setWishlist(JSON.parse(saved))
}, [])

// On change: save to localStorage
useEffect(() => {
  localStorage.setItem('wishlist', JSON.stringify(wishlist))
}, [wishlist])
```

**Concept to retain:** localStorage is a free "database" for anonymous users. Use it for MVPs before adding auth.

---

## File Structure (What We're Creating)

```
majikari-web/
├── app/
│   ├── page.tsx              # Landing + Calculator
│   ├── discover/
│   │   └── page.tsx          # Discovery feed (NEW)
│   └── api/
│       └── calculate/
│           └── route.ts      # Calculator API (NEW)
├── components/
│   ├── ItemGrid.tsx          # Grid of items (NEW)
│   ├── ItemCard.tsx          # Single item card (NEW)
│   ├── FilterBar.tsx         # Category/price filters (NEW)
│   └── WishlistButton.tsx    # Save to wishlist (NEW)
├── lib/
│   ├── items.ts              # Load items from JSON (NEW)
│   └── wishlist.ts           # Wishlist localStorage helpers (NEW)
└── data/
    └── items.json            # Scraped items (copy from scraper)
```

---

## Concepts You're Learning

### 1. React Server Components (RSC)
- New in Next.js 13+
- Components that run ONLY on the server
- Can directly access files, databases
- Smaller JavaScript bundle (code doesn't ship to browser)

### 2. "use client" Directive
- Marks a component to run in the browser
- Required for: useState, useEffect, onClick, any browser API
- Creates a "boundary" — everything below it is also client

### 3. localStorage API
- Browser storage (5MB limit per domain)
- Persists until user clears it
- Synchronous (blocks thread, but fast for small data)
- `localStorage.setItem(key, value)` / `localStorage.getItem(key)`

### 4. JSON Import in Next.js
- Can import JSON files directly: `import items from './items.json'`
- Or fetch at runtime: `fetch('/data/items.json')`
- We'll use fetch for flexibility

---

## Progress Log

| Time | What | Status |
|------|------|--------|
| 10pm | Plan & architecture | ✅ |
| 10:15 | Copy items.json to web project | ✅ |
| 10:20 | Create lib/items.ts (types + helpers) | ✅ |
| 10:25 | Create lib/wishlist.ts (localStorage) | ✅ |
| 10:35 | Create ItemCard component | ✅ |
| 10:40 | Create FilterBar component | ✅ |
| 10:50 | Create ItemGrid component | ✅ |
| 10:55 | Create Discovery page | ✅ |
| 11:00 | Add navigation between pages | ✅ |
| | Install deps & test | ⬜ |
| | Polish for demo | ⬜ |

---
