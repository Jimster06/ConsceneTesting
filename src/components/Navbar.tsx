'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-brand-darker border-b border-brand-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-brand-green font-bold text-xl tracking-tight">
          ConScene
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm text-brand-text">
          <Link href="/concerts" className="hover:text-white transition-colors">
            Shows
          </Link>
          <Link href="/artists" className="hover:text-white transition-colors">
            Artists
          </Link>
          <Link href="/import" className="hover:text-white transition-colors">
            Import
          </Link>
          {session ? (
            <>
              <Link
                href="/reviews/new"
                className="bg-brand-green text-black font-semibold px-3 py-1.5 rounded hover:bg-green-400 transition-colors"
              >
                + Review
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="hover:text-white transition-colors"
                >
                  {session.user.name}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-brand-card border border-brand-border rounded shadow-lg">
                    <button
                      onClick={() => { signOut(); setMenuOpen(false) }}
                      className="block w-full text-left px-4 py-2 text-sm text-brand-text hover:text-white hover:bg-brand-border transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-brand-green text-black font-semibold px-3 py-1.5 rounded hover:bg-green-400 transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden text-brand-text hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-brand-card border-t border-brand-border px-4 py-3 flex flex-col gap-3 text-sm text-brand-text">
          <Link href="/concerts" onClick={() => setMenuOpen(false)} className="hover:text-white">
            Shows
          </Link>
          <Link href="/artists" onClick={() => setMenuOpen(false)} className="hover:text-white">
            Artists
          </Link>
          <Link href="/import" onClick={() => setMenuOpen(false)} className="hover:text-white">
            Import
          </Link>
          {session ? (
            <>
              <Link href="/reviews/new" onClick={() => setMenuOpen(false)} className="hover:text-white">
                + Review
              </Link>
              <button
                onClick={() => { signOut(); setMenuOpen(false) }}
                className="text-left hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" onClick={() => setMenuOpen(false)} className="hover:text-white">
                Sign in
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="hover:text-white">
                Join
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
