"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ClientAddressRequirement({
  required,
  children,
}: {
  required: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const onSettingsPage = pathname === "/client/settings" || pathname.startsWith("/client/settings/")
  const dialogOpen = required && !onSettingsPage

  return (
    <>
      {children}
      <Dialog open={dialogOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add your address</DialogTitle>
            <DialogDescription>
              Your account was created with Google and does not have an address yet. Add your address in Settings before continuing to other client pages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push("/client/settings#address")}>Go to Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
