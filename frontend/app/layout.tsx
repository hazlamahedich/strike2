import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "sonner";
import AuthProviderWrapper from "@/components/shared/auth-provider-wrapper";
import { QueryClientProvider } from "@/components/shared/query-client-provider";
import { BreadcrumbProvider } from "@/components/shared/breadcrumb-provider";
import { ChatbotProvider } from "@/components/shared/chatbot-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI-Powered CRM",
  description: "Intelligent, modular CRM system built with modern AI capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProviderWrapper>
            <QueryClientProvider>
              <ChatbotProvider>
                <div className="flex flex-col min-h-screen">
                  <BreadcrumbProvider />
                  <div className="flex-1">
                    {children}
                  </div>
                </div>
                <Toaster position="top-right" />
              </ChatbotProvider>
            </QueryClientProvider>
          </AuthProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
