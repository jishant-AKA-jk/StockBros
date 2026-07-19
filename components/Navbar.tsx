import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/app/actions'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from './Logo'
import Link from 'next/link'
import { LogoutButton } from './LogoutButton'
import { NavLinks } from './NavLinks'

export async function Navbar() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-hairline bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 mr-4">
              <Logo className="w-[120px] h-auto" />
            </Link>

            {user && (
              <NavLinks />
            )}
          </div>
          
          <div className="flex items-center gap-4 relative">
            <ThemeToggle />
            
            {user ? (
              <LogoutButton />
            ) : (
              <Link 
                href="/"
                className="text-sm font-medium text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
