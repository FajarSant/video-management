// app/admin/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Video, Clock, CheckCircle, AlertCircle, TrendingUp, Calendar } from 'lucide-react'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function AdminDashboardPage() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect('/login')
    }

    if (session.user?.role !== 'ADMIN') {
      redirect('/unauthorized')
    }

    // Fetch data dengan error handling
    let totalCustomers = 0
    let totalVideos = 0
    let pendingRequests = 0
    let activeAccesses = 0
    let todayRequests = 0
    let approvalRate = 0

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        customers,
        videos,
        pending,
        active,
        todayReqs,
        totalReqs,
        approvedReqs
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.video.count(),
        prisma.accessRequest.count({ where: { status: 'PENDING' } }),
        prisma.videoAccess.count({ where: { isActive: true } }),
        prisma.accessRequest.count({ 
          where: { 
            requestedAt: { gte: today }
          } 
        }),
        prisma.accessRequest.count(),
        prisma.accessRequest.count({ where: { status: 'APPROVED' } })
      ])
      
      totalCustomers = customers
      totalVideos = videos
      pendingRequests = pending
      activeAccesses = active
      todayRequests = todayReqs
      approvalRate = totalReqs > 0 ? Math.round((approvedReqs / totalReqs) * 100) : 0
    } catch (dbError) {
      console.error('Database error:', dbError)
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dasbor</h1>
            <p className="text-muted-foreground">
              Selamat datang kembali, {session.user?.name}! Berikut yang terjadi hari ini.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Pelanggan"
            value={totalCustomers}
            icon={Users}
            description="Pengguna terdaftar"
            trend="+12%"
            color="blue"
          />
          <StatsCard
            title="Total Video"
            value={totalVideos}
            icon={Video}
            description="Konten tersedia"
            trend="+5%"
            color="green"
          />
          <StatsCard
            title="Permintaan Tertunda"
            value={pendingRequests}
            icon={Clock}
            description="Menunggu persetujuan"
            trend={pendingRequests > 0 ? `+${pendingRequests} baru` : '0 baru'}
            color="yellow"
            badge={pendingRequests}
          />
          <StatsCard
            title="Akses Aktif"
            value={activeAccesses}
            icon={CheckCircle}
            description="Sedang menonton"
            trend="+8%"
            color="purple"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Permintaan Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Permintaan yang diterima hari ini
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tingkat Persetujuan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Dari semua permintaan yang disetujui
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="Tambah Video Baru"
              description="Unggah dan kelola konten video"
              icon={Video}
              href="/admin/videos"
              color="blue"
            />
            <QuickActionCard
              title="Kelola Pelanggan"
              description="Lihat dan kelola akun pengguna"
              icon={Users}
              href="/admin/customers"
              color="green"
            />
            <QuickActionCard
              title="Tinjau Permintaan"
              description={`${pendingRequests} permintaan tertunda`}
              icon={Clock}
              href="/admin/requests"
              color="yellow"
              badge={pendingRequests}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada aktivitas terbaru untuk ditampilkan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/login')
  }
}

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  color,
  badge 
}: { 
  title: string
  value: number
  icon: any
  description: string
  trend?: string
  color: string
  badge?: number
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <span className="text-xs font-medium text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </span>
          )}
        </div>
        {badge && badge > 0 && (
          <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {badge}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

// Quick Action Card Component
function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color,
  badge 
}: { 
  title: string
  description: string
  icon: any
  href: string
  color: string
  badge?: number
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
  }

  return (
    <a
      href={href}
      className={`block p-6 rounded-lg border transition-all hover:shadow-md ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-start justify-between">
        <Icon className="h-8 w-8" />
        {badge && badge > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold mt-4">{title}</h3>
      <p className="text-sm opacity-80 mt-1">{description}</p>
    </a>
  )
}