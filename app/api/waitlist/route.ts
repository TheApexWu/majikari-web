/**
 * Waitlist API
 *
 * POST /api/waitlist — Add email to waitlist
 * GET  /api/waitlist — Get count
 *
 * Uses Vercel KV (Redis) for persistence. Falls back to in-memory
 * if KV isn't configured (dev mode).
 *
 * Set WAITLIST_KV_REST_API_URL and WAITLIST_KV_REST_API_TOKEN in Vercel env
 * OR use the simpler approach: store in a Vercel Blob / external DB.
 *
 * For MVP: We use a simple JSON file in the repo as seed + runtime append
 * via Vercel's Edge Config or just accept that signups go to logs.
 *
 * ACTUALLY for launch speed: POST writes to Vercel Function logs (retrievable)
 * AND sends a notification. Simple, reliable, zero infrastructure.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('landing'),
})

// In-memory store (persists per cold-start, fine for MVP traffic)
// Each serverless instance gets its own, but we log everything
const memoryStore: Array<{ email: string; source: string; createdAt: string }> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = emailSchema.parse(body)

    // Dedupe within this instance
    if (memoryStore.some(e => e.email === email)) {
      return NextResponse.json({
        success: true,
        message: "You're already on the list!",
      })
    }

    const entry = { email, source, createdAt: new Date().toISOString() }
    memoryStore.push(entry)

    // Log to Vercel Function Logs (always retrievable via `vercel logs`)
    console.log(`[WAITLIST_SIGNUP] ${JSON.stringify(entry)}`)

    // If a webhook URL is configured, fire and forget
    const webhookUrl = process.env.WAITLIST_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🎯 New Majikari signup: ${email} (${source})` }),
      }).catch(() => {}) // fire and forget
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list! We'll reach out soon.",
    })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: e.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Waitlist error:', e)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return in-memory count (instance-local, but honest)
  return NextResponse.json({ count: memoryStore.length })
}
