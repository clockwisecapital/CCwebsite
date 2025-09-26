'use client'

import { useState, useEffect } from 'react'
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
  HiArrowDownTray
} from 'react-icons/hi2'
import type { DisplaySpec, DisplayBlock } from '@/lib/supabase/types'

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
  conversations: Array<{
    id: string
    user_email: string
    created_at: string
    leadScore: number
    status: string
    goals: { type?: string; amount?: number; timeline?: number }
    portfolio: { value?: number; holdings: number; newInvestor?: boolean }
    hasAnalysis: boolean
    lastActivity: string
  }>
  lastUpdated: string
}

type TimelineItem = { timestamp: string; event: string; description?: string }
type MessageItem = { id: string; role: 'user' | 'assistant'; created_at: string; content: string | null; display_spec?: unknown }
type LeadScore = number | { total: number; breakdown?: Record<string, number> }
type ConversationDetail = {
  id: string
  user_email: string | null
  created_at: string
  leadScore: LeadScore
  timeline: TimelineItem[]
  messages: MessageItem[]
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('week')
  const [sortBy, setSortBy] = useState('leadScore')
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [timeframe])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/dashboard?timeframe=${timeframe}&limit=100`)
      
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.message || 'Failed to fetch data')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Conversation detail modal state and handlers
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detail, setDetail] = useState<ConversationDetail | null>(null)

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
    } catch (e) {
      setDetailError('Network error. Please try again.')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeConversation = () => {
    setIsDetailOpen(false)
    setDetail(null)
  }

  const sortedConversations = data?.conversations.sort((a, b) => {
    switch (sortBy) {
      case 'leadScore':
        return b.leadScore - a.leadScore
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'portfolioValue':
        return (b.portfolio.value || 0) - (a.portfolio.value || 0)
      default:
        return b.leadScore - a.leadScore
    }
  }) || []

  // Helper: render a DisplaySpec block array into readable HTML
  const renderDisplaySpec = (spec: unknown) => {
    const ds = spec as Partial<DisplaySpec> | null
    if (!ds || !Array.isArray(ds.blocks)) {
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
          } catch (_) {
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
      {/* Admin Dashboard Content - Add top padding to account for fixed header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Business Intelligence & Lead Management</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          </div>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900">{data?.stats.total.conversations}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <HiChatBubbleLeftRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Unique Emails</p>
                <p className="text-3xl font-bold text-gray-900">{data?.stats.total.emails}</p>
                <p className="text-xs text-gray-500 mt-1">Qualified leads</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <HiEnvelope className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completed Analysis</p>
                <p className="text-3xl font-bold text-gray-900">{data?.stats.total.completed}</p>
                <p className="text-xs text-gray-500 mt-1">Full conversions</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <HiChartBar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Lead Score</p>
                <p className="text-3xl font-bold text-gray-900">{Math.round(data?.stats.conversion.averageLeadScore || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Quality metric</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <HiBolt className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <HiChartBar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Investment Goals Distribution</h3>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                <HiCurrencyDollar className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Portfolio Size Distribution</h3>
            </div>
            <div className="space-y-4">
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

        {/* Conversations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-2 bg-slate-100 rounded-lg mr-3">
                  <HiUsers className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Conversations</h3>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="leadScore">Sort by Lead Score</option>
                  <option value="created_at">Sort by Date</option>
                  <option value="portfolioValue">Sort by Portfolio Value</option>
                </select>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center space-x-2">
                  <HiArrowDownTray className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <HiUser className="w-4 h-4" />
                      <span>Contact</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <HiBolt className="w-4 h-4" />
                      <span>Score</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <HiCheckCircle className="w-4 h-4" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <HiChartBar className="w-4 h-4" />
                      <span>Goals</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <HiCurrencyDollar className="w-4 h-4" />
                      <span>Portfolio</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <HiCalendarDays className="w-4 h-4" />
                      <span>Created</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedConversations.slice(0, 50).map((conversation) => (
                  <tr
                    key={conversation.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => openConversation(conversation.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-medium text-sm">
                            {conversation.user_email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{conversation.user_email}</div>
                          <div className="text-xs text-gray-500">{conversation.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
                        conversation.leadScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        conversation.leadScore >= 60 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {conversation.leadScore >= 80 && <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                        {conversation.leadScore}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        conversation.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        conversation.status === 'Portfolio Collected' ? 'bg-blue-100 text-blue-800' :
                        conversation.status === 'Goals Collected' ? 'bg-purple-100 text-purple-800' :
                        conversation.status === 'Email Captured' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {conversation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conversation.goals.type ? (
                        <div>
                          <div className="font-medium capitalize">{conversation.goals.type}</div>
                          {conversation.goals.amount && (
                            <div className="text-xs text-gray-500">${conversation.goals.amount.toLocaleString()}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No data</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-sm">{new Date(conversation.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">{new Date(conversation.created_at).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversation Detail Modal */}
        {isDetailOpen && (
          <div
            className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 md:p-8"
            onClick={closeConversation}
          >
            <div
              className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="conv-title"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h2 id="conv-title" className="text-xl font-semibold text-gray-900">
                    {(detail?.user_email || 'Conversation')} • {detail?.id?.slice(0, 8) || ''}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {detail?.created_at ? `Started ${new Date(detail.created_at).toLocaleString()}` : ''}
                  </p>
                </div>
                <button
                  onClick={closeConversation}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>

              {detailLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : detailError ? (
                <div className="p-6 text-red-600">{detailError}</div>
              ) : detail ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                  <div className="md:col-span-1 border-r p-6 space-y-6">
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
                        {(typeof detail.leadScore === 'number' ? detail.leadScore : (detail.leadScore?.total ?? 0)) ?? 0}
                      </div>
                      {(typeof detail.leadScore === 'object' && detail.leadScore?.breakdown) && (
                        <ul className="mt-3 space-y-1 text-sm text-gray-700">
                          {Object.entries(detail.leadScore.breakdown as Record<string, number>).map(([k, v]) => (
                            <li key={k} className="flex justify-between">
                              <span>{k}</span>
                              <span className="font-medium">{v}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h3>
                      <ol className="space-y-3">
                        {(detail.timeline || []).map((t: TimelineItem, idx: number) => (
                          <li key={idx} className="text-sm">
                            <div className="text-gray-900">{t.event}</div>
                            <div className="text-gray-500">{new Date(t.timestamp).toLocaleString()}</div>
                            {t.description && <div className="text-gray-600">{t.description}</div>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  <div className="md:col-span-2 p-6 max-h-[70vh] overflow-y-auto">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Messages</h3>
                    <div className="space-y-4">
                    {(detail.messages || []).map((m: MessageItem) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg border ${
                          m.role === 'user' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-medium ${
                              m.role === 'user' ? 'text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            {m.role === 'user' ? 'User' : 'Assistant'}
                          </span>
                          <span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        {renderMessageBody(m)}
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-gray-500">Select a conversation to view details.</div>
              )}
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
