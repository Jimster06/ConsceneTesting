'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { StarRating } from './StarRating'

interface ReviewMedia {
  id: string
  url: string
  type: string
}

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    body?: string | null
    createdAt: string
    user: { id: string; username: string; avatar?: string | null }
    concert: {
      id: string
      title: string
      artist: { name: string; slug: string }
      venue: string
      city: string
      date: string
    }
    media: ReviewMedia[]
    _count: { likes: number }
  }
  showConcert?: boolean
}

export function ReviewCard({ review, showConcert = true }: ReviewCardProps) {
  const { data: session } = useSession()
  const [likes, setLikes] = useState(review._count.likes)
  const [liked, setLiked] = useState(false)
  const [lightbox, setLightbox] = useState<ReviewMedia | null>(null)

  const handleLike = async () => {
    if (!session) return
    const res = await fetch(`/api/reviews/${review.id}/like`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setLiked(data.liked)
      setLikes((l) => l + (data.liked ? 1 : -1))
    }
  }

  return (
    <>
      <div className="bg-brand-card border border-brand-border rounded-lg p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{review.user.username}</span>
              <StarRating value={review.rating} size="sm" />
            </div>
            {showConcert && (
              <Link
                href={`/concerts/${review.concert.id}`}
                className="text-brand-text text-xs hover:text-white transition-colors"
              >
                {review.concert.artist.name} — {review.concert.title}
                <span className="text-brand-muted ml-1">
                  · {review.concert.city} · {new Date(review.concert.date).getFullYear()}
                </span>
              </Link>
            )}
          </div>
          <span className="text-brand-muted text-xs whitespace-nowrap">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Body */}
        {review.body && (
          <p className="text-sm text-brand-text leading-relaxed">{review.body}</p>
        )}

        {/* Media grid */}
        {review.media.length > 0 && (
          <div className="media-grid">
            {review.media.map((m) =>
              m.type === 'image' ? (
                <button
                  key={m.id}
                  onClick={() => setLightbox(m)}
                  className="aspect-square overflow-hidden rounded border border-brand-border hover:opacity-90 transition-opacity"
                >
                  <img
                    src={m.url}
                    alt="concert photo"
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <video
                  key={m.id}
                  src={m.url}
                  controls
                  className="w-full rounded border border-brand-border"
                />
              )
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1 border-t border-brand-border text-xs text-brand-muted">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 hover:text-white transition-colors ${liked ? 'text-brand-green' : ''}`}
          >
            ♥ {likes}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && lightbox.type === 'image' && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.url}
            alt="concert photo"
            className="max-h-screen max-w-full rounded object-contain"
          />
        </div>
      )}
    </>
  )
}
