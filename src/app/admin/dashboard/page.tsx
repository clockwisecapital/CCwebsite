'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  HiChatBubbleLeftRight, 
  HiEnvelope, 
  HiChartBar, 
  HiBolt,
  HiUsers,
  HiCurrencyDollar,
  HiCalendarDays,
  HiUser,
  HiCheckCircle,
  HiArrowDownTray,
  HiShieldCheck,
  HiSquares2X2,
  HiBuildingOffice2,
  HiArrowPath,
  HiXMark,
  HiFunnel,
  HiUserGroup
} from 'react-icons/hi2'
import type { DisplaySpec, DisplayBlock } from '@/lib/supabase/types'

// Advisory firms list
const ADVISORY_FIRMS = [
  'LFP Advisors',
  'Legado Wealth Management',
  'The Financial Gym'
] as const

interface AssignmentInfo {
  assignedToFirm: string
  assignedBy: string
  assignedAt: string
  notes: string | null
}

interface DashboardData {
  stats: {
    total: { conversations: number; emails: number; completed: number }
    recent: { conversations: number; timeframe: string }
    conversion: { emailCapture: number; analysisCompletion: number; averageLeadScore: number }
  }
  insights: {
    goalTypes: Record<string, number>
    portfolioSizes: Record<string, number>
    newInvestors: number
    highValueLeads: number
  }
  portfolioInsights: {
    avgExpectedReturn: number | null
    avgPortfolioValue: number | null
    totalAUM: number
    assetAllocationDistribution: Record<string, number>
    riskDistribution: { low: number; medium: number; high: number }
    completedAnalysisWithData: number
    avgTimePortfolioReturn: number | null
    returnComparison: {
      userAvg: number | null
      timeAvg: number | null
      difference: number | null
    }
  }
  conversations: Array<{
    id: string
    user_email: string
    created_at: string
    leadScore: number
    status: string
    goals: { type?: string; amount?: number; timeline?: number }
    portfolio: { value?: number; holdings: number; newInvestor?: boolean; allocation?: { stocks: number; bonds: number; cash: number } | null }
    hasAnalysis: boolean
    analysisMetrics?: {
      expectedReturn: number | null
      timeExpectedReturn: number | null
      positionsCount: number
    } | null
    lastActivity: string
    assignment: AssignmentInfo | null
  }>
  assignmentStats?: {
    totalAssigned: number
    totalUnassigned: number
    byFirm: Record<string, number>
  }
  userRole: 'master' | 'advisor'
  userFirm: string | null
  lastUpdated?: string
}

