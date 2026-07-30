export default function Page() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">Reports</h1>
          <p className="mt-2 text-muted-foreground">
            View and analyze reports on appointments, doctors, and facility performance.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Report Categories */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-background p-6 hover:bg-background/80 cursor-pointer transition">
              <h3 className="font-semibold">Appointment Reports</h3>
              <p className="text-sm text-muted-foreground mt-1">View appointment statistics and trends</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-6 hover:bg-background/80 cursor-pointer transition">
              <h3 className="font-semibold">Doctor Performance</h3>
              <p className="text-sm text-muted-foreground mt-1">Analyze doctor availability and ratings</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-6 hover:bg-background/80 cursor-pointer transition">
              <h3 className="font-semibold">Patient Analytics</h3>
              <p className="text-sm text-muted-foreground mt-1">Track patient demographics and trends</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-6 hover:bg-background/80 cursor-pointer transition">
              <h3 className="font-semibold">Financial Reports</h3>
              <p className="text-sm text-muted-foreground mt-1">Review billing and payment information</p>
            </div>
          </div>

          {/* Content coming soon */}
          <div className="rounded-lg border border-dashed border-border p-8 text-center mt-4">
            <p className="text-muted-foreground">Detailed report analytics coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
