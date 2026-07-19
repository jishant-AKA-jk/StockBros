'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLinks() {
  const pathname = usePathname();
  
  const links = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Screener', href: '/screener' },
    { name: 'Scanner', href: '/scanner' },
    { name: 'Watchlist', href: '/watchlist' },
    { name: 'Journal', href: '/journal' },
  ];

  return (
    <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "inline-flex items-center pt-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
              isActive 
                ? "border-primary text-primary" 
                : "border-transparent text-ink-light hover:text-ink hover:border-primary/50"
            )}
          >
            {link.name}
          </Link>
        );
      })}
    </div>
  );
}
