// app/admin/layout.tsx
'use client'

import { AdminSidebar } from "@/components/admin-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
    } else if (session.user?.role !== 'ADMIN') {
      router.push('/unauthorized')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <AdminSidebar />
        <main className="flex-1">
          <div className="flex items-center gap-4 p-4 border-b bg-white shadow-sm">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">
                Admin Dashboard
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">
                {session.user?.name}
              </span>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}