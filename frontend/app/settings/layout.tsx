"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Cog, User, Database, Bot, Headset, Bell, KeyRound, Users, BarChart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const sidebarNavItems = [
  {
    title: "Account",
    href: "/settings/account",
    icon: User,
  },
  {
    title: "Team",
    href: "/settings/team",
    icon: Users,
  },
  {
    title: "Integrations",
    href: "/settings/integrations",
    icon: Database,
  },
  {
    title: "LLM",
    href: "/settings/llm",
    icon: Bot,
  },
  {
    title: "API Keys",
    href: "/settings/api-keys",
    icon: KeyRound,
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Analytics",
    href: "/settings/analytics",
    icon: BarChart,
  },
  {
    title: "Support",
    href: "/settings/support",
    icon: Headset,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 px-10 pb-16 md:block">
      <div className="space-y-0.5 py-6">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and configure application preferences
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex flex-col space-y-2">
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                  pathname && (pathname === item.href || pathname.startsWith(`${item.href}/`))
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
} 