import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for generation status (use database in production)
const generationStatus = {}

export async function GET(request, { params }) {
  const { id } = params

  if (!id) {
    return NextResponse.json(
      { error: 'Generation ID is required' },
      { status: 400 }
    )
  }

  const status = generationStatus[id] || {
    id,
    status: 'not_found',
    message: 'Generation not found'
  }

  return NextResponse.json(status)
}

export async function POST(request, { params }) {
  const { id } = params
  const body = await request.json()

  generationStatus[id] = {
    id,
    status: body.status || 'generating',
    message: body.message || 'Processing...',
    progress: body.progress,
    updatedAt: new Date().toISOString()
  }

  return NextResponse.json({ success: true })
}