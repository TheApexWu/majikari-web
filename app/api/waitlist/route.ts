/**
 * Waitlist API
 *
 * POST /api/waitlist — Add email to waitlist
 * GET  /api/waitlist — Get count
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('landing'),
})

const WAITLIST_FILE = process.env.WAITLIST_FILE || 'data/waitlist.json'

async function getWaitlist(): Promise<Array<{ email: string; source: string; createdAt: string }>> {
  try {
    const fs = await import('fs/promises')
    const data = await fs.readFile(WAITLIST_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveWaitlist(entries: Array<{ email: string; source: string; createdAt: string }>) {
  const fs = await import('fs/promises')
  const path = await import('path')
  await fs.mkdir(path.dirname(WAITLIST_FILE), { recursive: true })
  await fs.writeFile(WAITLIST_FILE, JSON.stringify(entries, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = emailSchema.parse(body)

    const entries = await getWaitlist()
    if (entries.some(e => e.email === email)) {
      return NextResponse.json({
        success: true,
        message: "You're already on the list!",
      })
    }

    entries.push({ email, source, createdAt: new Date().toISOString() })
    await saveWaitlist(entries)

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
  const entries = await getWaitlist()
  return NextResponse.json({ count: entries.length })
}
