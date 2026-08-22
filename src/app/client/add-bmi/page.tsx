"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AddVitalsDialog } from "@/components/add-vitals-dialog"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlusIcon } from "lucide-react"
import { getVitalColumns, type VitalRow } from "./columns"

function computeBmi(weight: number | null, height: number | null) {
  if (!weight || !height || weight <= 0 || height <= 0) return null
  const heightM = height / 100
  return Math.round((weight / (heightM * heightM)) * 10) / 10
}

export default function AddBmiPage() {
  const [rows, setRows] = useState<VitalRow[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVital, setEditVital] = useState<VitalRow | null>(null)
  const [deleteVital, setDeleteVital] = useState<VitalRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const fetchRows = async () => {
    try {
      const res = await fetch("/api/vital-signs")
      const json = await res.json()
      if (res.ok && json?.success) {
        const data = Array.isArray(json.data) ? json.data : []
        const mapped = data.map((r: any) => ({
          id: String(r.id ?? ""),
          date: r.created_at ? new Date(r.created_at).toLocaleString() : "",
          weight: r.weight ?? null,
          height: r.height ?? null,
          bmi: computeBmi(r.weight ?? null, r.height ?? null),
          heartRate: r.heart_rate ?? null,
          temp: r.body_temperature ?? null,
          bloodSugar: r.blood_sugar ?? null,
        }))
        setRows(mapped.filter((row: VitalRow) => row.id))
      }
    } catch {
      // ignore
    }
  }

  React.useEffect(() => {
    fetchRows()
  }, [])

  const columns = useMemo(
    () =>
      getVitalColumns({
        onEdit: (row) => {
          setEditVital(row)
          setDialogOpen(true)
        },
        onDelete: (row) => setDeleteVital(row),
      }),
    [],
  )

  const handleConfirmDelete = async () => {
    if (!deleteVital) return
    setDeleting(true)
    try {
      const res = await fetch("/api/vital-signs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(deleteVital.id) }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || "Unable to delete vitals")

      toast.success("Vitals deleted")
      setDeleteVital(null)
      await fetchRows()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete vitals")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vitals History</h3>
        <Button
          size="sm"
          className="shadow-md shadow-primary/20"
          onClick={() => {
            setEditVital(null)
            setDialogOpen(true)
          }}
        >
          <PlusIcon className="size-4 mr-2" />
          Add
        </Button>
      </div>

      <AddVitalsDialog
        open={dialogOpen}
        showTrigger={false}
        vital={editVital}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditVital(null)
        }}
        onSaved={async () => {
          await fetchRows()
          router.refresh()
        }}
      />

      <DataTable columns={columns} data={rows} />

      <Dialog open={Boolean(deleteVital)} onOpenChange={(open) => { if (!open) setDeleteVital(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete vitals</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vitals record{deleteVital?.date ? ` from ${deleteVital.date}` : ""}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVital(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
