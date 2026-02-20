'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default function CustomerLayout({
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
    } else if (session.user?.role !== 'CUSTOMER') {
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

  if (!session || session.user?.role !== 'CUSTOMER') {
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
              <h2 className="text-lg font-semibold text-gray-800">Customer Portal</h2>
            </div>
            <div className="text-sm text-gray-600">{session.user?.name}</div>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
