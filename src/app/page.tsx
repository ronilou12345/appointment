"use client"

import * as React from "react"
import Link from "next/link"
import {
  Triangle,
  Rocket,
  ShieldCheck,
  Zap,
  Headset,
  Moon,
  Sun,
  ChevronRight,
  Menu,
  X,
  Paintbrush,
  ActivityIcon,
  Stethoscope,
  HeartPulse,
  Monitor,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ThemeCustomizer } from "@/components/theme-customizer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LandingPage() {
  const { theme: activeTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const theme = mounted ? activeTheme || "system" : "system"

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground transition-colors duration-500">
      {/* Background Patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] size-[40%] rounded-full border border-muted/50" />
        <div className="absolute top-[20%] right-[-5%] size-[30%] rounded-full border border-muted/30" />
        <div className="absolute bottom-[-15%] left-[15%] size-[45%] rounded-full border border-muted/40" />

        <div className="absolute top-20 left-20 size-8 rotate-45 border border-muted/60" />
        <div className="absolute top-1/4 right-32 size-12 rotate-12 border border-muted/40" />
        <div className="absolute bottom-40 left-1/3 size-16 rotate-[30deg] border border-muted/50" />
        <div className="absolute top-1/2 left-10 size-6 rounded-full bg-muted/20" />
        <div className="absolute bottom-1/4 right-20 size-10 rounded-full border border-muted/40" />

        <div className="absolute top-0 left-1/2 h-full w-px bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-muted/20 to-transparent" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Triangle className="size-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-black">C2M Family Clinic & Pharmacy</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#home" className="text-sm font-medium transition-colors hover:text-primary">Home</Link>
            <Link href="#about" className="text-sm font-medium transition-colors hover:text-primary">About</Link>
            <Link href="#contact" className="text-sm font-medium transition-colors hover:text-primary">Contact</Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 rounded-full">
                    <Paintbrush className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-6" align="end" sideOffset={8}>
                  <div className="mb-4 space-y-1">
                    <h4 className="font-semibold leading-none text-lg">Customize</h4>
                    <p className="text-sm text-muted-foreground">
                      Pick a style and color for your components.
                    </p>
                  </div>
                  <ThemeCustomizer />
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="size-8 rounded-full"
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
                  ) : (
                    <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
                  )
                ) : (
                  <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
            <Link href="/login">
              <Button size="sm" className="rounded-full px-5">
                <Rocket className="mr-2 size-4" />
                Dashboard Access
              </Button>
            </Link>
          </nav>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full border-b bg-background p-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link href="#home" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="#about" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link href="#contact" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Paintbrush className="mr-2 size-4" />
                        Palette
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 p-6" align="center" sideOffset={8}>
                      <ThemeCustomizer />
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-full"
                  >
                    {mounted ? (
                      theme === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />
                    ) : (
                      <Monitor className="mr-2 size-4" />
                    )}
                    {mounted ? (theme === "dark" ? "Light" : "Dark") : "Theme"}
                  </Button>
                </div>
                <Link href="/login">
                  <Button size="sm" className="rounded-full">
                    <Rocket className="mr-2 size-4" />
                    Dashboard Access
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main id="home" className="relative z-10 container mx-auto flex flex-col items-center justify-center px-4 pt-20 pb-20 text-center lg:pt-32 lg:pb-32">
        <Badge variant="secondary" className="mb-8 rounded-full py-1.5 px-4 text-xs font-medium tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <ActivityIcon className="mr-2 size-3 text-primary opacity-90" />
          C2M Family Clinic & Pharmacy
        </Badge>

        <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-7xl lg:text-8xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          Streamline healthcare with an <span className="bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">Intelligent C2M Clinic System</span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:text-2xl animate-in fade-in slide-in-from-bottom-12 duration-500">
          Revolutionizing patient care with a fast, deeply secure, and highly intuitive <span className="font-semibold text-foreground">patient and staff management</span> network.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-16 duration-300">
          <Link href="/login">
            <Button size="lg" className="h-14 rounded-full px-10 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30 active:scale-95">
              <Rocket className="mr-2 size-6" />
              Sign In To Dashboard
            </Button>
          </Link>
          <Link href="#about">
            <Button size="lg" variant="outline" className="h-14 rounded-full px-10 text-lg font-bold transition-all hover:bg-accent hover:text-accent-foreground active:scale-95">
              Learn More
              <ChevronRight className="ml-2 size-5" />
            </Button>
          </Link>
        </div>

        {/* Feature Highlights display */}
        <div className="mt-24 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8 lg:mt-32 w-full max-w-4xl opacity-0 animate-in fade-in fill-mode-forwards duration-1000 delay-500">
          <div className="flex flex-col items-center gap-4 group">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50 transition-colors group-hover:bg-primary/10">
              <ShieldCheck className="size-6 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <span className="text-base font-bold text-foreground">Enterprise Security</span>
          </div>
          <div className="flex flex-col items-center gap-4 group">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50 transition-colors group-hover:bg-primary/10">
              <Stethoscope className="size-6 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <span className="text-base font-bold text-foreground">Complete Patient Records</span>
          </div>
          <div className="flex flex-col items-center gap-4 group">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50 transition-colors group-hover:bg-primary/10">
              <HeartPulse className="size-6 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <span className="text-base font-bold text-foreground">Role-based Access</span>
          </div>
        </div>
      </main>

      {/* About Section */}
      <section id="about" className="relative z-10 py-24 bg-muted/20 border-y">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground mb-4">About PMIS</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our Patient Management Information System is designed to alleviate the administrative burdens of healthcare professionals, giving them more time to focus on what matters most: patient care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <ActivityIcon className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Real-Time Dashboards</h3>
                  <p className="text-muted-foreground leading-relaxed mt-1">Nurses, Doctors, and Staff get their own specialized toolsets and metrics at a glance, allowing efficient triage and workflow.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <ShieldCheck className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Encrypted Patient Data</h3>
                  <p className="text-muted-foreground leading-relaxed mt-1">Medical records, billing information, and user authentications are heavily secured ensuring top-tier compliance and safety.</p>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl border bg-background/50 backdrop-blur-sm p-8 shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Triangle className="size-32" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                We believe that modern healthcare deserves modern technology. PMIS bridges the gap between chaotic filing systems and beautiful interactive workspaces. We strive to bring simplicity and speed to clinics and hospitals worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground mb-4">Get In Touch</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Have questions about integrating PMIS into your facility? Our support team is available around the clock.
          </p>

          <div className="grid sm:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <Headset className="size-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Technical Support</h3>
              <p className="text-sm text-muted-foreground mb-4">Stuck on something? Let us help you out.</p>
              <Button variant="outline" className="mt-auto">support@pmis.com</Button>
            </div>
            <div className="flex flex-col text-left p-8 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <h3 className="font-semibold text-xl mb-6">Drop us a line</h3>
              <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-xs font-medium">Name</label>
                  <Input id="name" placeholder="John Doe" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="emailMessage" className="text-xs font-medium">Email</label>
                  <Input id="emailMessage" type="email" placeholder="john@hospital.org" />
                </div>
                <Button className="mt-2" type="submit">Send Message</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t bg-muted/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row">
          <div className="flex items-center gap-2 opacity-60">
            <Triangle className="size-4 fill-current text-foreground" />
            <span className="text-sm font-bold tracking-tight text-foreground">C2M Network</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 C2M Clinic System  All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
