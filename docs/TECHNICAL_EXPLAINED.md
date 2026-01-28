# Majikari Technical Deep Dive

*How every piece actually works — no black boxes.*

---

## 1. How the Scraper Calls Mercari's API

### The Library: `mercapi`

We use a third-party Python library called `mercapi`. It's a **reverse-engineered wrapper** around Mercari Japan's internal API.

**Important:** Mercari has no official public API. `mercapi` figured out how their mobile app talks to their servers and recreated it in Python.

### What Happens When You Search

```python
from mercapi import Mercapi

# Step 1: Create a client
# This generates a cryptographic keypair for request signing
m = Mercapi()
```

**Under the hood:**
- Generates an ECDSA key pair (like a password, but math-based)
- Creates a unique device UUID (pretends to be a phone)
- Sets up HTTP headers to look like a real Mercari app

```python
# Step 2: Search for items
results = await m.search(
    query="フィギュア",                    # Search term
    price_min=2000,                        # Minimum price
    price_max=8000,                        # Maximum price
    status=[Status.STATUS_ON_SALE],        # Only active listings
    sort_by=SortBy.SORT_CREATED_TIME,      # Newest first
)
```

**Under the hood:**
```
POST https://api.mercari.jp/v2/entities:search

Headers:
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
  X-Platform: web
  DPoP: eyJhbGciOiJFUzI1NiIs... (signed JWT token)

Body (JSON):
{
  "searchConditions": {
    "query": "フィギュア",
    "priceMin": 2000,
    "priceMax": 8000,
    "status": ["STATUS_ON_SALE"],
    "sortBy": "SORT_CREATED_TIME"
  }
}
```

**Response:**
```json
{
  "items": [
    {"id": "m12345", "name": "...", "price": 3500, "thumbnails": [...]},
    {"id": "m67890", "name": "...", "price": 4200, "thumbnails": [...]},
    ...
  ],
  "meta": {
    "numFound": 15420,
    "nextPageToken": "abc123..."
  }
}
```

### Getting Full Item Details

Search results are "sparse" — just ID, name, price, thumbnail. To get everything:

```python
# Step 3: Get full details
for item in results.items:
    full = await item.full_item()
    
    # Now we have:
    print(full.description)      # Full description text
    print(full.photos)           # All image URLs
    print(full.seller)           # Seller info (ratings, history)
    print(full.item_condition)   # Condition (1-5 scale)
    print(full.shipping_payer)   # Who pays shipping
```

**Under the hood:**
```
GET https://api.mercari.jp/v2/items/m12345

Response:
{
  "id": "m12345",
  "name": "初音ミク フィギュア",
  "description": "新品・未開封です...",
  "price": 3500,
  "photos": ["https://static.mercdn.net/...jpg", ...],
  "seller": {
    "id": 924054898,
    "name": "Tokyo Shop",
    "ratings": {"good": 1725, "normal": 17, "bad": 5}
  },
  "itemCondition": {"id": 1, "name": "新品、未使用"},
  "shippingPayer": {"code": "seller", "name": "送料込み"}
}
```

### Why Items Return `None`

Sometimes `full_item()` returns `None`. This happens when:
- Item was sold between search and fetch
- Item was deleted by seller
- Item was removed by Mercari (policy violation)

This is normal — we just skip these items.

### Rate Limiting

We add delays to avoid getting blocked:
```python
await asyncio.sleep(0.1)  # 100ms between requests
```

Mercari doesn't publish rate limits, but ~10 requests/second seems safe.

---

## 2. How Prisma/Database Works

### What is Prisma?

Prisma is a **database toolkit** that lets you:
1. Define your database structure in a readable format
2. Generate TypeScript code to interact with it
3. Handle migrations (schema changes over time)

### The Schema File

`prisma/schema.prisma` defines what tables exist:

