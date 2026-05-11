'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SlfmArtist {
  mbid: string
  name: string
  sortName: string
  disambiguation?: string
}

interface SlfmSetlist {
  id: string
  eventDate: string
  venue: { name: string; city: { name: string; country: { name: string } } }
  tour?: { name: string }
  sets: { set: { song: { name: string }[] }[] }
  artist: SlfmArtist
}

type ImportStatus = 'idle' | 'importing' | 'done' | 'exists' | 'error'

interface PopularResult {
  artist: string
  status: 'imported' | 'exists' | 'no_setlist' | 'error'
  concertId?: string
  title?: string
}

export default function ImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [popularLoading, setPopularLoading] = useState(false)
  const [popularResults, setPopularResults] = useState<PopularResult[] | null>(null)
  const [popularError, setPopularError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [artists, setArtists] = useState<SlfmArtist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<SlfmArtist | null>(null)
  const [setlists, setSetlists] = useState<SlfmSetlist[]>([])
  const [loadingSetlists, setLoadingSetlists] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [importStatus, setImportStatus] = useState<Record<string, ImportStatus>>({})

  const searchArtists = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setArtists([])
    setSelectedArtist(null)
    setSetlists([])

    const res = await fetch(`/api/setlistfm/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setArtists(data)
    setSearching(false)
  }, [query])

  const loadSetlists = useCallback(async (artist: SlfmArtist, p = 1) => {
    setSelectedArtist(artist)
    setLoadingSetlists(true)
    if (p === 1) setSetlists([])
    setPage(p)

    const res = await fetch(`/api/setlistfm/setlists?mbid=${artist.mbid}&page=${p}`)
    const data = await res.json()
    setSetlists((prev) => p === 1 ? data.setlists : [...prev, ...data.setlists])
    setTotal(data.total)
    setLoadingSetlists(false)
  }, [])

  const importSetlist = useCallback(async (setlist: SlfmSetlist) => {
    setImportStatus((s) => ({ ...s, [setlist.id]: 'importing' }))

    const res = await fetch('/api/setlistfm/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setlist),
    })

    if (!res.ok) {
      setImportStatus((s) => ({ ...s, [setlist.id]: 'error' }))
      return
    }

    const data = await res.json()
    setImportStatus((s) => ({
      ...s,
      [setlist.id]: data.alreadyExists ? 'exists' : 'done',
    }))

    if (!data.alreadyExists) {
      setTimeout(() => router.push(`/concerts/${data.concertId}`), 800)
    }
  }, [router])

  const importPopular = useCallback(async () => {
    setPopularLoading(true)
    setPopularResults(null)
    setPopularError(null)
    try {
      const res = await fetch('/api/cron/import-popular', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setPopularError((data.error ?? `Server error ${res.status}`) + (data.detail ? ` — ${data.detail}` : ''))
      } else {
        setPopularResults(data.results ?? [])
      }
    } catch (e) {
      setPopularError(String(e))
    }
    setPopularLoading(false)
  }, [])

  const songCount = (setlist: SlfmSetlist) =>
    setlist.sets.set.reduce((n, s) => n + (s.song?.length ?? 0), 0)

  const formatDate = (d: string) => {
    const [day, month, year] = d.split('-')
    return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  if (status === 'loading') return null

  if (!session) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-white text-lg">Sign in to import shows from setlist.fm.</p>
        <Link href="/auth/signin" className="bg-brand-green text-black font-semibold px-6 py-2 rounded hover:bg-green-400 transition-colors">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Import from setlist.fm</h1>
        <p className="text-brand-text text-sm mt-1">
          Search for an artist, browse their shows, and import with full setlist data.
        </p>
      </div>

      {/* Popular shows */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold">Import Today&apos;s Popular Shows</h2>
            <p className="text-brand-muted text-xs mt-0.5">
              Pulls the top 10 artists from Spotify&apos;s Global Top 50 and imports their most recent show.
            </p>
          </div>
          <button
            onClick={importPopular}
            disabled={popularLoading}
            className="shrink-0 bg-brand-green text-black font-semibold px-4 py-2 rounded text-sm hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            {popularLoading ? 'Importing…' : '↓ Import Popular'}
          </button>
        </div>

        {popularError && (
          <div className="pt-1 border-t border-brand-border text-sm text-red-400">
            Error: {popularError}
          </div>
        )}

        {popularResults && popularResults.length === 0 && (
          <div className="pt-1 border-t border-brand-border text-sm text-brand-muted">
            No results returned. Check that your SETLISTFM_API_KEY and SPOTIFY credentials are set in .env and restart the dev server.
          </div>
        )}

        {popularResults && popularResults.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-brand-border">
            {popularResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm gap-3">
                <div className="min-w-0">
                  <span className="font-medium text-white">{r.artist}</span>
                  {r.title && <span className="text-brand-muted text-xs ml-2 truncate">{r.title}</span>}
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${
                  r.status === 'imported' ? 'bg-brand-green text-black' :
                  r.status === 'exists' ? 'bg-brand-border text-brand-muted' :
                  r.status === 'no_setlist' ? 'bg-brand-border text-brand-muted' :
                  'bg-red-900 text-red-300'
                }`}>
                  {r.status === 'imported' ? '✓ Imported' :
                   r.status === 'exists' ? 'Already added' :
                   r.status === 'no_setlist' ? 'No setlist found' :
                   'Error'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-brand-muted">
        <div className="flex-1 border-t border-brand-border" />
        <span className="text-xs uppercase tracking-wider">or search manually</span>
        <div className="flex-1 border-t border-brand-border" />
      </div>

      {/* Search */}
      <form onSubmit={searchArtists} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists on setlist.fm…"
          className="flex-1 bg-brand-card border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-brand-green text-black font-semibold px-4 py-2 rounded text-sm hover:bg-green-400 transition-colors disabled:opacity-50"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Artist results */}
      {artists.length > 0 && !selectedArtist && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Artists</h2>
          {artists.map((a) => (
            <button
              key={a.mbid}
              onClick={() => loadSetlists(a, 1)}
              className="w-full text-left bg-brand-card border border-brand-border rounded-lg px-4 py-3 hover:border-brand-green transition-colors group"
            >
              <span className="font-semibold text-white group-hover:text-brand-green transition-colors">
                {a.name}
              </span>
              {a.disambiguation && (
                <span className="text-brand-muted text-xs ml-2">({a.disambiguation})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Setlists */}
      {selectedArtist && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedArtist(null); setSetlists([]) }}
              className="text-brand-muted hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-lg font-bold text-white">{selectedArtist.name}</h2>
            <span className="text-brand-muted text-sm">{total} shows on setlist.fm</span>
          </div>

          {loadingSetlists && setlists.length === 0 ? (
            <p className="text-brand-muted text-sm py-8 text-center">Loading shows…</p>
          ) : setlists.length === 0 ? (
            <p className="text-brand-muted text-sm py-8 text-center">No setlists found for this artist.</p>
          ) : (
            <>
              <div className="space-y-2">
                {setlists.map((sl) => {
                  const songs = songCount(sl)
                  const st = importStatus[sl.id] ?? 'idle'
                  return (
                    <div
                      key={sl.id}
                      className="bg-brand-card border border-brand-border rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {sl.venue.name}
                          <span className="text-brand-muted font-normal ml-2">
                            · {sl.venue.city.name}, {sl.venue.city.country.name}
                          </span>
                        </p>
                        <p className="text-brand-muted text-xs mt-0.5">
                          {formatDate(sl.eventDate)}
                          {sl.tour && <span className="ml-2">· {sl.tour.name}</span>}
                          <span className="ml-2">· {songs} song{songs !== 1 ? 's' : ''}</span>
                        </p>
                        {/* Song preview */}
                        {songs > 0 && (
                          <p className="text-brand-muted text-xs mt-1 truncate">
                            {sl.sets.set.flatMap(s => s.song ?? []).slice(0, 4).map(s => s.name).join(' · ')}
                            {songs > 4 && ` · +${songs - 4} more`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => importSetlist(sl)}
                        disabled={st !== 'idle'}
                        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                          st === 'done' ? 'bg-brand-green text-black' :
                          st === 'exists' ? 'bg-brand-border text-brand-muted' :
                          st === 'importing' ? 'bg-brand-border text-brand-muted' :
                          st === 'error' ? 'bg-red-900 text-red-300' :
                          'bg-brand-green text-black hover:bg-green-400'
                        }`}
                      >
                        {st === 'done' ? '✓ Imported' :
                         st === 'exists' ? 'Already added' :
                         st === 'importing' ? 'Importing…' :
                         st === 'error' ? 'Error' :
                         'Import'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {setlists.length < total && (
                <button
                  onClick={() => loadSetlists(selectedArtist, page + 1)}
                  disabled={loadingSetlists}
                  className="w-full py-2 text-sm text-brand-text border border-brand-border rounded hover:border-brand-green hover:text-white transition-colors disabled:opacity-50"
                >
                  {loadingSetlists ? 'Loading…' : `Load more (${setlists.length} of ${total})`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
