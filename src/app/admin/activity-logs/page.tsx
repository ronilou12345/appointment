import { getActivityLogs } from "@/lib/activity-log"
import { ActivityLogTable } from "./activity-log-table"

export default async function ActivityLogPage() {
  const rows = await getActivityLogs()

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground">Activity Logs</h1>
        <p className="mt-2 text-muted-foreground">
          Track logins and actions from clients, doctors, and admins across the clinic. Use the Admin filter to review administrator activity.
        </p>
      </div>

      <ActivityLogTable rows={rows} />
    </div>
  )
}
