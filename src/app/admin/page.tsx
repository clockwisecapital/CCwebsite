'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRootPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated by trying to access dashboard
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push('/admin/dashboard')
        } else {
          // User is not authenticated, redirect to login
          router.push('/admin/login')
        }
      } catch {
        // Error occurred, redirect to login
        router.push('/admin/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  )
}
