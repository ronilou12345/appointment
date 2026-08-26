"use client"

import * as React from "react"
import Image from "next/image"
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
  Pill,
  Plus,
  CalendarDays,
  Syringe,
  Star,
  Facebook,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [contactEmail, setContactEmail] = React.useState("")
  const [contactMessage, setContactMessage] = React.useState("")
  const [contactStatus, setContactStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle")
  const [contactError, setContactError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setContactStatus("sending")
    setContactError(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contactEmail, message: contactMessage }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to send your message.")
      }

      setContactStatus("sent")
      setContactEmail("")
      setContactMessage("")
    } catch (error) {
      setContactStatus("error")
      setContactError(error instanceof Error ? error.message : String(error))
    }
  }

  const isDark = mounted ? resolvedTheme === "dark" : false

  const clientFeedback = [
    {
      name: "Maria Santos",
      role: "Patient, Sinacaban",
      avatar: "https://images.unsplash.com/photo-1573884084196-a3b5bdf87676?auto=format&fit=crop&w=256&h=256&q=80&crop=faces",
      quote: "Booking an appointment is so easy now. I can check my schedule, see my doctor, and get updates without waiting at the clinic all morning.",
    },
    {
      name: "Juan Dela Cruz",
      role: "Father of two",
      avatar: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=256&h=256&q=80&crop=faces",
      quote: "C2M takes care of our whole family. The doctors are kind, the pharmacy is ready, and we always know when our next visit is.",
    },
    {
      name: "Ana Reyes",
      role: "Regular patient",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&h=256&q=80&crop=faces",
      quote: "I love that I can view my records and prescriptions in one place. Follow-up care feels organized and I never miss an appointment.",
    },
    {
      name: "Carlos Mendoza",
      role: "Patient, Poblacion",
      avatar: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?auto=format&fit=crop&w=256&h=256&q=80&crop=faces",
      quote: "The staff treated me with respect from the first visit. Check-in was fast and my consultation started on time.",
    },
    {
      name: "Liza Navarro",
      role: "Mother",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80&crop=faces",
      quote: "Bringing my children here is stress-free. The clinic is clean, the doctors explain everything clearly, and the pharmacy has what we need.",
    },
    {
      name: "Roberto Villanueva",
      role: "Senior patient",
      avatar: "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=256&h=256&q=80&crop=faces",
      quote: "I appreciate the patient and careful care. They remind me of my visits and I feel looked after every time I come in.",
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground transition-colors duration-500">
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-primary/12 blur-3xl dark:bg-primary/10" />
        <div className="absolute top-[22%] -right-28 size-[24rem] rounded-full bg-primary/10 blur-3xl dark:bg-primary/8" />
        <div className="absolute bottom-[-12%] left-[20%] size-[26rem] rounded-full bg-muted/70 blur-3xl dark:bg-muted/30" />

        <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.18]" style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        <div className="absolute top-[-10%] left-[-10%] size-[40%] rounded-full border border-muted/50" />
        <div className="absolute top-[20%] right-[-5%] size-[30%] rounded-full border border-muted/30" />
        <div className="absolute bottom-[-15%] left-[15%] size-[45%] rounded-full border border-muted/40" />

        <div className="absolute top-20 left-20 size-8 rotate-45 border border-muted/60" />
        <div className="absolute top-1/4 right-32 size-12 rotate-12 border border-muted/40" />
        <div className="absolute bottom-40 left-1/3 size-16 rotate-[30deg] border border-muted/50" />
        <div className="absolute top-1/2 left-10 size-6 rounded-full bg-muted/20" />
        <div className="absolute bottom-1/4 right-20 size-10 rounded-full border border-muted/40" />

        <div className="absolute top-0 left-1/2 h-full w-px bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
        <div className="absolute top-1/3 left-0 h-px w-full bg-gradient-to-r from-transparent via-muted/20 to-transparent" />

        <Stethoscope className="landing-float absolute top-28 left-[7%] size-16 text-primary/20 dark:text-primary/25" />
        <HeartPulse className="landing-float-delayed absolute top-[16%] right-[8%] size-14 text-primary/20 dark:text-primary/25" />
        <ActivityIcon className="landing-float-delayed-2 absolute top-[48%] left-[5%] size-12 text-primary/15 dark:text-primary/20" />
        <Pill className="landing-float absolute top-[58%] right-[6%] size-12 rotate-12 text-primary/20 dark:text-primary/25" />
        <Plus className="landing-float-delayed absolute bottom-[22%] left-[12%] size-10 text-primary/20 dark:text-primary/25" />
        <CalendarDays className="landing-float-delayed-2 absolute bottom-[18%] right-[14%] size-12 text-primary/15 dark:text-primary/20" />
        <Syringe className="landing-float absolute top-[38%] right-[18%] size-11 -rotate-12 text-primary/15 dark:text-primary/20" />
        <ShieldCheck className="landing-float-delayed absolute bottom-[8%] left-[42%] size-14 text-primary/12 dark:text-primary/18" />
        <Plus className="landing-float-delayed-2 absolute top-[72%] left-[28%] size-7 text-primary/15" />
        <HeartPulse className="landing-float absolute bottom-[32%] right-[28%] size-8 text-primary/12" />
      </div>

      {/* Navbar */}
      <header className="relative sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="overflow-hidden rounded-lg bg-card">
              <Image src="/logo1.jpg" alt="C2M Family Clinic & Pharmacy logo" width={40} height={40} className="object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">C2M Family Clinic & Pharmacy</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#home" className="text-sm font-medium transition-colors hover:text-primary">Home</Link>
            <Link href="#about" className="text-sm font-medium transition-colors hover:text-primary">About</Link>
            <Link href="#feedback" className="text-sm font-medium transition-colors hover:text-primary">Feedback</Link>
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
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="size-8 rounded-full"
              >
                {mounted ? (
                  isDark ? (
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
              <Link href="#feedback" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Feedback</Link>
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
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="rounded-full"
                  >
                    {mounted ? (
                      isDark ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />
                    ) : (
                      <Monitor className="mr-2 size-4" />
                    )}
                    {mounted ? (isDark ? "Light" : "Dark") : "Theme"}
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
          Quality healthcare with <span className="bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">compassion and care.</span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:text-2xl animate-in fade-in slide-in-from-bottom-12 duration-500">
          Trusted <span className="font-semibold text-foreground">medical services</span> for the whole family
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
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground mb-4">About C2M Family Clinic & Pharmacy</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform is designed to ease the administrative load for healthcare professionals, giving them more time to focus on what matters most: patient care.
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
                  <p className="text-muted-foreground leading-relaxed mt-1">Nurses, Doctors, and administrators get their own specialized toolsets and metrics at a glance, allowing efficient triage and workflow.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <ShieldCheck className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Encrypted Patient Data</h3>
                  <p className="text-muted-foreground leading-relaxed mt-1">Medical records, prescriptions, and appointments are securely managed to support safe, efficient care.</p>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl border bg-background/50 backdrop-blur-sm p-8 shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Triangle className="size-32" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To provide accessible, affordable, compassionate quality healthcare that empowers patients and families to actively participate in their health and well-being. C2M Family Clinic aims to foster a strong partnership among the physician, patient, family and community, while building meaningful linkages to promote health, wellness, prevention and continuity of care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="relative z-10 py-24 bg-muted/10">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground mb-4">Location</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our location on the map. Use the directions map to find the best route to our clinic, and view the exact photo pin on the right.
            </p>
            <Link
              href="https://www.google.com/maps?q=Poblacion%2C+Sinacaban%2C+Misamis+Occidental"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full border border-border bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Open Map
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-5">
                <h3 className="text-xl font-semibold text-foreground">Map Directions</h3>
                <p className="mt-2 text-sm text-muted-foreground">Directions from your current location to our pinned clinic address.</p>
              </div>
              <iframe
                title="C2M Family Clinic & Pharmacy Map Direction"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3948.1693612303407!2d123.84010568979909!3d8.285937715533276!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x325501005ec34a43%3A0x3f9247a9eba5c855!2sC2M%20Family%20Clinic%20%26%20Pharmacy!5e0!3m2!1sen!2sph!4v1786025975089!5m2!1sen!2sph"
                className="h-96 w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-5">
                <h3 className="text-xl font-semibold text-foreground">Location</h3>
                <p className="mt-2 text-sm text-muted-foreground">Exact clinic location pinned on the map.</p>
              </div>
              <iframe
                title="Poblacion, Sinacaban, Misamis Occidental Map"
                src="https://www.google.com/maps/embed?pb=!4v1786025510623!6m8!1m7!1swmb7Op20cdqbM4sp1wKJag!2m2!1d8.28560839388068!2d123.8428480634417!3f40.26276063175551!4f-8.601137078695459!5f0.7820865974627469"
                className="h-96 w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ border: 0 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Client Feedback */}
      <section id="feedback" className="relative z-10 py-24">
        <div className="container mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What Our Clients <span className="text-primary">Say About Us</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Trusted by families in our community for compassionate care, clear communication, and reliable clinic services.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clientFeedback.map((item) => {
              const initials = item.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")

              return (
                <article
                  key={item.name}
                  className="flex flex-col rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={item.avatar} alt={item.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
                    “{item.quote}”
                  </p>
                  <div className="mt-5 flex items-center gap-1" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="size-4 fill-primary text-primary" />
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground mb-4">Get In Touch</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Have questions about integrating C2M Family Clinic & Pharmacy into your facility? Our support team is available around the clock.
          </p>

          <div className="grid sm:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <Headset className="size-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Technical Support</h3>
              <p className="text-sm text-muted-foreground mb-4">Stuck on something? Let us help you out.</p>
              <Button variant="outline" className="mt-auto">c2mfamilyclinicpharmacy@gmail.com</Button>
            </div>
            <div className="flex flex-col text-left p-8 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <h3 className="font-semibold text-xl mb-6">Drop us a line</h3>
              <form className="flex flex-col gap-4" onSubmit={handleContactSubmit}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-message" className="text-xs font-medium">Message</label>
                  <Textarea
                    id="contact-message"
                    placeholder="Write your message"
                    value={contactMessage}
                    onChange={(event) => setContactMessage(event.target.value)}
                    className="min-h-28"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="emailMessage" className="text-xs font-medium">Email</label>
                  <Input
                    id="emailMessage"
                    type="email"
                    placeholder="juandelacruz@hospital.org"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    required
                  />
                </div>
                {contactError ? <p className="text-sm text-destructive">{contactError}</p> : null}
                {contactStatus === "sent" ? (
                  <p className="text-sm text-emerald-600">Your message was sent. We will reply to your email.</p>
                ) : null}
                <Button className="mt-2" type="submit" disabled={contactStatus === "sending"}>
                  {contactStatus === "sending" ? "Sending..." : "Send Message"}
                </Button>
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
            <span className="text-sm font-bold tracking-tight text-foreground">C2M Family Clinic & Pharmacy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 C2M Clinic System  All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Link
                href="https://www.facebook.com/profile.php?id=61590264128141"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[#1877F2] hover:text-[#1877F2]"
              >
                <Facebook className="size-4" />
              </Link>
              <Link
                href="https://www.google.com/maps?q=C2M+Family+Clinic+%26+Pharmacy,+Poblacion,+Sinacaban"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Google"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4" aria-hidden>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </Link>
            </div>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
