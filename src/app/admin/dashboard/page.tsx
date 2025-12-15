'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  HiUserGroup,
  HiPresentationChartLine,
  HiDocumentArrowUp,
  HiCloudArrowUp
} from 'react-icons/hi2'
import type { DisplaySpec, DisplayBlock } from '@/lib/supabase/types'
import type { ClockwisePortfolio } from '@/app/api/admin/portfolios/route'
import type { MultiPortfolioResult } from '@/lib/portfolio-metrics'
import PortfolioPerformanceTable, { PortfolioComparisonTable } from '@/components/features/PortfolioPerformanceTable'
import { downloadPortfolioPDF, downloadComparisonPDF } from '@/lib/portfolio-pdf'

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
  
  // Main tab for master users
  const [mainTab, setMainTab] = useState<'dashboard' | 'portfolioPerformance'>('dashboard')
  
  // Disclosure modal state
  const [showDisclosureModal, setShowDisclosureModal] = useState(false)
  
  // Portfolio Performance state (master only) - Database driven with CSV upload
  const [clockwisePortfolios, setClockwisePortfolios] = useState<ClockwisePortfolio[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState('')
  const [editingPortfolio, setEditingPortfolio] = useState<ClockwisePortfolio | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Portfolio view states (Individual vs Comparison, PDF download)
  const [portfolioView, setPortfolioView] = useState<'individual' | 'comparison'>('comparison')
  const [uploadedPortfolioData, setUploadedPortfolioData] = useState<MultiPortfolioResult | null>(null)
  const [selectedPortfolioForPDF, setSelectedPortfolioForPDF] = useState<string>('')
  
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

  // Fetch Clockwise portfolios from database (master only)
  const fetchClockwisePortfolios = useCallback(async () => {
    if (!isMaster) return
    
    setPortfolioLoading(true)
    setPortfolioError('')
    
    try {
      const response = await fetch('/api/admin/portfolios?admin=true')
      const result = await response.json()
      
      if (result.success) {
        setClockwisePortfolios(result.data)
      } else {
        setPortfolioError(result.message || 'Failed to fetch portfolios')
      }
    } catch (e) {
      console.error('Portfolio fetch error:', e)
      setPortfolioError('Network error. Please try again.')
    } finally {
      setPortfolioLoading(false)
    }
  }, [isMaster])

  // Save portfolio changes
  const handleSavePortfolio = async (portfolio: ClockwisePortfolio) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/portfolios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolio)
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update local state
        setClockwisePortfolios(prev => 
          prev.map(p => p.id === portfolio.id ? result.data : p)
        )
        setEditingPortfolio(null)
      } else {
        alert(result.message || 'Failed to save portfolio')
      }
    } catch (e) {
      console.error('Portfolio save error:', e)
      alert('Failed to save portfolio')
    } finally {
      setIsSaving(false)
    }
  }

  // Fetch portfolios when tab changes to portfolioPerformance
  useEffect(() => {
    if (mainTab === 'portfolioPerformance' && isMaster && clockwisePortfolios.length === 0) {
      fetchClockwisePortfolios()
    }
  }, [mainTab, isMaster, clockwisePortfolios.length, fetchClockwisePortfolios])

  // Handle CSV file upload - parse, calculate metrics, save to database AND get detailed analytics
  const handleCSVUpload = async (file: File) => {
    if (!isMaster) return
    
    setIsUploading(true)
    setPortfolioError('')
    setUploadSuccess(false)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Call both APIs in parallel:
      // 1. Save to database (simple metrics)
      // 2. Get detailed analytics for PDF generation
      const [uploadResponse, analyzeResponse] = await Promise.all([
        fetch('/api/admin/portfolios/upload', {
          method: 'POST',
          body: formData
        }),
        fetch('/api/admin/portfolio-analyze', {
          method: 'POST',
          body: formData
        })
      ])
      
      const uploadResult = await uploadResponse.json()
      const analyzeResult = await analyzeResponse.json()
      
      if (uploadResult.success) {
        setUploadSuccess(true)
        // Refresh portfolio data from database
        await fetchClockwisePortfolios()
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000)
      } else {
        setPortfolioError(uploadResult.message || 'Failed to save portfolio data')
      }
      
      // Store detailed analytics data for PDF generation
      if (analyzeResult.success && analyzeResult.data) {
        setUploadedPortfolioData(analyzeResult.data)
        // Set first portfolio as selected for PDF
        const portfolioNames = Object.keys(analyzeResult.data.portfolios || {})
        if (portfolioNames.length > 0 && !selectedPortfolioForPDF) {
          setSelectedPortfolioForPDF(portfolioNames[0])
        }
      }
    } catch (e) {
      console.error('CSV upload error:', e)
      setPortfolioError('Network error. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleCSVUpload(file)
    }
    // Reset input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      handleCSVUpload(file)
    } else {
      setPortfolioError('Please upload a CSV file')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
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
          
          {/* Main Tab Navigation (Master only) */}
          {isMaster && (
            <div className="border-t border-gray-100">
              <nav className="flex space-x-8" aria-label="Main tabs">
                <button
                  onClick={() => setMainTab('dashboard')}
                  className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    mainTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <HiChartBar className="w-4 h-4 mr-2" />
                    Dashboard
                  </div>
                </button>
                <button
                  onClick={() => setMainTab('portfolioPerformance')}
                  className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    mainTab === 'portfolioPerformance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <HiPresentationChartLine className="w-4 h-4 mr-2" />
                    Portfolio Performance
                  </div>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Performance Tab (Master Only) - Database Driven */}
      {isMaster && mainTab === 'portfolioPerformance' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Portfolio Performance
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Clockwise Model Portfolio 3-Year Cumulative Metrics
                </p>
              </div>
              
              <button
                onClick={() => fetchClockwisePortfolios()}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <HiArrowPath className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
          
          {/* CSV Upload Section */}
          <div className="mb-6">
            <div 
              className={`bg-white rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                isUploading 
                  ? 'border-blue-400 bg-blue-50' 
                  : uploadSuccess 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".csv"
                className="hidden"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-blue-600 font-medium">Processing CSV...</p>
                  <p className="text-sm text-blue-500 mt-1">Calculating metrics and saving to database</p>
                </div>
              ) : uploadSuccess ? (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <HiCheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-green-600 font-medium">Portfolio data updated successfully!</p>
                  <p className="text-sm text-green-500 mt-1">Data is now available to all advisors and on the Review Tab</p>
                </div>
              ) : (
                <>
                  <HiCloudArrowUp className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-700 font-medium mb-1">Upload Portfolio CSV</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop your Clockwise Portfolios CSV file here, or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <HiDocumentArrowUp className="w-4 h-4 mr-2" />
                    Select CSV File
                  </button>
                  <p className="text-xs text-gray-400 mt-3">
                    Expected format: Date, Clockwise Max Growth, Clockwise Moderate, Clockwise Max Income, Clockwise Growth
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* View Toggle and PDF Download (only shown after CSV upload) */}
          {uploadedPortfolioData && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* View toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPortfolioView('individual')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      portfolioView === 'individual'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    onClick={() => setPortfolioView('comparison')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      portfolioView === 'comparison'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Comparison
                  </button>
                </div>

                {/* PDF Download Section */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Individual Portfolio PDF */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedPortfolioForPDF || Object.keys(uploadedPortfolioData.portfolios)[0]}
                      onChange={(e) => setSelectedPortfolioForPDF(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      {Object.keys(uploadedPortfolioData.portfolios).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const portfolioName = selectedPortfolioForPDF || Object.keys(uploadedPortfolioData.portfolios)[0]
                        downloadPortfolioPDF(uploadedPortfolioData, portfolioName)
                      }}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <HiArrowDownTray className="w-4 h-4 mr-2" />
                      Download PDF
                    </button>
                  </div>

                  {/* Comparison PDF */}
                  {Object.keys(uploadedPortfolioData.portfolios).length > 1 && (
                    <button
                      onClick={() => downloadComparisonPDF(uploadedPortfolioData)}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <HiArrowDownTray className="w-4 h-4 mr-2" />
                      Comparison PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Performance Tables (Yearly Breakdowns) */}
          {uploadedPortfolioData && (
            <div className="space-y-6">
              {portfolioView === 'individual' ? (
                <PortfolioPerformanceTable 
                  data={uploadedPortfolioData} 
                  selectedPortfolio={selectedPortfolioForPDF || Object.keys(uploadedPortfolioData.portfolios)[0]}
                />
              ) : (
                <PortfolioComparisonTable data={uploadedPortfolioData} />
              )}
            </div>
          )}

          {/* Loading State */}
          {portfolioLoading && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading portfolio data...</p>
            </div>
          )}
          
          {/* Error State */}
          {portfolioError && !portfolioLoading && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
              <p className="text-red-600 font-medium">{portfolioError}</p>
              <button
                onClick={() => fetchClockwisePortfolios()}
                className="mt-4 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
              >
                Try Again
              </button>
            </div>
          )}
          
          {/* Database Portfolio Table (3Y Metrics + Edit) */}
          {!portfolioLoading && clockwisePortfolios.length > 0 && (
            <div className="space-y-6">
              {/* 3-Year Cumulative Performance Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="text-xl font-semibold text-gray-900">3-Year Cumulative Performance</h2>
                  <p className="text-sm text-gray-500 mt-1">Click on a value to edit</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                          Metric
                        </th>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <th 
                            key={portfolio.id} 
                            className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]"
                          >
                            {portfolio.name}
                          </th>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(portfolio => (
                          <th 
                            key={portfolio.id} 
                            className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]"
                          >
                            {portfolio.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Return Row */}
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Return</td>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right font-bold text-emerald-700">
                            {portfolio.return_3y !== null ? `${(portfolio.return_3y * 100).toFixed(2)}%` : '-'}
                          </td>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right font-bold text-orange-700">
                            {portfolio.return_3y !== null ? `${(portfolio.return_3y * 100).toFixed(2)}%` : '-'}
                          </td>
                        ))}
                      </tr>
                      {/* Std Dev Row */}
                      <tr className="bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Std Dev</td>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-900">
                            {portfolio.std_dev !== null ? `${(portfolio.std_dev * 100).toFixed(1)}%` : '-'}
                          </td>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-600">
                            {portfolio.std_dev !== null ? `${(portfolio.std_dev * 100).toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>
                      {/* Alpha Row */}
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Alpha</td>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-900">
                            {portfolio.alpha !== null ? `${(portfolio.alpha * 100).toFixed(1)}%` : '-'}
                          </td>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(() => (
                          <td key="benchmark-alpha" className="px-4 py-3 text-sm text-right text-gray-500">0.0%</td>
                        ))}
                      </tr>
                      {/* Beta Row */}
                      <tr className="bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Beta</td>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-900">
                            {portfolio.beta !== null ? portfolio.beta.toFixed(2) : '-'}
                          </td>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(() => (
                          <td key="benchmark-beta" className="px-4 py-3 text-sm text-right text-gray-500">1.00</td>
                        ))}
                      </tr>
                      {/* Sharpe Ratio Row */}
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Sharpe Ratio</td>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-900">
                            {portfolio.sharpe_ratio !== null ? portfolio.sharpe_ratio.toFixed(2) : '-'}
                          </td>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-600">
                            {portfolio.sharpe_ratio !== null ? portfolio.sharpe_ratio.toFixed(2) : '-'}
                          </td>
                        ))}
                      </tr>
                      {/* Max Drawdown Row */}
                      <tr className="bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Max Drawdown</td>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-900">
                            {portfolio.max_drawdown !== null ? `${(portfolio.max_drawdown * 100).toFixed(1)}%` : '-'}
                          </td>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-600">
                            {portfolio.max_drawdown !== null ? `${(portfolio.max_drawdown * 100).toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>
                      {/* Up Capture Row */}
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Up Capture</td>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-900">
                            {portfolio.up_capture !== null ? portfolio.up_capture.toFixed(2) : '-'}
                          </td>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(() => (
                          <td key="benchmark-up" className="px-4 py-3 text-sm text-right text-gray-500">1.00</td>
                        ))}
                      </tr>
                      {/* Down Capture Row */}
                      <tr className="bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">Down Capture</td>
                        {clockwisePortfolios.filter(p => !p.is_benchmark).map(portfolio => (
                          <td key={portfolio.id} className="px-4 py-3 text-sm text-right text-gray-900">
                            {portfolio.down_capture !== null ? portfolio.down_capture.toFixed(2) : '-'}
                          </td>
                        ))}
                        {clockwisePortfolios.filter(p => p.is_benchmark).map(() => (
                          <td key="benchmark-down" className="px-4 py-3 text-sm text-right text-gray-500">1.00</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Disclosure Link */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowDisclosureModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View Important Disclosures
                  </button>
                </div>
              </div>

              {/* Edit Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <HiChartBar className="w-4 h-4 mr-2" />
                  Edit Portfolio Metrics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clockwisePortfolios.map(portfolio => (
                    <div 
                      key={portfolio.id}
                      className={`p-4 rounded-lg border ${portfolio.is_benchmark ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{portfolio.name}</h4>
                        <button
                          onClick={() => setEditingPortfolio(portfolio)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last updated: {portfolio.updated_at ? new Date(portfolio.updated_at).toLocaleDateString() : 'N/A'}
                        {portfolio.updated_by && ` by ${portfolio.updated_by}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Note */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Data Management</h3>
                <p className="text-xs text-gray-600">
                  Portfolio metrics are stored in the database and displayed on both the Admin Dashboard and the user-facing Review Tab. 
                  Changes made here will be reflected immediately across the application.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!portfolioLoading && clockwisePortfolios.length === 0 && !portfolioError && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <HiChartBar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Portfolio Data</h3>
              <p className="text-gray-600 mb-4">
                Portfolio data will appear here once added to the database.
              </p>
              <button
                onClick={() => fetchClockwisePortfolios()}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Portfolio Modal */}
      {editingPortfolio && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setEditingPortfolio(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit {editingPortfolio.name}</h3>
              <button onClick={() => setEditingPortfolio(null)} className="text-gray-400 hover:text-gray-600">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Return */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">3-Year Return (as decimal, e.g., 1.1074 for 110.74%)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingPortfolio.return_3y ?? ''}
                  onChange={e => setEditingPortfolio({...editingPortfolio, return_3y: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              {/* Std Dev */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Std Dev (as decimal, e.g., 0.148 for 14.8%)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingPortfolio.std_dev ?? ''}
                  onChange={e => setEditingPortfolio({...editingPortfolio, std_dev: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              {/* Alpha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alpha (as decimal, e.g., 0.068 for 6.8%)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingPortfolio.alpha ?? ''}
                  onChange={e => setEditingPortfolio({...editingPortfolio, alpha: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              {/* Beta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beta</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPortfolio.beta ?? ''}
                  onChange={e => setEditingPortfolio({...editingPortfolio, beta: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              {/* Sharpe Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sharpe Ratio</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPortfolio.sharpe_ratio ?? ''}
                  onChange={e => setEditingPortfolio({...editingPortfolio, sharpe_ratio: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              {/* Max Drawdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Drawdown (as negative decimal, e.g., -0.214 for -21.4%)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingPortfolio.max_drawdown ?? ''}
                  onChange={e => setEditingPortfolio({...editingPortfolio, max_drawdown: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              {/* Up Capture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Up Capture</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPortfolio.up_capture ?? ''}
                  onChange={e => setEditingPortfolio({...editingPortfolio, up_capture: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              {/* Down Capture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Down Capture</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPortfolio.down_capture ?? ''}
                  onChange={e => setEditingPortfolio({...editingPortfolio, down_capture: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setEditingPortfolio(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSavePortfolio(editingPortfolio)}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclosure Modal */}
      {showDisclosureModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900">Important Disclosures</h2>
              <button
                onClick={() => setShowDisclosureModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto p-6 text-sm text-gray-700 space-y-4">
              <p>This report is being provided by your financial professional as a courtesy and is not intended to be used as or in lieu of an account statement.</p>
              
              <p>This report presents past performance, which does not guarantee future results. The investment return and principal value will fluctuate thus an investor&apos;s shares, when redeemed, may be worth more or less than their original cost. Current performance may be higher or lower than return data quoted herein.</p>
              
              <p>The portfolio performance presented in this report is hypothetical and based on simulated investments. Unlike the results shown in an actual performance record, these results do not represent actual trading. Also, because these trades have not actually been executed, these results may have under-or over-compensated for the impact, if any, of certain market factors, such as lack of liquidity. Simulated or hypothetical trading programs in general are also subject to the fact that they are designed with the benefit of hindsight. No representation is being made that any account will or is likely to achieve profits or losses similar to these being shown.</p>
              
              <p>Returns in this report are time-weighted returns (TWR). Returns include distribution income such as dividends. The simulation of model portfolios does not take into account trading costs and tax implications.</p>
              
              <p>The projections or other information generated by Kwanti Analytics regarding the likelihood of various investment outcomes are hypothetical in nature, do not reflect actual investment results and are not guarantees of future results.</p>
              
              <p>Performance is presented net of advisory fees. Other fees borne by investors and not included in this report are: commissions, custodial charges and sales loads. If applicable, these fees will have a compounding effect on performance that can be material.</p>
              
              <p>Clockwise Capital, which is a registered investment advisor. Information presented herein is for educational purposes only and does not intend to make an offer or solicitation for the sale or purchase of any specific securities, investments, or investment strategies. Investments involve risk and unless otherwise stated, are not guaranteed. Readers of the information contained on this handout should be aware that any action taken by the viewer/reader based on this information is taken at their own risk. This information does not address individual situations and should not be construed or viewed as any type of individual or group recommendation. Be sure to first consult with a qualified financial adviser, tax professional, and/or legal counsel before implementing any securities, investments, or investment strategies discussed.</p>
              
              <p>Any performance shown by Clockwise Capital for the relevant time periods is based upon composite results of multiple Guttridge Capital Management portfolios and Clockwise Capital portfolios. Portfolio performance is the result of the application of the Clockwise Capital and Guttridge Capital Management&apos;s investment process. The composite includes the All Stock Portfolio managed by Guttridge Capital Management (2014-2016), the separately managed accounts (SMA) (2017-2021) managed by Clockwise Capital, and the model portfolios (Models) (2022-2025) managed by Clockwise Capital.</p>
              
              <p>Portfolio performance is not shown net of the advisory fees as different Independent Advisors using Clockwise Models possess different fees and sample trading costs are based on Clockwise Capital&apos;s Custodians, which are Charles Schwab, Betterment LLC and Altruist. Performance does not reflect the deduction of other fees or expenses, including but not limited to brokerage fees, custodial fees and fees and expenses charged by mutual funds and other investment companies. Performance results shown include the reinvestment of dividends and interest on cash balances where applicable. The data used to calculate the portfolio performance was obtained from sources deemed reliable and then organized and presented by Clockwise Capital. The performance calculations have not been audited by any third party. Actual performance of client portfolios may differ materially due to the timing related to additional client deposits or withdrawals and the actual deployment and investment of a client portfolio, the length of time various positions are held, the client&apos;s objectives and restrictions, and fees and expenses incurred by any specific individual portfolio.</p>
              
              <h3 className="font-bold text-gray-900 pt-4">Benchmarks</h3>
              <p>Performance results shown are compared to the performance of the S&P 500 Index without dividends reinvested. The index results do not reflect fees and expenses and you typically cannot invest in an index.</p>
              
              <h3 className="font-bold text-gray-900 pt-4">Return Comparison</h3>
              <p>The S&P 500 was chosen for comparison as it is generally well recognized as an indicator or representation of the stock market in general and includes a cross section of equity holdings. PAST PERFORMANCE IS NO GUARANTEE OF FUTURE RESULTS.</p>
              
              <h3 className="font-bold text-gray-900 pt-4">Indexes and Benchmarks</h3>
              <p>References to indexes and benchmarks are hypothetical illustrations of aggregate returns and do not reflect the performance of any actual investment. Investors cannot invest in an index.</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>S&P 500 Index TR:</strong> Measures the performance of 500 widely held, large-capitalization US stocks.</li>
                <li><strong>Bloomberg US Aggregate Bond Index:</strong> Measures the U.S. bond market and covers all major types of bonds, including taxable corporate bonds, treasury bonds, and municipal bonds.</li>
                <li><strong>S&P 500 Index Price:</strong> Measures the performance of 500 widely held, large-capitalization US stocks.</li>
              </ul>
              
              <h3 className="font-bold text-gray-900 pt-4">Definitions</h3>
              <ul className="space-y-2">
                <li><strong>Alpha:</strong> the excess return of the investment over the benchmark, after adjusting for risk. A positive value implies that the investment has performed better than expected, relatively to its risk. The benchmark used for alpha calculation in this report is the S&P500 Index Total Return.</li>
                <li><strong>Beta:</strong> the volatility of the investment compared to the volatility of the benchmark. A value lower than 1 indicates that the investment is less volatile than the benchmark. A value greater than 1 indicates a higher volatility. The benchmark used for beta calculation in this report is the S&P500 Index Total Return.</li>
                <li><strong>Fund expense ratio:</strong> for investment funds, the expense ratio as reported in the fund&apos;s prospectus.</li>
                <li><strong>Maximum drawdown:</strong> the largest percent retrenchment from an investment&apos;s peak value to the investment&apos;s valley value for a given period.</li>
                <li><strong>Risk (Standard Deviation):</strong> a measure of dispersion of returns around their historical average. The higher the standard deviation, the more widely the investment&apos;s returns vary over time.</li>
                <li><strong>Sharpe ratio:</strong> compares the investment return against the risk-free return (US Treasury Bill), after adjusting for risk. The greater the Sharpe ratio, the better its risk-adjusted performance.</li>
                <li><strong>Up/Down capture ratio:</strong> shows what portion of a market performance was captured by an investment in up and down markets.</li>
                <li><strong>Yield 12-month:</strong> the sum of distributions from the asset(s) over 12 trailing months, divided by the current market price of the asset(s).</li>
                <li><strong>Yield SEC:</strong> the annualized yield based on the 30-day period ending on the last day of previous month.</li>
              </ul>
              
              <p className="pt-4 text-xs text-gray-500">The information and analysis contained herein does not constitute investment advice offered by Kwanti and Morningstar, and is not warranted to be correct, complete or accurate. Kwanti and Morningstar are not responsible for any damages or losses arising from use of this information and analysis. Asset allocation data ©2024 Morningstar. All rights reserved. The asset allocation data contained herein is proprietary to Morningstar and/or its content providers.</p>
              
              <p className="font-semibold text-gray-900 pt-4">These results are hypothetical. The performance data quoted represents past performance. Past performance does not guarantee future results. Investment return and principal value will fluctuate so that an investor&apos;s shares, when redeemed, may be worth more or less than their original cost.</p>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDisclosureModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard Content */}
      {(mainTab === 'dashboard' || !isMaster) && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
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
      )}
    </div>
  )
}
