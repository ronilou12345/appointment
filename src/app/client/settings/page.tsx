import { redirect } from "next/navigation"

import { AccountSettingsForm } from "@/components/account-settings-form"
import { getSession } from "@/lib/auth-utils"

export default async function ClientSettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

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
            avatar: session.profile_image ?? undefined,
          }}
          redirectPath="/client/settings"
          title="Client account settings"
          description="Manage your personal details and account preferences."
        />
      </div>
    </div>
  )
}
