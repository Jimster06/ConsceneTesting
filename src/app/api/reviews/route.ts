import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const concertId = searchParams.get('concertId') ?? undefined
  const userId = searchParams.get('userId') ?? undefined

  const reviews = await prisma.review.findMany({
    where: {
      ...(concertId ? { concertId } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      concert: {
        include: { artist: { select: { name: true, slug: true } } },
      },
      media: true,
      _count: { select: { likes: true } },
    },
  })

  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { concertId, rating, body, mediaUrls } = await req.json()

    if (!concertId || !rating) {
      return NextResponse.json({ error: 'concertId and rating are required' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        concertId,
        rating: Number(rating),
        body,
        media: {
          create: (mediaUrls ?? []).map((item: { url: string; type: string }) => ({
            url: item.url,
            type: item.type,
          })),
        },
      },
      include: {
        user: { select: { id: true, username: true } },
        media: true,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