```prisma
model Item {
  id          String   @id              // Primary key
  name        String                    // Text column
  price       Int                       // Integer column
  description String?  @db.Text         // Optional, long text
  createdAt   DateTime @default(now())  // Auto-set timestamp
  
  // Relationships
  savedBy     SavedItem[]               // One item can be saved by many users
}
```

**This becomes a SQL table:**
```sql
CREATE TABLE "Item" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### How You Interact With Data

Prisma generates a **client** with type-safe methods:

```typescript
import { prisma } from '@/lib/db'

// CREATE - Insert a new item
const newItem = await prisma.item.create({
  data: {
    id: "m12345",
    name: "初音ミク フィギュア",
    price: 3500,
  }
})

// READ - Find items
const cheapFigures = await prisma.item.findMany({
  where: {
    category: "figures",
    price: { lt: 5000 }  // less than ¥5000
  },
  orderBy: { price: 'asc' },
  take: 20  // limit 20
})

// UPDATE - Change an item
await prisma.item.update({
  where: { id: "m12345" },
  data: { price: 3000 }
})

// DELETE - Remove an item
await prisma.item.delete({
  where: { id: "m12345" }
})
```

### The Flow

```
1. You write schema.prisma (human-readable)
         ↓
2. Run `npx prisma db push` (creates real database tables)
         ↓
3. Run `npx prisma generate` (creates TypeScript client)
         ↓
4. Import `prisma` in your code and use it
```

### Why Prisma?

| Alternative | Problem |
|-------------|---------|
| Raw SQL | Error-prone, no type safety |
| Knex.js | Still write SQL-ish code |
| TypeORM | Complex, over-engineered |
| **Prisma** | Clean syntax, great TypeScript support |

---

## 3. How Next.js Routes Requests

### The App Router (Next.js 14)

Next.js uses **file-based routing**. The folder structure = the URL structure:

```
app/
├── page.tsx              → yoursite.com/
├── about/
│   └── page.tsx          → yoursite.com/about
├── calculator/
│   └── page.tsx          → yoursite.com/calculator
└── api/
    └── calculate/
        └── route.ts      → yoursite.com/api/calculate (API endpoint)
