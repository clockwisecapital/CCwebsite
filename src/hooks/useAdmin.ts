'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/test', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.success)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'DELETE',
        credentials: 'include'
      })
      setIsAdmin(false)
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    isAdmin,
    isLoading,
    logout,
    checkAdminStatus
  }
}
