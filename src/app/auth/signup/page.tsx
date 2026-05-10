'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError("Passwords don't match")
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Registration failed')
      setLoading(false)
      return
    }

    // Auto sign-in after registration
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Account created but sign-in failed. Please sign in manually.')
      router.push('/auth/signin')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 space-y-6">
      <div className="text-center">
        <Link href="/" className="text-brand-green font-bold text-2xl">
          ConScene
        </Link>
        <h1 className="text-xl font-semibold text-white mt-2">Create an account</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-brand-card border border-brand-border rounded-xl p-6 space-y-4"
      >
        <div className="space-y-1">
          <label className="text-sm text-brand-text">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-brand-darker border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-brand-text">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={2}
            maxLength={30}
            className="w-full bg-brand-darker border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
            placeholder="concertfan99"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-brand-text">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-brand-darker border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-brand-text">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full bg-brand-darker border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-green text-black font-bold py-2.5 rounded hover:bg-green-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-brand-text text-sm">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-brand-green hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
