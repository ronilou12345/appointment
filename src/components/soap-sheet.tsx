"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PenLine } from "lucide-react"

type SOAPNote = {
  id: string | number
  chief_complaints: string
  physical_examination: string | null
  diagnosis: string
  prescription: string | null
  next_follow_up: string | null
}

type SOAPSheetProps = {
  appointmentId?: number | string
  mode?: "full" | "add" | "row-edit"
  note?: SOAPNote
}

export default function SOAPSheet({ appointmentId, mode = "full", note }: SOAPSheetProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [prefill, setPrefill] = React.useState(false)
  const [subjective, setSubjective] = React.useState("")
  const [objective, setObjective] = React.useState("")
  const [assessment, setAssessment] = React.useState("")
  const [plan, setPlan] = React.useState("")
  const [nextFollowUp, setNextFollowUp] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const openNoteForEditing = (n: SOAPNote) => {
    setSubjective(n.chief_complaints || "")
    setObjective(n.physical_examination || "")
    setAssessment(n.diagnosis || "")
    setPlan(n.prescription || "")
    setNextFollowUp(n.next_follow_up || "")
    setEditingId(Number(n.id))
    setPrefill(true)
    setOpen(true)
  }

  const resetForm = () => {
    setSubjective("")
    setObjective("")
    setAssessment("")
    setPlan("")
    setNextFollowUp("")
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!appointmentId) {
      toast.error("Appointment is not available for this SOAP note.")
      return
    }

    if (!subjective.trim() || !assessment.trim()) {
      toast.error("Chief complaints and diagnosis are required.")
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        appointmentId: Number(appointmentId),
        chiefComplaints: subjective.trim(),
        physicalExamination: objective.trim() || null,
        diagnosis: assessment.trim(),
        prescription: plan.trim() || null,
        nextFollowUp: nextFollowUp.trim() || null,
      }

      let response
      if (editingId) {
        response = await fetch("/api/soap-notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
      } else {
        response = await fetch("/api/soap-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save SOAP note")
      }

      toast.success(editingId ? "SOAP note updated" : "SOAP note saved successfully")
      resetForm()
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save SOAP note")
    } finally {
      setIsSaving(false)
    }
  }

  // Fetching for Edit is handled directly in the Edit button click handler

  return (
    <Sheet open={open} onOpenChange={(v) => {
      setOpen(v)
      if (!v) {
        setPrefill(false)
        resetForm()
      }
    }}>
      <div className="flex items-center gap-2">
        {mode === "full" ? (
          <Button
            variant="outline"
            className="hidden sm:inline-flex"
            onClick={async () => {
              if (!appointmentId) {
                toast.error("No appointment selected")
                return
              }
              try {
                const res = await fetch(`/api/soap-notes?appointmentId=${encodeURIComponent(String(appointmentId))}`)
                const data = await res.json()
                if (!res.ok || !data.success) {
                  toast.error(data?.error || "Unable to load SOAP note")
                  return
                }
                if (!data.note) {
                  toast.error("No existing SOAP note to edit")
                  return
                }
                openNoteForEditing(data.note)
              } catch {
                toast.error("Unable to load SOAP note")
              }
            }}
          >
            Edit SOAP
          </Button>
        ) : null}
        {mode === "row-edit" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open SOAP note actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!note}
                onSelect={() => {
                  if (note) openNoteForEditing(note)
                }}
              >
                <PenLine className="mr-2 h-4 w-4" />
                Edit SOAP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {mode !== "row-edit" ? (
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              resetForm()
              setPrefill(false)
              setOpen(true)
            }}
          >
            Add SOAP
          </Button>
        ) : null}
      </div>
      <SheetContent side="right" className="max-w-lg">
        <SheetHeader>
          <SheetTitle>{prefill || editingId ? "Edit SOAP Note" : "Add SOAP Note"}</SheetTitle>
          <SheetDescription>
            {prefill || editingId
              ? "Edit the existing SOAP entry for this appointment. Update subjective, objective, assessment, and plan details. "
              : "Create a new SOAP entry for this appointment with subjective, objective, assessment, and plan details."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Subjective (Chief Complaints)</label>
            <Textarea
              value={subjective}
              onChange={(event) => setSubjective(event.target.value)}
              rows={4}
              placeholder="Patient description of symptoms, history, and complaints."
              className="min-h-[120px]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Objective (Physical Examination)</label>
            <Textarea
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              rows={4}
              placeholder="Physical exam findings, vital signs, and observable data."
              className="min-h-[120px]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Assessment (Diagnosis)</label>
            <Textarea
              value={assessment}
              onChange={(event) => setAssessment(event.target.value)}
              rows={4}
              placeholder="Clinical impressions, diagnoses, and differential considerations."
              className="min-h-[120px]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Plan</label>
            <Textarea
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              rows={4}
              placeholder="Treatment plan, medications, and next steps."
              className="min-h-[120px]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Prescription</label>
            <Textarea
              value={nextFollowUp}
              onChange={(event) => setNextFollowUp(event.target.value)}
              rows={3}
              placeholder="Suggested date, timing, or instructions for the next follow-up."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <SheetClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </SheetClose>
          <Button type="button" className="w-full sm:w-auto" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (editingId ? "Saving..." : "Saving...") : editingId ? "Save" : "Add"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
