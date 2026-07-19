'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.refresh() // Clear router cache
    window.location.href = '/' // Force full reload to clear all client states (zustand, etc)
  }

  return (
    <button 
      onClick={handleLogout}
      className="text-sm font-medium text-ink-light hover:text-data-down transition-colors px-3 py-2 rounded-md hover:bg-data-down/10"
    >
      Log out
    </button>
  )
}
