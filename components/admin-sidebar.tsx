// components/app-sidebar.tsx
'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  Clock, 
  Settings,
  LogOut,
  Home,
  HelpCircle,
  Bell,
  ChevronDown,
  BarChart3,
  Shield,
  UserCircle
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AdminSidebar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  // Menu items untuk Admin
  const adminMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      title: "Customers",
      icon: Users,
      href: "/admin/customers",
    },
    {
      title: "Videos",
      icon: Video,
      href: "/admin/videos",
    },
    {
      title: "Access Requests",
      icon: Clock,
      href: "/admin/requests",
      badge: 3, // Contoh badge
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/admin/analytics",
    },
  ]

  // Menu items untuk Customer
  const customerMenuItems = [
    {
      title: "My Videos",
      icon: LayoutDashboard,
      href: "/customer/dashboard",
    },
    {
      title: "My Requests",
      icon: Clock,
      href: "/customer/requests",
    },
  ]

  // Menu items untuk semua user
  const generalMenuItems = [
    {
      title: "Home",
      icon: Home,
      href: "/",
    },
  ]

  // Menu items untuk settings
  const settingsMenuItems = [
    {
      title: "Profile",
      icon: UserCircle,
      href: "/profile",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
    },
    {
      title: "Help",
      icon: HelpCircle,
      href: "/help",
    },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Video className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
            VideoPermit
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* User Info */}
        {session && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(session.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-gray-500">{session.user.email}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <UserCircle className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title}
                      isActive={isActive(item.href)}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Customer Menu */}
        {!isAdmin && session && (
          <SidebarGroup>
            <SidebarGroupLabel>Customer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {customerMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title}
                      isActive={isActive(item.href)}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Settings Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500">v1.0.0</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}