type TimelineItem = { timestamp: string; event: string; description?: string }
type MessageItem = { id: string; role: 'user' | 'assistant'; created_at: string; content: string | null; display_spec?: unknown }

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('week')
  const [sortBy, setSortBy] = useState('leadScore')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detail, setDetail] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'analysis' | 'risk' | 'allocation' | 'holdings' | 'messages'>('overview')
  
  // Assignment states
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set())
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [firmFilter, setFirmFilter] = useState<string>('')
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [assigningTo, setAssigningTo] = useState<string>('')
  const [assignmentNote, setAssignmentNote] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  
  // User info
  const [currentUser, setCurrentUser] = useState<{
    username: string
    role: 'master' | 'advisor'
    firmName: string | null
    displayName: string
  } | null>(null)
  
  const router = useRouter()

  const isMaster = currentUser?.role === 'master'

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      let url = `/api/admin/dashboard?timeframe=${timeframe}&limit=100`
      if (isMaster) {
        if (firmFilter) url += `&firm=${encodeURIComponent(firmFilter)}`
        if (assignmentFilter !== 'all') url += `&assignment=${assignmentFilter}`
      }
      
      const response = await fetch(url)
      
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setCurrentUser({
          username: result.data.userRole === 'master' ? 'clockwise' : result.data.userFirm,
          role: result.data.userRole,
          firmName: result.data.userFirm,
          displayName: result.data.userRole === 'master' ? 'Clockwise Capital' : result.data.userFirm || 'Advisor'
        })
      } else {
        setError(result.message || 'Failed to fetch data')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [timeframe, firmFilter, assignmentFilter, isMaster, router])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Fetch current user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/admin/auth')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setCurrentUser(result.user)
          }
        }
      } catch (e) {
        console.error('Failed to fetch user:', e)
      }
    }
    fetchUser()
  }, [])

  const openConversation = async (id: string) => {
    setIsDetailOpen(true)
    setDetailLoading(true)
    setDetailError('')
    setDetail(null)
    try {
      const res = await fetch(`/api/admin/conversation/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setDetail(json.data)
      } else {
        setDetailError(json.message || 'Failed to load conversation')
      }
    } catch {
      setDetailError('Network error. Please try again.')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeConversation = () => {
    setIsDetailOpen(false)
    setDetail(null)
    setActiveDetailTab('overview')
  }

  // Assignment functions
  const handleAssign = async (conversationIds: string[], firmName: string, notes?: string) => {
    if (!isMaster) return
    
    setIsAssigning(true)
    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationIds,
          firmName,
          notes
        })
      })
      
      const result = await response.json()
      if (result.success) {
        // Refresh dashboard data
        await fetchDashboardData()
        setSelectedConversations(new Set())
        setShowBulkAssign(false)
        setAssignmentNote('')
      } else {
        alert(result.message || 'Failed to assign')
      }
    } catch (e) {
      console.error('Assignment error:', e)
      alert('Failed to assign clients')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassign = async (conversationIds: string[]) => {
    if (!isMaster) return
    
    if (!confirm(`Are you sure you want to unassign ${conversationIds.length} client(s)?`)) return
    
    setIsAssigning(true)
    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationIds })
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchDashboardData()
        setSelectedConversations(new Set())
      } else {
        alert(result.message || 'Failed to unassign')
      }
    } catch (e) {
      console.error('Unassign error:', e)
      alert('Failed to unassign clients')
    } finally {
      setIsAssigning(false)
    }
  }

  const toggleSelectConversation = (id: string) => {
    const newSelected = new Set(selectedConversations)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedConversations(newSelected)
  }

  const selectAllVisible = () => {
    const allIds = sortedConversations.map(c => c.id)
    setSelectedConversations(new Set(allIds))
  }

  const clearSelection = () => {
    setSelectedConversations(new Set())
  }

  interface ConversationItem {
    id: string
    leadScore: number
    created_at: string
    portfolio?: { value?: number }
    assignment: AssignmentInfo | null
  }

  const sortedConversations = data?.conversations.sort((a: ConversationItem, b: ConversationItem) => {
    switch (sortBy) {
      case 'leadScore':
        return b.leadScore - a.leadScore
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'portfolioValue':
        return (b.portfolio?.value || 0) - (a.portfolio?.value || 0)
      default:
        return b.leadScore - a.leadScore
    }
  }) || []

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      router.push('/admin/login')
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  // Helper: render a DisplaySpec block array into readable HTML
  const renderDisplaySpec = (spec: unknown) => {
    const ds = spec as Partial<DisplaySpec> | null
    if (!ds || !Array.isArray(ds?.blocks)) {
      return (
        <pre className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 overflow-x-auto">
          {JSON.stringify(spec as unknown, null, 2)}
        </pre>
      )
    }
    return (
      <div className="space-y-3">
        {ds.blocks.map((block: Partial<DisplayBlock>, idx: number) => {
          const type = (block as Partial<DisplayBlock>)?.type as DisplayBlock['type'] | undefined
          // Content is typically stored as JSON string; parse safely
          let parsed: unknown = undefined
          try {
            parsed = typeof block?.content === 'string' ? JSON.parse(block.content) : block?.content
          } catch {
            parsed = block?.content
          }
          if (type === 'summary_bullets' && Array.isArray(parsed)) {
            return (
              <ul key={idx} className="list-disc ml-5 text-sm text-gray-800">
                {(parsed as unknown[]).map((item, i) => <li key={i}>{String(item)}</li>)}
              </ul>
            )
          }
          if (type === 'conversation_text' && Array.isArray(parsed)) {
            return (
              <div key={idx} className="text-sm text-gray-800 whitespace-pre-wrap">
                {(parsed as unknown[]).map(String).join('\n')}
              </div>
            )
          }
          if (type === 'cta_group' && Array.isArray(parsed)) {
            return (
              <div key={idx} className="flex flex-wrap gap-2">
                {(parsed as Array<{ label?: string }>).map((btn, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {btn?.label || 'CTA'}
                  </span>
                ))}
              </div>
            )
          }
          // Fallback for table/stat/chart/sources or unknown
          return (
            <pre key={idx} className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 overflow-x-auto">
              {JSON.stringify({ type, content: parsed }, null, 2)}
            </pre>
          )
        })}
      </div>
    )
  }

  const renderMessageBody = (m: { content?: string | null; display_spec?: unknown }) => {
    if (m?.content) {
      return (
        <div className="mt-2 text-sm text-gray-900 whitespace-pre-wrap break-words">{m.content}</div>
      )
    }
    if (m?.display_spec) {
      return (
        <div className="mt-2">{renderDisplaySpec(m.display_spec)}</div>
      )
    }
    return (
      <div className="mt-2 text-xs text-gray-400">No content</div>
    )
  }

  // Main component render logic
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
            onClick={fetchDashboardData}
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
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Role Badge */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CC</span>
                </div>
                <span className="ml-2 font-semibold text-gray-900">Admin Dashboard</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isMaster 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isMaster ? 'Master' : currentUser?.firmName || 'Advisor'}
              </span>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {isMaster && (
                <button
                  onClick={() => router.push('/admin/users')}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center"
                >
                  <HiUserGroup className="w-4 h-4 mr-1" />
                  Manage Users
                </button>
              )}
              <span className="text-sm text-gray-500">
                {currentUser?.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isMaster ? 'Admin Dashboard' : `${currentUser?.firmName} Dashboard`}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {isMaster 
                  ? 'Business Intelligence & Lead Management' 
                  : 'Your Assigned Clients & Leads'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Timeframe filter */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
              
              {/* Refresh button */}
              <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="Refresh data"
              >
                <HiArrowPath className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Stats for Master (new section) */}
        {isMaster && data?.assignmentStats && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-xs text-purple-600 font-medium">Total Assigned</p>
                  <p className="text-2xl font-bold text-purple-900">{data.assignmentStats.totalAssigned}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Unassigned</p>
                  <p className="text-2xl font-bold text-blue-900">{data.assignmentStats.totalUnassigned}</p>
                </div>
                <div className="border-l border-purple-200 pl-6">
                  <p className="text-xs text-gray-600 font-medium mb-1">By Firm</p>
                  <div className="flex space-x-4">
                    {Object.entries(data.assignmentStats.byFirm).map(([firm, count]) => (
                      <div key={firm} className="text-sm">
                        <span className="text-gray-600">{firm.split(' ')[0]}:</span>{' '}
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Filter controls */}
              <div className="flex items-center space-x-3">
                <select
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value as 'all' | 'assigned' | 'unassigned')}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                >
                  <option value="all">All Clients</option>
                  <option value="assigned">Assigned Only</option>
                  <option value="unassigned">Unassigned Only</option>
                </select>
                <select
                  value={firmFilter}
                  onChange={(e) => setFirmFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                >
                  <option value="">All Firms</option>
                  {ADVISORY_FIRMS.map(firm => (
                    <option key={firm} value={firm}>{firm}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Advisor Info Banner */}
        {!isMaster && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <HiBuildingOffice2 className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Viewing clients assigned to {currentUser?.firmName}
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Contact Clockwise Capital to have additional clients assigned to your firm.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Conversations</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{data?.stats.total.conversations}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                  {isMaster ? 'All time' : 'Assigned to you'}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg">
                <HiChatBubbleLeftRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Emails</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{data?.stats.total.emails}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">Qualified leads</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl shadow-lg">
                <HiEnvelope className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{data?.stats.total.completed}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">Full conversions</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl shadow-lg">
                <HiChartBar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Avg Score</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{Math.round(data?.stats.conversion.averageLeadScore || 0)}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">Quality metric</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg sm:rounded-xl shadow-lg">
                <HiBolt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <HiChartBar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Investment Goals</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(data?.insights.goalTypes || {}).map(([goal, count]) => (
                <div key={goal} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{goal}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                <HiCurrencyDollar className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Portfolio Sizes</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(data?.insights.portfolioSizes || {}).map(([size, count]) => (
                <div key={size} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">{size}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Assignment Bar (Master only, when items selected) */}
        {isMaster && selectedConversations.size > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedConversations.size} client(s) selected
              </span>
              <button
                onClick={clearSelection}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={assigningTo}
                onChange={(e) => setAssigningTo(e.target.value)}
                className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              >
                <option value="">Select firm...</option>
                {ADVISORY_FIRMS.map(firm => (
                  <option key={firm} value={firm}>{firm}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (assigningTo) {
                    handleAssign(Array.from(selectedConversations), assigningTo)
                  }
                }}
                disabled={!assigningTo || isAssigning}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? 'Assigning...' : 'Assign Selected'}
              </button>
              <button
                onClick={() => handleUnassign(Array.from(selectedConversations))}
                disabled={isAssigning}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Unassign
              </button>
            </div>
          </div>
        )}

        {/* Conversations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center">
                <div className="p-2 bg-slate-100 rounded-lg mr-3">
                  <HiUsers className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {isMaster ? 'All Conversations' : 'Your Clients'}
                </h3>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {isMaster && (
                  <button
                    onClick={selectAllVisible}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                )}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none"
                >
                  <option value="leadScore">Lead Score</option>
                  <option value="created_at">Date</option>
                  <option value="portfolioValue">Portfolio</option>
                </select>
                <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap">
                  <HiArrowDownTray className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  {isMaster && (
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedConversations.size === sortedConversations.length && sortedConversations.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllVisible()
                          } else {
                            clearSelection()
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <HiUser className="w-4 h-4" />
                      <span>Contact</span>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <HiBolt className="w-4 h-4" />
                      <span>Score</span>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                    <div className="flex items-center space-x-1">
                      <HiCheckCircle className="w-4 h-4" />
                      <span>Status</span>
                    </div>
                  </th>
                  {/* Assignment Column */}
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    <div className="flex items-center space-x-1">
                      <HiBuildingOffice2 className="w-4 h-4" />
                      <span>Assigned To</span>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                    <div className="flex items-center space-x-1">
                      <HiCurrencyDollar className="w-4 h-4" />
                      <span>Portfolio</span>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    <div className="flex items-center space-x-1">
                      <HiCalendarDays className="w-4 h-4" />
                      <span>Created</span>
                    </div>
                  </th>
                  {isMaster && (
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <span>Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedConversations.slice(0, 50).map((conversation) => (
                  <tr
                    key={conversation.id}
                    className={`hover:bg-blue-50 transition-colors ${
                      selectedConversations.has(conversation.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {isMaster && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedConversations.has(conversation.id)}
                          onChange={() => toggleSelectConversation(conversation.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td 
                      className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => openConversation(conversation.id)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                          <span className="text-white font-medium text-xs sm:text-sm">
                            {conversation.user_email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{conversation.user_email}</div>
                          <div className="text-xs text-gray-500 hidden sm:block">{conversation.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs font-bold rounded-full ${
                        conversation.leadScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        conversation.leadScore >= 60 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {conversation.leadScore >= 80 && <svg className="w-3 h-3 mr-1 hidden sm:inline" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                        {conversation.leadScore}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        conversation.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        conversation.status === 'Portfolio Collected' ? 'bg-blue-100 text-blue-800' :
                        conversation.status === 'Goals Collected' ? 'bg-blue-100 text-blue-800' :
                        conversation.status === 'Email Captured' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {conversation.status}
                      </span>
                    </td>
                    {/* Assignment Cell */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      {conversation.assignment ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <HiBuildingOffice2 className="w-3 h-3 mr-1" />
                            {conversation.assignment.assignedToFirm.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      {conversation.portfolio.newInvestor ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New Investor
                        </span>
                      ) : conversation.portfolio.value ? (
                        <div>
                          <div className="font-medium">${conversation.portfolio.value.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{conversation.portfolio.holdings} holdings</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No data</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      <div className="text-sm">{new Date(conversation.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">{new Date(conversation.created_at).toLocaleTimeString()}</div>
                    </td>
                    {isMaster && (
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <select
                            value={conversation.assignment?.assignedToFirm || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssign([conversation.id], e.target.value)
                              } else if (conversation.assignment) {
                                handleUnassign([conversation.id])
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="">Unassigned</option>
                            {ADVISORY_FIRMS.map(firm => (
                              <option key={firm} value={firm}>{firm.split(' ')[0]}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversation Detail Modal */}
        {isDetailOpen && (
          <div
            className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:p-8 overflow-y-auto"
            onClick={closeConversation}
          >
            <div
              className="w-full max-w-6xl bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden my-2 sm:my-4"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="conv-title"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-slate-50 to-white">
                <div className="min-w-0 flex-1 mr-4">
                  <h2 id="conv-title" className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                    {(detail?.user_email as string || 'Conversation')}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    <span className="hidden sm:inline">{(detail?.id as string)?.slice(0, 8) || ''} • </span>
                    {detail?.created_at ? new Date(detail.created_at as string).toLocaleDateString() : ''}
                  </p>
                </div>
                <button
                  onClick={closeConversation}
                  className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                  aria-label="Close"
                >
                  <HiXMark className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : detailError ? (
                <div className="p-6 text-red-600">{detailError}</div>
              ) : detail ? (
                <>
                  {/* Tabs Navigation */}
                  <div className="border-b bg-gray-50 px-2 sm:px-6">
                    <nav className="flex space-x-0.5 sm:space-x-1 overflow-x-auto scrollbar-hide -mb-px" aria-label="Tabs">
                      {[
                        { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: HiUser },
                        { id: 'analysis', label: 'Portfolio Analysis', shortLabel: 'Analysis', icon: HiChartBar },
                        { id: 'risk', label: 'Risk Metrics', shortLabel: 'Risk', icon: HiShieldCheck },
                        { id: 'allocation', label: 'Asset Allocation', shortLabel: 'Alloc.', icon: HiSquares2X2 },
                        { id: 'holdings', label: 'Holdings', shortLabel: 'Hold.', icon: HiCurrencyDollar },
                        { id: 'messages', label: 'Messages', shortLabel: 'Msgs', icon: HiChatBubbleLeftRight },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveDetailTab(tab.id as typeof activeDetailTab)}
                          className={`flex items-center px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            activeDetailTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <tab.icon className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden ml-1">{tab.shortLabel}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="max-h-[60vh] sm:max-h-[65vh] overflow-y-auto">
                    {/* Overview Tab */}
                    {activeDetailTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                        <div className="md:col-span-1 md:border-r border-b md:border-b-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lead Score</h3>
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                ((typeof detail.leadScore === 'number' ? detail.leadScore : (detail.leadScore?.total ?? 0)) as number) >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ((typeof detail.leadScore === 'number' ? detail.leadScore : (detail.leadScore?.total ?? 0)) as number) >= 60
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {String((typeof detail.leadScore === 'number' ? detail.leadScore : (detail.leadScore?.total ?? 0)) ?? 0)}
                            </div>
                            {(() => {
                              if (typeof detail.leadScore === 'object' && detail.leadScore !== null) {
                                const breakdown = detail.leadScore.breakdown;
                                if (breakdown && typeof breakdown === 'object') {
                                  return (
                                    <ul className="mt-3 space-y-1 text-sm text-gray-700">
                                      {Object.entries(breakdown).map(([k, v]) => (
                                        <li key={k} className="flex justify-between">
                                          <span>{k}</span>
                                          <span className="font-medium">{String(v)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                          
                          {/* Intake Form Summary */}
                          {Boolean(detail.intakeFormData) && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-2">Client Profile</h3>
                              <div className="space-y-2 text-sm">
                                {Boolean(detail.intakeFormData.firstName) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Name</span>
                                    <span className="font-medium text-gray-900">
                                      {String(detail.intakeFormData.firstName)} {String(detail.intakeFormData.lastName || '')}
                                    </span>
                                  </div>
                                )}
                                {Boolean(detail.intakeFormData.age) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Age</span>
                                    <span className="font-medium text-gray-900">{String(detail.intakeFormData.age)}</span>
                                  </div>
                                )}
                                {Boolean(detail.intakeFormData.experienceLevel) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Experience</span>
                                    <span className="font-medium text-gray-900">{String(detail.intakeFormData.experienceLevel)}</span>
                                  </div>
                                )}
                                {Boolean(detail.intakeFormData.riskTolerance) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Risk Tolerance</span>
                                    <span className={`font-medium capitalize ${
                                      detail.intakeFormData.riskTolerance === 'high' ? 'text-red-600' :
                                      detail.intakeFormData.riskTolerance === 'medium' ? 'text-amber-600' : 'text-green-600'
                                    }`}>
                                      {String(detail.intakeFormData.riskTolerance)}
                                    </span>
                                  </div>
                                )}
                                {Boolean(detail.intakeFormData.timeHorizon) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Time Horizon</span>
                                    <span className="font-medium text-gray-900">{String(detail.intakeFormData.timeHorizon)} years</span>
                                  </div>
                                )}
                                {Boolean(detail.intakeFormData.userRating) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Rating</span>
                                    <span className="font-medium text-amber-600">{String(detail.intakeFormData.userRating)}/5 stars</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2 p-4 sm:p-6">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h3>
                          <ol className="space-y-3">
                            {((detail.timeline as TimelineItem[]) || []).map((t: TimelineItem, idx: number) => (
                              <li key={idx} className="text-sm flex">
                                <div className={`w-2 h-2 rounded-full mt-1.5 mr-3 ${
                                  t.event.includes('Completed') ? 'bg-green-500' :
                                  t.event.includes('Portfolio') ? 'bg-blue-500' :
                                  t.event.includes('Goals') ? 'bg-blue-500' : 'bg-gray-400'
                                }`} />
                                <div>
                                  <div className="text-gray-900 font-medium">{t.event}</div>
                                  <div className="text-gray-500 text-xs">{new Date(t.timestamp).toLocaleString()}</div>
                                  {t.description && <div className="text-gray-600 mt-0.5">{t.description}</div>}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Portfolio Analysis Tab */}
                    {activeDetailTab === 'analysis' && (
                      <div className="p-4 sm:p-6">
                        {detail.portfolioAnalysis !== null && detail.portfolioAnalysis !== undefined ? (
                          <div className="space-y-4 sm:space-y-6">
                            {/* Return Comparison Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-5 text-white">
                                <p className="text-xs sm:text-sm opacity-90 mb-1">User Portfolio Return</p>
                                <p className="text-2xl sm:text-3xl font-bold">
                                  {detail.portfolioAnalysis?.userPortfolio?.expectedReturn !== undefined
                                    ? `${(detail.portfolioAnalysis.userPortfolio.expectedReturn * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </p>
                                <p className="text-xs opacity-80 mt-1">Expected annual return</p>
                              </div>
                              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 sm:p-5 text-white">
                                <p className="text-xs sm:text-sm opacity-90 mb-1">TIME Portfolio Return</p>
                                <p className="text-2xl sm:text-3xl font-bold">
                                  {detail.portfolioAnalysis?.timePortfolio?.expectedReturn !== undefined
                                    ? `${(detail.portfolioAnalysis.timePortfolio.expectedReturn * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </p>
                                <p className="text-xs opacity-80 mt-1">Benchmark return</p>
                              </div>
                              <div className={`rounded-xl p-4 sm:p-5 text-white ${
                                detail.portfolioAnalysis?.returnDifference >= 0 
                                  ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                  : 'bg-gradient-to-br from-red-500 to-red-600'
                              }`}>
                                <p className="text-xs sm:text-sm opacity-90 mb-1">Difference</p>
                                <p className="text-2xl sm:text-3xl font-bold">
                                  {detail.portfolioAnalysis?.returnDifference !== undefined
                                    ? `${detail.portfolioAnalysis.returnDifference >= 0 ? '+' : ''}${(detail.portfolioAnalysis.returnDifference * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </p>
                                <p className="text-xs opacity-80 mt-1">vs TIME Portfolio</p>
                              </div>
                            </div>

                            {/* Portfolio Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                              <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                                <h4 className="font-semibold text-gray-900 mb-3">User Portfolio</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Total Value</span>
                                    <span className="font-medium">
                                      {detail.portfolioAnalysis?.userPortfolio?.totalValue
                                        ? `$${detail.portfolioAnalysis.userPortfolio.totalValue.toLocaleString()}`
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Positions</span>
                                    <span className="font-medium">
                                      {detail.portfolioAnalysis?.userPortfolio?.positions?.length || 0}
                                    </span>
                                  </div>
                                  {detail.portfolioAnalysis?.userPortfolio?.isUsingProxy && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                                      Using proxy ETFs for analysis
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                                <h4 className="font-semibold text-gray-900 mb-3">TIME Portfolio</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Total Value</span>
                                    <span className="font-medium">
                                      {detail.portfolioAnalysis?.timePortfolio?.totalValue
                                        ? `$${detail.portfolioAnalysis.timePortfolio.totalValue.toLocaleString()}`
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Positions</span>
                                    <span className="font-medium">
                                      {detail.portfolioAnalysis?.timePortfolio?.positions?.length || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Time Horizon */}
                            {detail.portfolioAnalysis.timeHorizon && (
                              <div className="bg-blue-50 rounded-xl p-4 flex items-center">
                                <HiCalendarDays className="w-5 h-5 text-blue-600 mr-3" />
                                <span className="text-sm text-blue-900">
                                  Analysis based on <strong>{String(detail.portfolioAnalysis.timeHorizon)}-year</strong> time horizon
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <HiChartBar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No portfolio analysis data available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Risk Metrics Tab */}
                    {activeDetailTab === 'risk' && (
                      <div className="p-4 sm:p-6">
                        {detail.riskMetrics ? (
                          <div className="space-y-4 sm:space-y-6">
                            {/* Risk Level Banner */}
                            <div className={`rounded-xl p-4 sm:p-6 ${
                              detail.riskMetrics.riskLevel === 'low' ? 'bg-green-50 border border-green-200' :
                              detail.riskMetrics.riskLevel === 'medium' ? 'bg-amber-50 border border-amber-200' :
                              'bg-red-50 border border-red-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className={`text-lg font-semibold capitalize ${
                                    detail.riskMetrics.riskLevel === 'low' ? 'text-green-800' :
                                    detail.riskMetrics.riskLevel === 'medium' ? 'text-amber-800' :
                                    'text-red-800'
                                  }`}>
                                    {String(detail.riskMetrics.riskLevel)} Risk Portfolio
                                  </h4>
                                  <p className={`text-sm ${
                                    detail.riskMetrics.riskLevel === 'low' ? 'text-green-600' :
                                    detail.riskMetrics.riskLevel === 'medium' ? 'text-amber-600' :
                                    'text-red-600'
                                  }`}>
                                    Based on Monte Carlo volatility analysis
                                  </p>
                                </div>
                                <HiShieldCheck className={`w-10 h-10 ${
                                  detail.riskMetrics.riskLevel === 'low' ? 'text-green-500' :
                                  detail.riskMetrics.riskLevel === 'medium' ? 'text-amber-500' :
                                  'text-red-500'
                                }`} />
                              </div>
                            </div>

                            {/* Risk Metrics Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                              <div className="bg-white border rounded-xl p-3 sm:p-4">
                                <p className="text-xs text-gray-500 mb-1">Volatility</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                  {detail.riskMetrics.portfolioVolatility !== null
                                    ? `${((detail.riskMetrics.portfolioVolatility as number) * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-white border rounded-xl p-3 sm:p-4">
                                <p className="text-xs text-gray-500 mb-1">Median Return</p>
                                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                                  {detail.riskMetrics.medianReturn !== null
                                    ? `${((detail.riskMetrics.medianReturn as number) * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-white border rounded-xl p-3 sm:p-4">
                                <p className="text-xs text-gray-500 mb-1">Upside (95th)</p>
                                <p className="text-lg sm:text-2xl font-bold text-green-600">
                                  {detail.riskMetrics.maxUpside !== null
                                    ? `+${((detail.riskMetrics.maxUpside as number) * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-white border rounded-xl p-3 sm:p-4">
                                <p className="text-xs text-gray-500 mb-1">Downside (5th)</p>
                                <p className="text-lg sm:text-2xl font-bold text-red-600">
                                  {detail.riskMetrics.maxDownside !== null
                                    ? `${((detail.riskMetrics.maxDownside as number) * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <HiShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No risk metrics data available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Asset Allocation Tab */}
                    {activeDetailTab === 'allocation' && (
                      <div className="p-4 sm:p-6">
                        {detail.assetAllocation ? (
                          <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                              {[
                                { key: 'stocks', label: 'Stocks', color: 'bg-blue-500' },
                                { key: 'bonds', label: 'Bonds', color: 'bg-emerald-500' },
                                { key: 'cash', label: 'Cash', color: 'bg-gray-400' },
                                { key: 'realEstate', label: 'Real Estate', color: 'bg-blue-400' },
                                { key: 'commodities', label: 'Commodities', color: 'bg-emerald-400' },
                                { key: 'alternatives', label: 'Alts', color: 'bg-blue-600' },
                              ].map(({ key, label, color }) => {
                                const value = (detail.assetAllocation as Record<string, number>)[key] || 0;
                                return (
                                  <div key={key} className="bg-white border rounded-xl p-2 sm:p-4 text-center">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center`}>
                                      <span className="text-white font-bold text-xs sm:text-sm">{value}%</span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-900">{label}</p>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Visual Bar */}
                            <div className="bg-gray-100 rounded-full h-8 overflow-hidden flex">
                              {[
                                { key: 'stocks', color: 'bg-blue-500' },
                                { key: 'bonds', color: 'bg-emerald-500' },
                                { key: 'cash', color: 'bg-gray-400' },
                                { key: 'realEstate', color: 'bg-blue-400' },
                                { key: 'commodities', color: 'bg-emerald-400' },
                                { key: 'alternatives', color: 'bg-blue-600' },
                              ].map(({ key, color }) => {
                                const value = (detail.assetAllocation as Record<string, number>)[key] || 0;
                                if (value === 0) return null;
                                return (
                                  <div
                                    key={key}
                                    className={`${color} h-full`}
                                    style={{ width: `${value}%` }}
                                    title={`${key}: ${value}%`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <HiSquares2X2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No asset allocation data available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Holdings Tab */}
                    {activeDetailTab === 'holdings' && (
                      <div className="p-4 sm:p-6">
                        {detail.portfolioAnalysis?.userPortfolio?.positions?.length > 0 ? (
                          <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticker</th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Name</th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Weight</th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Price</th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Target</th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Return</th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Vol</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {(detail.portfolioAnalysis.userPortfolio.positions || []).map((pos: {
                                  ticker: string;
                                  name: string;
                                  weight: number;
                                  currentPrice?: number;
                                  targetPrice?: number | null;
                                  expectedReturn?: number | null;
                                  monteCarlo?: { volatility: number } | null;
                                  isProxy?: boolean;
                                }, idx: number) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                                      <span className="font-mono font-medium text-gray-900 text-xs sm:text-sm">{pos.ticker}</span>
                                      {pos.isProxy && (
                                        <span className="ml-1 sm:ml-2 text-xs bg-blue-100 text-blue-700 px-1 sm:px-1.5 py-0.5 rounded">P</span>
                                      )}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-600 max-w-[200px] truncate hidden sm:table-cell">{pos.name}</td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-gray-900">{pos.weight.toFixed(1)}%</td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-sm text-gray-600 hidden md:table-cell">
                                      {pos.currentPrice ? `$${pos.currentPrice.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-sm text-gray-600 hidden lg:table-cell">
                                      {pos.targetPrice ? `$${pos.targetPrice.toFixed(2)}` : '-'}
                                    </td>
                                    <td className={`px-3 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium ${
                                      pos.expectedReturn !== null && pos.expectedReturn !== undefined
                                        ? pos.expectedReturn >= 0 ? 'text-green-600' : 'text-red-600'
                                        : 'text-gray-400'
                                    }`}>
                                      {pos.expectedReturn !== null && pos.expectedReturn !== undefined
                                        ? `${pos.expectedReturn >= 0 ? '+' : ''}${(pos.expectedReturn * 100).toFixed(1)}%`
                                        : '-'}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-sm text-gray-600 hidden md:table-cell">
                                      {pos.monteCarlo?.volatility
                                        ? `${(pos.monteCarlo.volatility * 100).toFixed(1)}%`
                                        : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <HiCurrencyDollar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No holdings data available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Messages Tab */}
                    {activeDetailTab === 'messages' && (
                      <div className="p-4 sm:p-6">
                        <div className="space-y-3 sm:space-y-4">
                          {((detail?.messages as MessageItem[]) || []).map((m: MessageItem) => (
                            <div
                              key={m.id}
                              className={`p-3 rounded-lg border ${
                                m.role === 'user' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-xs font-medium ${
                                    m.role === 'user' ? 'text-blue-700' : 'text-gray-700'
                                  }`}
                                >
                                  {m.role === 'user' ? 'User' : 'Assistant'}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString()}</span>
                              </div>
                              {renderMessageBody(m)}
                            </div>
                          ))}
                          {(!detail?.messages || (detail.messages as MessageItem[]).length === 0) && (
                            <div className="text-center py-12 text-gray-500">
                              <HiChatBubbleLeftRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No messages in this conversation</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 text-gray-500">Select a conversation to view details.</div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Assignment Modal */}
        {showBulkAssign && isMaster && (
          <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Assignment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Firm</label>
                  <select
                    value={assigningTo}
                    onChange={(e) => setAssigningTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select firm...</option>
                    {ADVISORY_FIRMS.map(firm => (
                      <option key={firm} value={firm}>{firm}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                  <textarea
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Add a note about this assignment..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkAssign(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (assigningTo) {
                      handleAssign(Array.from(selectedConversations), assigningTo, assignmentNote)
                    }
                  }}
                  disabled={!assigningTo || isAssigning}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : `Assign ${selectedConversations.size} Client(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}</p>
        </div>
      </div>
    </div>
  )
}
