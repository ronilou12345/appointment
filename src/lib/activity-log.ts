import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"

export type ActivityLogRow = {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  action: string
  details: string
  entityType: string
  entityId: string
  createdAt: string
}

type ActivityActor = {
  id?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
}

let tableReady = false

async function ensureActivityLogTable() {
  if (tableReady) return

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.activity_log (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_email TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      details TEXT,
      entity_type TEXT,
      entity_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS activity_log_created_at_idx
    ON public.activity_log (created_at DESC)
  `)

  tableReady = true
}

export function formatActivityRole(role?: string | null) {
  const normalized = normalizeUserRole(role)
  if (normalized === "ADMIN") return "Admin"
  if (normalized === "DOCTOR") return "Doctor"
  return "Client"
}

export async function logActivity(input: {
  userId?: string | null
  actor?: ActivityActor | null
  action: string
  details?: string | null
  entityType?: string | null
  entityId?: string | number | null
}) {
  try {
    await ensureActivityLogTable()

    let userId = String(input.actor?.id ?? input.userId ?? "").trim()
    let userName = String(input.actor?.name ?? "").trim()
    let userEmail = String(input.actor?.email ?? "").trim()
    let userRole = String(input.actor?.role ?? "").trim()

    if (userId && (!userName || !userEmail || !userRole)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      })

      if (user) {
        userId = user.id
        userName = userName || user.name
        userEmail = userEmail || user.email
        userRole = userRole || String(user.role ?? "")
      }
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO public.activity_log
        (user_id, user_name, user_email, user_role, action, details, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      userId || null,
      userName || "Unknown user",
      userEmail || null,
      userRole || null,
      input.action,
      input.details?.trim() || null,
      input.entityType || null,
      input.entityId != null ? String(input.entityId) : null,
    )
  } catch (error) {
    console.error("Activity log failed:", error)
  }
}

export async function logCurrentUserActivity(
  action: string,
  details?: string | null,
  entity?: { type?: string; id?: string | number | null },
) {
  const session = await getSession()
  await logActivity({
    actor: session,
    action,
    details,
    entityType: entity?.type,
    entityId: entity?.id,
  })
}

export async function getActivityLogs(limit = 500): Promise<ActivityLogRow[]> {
  try {
    await ensureActivityLogTable()

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: number | string
      user_id: string | null
      user_name: string | null
      user_email: string | null
      user_role: string | null
      action: string | null
      details: string | null
      entity_type: string | null
      entity_id: string | null
      created_at: Date | string | null
    }>>(
      `SELECT id, user_id, user_name, user_email, user_role, action, details, entity_type, entity_id, created_at
       FROM public.activity_log
       ORDER BY created_at DESC
       LIMIT $1`,
      Math.min(Math.max(limit, 1), 1000),
    )

    return rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id ?? ""),
      userName: String(row.user_name ?? "Unknown user"),
      userEmail: String(row.user_email ?? ""),
      role: formatActivityRole(row.user_role),
      action: String(row.action ?? ""),
      details: String(row.details ?? ""),
      entityType: String(row.entity_type ?? ""),
      entityId: String(row.entity_id ?? ""),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Unable to load activity logs:", error)
    return []
  }
}
