import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          // For testing purposes, we'll use hardcoded credentials
          // In production, you would validate against your database
          if (credentials.email === "admin@example.com" && credentials.password === "password123") {
            return {
              id: "1",
              name: "Admin User",
              email: "admin@example.com",
              role: "admin",
              image: null,
            };
          }
          
          if (credentials.email === "user@example.com" && credentials.password === "password123") {
            return {
              id: "2",
              name: "Regular User",
              email: "user@example.com",
              role: "user",
              image: null,
            };
          }
          
          // If credentials don't match any of our test users
          throw new Error("Invalid credentials");
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom user data to the JWT token
      if (user) {
        // Use type assertion to ensure type safety
        token.id = user.id || "";
        token.role = (user as any).role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom user data to the session
      if (session.user) {
        // Use type assertion to ensure type safety
        session.user.id = token.id || "";
        session.user.role = (token as any).role || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
  },
  debug: process.env.NODE_ENV === "development",
}; 