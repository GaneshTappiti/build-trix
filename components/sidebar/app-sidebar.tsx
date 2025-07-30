"use client"

import * as React from "react"
import { useState, useEffect } from "react"
// import {
// AudioWaveform,
// BookOpen,
// Bot,
// Command,
// Frame,
// GalleryVerticalEnd,
// Map,
// PieChart,
// Settings2,
// SquareTerminal,
// } from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
// import { NavProjects } from "@/components/sidebar/nav-projects"
import { NavUser } from "@/components/sidebar/nav-user"
// import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ROUTES } from "@/utils/constants/routes"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
          setUser(user)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Prepare user data for NavUser component
  const userData = user ? {
    name: user.user_metadata?.full_name || user.user_metadata?.name || "User",
    email: user.email || "",
    avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
  } : null

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={ROUTES} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        {!isLoading && userData && <NavUser user={userData} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
