# Majikari Web (マジカリ)

Frontend + API for the Majikari platform.

## Stack
- **Frontend:** Next.js 14 (App Router)
- **Auth:** NextAuth.js v5
- **Database:** PostgreSQL (via Prisma)
- **Hosting:** Vercel (frontend) + Railway (database)

## Setup
```bash
npm install
cp .env.example .env.local
# Fill in your database URL and auth secrets
npm run dev
```

## Structure
```
majikari-web/
├── app/                 # Next.js App Router
│   ├── page.tsx        # Landing page
│   ├── calculator/     # Savings Calculator
│   ├── search/         # Visual Search
│   └── api/            # API routes
├── components/         # React components
├── lib/                # Utilities
│   ├── db.ts          # Prisma client
│   └── auth.ts        # Auth config
├── prisma/
│   └── schema.prisma  # Database schema
└── public/
