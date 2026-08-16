import { mkdir, writeFile } from "fs/promises"
import path from "path"
import prisma from "@/lib/prisma"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const mimeToExt: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
}

export function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/)
  if (!match) return null

  const mimeType = match[1].toLowerCase()
  const ext = mimeToExt[mimeType]
  if (!ext) return null

  const buffer = Buffer.from(match[2], "base64")
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null

  return { buffer, ext }
}

export async function saveProfileImageFile(userId: string, dataUrl: string) {
  const parsed = parseImageDataUrl(dataUrl)
  if (!parsed) {
    throw new Error("Please upload a JPG, PNG, WEBP, or GIF image under 2MB.")
  }

  try {
    const filename = `${userId}${parsed.ext}`
    const directory = path.join(process.cwd(), "public", "uploads", "profiles")
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, filename), parsed.buffer)
    return `/uploads/profiles/${filename}`
  } catch (error) {
    if (error instanceof Error && ("code" in error ? String((error as NodeJS.ErrnoException).code) === "EROFS" : false)) {
      console.warn("Profile image write fallback: filesystem is read-only. Storing the uploaded image as a data URL instead.")
      return dataUrl
    }

    throw error
  }
}

export async function updateUserProfileImage(userId: string, imageUrl: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { profile_image: imageUrl },
  })
}
