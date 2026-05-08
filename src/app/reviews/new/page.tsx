'use client'

import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { StarRating } from '@/components/StarRating'

interface Artist {
  id: string
  name: string
  slug: string
}

interface Concert {
  id: string
  title: string
  venue: string
  city: string
  date: string
  artist: Artist
}

interface UploadedMedia {
  url: string
  type: string
  preview?: string
}

function NewReviewForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [concerts, setConcerts] = useState<Concert[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedConcert, setSelectedConcert] = useState('')
  const [selectedArtist, setSelectedArtist] = useState(searchParams.get('artistId') ?? '')
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [concertSearch, setConcertSearch] = useState('')

  useEffect(() => {
    fetch('/api/artists')
      .then((r) => r.json())
      .then(setArtists)
  }, [])

  useEffect(() => {
    const artistParam = searchParams.get('artistId')
    const concertParam = searchParams.get('concertId')
    if (artistParam) setSelectedArtist(artistParam)
    if (concertParam) setSelectedConcert(concertParam)
  }, [searchParams])

  useEffect(() => {
    if (!selectedArtist) {
      setConcerts([])
      return
    }
    fetch(`/api/concerts?artistId=${selectedArtist}`)
      .then((r) => r.json())
      .then(setConcerts)
  }, [selectedArtist])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setError('')

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? 'Upload failed')
          continue
        }
        const data = await res.json()
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        setMedia((prev) => [...prev, { url: data.url, type: data.type, preview }])
      } catch {
        setError('Upload failed')
      }
    }

    setUploading(false)
    e.target.value = ''
  }, [])

  const removeMedia = (url: string) => {
    setMedia((prev) => prev.filter((m) => m.url !== url))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedConcert) { setError('Please select a show'); return }
    if (rating === 0) { setError('Please select a rating'); return }

    setSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concertId: selectedConcert,
          rating,
          body: body || null,
          mediaUrls: media.map(({ url, type }) => ({ url, type })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Submission failed')
        setSubmitting(false)
        return
      }

      router.push(`/concerts/${selectedConcert}`)
    } catch {
      setError('Something went wrong')
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return <p className="text-brand-muted text-center py-20">Loading…</p>
  }

  if (!session) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-white text-lg">You need to sign in to write a review.</p>
        <Link
          href="/auth/signin"
          className="bg-brand-green text-black font-semibold px-6 py-2 rounded hover:bg-green-400 transition-colors"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const filteredConcerts = concertSearch
    ? concerts.filter((c) =>
        `${c.title} ${c.venue} ${c.city}`.toLowerCase().includes(concertSearch.toLowerCase())
      )
    : concerts

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Write a Review</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Artist select */}
        <div className="space-y-1">
          <label className="text-sm text-brand-text">Artist</label>
          <select
            value={selectedArtist}
            onChange={(e) => { setSelectedArtist(e.target.value); setSelectedConcert('') }}
            className="w-full bg-brand-card border border-brand-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-green"
          >
            <option value="">Select an artist…</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Concert select */}
        {selectedArtist && (
          <div className="space-y-2">
            <label className="text-sm text-brand-text">Show</label>
            {concerts.length > 5 && (
              <input
                placeholder="Filter shows…"
                value={concertSearch}
                onChange={(e) => setConcertSearch(e.target.value)}
                className="w-full bg-brand-card border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
              />
            )}
            {concerts.length === 0 ? (
              <p className="text-brand-muted text-sm">No shows found for this artist.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredConcerts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedConcert(c.id)}
                    className={`w-full text-left p-3 rounded border text-sm transition-colors ${
                      selectedConcert === c.id
                        ? 'border-brand-green bg-brand-green/10 text-white'
                        : 'border-brand-border bg-brand-card text-brand-text hover:border-brand-green hover:text-white'
                    }`}
                  >
                    <span className="font-medium">{c.title}</span>
                    <span className="text-brand-muted ml-2 text-xs">
                      {c.venue} · {c.city} ·{' '}
                      {new Date(c.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="space-y-1">
          <label className="text-sm text-brand-text">Rating</label>
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <span className="text-brand-text text-sm">
                {['', 'Terrible', 'Poor', 'OK', 'Good', 'Outstanding'][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Review body */}
        <div className="space-y-1">
          <label className="text-sm text-brand-text">Review (optional)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the show — the setlist, the energy, a moment you'll never forget…"
            rows={5}
            className="w-full bg-brand-card border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green resize-y"
          />
        </div>

        {/* Media upload */}
        <div className="space-y-2">
          <label className="text-sm text-brand-text">
            Photos & Videos (optional)
          </label>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-6 cursor-pointer hover:border-brand-green transition-colors group">
            <span className="text-2xl">📷</span>
            <div className="text-center">
              <span className="text-brand-text text-sm group-hover:text-white transition-colors block">
                Click to upload photos or videos
              </span>
              <span className="text-brand-muted text-xs">
                JPG, PNG, GIF, WebP up to 10MB · MP4, WebM up to 200MB
              </span>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {uploading && (
            <p className="text-brand-muted text-sm flex items-center gap-2">
              <span className="animate-spin">⏳</span> Uploading…
            </p>
          )}

          {/* Media previews */}
          {media.length > 0 && (
            <div className="media-grid">
              {media.map((m) => (
                <div key={m.url} className="relative group">
                  {m.type === 'image' ? (
                    <img
                      src={m.preview ?? m.url}
                      alt="upload preview"
                      className="w-full aspect-square object-cover rounded border border-brand-border"
                    />
                  ) : (
                    <video
                      src={m.url}
                      className="w-full rounded border border-brand-border"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(m.url)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full bg-brand-green text-black font-bold py-3 rounded hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={<p className="text-brand-muted text-center py-20">Loading…</p>}>
      <NewReviewForm />
    </Suspense>
  )
}
