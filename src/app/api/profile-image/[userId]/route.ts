import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { parseImageDataUrl } from "@/lib/profile-image"

const extToMime: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile_image: true },
    })

    const stored = user?.profile_image?.trim()

    if (!stored) {
      return new NextResponse(null, { status: 404 })
    }

    if (!stored.startsWith("data:image/")) {
      return new NextResponse(null, { status: 307, headers: { Location: stored } })
    }

    const parsed = parseImageDataUrl(stored)
    if (!parsed) {
      return new NextResponse(null, { status: 404 })
    }

    return new NextResponse(new Uint8Array(parsed.buffer), {
      headers: {
        "Content-Type": extToMime[parsed.ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
