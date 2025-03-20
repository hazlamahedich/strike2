"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex flex-1 items-center justify-start">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold inline-block">{siteConfig.name}</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4">
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
              })}
            >
              GitHub
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
} 