const PLACEHOLDER_AVATARS = [
  "/avatars/shadcn.jpg",
  "/avatars/admin.jpg",
  "/avatars/client.jpg",
  "/avatars/doctor.jpg",
]

export function getNameInitials(name: string) {
  const parts = name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "U"
  if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase()

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function hasProfileImage(avatar?: string | null) {
  const value = avatar?.trim() ?? ""
  if (!value) return false
  return !PLACEHOLDER_AVATARS.some((placeholder) => value.includes(placeholder))
}
