import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { reviewId: params.id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, username: true, avatar: true } } },
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { body } = await req.json()
  if (!body?.trim()) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: { reviewId: params.id, userId: session.user.id, body: body.trim() },
    include: { user: { select: { id: true, username: true, avatar: true } } },
  })

  return NextResponse.json(comment)
}
