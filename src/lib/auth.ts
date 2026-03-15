import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions, Session } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

/**
 * Returns a Prisma where-clause that scopes queries to the authenticated user.
 * When auth is disabled (no session), returns {} which matches all records.
 *
 *   getUserScope(session)
 *     ├── session with userId → { userId: session.user.id }
 *     └── no session / no userId → {}
 */
export function getUserScope(session: Session | null): { userId?: string } {
  const userId = session?.user?.id;
  return userId ? { userId } : {};
}
