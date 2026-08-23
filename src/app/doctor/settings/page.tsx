import { redirect } from "next/navigation"

import { AccountSettingsForm } from "@/components/account-settings-form"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { resolveProfileAvatar } from "@/lib/profile-image"

function parseList(value?: string | null) {
  if (!value) return ""

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean).join(", ")
    }
  } catch {
    // fall through
  }

  return value
}

export default async function DoctorSettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const [doctor, user] = await Promise.all([
    prisma.doctor.findUnique({
      where: { user_id: session.id },
      select: {
        prefix: true,
        suffix: true,
        address: true,
        credentials: true,
        license_number: true,
        years_of_experience: true,
        board_certification: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        designations: true,
        profile_image: true,
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Account</p>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Update your profile information and account details from here.
          </p>
        </div>

        <AccountSettingsForm
          user={{
            id: session.id,
            name: session.name,
            email: session.email,
            role: session.role,
            status: session.status,
            avatar: resolveProfileAvatar(session.id, user?.profile_image ?? session.profile_image),
          }}
          doctorBackground={
            doctor
              ? {
                  prefix: doctor.prefix ?? "",
                  suffix: doctor.suffix ?? "",
                  address: doctor.address ?? "",
                  credentials: doctor.credentials ?? "",
                  licenseNumber: doctor.license_number ?? "",
                  yearsOfExperience: doctor.years_of_experience != null ? String(doctor.years_of_experience) : "",
                  boardCertifications: parseList(doctor.board_certification),
                  specialties: parseList(user?.designations),
                }
              : undefined
          }
          redirectPath="/doctor/settings"
          title="Doctor account settings"
          description="Manage your personal details and account preferences."
        />
      </div>
    </div>
  )
}
