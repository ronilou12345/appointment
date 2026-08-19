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

function sniffImageMime(buffer: Buffer, reported: string) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png"
  }
  if (buffer.length >= 6 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif"
  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42) {
    return "image/webp"
  }
  if (mimeToExt[reported]) return reported
  return "image/jpeg"
}

function enlargeGooglePhotoUrl(imageUrl: string) {
  const source = imageUrl.trim()
  if (!source.includes("googleusercontent.com")) return source

  if (/=s\d+/.test(source)) {
    return source.replace(/=s\d+(-c)?/, "=s256$1")
  }

  return `${source}=s256-c`
}

export async function saveRemoteProfileImage(userId: string, imageUrl: string) {
  const source = enlargeGooglePhotoUrl(imageUrl)
  if (!source.startsWith("https://")) return ""

  try {
    const response = await fetch(source, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; C2MClinic/1.0)",
      },
    })

    if (!response.ok) return ""

    const reported = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase()
    const buffer = Buffer.from(await response.arrayBuffer())
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return ""

    const mimeType = sniffImageMime(buffer, reported)
    if (!mimeToExt[mimeType]) return ""

    return await saveProfileImageFile(userId, `data:${mimeType};base64,${buffer.toString("base64")}`)
  } catch (error) {
    console.warn("Could not download Google profile photo:", error)
    return ""
  }
}

export function isRemoteProfileImage(stored: string | null | undefined) {
  const value = stored?.trim() ?? ""
  return !value || /^https?:\/\//i.test(value)
}

export function resolveProfileAvatar(userId: string, stored: string | null | undefined) {
  const value = stored?.trim() ?? ""
  if (!value) return ""
  if (value.startsWith("data:image/") || /^https?:\/\//i.test(value)) {
    return `/api/profile-image/${userId}`
  }
  return value
}

export async function updateUserProfileImage(userId: string, imageUrl: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { profile_image: imageUrl },
  })
}
