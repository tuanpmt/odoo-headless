import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser } from "@/lib/auth";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Odoo",
      credentials: {
        login: { label: "Email", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;
        const user = await authenticateUser(
          credentials.login,
          credentials.password
        );
        if (!user) return null;
        return { id: String(user.id), name: user.name, email: user.email };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as Record<string, unknown>).id = token.id;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
