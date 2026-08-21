import { getReportsData } from "@/lib/reports-data"
import { ReportsClient } from "./reports-client"

export default async function Page() {
  const data = await getReportsData()
  return <ReportsClient data={data} />
}
