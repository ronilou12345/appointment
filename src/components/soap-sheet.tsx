"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

export default function SOAPSheet() {
  const [subjective, setSubjective] = React.useState("")
  const [objective, setObjective] = React.useState("")
  const [assessment, setAssessment] = React.useState("")
  const [plan, setPlan] = React.useState("")

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" className="w-full sm:w-auto">
          Add SOAP
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="max-w-lg">
        <SheetHeader>
          <SheetTitle>Add SOAP Note</SheetTitle>
          <SheetDescription>
            Create a new SOAP entry for this appointment with subjective, objective, assessment, and plan details.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Subjective</label>
            <Textarea
              value={subjective}
              onChange={(event) => setSubjective(event.target.value)}
              rows={4}
              placeholder="Patient description of symptoms, history, and complaints."
              className="min-h-[120px]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Objective</label>
            <Textarea
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              rows={4}
              placeholder="Physical exam findings, vital signs, and observable data."
              className="min-h-[120px]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Assessment</label>
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
              placeholder="Treatment plan, follow-up, medications, and next steps."
              className="min-h-[120px]"
            />
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <SheetClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => console.log({ subjective, objective, assessment, plan })}
          >
            Add
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
