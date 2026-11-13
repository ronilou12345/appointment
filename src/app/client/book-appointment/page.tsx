import { BookAppointmentContent } from "@/app/admin/client/book-appointment/content"
import { getSession } from "@/lib/auth-utils"

export default async function Page() {
  const session = await getSession()

  return <BookAppointmentContent currentUserName={session?.name ?? ""} />
}
