import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { QueryClientProvider } from "@/components/shared/query-client-provider";
import { BreadcrumbProvider } from "@/components/shared/breadcrumb-provider";
import { ChatbotProvider } from "@/components/shared/chatbot-provider";
import { DialogProvider } from "@/lib/contexts/DialogContext";
import { Providers } from "./providers";
import { Analytics } from "@/components/shared/analytics";

// Use Inter as the primary font and Montserrat for headings
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI-Powered CRM Suite",
  description: "Intelligent, modular CRM system built with modern AI capabilities",
  keywords: "CRM, sales, customer relationship management, AI, analytics",
  authors: [{ name: "CRM Suite Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`${inter.variable} ${montserrat.variable}`}
    >
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <QueryClientProvider>
              <ChatbotProvider>
                <DialogProvider>
                  <div className="flex flex-col min-h-screen bg-background">
                    <BreadcrumbProvider />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Analytics />
                  </div>
                </DialogProvider>
              </ChatbotProvider>
            </QueryClientProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
