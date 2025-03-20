import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "sonner";
import AuthProviderWrapper from "@/components/shared/auth-provider-wrapper";
import { QueryClientProvider } from "@/components/shared/query-client-provider";
import { BreadcrumbProvider } from "@/components/shared/breadcrumb-provider";
import { ChatbotProvider } from "@/components/shared/chatbot-provider";
import { MeetingDialogProvider, MeetingDialogContainer } from "@/contexts/MeetingDialogContext";
import { TaskDialogProvider } from "@/contexts/TaskDialogContext";
import { EmailDialogProvider } from "@/contexts/EmailDialogContext";
import { LeadPhoneDialogProvider } from '@/contexts/LeadPhoneDialogContext';
import { MeetingDialogTaskbar } from '@/components/ui/meeting-dialog-taskbar';
import { TaskDialogTaskbar } from '@/components/ui/task-dialog-taskbar';
import { EmailDialogTaskbar } from '@/components/ui/email-dialog-taskbar';
import { PhoneDialogTaskbar } from '@/components/ui/phone-dialog-taskbar';
import { LeadNotesProvider } from '@/lib/contexts/LeadNotesContext';
import { LeadNoteDialogManager } from '@/components/leads/LeadNoteDialogManager';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Strike CRM",
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
                <MeetingDialogProvider>
                  <TaskDialogProvider>
                    <EmailDialogProvider>
                      <LeadPhoneDialogProvider>
                        <LeadNotesProvider>
                          <div className="flex flex-col min-h-screen">
                            <BreadcrumbProvider />
                            <div className="flex-1">
                              {children}
                            </div>
                            <MeetingDialogTaskbar />
                            <TaskDialogTaskbar />
                            <EmailDialogTaskbar />
                            <PhoneDialogTaskbar />
                            <MeetingDialogContainer />
                            <LeadNoteDialogManager />
                          </div>
                          <Toaster position="top-right" />
                        </LeadNotesProvider>
                      </LeadPhoneDialogProvider>
                    </EmailDialogProvider>
                  </TaskDialogProvider>
                </MeetingDialogProvider>
              </ChatbotProvider>
            </QueryClientProvider>
          </AuthProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
