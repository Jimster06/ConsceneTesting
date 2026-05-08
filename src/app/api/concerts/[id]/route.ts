import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const concert = await prisma.concert.findUnique({
    where: { id: params.id },
    include: {
      artist: true,
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          media: true,
          _count: { select: { likes: true } },
        },
      },
    },
  })

  if (!concert) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const avgRating =
    concert.reviews.length
      ? concert.reviews.reduce((s, r) => s + r.rating, 0) / concert.reviews.length
      : null

  return NextResponse.json({ ...concert, avgRating })
}
