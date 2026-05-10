import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const artist = await prisma.artist.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    include: {
      concerts: {
        orderBy: { date: 'desc' },
        include: { _count: { select: { reviews: true } } },
      },
    },
  })

  if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(artist)
}
