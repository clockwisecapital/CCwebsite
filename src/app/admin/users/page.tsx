'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  HiUserGroup,
  HiPlus,
  HiPencil,
  HiTrash,
  HiArrowLeft,
  HiShieldCheck,
  HiBuildingOffice2,
  HiEye,
  HiEyeSlash,
  HiXMark,
  HiCheck,
  HiExclamationTriangle
} from 'react-icons/hi2'

interface AdminUser {
  id: string
  username: string
  role: 'master' | 'advisor'
  firm_name: string | null
  display_name: string | null
  email: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'password'>('create')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'advisor' as 'master' | 'advisor',
    firmName: '',
    displayName: '',
    email: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  
  const router = useRouter()

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      
      if (response.status === 403) {
        router.push('/admin/dashboard')
        return
      }

      const result = await response.json()
      
      if (result.success) {
        setUsers(result.data.users)
      } else {
        setError(result.message || 'Failed to fetch users')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedUser(null)
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      role: 'advisor',
      firmName: '',
      displayName: '',
      email: ''
    })
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (user: AdminUser) => {
    setModalMode('edit')
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: '',
      confirmPassword: '',
      role: user.role,
      firmName: user.firm_name || '',
      displayName: user.display_name || '',
      email: user.email || ''
    })
    setFormError('')
    setShowModal(true)
  }

  const openPasswordModal = (user: AdminUser) => {
    setModalMode('password')
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: '',
      confirmPassword: '',
      role: user.role,
      firmName: user.firm_name || '',
      displayName: user.display_name || '',
      email: user.email || ''
    })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    // Validation
    if (modalMode === 'create' || modalMode === 'password') {
      if (!formData.password) {
        setFormError('Password is required')
        return
      }
      if (formData.password.length < 8) {
        setFormError('Password must be at least 8 characters')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match')
        return
      }
    }
    
    if (modalMode === 'create' && !formData.username) {
      setFormError('Username is required')
      return
    }
    
    if (formData.role === 'advisor' && !formData.firmName) {
      setFormError('Firm name is required for advisors')
      return
    }
    
    setIsSaving(true)
    
    try {
      let response: Response
      
      if (modalMode === 'create') {
        response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username.toLowerCase().trim(),
            password: formData.password,
            role: formData.role,
            firmName: formData.role === 'advisor' ? formData.firmName : null,
            displayName: formData.displayName || formData.username,
            email: formData.email || null
          })
        })
      } else if (modalMode === 'edit') {
        response = await fetch(`/api/admin/users/${selectedUser?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firmName: formData.role === 'advisor' ? formData.firmName : null,
            displayName: formData.displayName,
            email: formData.email || null
          })
        })
      } else {
        // Password reset
        response = await fetch(`/api/admin/users/${selectedUser?.id}/password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: formData.password })
        })
      }
      
      const result = await response.json()
      
      if (result.success) {
        closeModal()
        fetchUsers()
      } else {
        setFormError(result.message || 'Operation failed')
      }
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (user: AdminUser) => {
    if (user.role === 'master') {
      alert('Cannot deactivate master account')
      return
    }
    
    const action = user.is_active ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} ${user.display_name || user.username}?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.is_active })
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchUsers()
      } else {
        alert(result.message || 'Failed to update user')
      }
    } catch {
      alert('Network error. Please try again.')
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (user.role === 'master') {
      alert('Cannot delete master account')
      return
    }
    
    if (!confirm(`Are you sure you want to delete ${user.display_name || user.username}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchUsers()
      } else {
        alert(result.message || 'Failed to delete user')
      }
    } catch {
      alert('Network error. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <HiArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <HiUserGroup className="w-6 h-6 text-blue-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
            >
              <HiPlus className="w-4 h-4 mr-1" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          user.role === 'master' 
                            ? 'bg-purple-100' 
                            : 'bg-blue-100'
                        }`}>
                          {user.role === 'master' ? (
                            <HiShieldCheck className="w-5 h-5 text-purple-600" />
                          ) : (
                            <HiBuildingOffice2 className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.display_name || user.username}
                          </div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                          {user.email && (
                            <div className="text-xs text-gray-400">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'master' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'master' ? 'Master' : user.firm_name || 'Advisor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString() 
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit user"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title="Reset password"
                        >
                          {showPassword ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                        </button>
                        {user.role !== 'master' && (
                          <>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`p-1.5 rounded ${
                                user.is_active 
                                  ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' 
                                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? <HiXMark className="w-4 h-4" /> : <HiCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete user"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <HiExclamationTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Default Credentials</p>
              <p className="text-blue-700">
                New advisor accounts use default passwords on first setup. Users should change their password after first login.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'create' && 'Create New User'}
                {modalMode === 'edit' && 'Edit User'}
                {modalMode === 'password' && 'Reset Password'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalMode === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., johndoe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'master' | 'advisor' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="advisor">Advisor</option>
                      <option value="master">Master</option>
                    </select>
                  </div>

                  {formData.role === 'advisor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Firm Name *
                      </label>
                      <select
                        value={formData.firmName}
                        onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select firm...</option>
                        <option value="LFP Advisors">LFP Advisors</option>
                        <option value="Legado Wealth Management">Legado Wealth Management</option>
                        <option value="The Financial Gym">The Financial Gym</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {(modalMode === 'create' || modalMode === 'edit') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., john@example.com"
                    />
                  </div>
                </>
              )}

              {(modalMode === 'create' || modalMode === 'password') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Re-enter password"
                    />
                  </div>
                </>
              )}

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : modalMode === 'create' ? 'Create User' : modalMode === 'edit' ? 'Save Changes' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

