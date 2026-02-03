/**
 * Waitlist API — Persistent via Upstash Redis
 *
 * POST /api/waitlist — Add email to waitlist
 * GET  /api/waitlist — Get count + optionally list all (?secret=ADMIN_SECRET)
 *
 * Env vars needed in Vercel:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *   WAITLIST_ADMIN_SECRET (optional, for retrieving emails)
 *   WAITLIST_WEBHOOK_URL (optional, for notifications)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('landing'),
})

// ── Upstash Redis REST helpers ──
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

async function redis(command: string[]) {
  if (!REDIS_URL || !REDIS_TOKEN) return null
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  return res.json()
}

// Fallback in-memory store for local dev
const memoryStore: Array<{ email: string; source: string; createdAt: string }> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = emailSchema.parse(body)
    const entry = { email, source, createdAt: new Date().toISOString() }

    if (REDIS_URL && REDIS_TOKEN) {
      // Check if already exists
      const exists = await redis(['SISMEMBER', 'waitlist:emails', email])
      if (exists?.result === 1) {
        return NextResponse.json({
          success: true,
          message: "You're already on the list!",
        })
      }

      // Add to set (for dedupe) and list (for ordered retrieval)
      await redis(['SADD', 'waitlist:emails', email])
      await redis(['RPUSH', 'waitlist:entries', JSON.stringify(entry)])
    } else {
      // Local dev fallback
      if (memoryStore.some(e => e.email === email)) {
        return NextResponse.json({
          success: true,
          message: "You're already on the list!",
        })
      }
      memoryStore.push(entry)
    }

    // Always log (backup)
    console.log(`[WAITLIST_SIGNUP] ${JSON.stringify(entry)}`)

    // Webhook notification (fire and forget)
    const webhookUrl = process.env.WAITLIST_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🎯 New Majikari signup: ${email} (${source})` }),
      }).catch(() => {})
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

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const adminSecret = process.env.WAITLIST_ADMIN_SECRET

  if (REDIS_URL && REDIS_TOKEN) {
    const countRes = await redis(['SCARD', 'waitlist:emails'])
    const count = countRes?.result || 0

    // If admin secret matches, return all entries
    if (adminSecret && secret === adminSecret) {
      const entriesRes = await redis(['LRANGE', 'waitlist:entries', '0', '-1'])
      const entries = (entriesRes?.result || []).map((e: string) => {
        try { return JSON.parse(e) } catch { return e }
      })
      return NextResponse.json({ count, entries })
    }

    return NextResponse.json({ count })
  }

  // Local dev fallback
  if (adminSecret && secret === adminSecret) {
    return NextResponse.json({ count: memoryStore.length, entries: memoryStore })
  }
  return NextResponse.json({ count: memoryStore.length })
}
