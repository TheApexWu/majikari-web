# Majikari — Community & Growth

## Email Waitlist
- Endpoint: POST /api/waitlist
- Storage: Upstash Redis (persistent, deduped)
- Admin: GET /api/waitlist?secret=WAITLIST_ADMIN_SECRET
- Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, WAITLIST_ADMIN_SECRET

## Discord
- Server: [TBD — setting up]
- Linked from: site footer, waitlist confirmation
- Channels: announcements, figure-finds, proxy-talk, feature-requests, introductions

## Reddit Launch Plan
1. Seed r/AnimeFigures with genuine participation (2 weeks)
2. "I built this" post with Discord link
3. Cross-post to r/MangaCollectors, r/AnimeMerch

## SEO Targets
- "buyee vs zenmarket"
- "cheapest japanese proxy service"
- "how to buy from mercari japan"
- "hidden proxy fees"

## Metrics
- Waitlist count: /api/waitlist (GET)
- Discord members: manual track
- Site analytics: [TBD — add Plausible or Umami]
