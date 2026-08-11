"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AddVitalsDialog } from "@/components/add-vitals-dialog"
import { DataTable } from "@/components/data-table"

export default function AddBmiPage() {
  const [rows, setRows] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  const fetchRows = async () => {
    try {
      const res = await fetch('/api/vital-signs')
      const json = await res.json()
      if (res.ok && json?.success) {
        const data = Array.isArray(json.data) ? json.data : []
        const mapped = data.map((r: any) => ({
          id: String(r.id ?? Math.random()),
          date: r.created_at ? new Date(r.created_at).toLocaleString() : '',
          weight: r.weight ?? '',
          height: r.height ?? '',
          bmi: r.weight && r.height ? Math.round((r.weight / ((r.height/100)*(r.height/100))) * 10) / 10 : '',
          heartRate: r.heart_rate ?? '',
          temp: r.body_temperature ?? '',
        }))
        setRows(mapped)
      }
    } catch {
      // ignore
    }
  }

  React.useEffect(() => {
    fetchRows()
  }, [])

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Vitals History</h3>
            <AddVitalsDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={async () => { await fetchRows(); router.refresh() }} />
          </div>

          <DataTable data={rows} />
        </div>
      </div>
    </div>
  )
}
