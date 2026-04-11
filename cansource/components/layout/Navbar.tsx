'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types/database'

export function Navbar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getDashboardHref = () => {
    if (!profile) return '/dashboard'
    if (profile.role === 'supplier') return '/supplier/dashboard'
    if (profile.role === 'admin') return '/admin'
    return '/dashboard'
  }

  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600 tracking-tight">Can</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Source</span>
            <span className="ml-1 text-lg">🍁</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/suppliers"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith('/suppliers')
                  ? 'text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Find Suppliers
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            {!loading && (
              <>
                {profile ? (
                  <div className="flex items-center gap-3">
                    <Link href={getDashboardHref()} className="btn-secondary text-xs px-4 py-2">
                      Dashboard
                    </Link>
                    <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/login" className="btn-secondary text-xs px-4 py-2">
                      Sign in
                    </Link>
                    <Link href="/signup" className="btn-primary text-xs px-4 py-2">
                      Get started
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3">
            <Link href="/suppliers" className="text-sm font-medium text-gray-700 py-2">Find Suppliers</Link>
            <Link href="/#pricing" className="text-sm font-medium text-gray-700 py-2">Pricing</Link>
            {profile ? (
              <>
                <Link href={getDashboardHref()} className="btn-secondary text-sm">Dashboard</Link>
                <button onClick={handleSignOut} className="text-sm text-gray-500 text-left">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm">Sign in</Link>
                <Link href="/signup" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
