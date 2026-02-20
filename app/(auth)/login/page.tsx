// app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect jika sudah login
  useEffect(() => {
    if (status === 'authenticated' && session) {
      if (session.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        router.push('/customer/dashboard')
      }
    }
  }, [status, session, router])

  // Jangan tampilkan halaman login jika sedang loading session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  // Jangan tampilkan halaman login jika sudah login
  if (status === 'authenticated') {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
      } else {
        // Trigger refresh untuk update session
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'admin' | 'customer') => {
    setLoading(true)
    setError('')

    const demoCredentials = {
      admin: { email: 'admin@example.com', password: 'admin123' },
      customer: { email: 'john.doe@example.com', password: 'customer123' }
    }

    const creds = demoCredentials[role]

    try {
      const result = await signIn('credentials', {
        email: creds.email,
        password: creds.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Demo login failed')
        setLoading(false)
      } else {
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Demo Login</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
            >
              Login as Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDemoLogin('customer')}
              disabled={loading}
            >
              Login as Customer
            </Button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Demo credentials:</p>
            <p>Admin: admin@example.com / admin123</p>
            <p>Customer: john.doe@example.com / customer123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}