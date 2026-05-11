'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { StarRating } from './StarRating'

interface ReviewMedia {
  id: string
  url: string
  type: string
}

interface Comment {
  id: string
  body: string
  createdAt: string
  user: { id: string; username: string; avatar?: string | null }
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
    _count: { likes: number; comments: number }
  }
  showConcert?: boolean
}

export function ReviewCard({ review, showConcert = true }: ReviewCardProps) {
  const { data: session } = useSession()
  const [likes, setLikes] = useState(review._count.likes)
  const [liked, setLiked] = useState(false)
  const [lightbox, setLightbox] = useState<ReviewMedia | null>(null)

  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(review._count.comments)
  const [commentsFetched, setCommentsFetched] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLike = async () => {
    if (!session) return
    const res = await fetch(`/api/reviews/${review.id}/like`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setLiked(data.liked)
      setLikes((l) => l + (data.liked ? 1 : -1))
    }
  }

  const toggleComments = async () => {
    if (!showComments && !commentsFetched) {
      const res = await fetch(`/api/reviews/${review.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
        setCommentsFetched(true)
      }
    }
    setShowComments((v) => !v)
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    const res = await fetch(`/api/reviews/${review.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments((c) => [...c, comment])
      setCommentCount((n) => n + 1)
      setNewComment('')
    }
    setSubmitting(false)
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
                  <img src={m.url} alt="concert photo" className="w-full h-full object-cover" />
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
        <div className="flex items-center gap-4 pt-1 border-t border-brand-border text-xs text-brand-muted">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 hover:text-white transition-colors ${liked ? 'text-brand-green' : ''}`}
          >
            ♥ {likes}
          </button>
          <button
            onClick={toggleComments}
            className={`flex items-center gap-1 hover:text-white transition-colors ${showComments ? 'text-white' : ''}`}
          >
            💬 {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="space-y-3 pt-1">
            {comments.length === 0 && commentsFetched && (
              <p className="text-brand-muted text-xs">No comments yet. Be the first!</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm">
                <span className="font-semibold text-white shrink-0">{c.user.username}</span>
                <span className="text-brand-text">{c.body}</span>
                <span className="text-brand-muted text-xs ml-auto shrink-0 self-start">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}

            {session ? (
              <form onSubmit={submitComment} className="flex gap-2 pt-1">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 bg-brand-darker border border-brand-border rounded px-3 py-1.5 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="bg-brand-green text-black font-semibold px-3 py-1.5 rounded text-sm hover:bg-green-400 transition-colors disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            ) : (
              <p className="text-brand-muted text-xs">
                <Link href="/auth/signin" className="text-brand-green hover:underline">Sign in</Link> to comment.
              </p>
            )}
          </div>
        )}
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
