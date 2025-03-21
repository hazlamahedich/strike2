import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftProvider from "next-auth/providers/azure-ad";

// Default UUID to use as fallback if a non-UUID ID is encountered
const DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Check if we're in development mode and mock data is enabled
const isMockModeEnabled = () => {
  return process.env.NODE_ENV === 'development' && 
         (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || 
          (typeof window !== 'undefined' && window.localStorage.getItem('strike_app_mock_data') === 'true'));
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // In mock mode (development), bypass authentication
        if (isMockModeEnabled()) {
          console.log('Using mock authentication data in development mode');
          return {
            id: "7007305b-1d08-49ae-9aa3-680eb8394a76",
            name: "Admin User (Mock Mode)",
            email: "admin@example.com",
            role: "admin",
            image: null,
          };
        }
        
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          // For testing purposes, we'll use hardcoded credentials
          // In production, you would validate against your database
          if (credentials.email === "admin@example.com" && credentials.password === "password123") {
            return {
              id: "7007305b-1d08-49ae-9aa3-680eb8394a76",
              name: "Admin User",
              email: "admin@example.com",
              role: "admin",
              image: null,
            };
          }
          
          if (credentials.email === "user@example.com" && credentials.password === "password123") {
            return {
              id: "8107305b-2e09-59bf-9bb4-790eb8394b87",
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/calendar.readonly email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: "common",
      authorization: {
        params: {
          scope: "openid email profile User.Read Calendars.Read"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Add custom user data to the JWT token
      if (user) {
        // Ensure user ID is a valid UUID
        if (user.id && typeof user.id === 'string') {
          // If it's already a valid UUID, use it
          if (UUID_REGEX.test(user.id)) {
            token.id = user.id;
          } else {
            // If it's not a valid UUID (e.g., numeric ID), log a warning and use default UUID
            console.warn(`Converting non-UUID user ID to default UUID. Original ID: ${user.id}`);
            token.id = DEFAULT_UUID;
          }
        } else {
          // If no ID is provided, use default UUID
          token.id = DEFAULT_UUID;
        }
        
        token.role = (user as any).role || "user";
      }
      // Store the access token and refresh token if available
      if (account) {
        if (account.provider === 'google' || account.provider === 'azure-ad') {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
          token.provider = account.provider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom user data to the session
      if (session.user) {
        // Ensure user ID is a valid UUID
        if (token.id && typeof token.id === 'string' && UUID_REGEX.test(token.id)) {
          session.user.id = token.id;
        } else {
          // Use default UUID if token.id is not a valid UUID
          console.warn(`Using default UUID for session. Token ID: ${token.id}`);
          session.user.id = DEFAULT_UUID;
        }
        
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
  secret: process.env.NEXTAUTH_SECRET || "DEVELOPMENT_SECRET_DO_NOT_USE_IN_PRODUCTION",
  debug: process.env.NODE_ENV === "development",
}; 