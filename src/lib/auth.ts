import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Single shared Google sign-in for the whole portal. Authorization (who may
 * reach /admin, who maps to which Head role, and the "any signed-in user"
 * gate on /drive/apply + /drive/donate) is enforced per-surface — see
 * admin/actions.ts and cohort/actions.ts — not here, since each surface has
 * a different allow-list.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
});
