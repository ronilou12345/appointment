import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserProfileAction } from "@/lib/actions/user"

interface AccountSettingsFormProps {
  user: {
    id: string
    name: string
    email: string
    role?: string | null
    status?: string | null
    designations?: string | null
  }
  redirectPath: string
  title: string
  description: string
}

export function AccountSettingsForm({ user, redirectPath, title, description }: AccountSettingsFormProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateUserProfileAction} className="space-y-6">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" placeholder="Leave blank to keep current password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designations">Designations</Label>
              <Input id="designations" name="designations" defaultValue={user.designations ?? ""} />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Role:</span> {user.role ?? "USER"}</p>
            <p><span className="font-medium text-foreground">Status:</span> {user.status ?? "ACTIVE"}</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
