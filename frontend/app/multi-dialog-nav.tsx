'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MultiDialogNav() {
  const pathname = usePathname();
  
  const links = [
    { href: '/multi-dialog-demo', label: 'Basic Demo' },
    { href: '/multi-dialog-hook-demo', label: 'Hook Demo' },
  ];
  
  return (
    <div className="bg-muted/50 p-2 rounded-lg mb-8">
      <nav className="flex space-x-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/docs/multi-dialog.md"
          className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ml-auto"
          target="_blank"
        >
          Documentation
        </Link>
      </nav>
    </div>
  );
} 