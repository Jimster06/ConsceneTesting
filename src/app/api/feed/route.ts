import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      concert: {
        include: { artist: { select: { id: true, name: true, slug: true } } },
      },
      media: true,
      _count: { select: { likes: true } },
    },
  })

  return NextResponse.json(reviews)
}
