"use client"

import * as React from "react"
import Image from "next/image"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CalendarDays } from "lucide-react"

interface AppSidebarUser {
  name: string
  email: string
  avatar: string
  role?: "ADMIN" | "DOCTOR" | "CLIENT" | "STAFF" | "PATIENT"
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: AppSidebarUser
}

const adminNavMain = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: <ChartBarIcon />,
  },
  {
    title: "All Doctors",
    url: "/admin/all-doctors",
    icon: <UsersIcon />,
  },
  {
    title: "All Appointments",
    url: "/admin/all-appointments",
    icon: <ListIcon />,
  },
  {
    title: "Add Specialties",
    url: "/admin/add-specialties",
    icon: <Settings2Icon />,
  },
  {
    title: "Manage Users",
    url: "/admin/manage-users",
    icon: <LayoutDashboardIcon />,
  },
]

const doctorNavMain = [
  {
    title: "Dashboard",
    url: "/doctor/dashboard",
    icon: <ChartBarIcon />,
  },
  {
    title: "Add Session",
    url: "/doctor/add-session",
    icon: <Settings2Icon />,
  },
  {
    title: "My Appointments",
    url: "/doctor/appointments",
    icon: <ListIcon />,
  },
]

const settingsNavItems = [
  { title: "Settings", url: "/admin/settings", icon: <Settings2Icon /> },
  { title: "Settings", url: "/doctor/settings", icon: <Settings2Icon /> },
  { title: "Settings", url: "/client/settings", icon: <Settings2Icon /> },
]

const clientNavMain = [
  {
    title: "Dashboard",
    url: "/client/dashboard",
    icon: <ChartBarIcon />,
  },
  {
    title: "All Doctors",
    url: "/client/all-doctors",
    icon: <UsersIcon />,
  },
  {
    title: "Book Appointment",
    url: "/client/book-appointment",
    icon: <ListIcon />,
  },
  {
    title: "My Appointments",
    url: "/client/appointments",
    icon: <CalendarDays />,
  },
]

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
    role: "ADMIN" as const,
  },
  navMain: adminNavMain,
  navClouds: [
    {
      title: "Capture",
      icon: <CameraIcon />,
      isActive: true,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
    {
      title: "Proposal",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
    {
      title: "Prompts",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
  ],
  navSecondary: [
    { title: "Settings", url: "/admin/settings", icon: <Settings2Icon /> },
    { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  ],
  documents: [
    { name: "Medicine", url: "/admin/inventory", icon: <DatabaseIcon /> },
    { name: "Reports", url: "/admin/reports", icon: <FileChartColumnIcon /> },
  ],
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Determine navigation based on user role
  const navMain = user?.role === "DOCTOR" ? doctorNavMain : user?.role === "CLIENT" ? clientNavMain : adminNavMain
  const showDocuments = user?.role === "ADMIN" // Only show Inventory and Reports for admin users
  const secondaryItems = [
    {
      title: "Settings",
      url: user?.role === "DOCTOR" ? "/doctor/settings" : user?.role === "CLIENT" ? "/client/settings" : "/admin/settings",
      icon: <Settings2Icon />,
    },
    {
      title: user?.role === "CLIENT" ? "Add BMI" : "Get Help",
      url: user?.role === "CLIENT" ? "/client/add-bmi" : "#",
      icon: user?.role === "CLIENT" ? <ChartBarIcon /> : <CircleHelpIcon />,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <a href="#" title="Empowered Health and Wellness Clinic" className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 dark:bg-slate-900">
                  <Image src="/logo1.jpg" alt="C2M Family Clinic & Pharmacy logo" width={40} height={40} className="object-contain" />
                </div>
                <span className="flex flex-col items-start">
                  <span className="text-sm font-semibold leading-tight">C2M Family Clinic & Pharmacy</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">Doctor ng Bawat Pamilyang Pilipino</span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {showDocuments && <NavDocuments items={data.documents} />}
        <NavSecondary items={secondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ?? data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
