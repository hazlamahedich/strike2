import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: {
    name: string
    href: string
  }[]
  separator?: React.ReactNode
  homeHref?: string
}

const Breadcrumb = React.forwardRef<HTMLDivElement, BreadcrumbProps>(
  ({ segments, separator = <ChevronRight className="h-4 w-4" />, homeHref = "/", className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn("flex items-center text-sm text-muted-foreground", className)}
        aria-label="Breadcrumb"
        {...props}
      >
        <ol className="flex items-center space-x-2">
          <li className="flex items-center">
            <Link
              href={homeHref}
              className="flex items-center hover:text-foreground transition-colors"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
          
          {segments.map((segment, index) => (
            <li key={segment.href} className="flex items-center space-x-2">
              <span className="text-muted-foreground">{separator}</span>
              <span className="flex items-center">
                {index === segments.length - 1 ? (
                  <span className="font-medium text-foreground" aria-current="page">{segment.name}</span>
                ) : (
                  <Link
                    href={segment.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {segment.name}
                  </Link>
                )}
              </span>
            </li>
          ))}
        </ol>
      </nav>
    )
  }
)

Breadcrumb.displayName = "Breadcrumb"

export { Breadcrumb } 