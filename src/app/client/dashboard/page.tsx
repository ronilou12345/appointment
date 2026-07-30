import { PatientDashboard } from "@/components/patient-dashboard"
import { getUserByRole } from "@/lib/user-role"

export default function ClientDashboardPage() {
  return <PatientDashboard user={getUserByRole("CLIENT")} />
}