```

### Page Components (Frontend)

`app/page.tsx` is a **React component** that renders HTML:

```tsx
// app/page.tsx
export default function Home() {
  return (
    <main>
      <h1>Welcome to Majikari</h1>
      <p>Stop overpaying for Japanese goods.</p>
    </main>
  )
}
```

**When someone visits yoursite.com:**
1. Next.js sees the request for `/`
2. Finds `app/page.tsx`
3. Runs the component
4. Sends the HTML to the browser

### API Routes (Backend)

`app/api/*/route.ts` files handle **API requests** (JSON in, JSON out):

```typescript
// app/api/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Get the input
  const body = await request.json()
  const { url } = body  // e.g., "https://jp.mercari.com/item/m12345"
  
  // 2. Do something with it
  const itemPrice = await fetchItemPrice(url)
  const totalCost = calculateLandedCost(itemPrice)
  
  // 3. Return JSON response
  return NextResponse.json({
    itemPrice,
    totalCost,
    breakdown: {
      item: itemPrice,
      serviceFee: itemPrice * 0.08,
      shipping: 2000,
      // ...
    }
  })
}
```

**When frontend calls the API:**
```typescript
// In a React component
const response = await fetch('/api/calculate', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://jp.mercari.com/item/m12345' })
})
const data = await response.json()
console.log(data.totalCost)  // e.g., 6500
```

### The Request Flow

```
Browser                    Next.js Server               Database
───────                    ──────────────               ────────
   │                             │                          │
   │  GET /                      │                          │
   │ ──────────────────────────► │                          │
   │                             │  (renders page.tsx)      │
   │  ◄─────────────────────────  │                          │
   │  HTML page                  │                          │
   │                             │                          │
   │  POST /api/calculate        │                          │
   │  {url: "..."}               │                          │
   │ ──────────────────────────► │                          │
   │                             │  SELECT * FROM items     │
   │                             │ ────────────────────────► │
   │                             │  ◄──────────────────────  │
   │                             │  (calculates fees)       │
   │  ◄─────────────────────────  │                          │
   │  {totalCost: 6500, ...}     │                          │
```

---

## 4. How Auth Will Work

### The Library: NextAuth.js v5

NextAuth handles:
- User login/logout
- Session management (who's logged in)
- OAuth providers (Google, Discord, etc.)
- Secure token handling

### The Flow (Email Login)

```
1. User enters email on /login page
         ↓
2. NextAuth sends "magic link" email
         ↓
3. User clicks link in email
         ↓
4. NextAuth verifies token, creates session
         ↓
5. User is now logged in (cookie set)
```

### The Flow (OAuth - e.g., Discord)

```
1. User clicks "Login with Discord"
         ↓
2. Redirect to Discord's login page
         ↓
3. User authorizes Majikari
         ↓
4. Discord redirects back with auth code
         ↓
5. NextAuth exchanges code for user info
         ↓
6. Creates/updates user in database
         ↓
7. Session created, user logged in
```

### How Sessions Work

When logged in, NextAuth sets a **secure cookie**:

```
Cookie: authjs.session-token=eyJhbGciOiJIUzI1NiIs...
```

On every request, NextAuth:
1. Reads the cookie
2. Decrypts/validates the token
3. Makes user info available to your code

```typescript
// In any page or API route
import { auth } from '@/lib/auth'

export default async function ProtectedPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  return <h1>Welcome, {session.user.name}!</h1>
}
```

### Database Integration

NextAuth stores users in our PostgreSQL database via Prisma:

```prisma
model User {
  id            String    @id
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]  // OAuth connections
  sessions      Session[]  // Active sessions
}
```

When someone logs in with Discord for the first time:
1. User record created (if new)
2. Account record links Discord ID to User
3. Session record created for this login

---

## Summary: How It All Connects

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAJIKARI ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

  SCRAPER (Python)           DATABASE (PostgreSQL)         WEB APP (Next.js)
  ════════════════           ════════════════════          ═════════════════
        │                           │                            │
   mercapi library                  │                      app/page.tsx
   (calls Mercari)                  │                      (landing page)
        │                           │                            │
        ▼                           │                            │
   JSON files ─────► Import ─────►  │                      app/api/calculate
   (data_v2/)        Script         │                      (fee calculator)
                                    │                            │
                               ┌────┴────┐                       │
                               │  Items  │ ◄─────────────────────┤
                               │  Users  │      Prisma Client    │
                               │ Alerts  │                       │
                               └────┬────┘                       │
                                    │                            │
                                    │                      lib/auth.ts
                                    └──────────────────►   (NextAuth)
                                         Session data            │
                                                                 │
                                                           BROWSER
                                                           (React UI)
```

---

## Your Question: How Do Users Actually Buy?

### The Answer: We Link to the Proxy

Majikari is **NOT a checkout system**. We're a discovery + comparison tool.

**User flow:**
```
1. User finds item on Majikari
2. User sees "Total landed cost: $45"
3. User clicks "Buy via Neokyo" button
4. Opens Neokyo in new tab with item URL pre-filled
5. User completes purchase on Neokyo
```

**The link we provide:**
```
https://neokyo.com/add?url=https://jp.mercari.com/item/m12345
```

(We need to verify Neokyo's actual URL structure — they may have a different format)

### Why Not Handle Checkout Ourselves?

1. **Licensing** — Being a proxy requires business licenses in Japan
2. **Warehousing** — Need physical warehouse in Japan
3. **Banking** — Need Japanese bank account, payment processing
4. **Support** — Need Japanese-speaking customer support
5. **Liability** — Responsible for lost/damaged packages

**Our MVP strategy:** Be the "front door" that drives traffic to partners. Monetize via affiliate fees or become a proxy later.

---

*Document created: January 28, 2026*
