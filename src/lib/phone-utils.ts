export function normalizePhilippineMobile(value: string | null | undefined): string | null {
  if (!value) return null

  const digits = String(value).replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('63') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 11) return `63${digits.slice(1)}`
  if (digits.length === 11 && digits.startsWith('9')) return `63${digits}`
  if (digits.length === 12 && digits.startsWith('63')) return digits

  return null
}

export function formatPhoneForDisplay(value: string | null | undefined): string {
  const normalized = normalizePhilippineMobile(value)
  if (!normalized) return value?.trim() || ''

  const local = normalized.slice(2)
  if (local.length === 10) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
  }

  return normalized
}
