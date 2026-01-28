/**
 * NextAuth.js v5 Configuration
 * 
 * Auth providers can be added later. For MVP, we start with:
 * - Email magic link (no password)
 * - Optional: Discord (anime community)
 * - Optional: Google
 */

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Start with email-only for MVP
    // Add OAuth providers when needed
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
})
