/**
 * Client Assignments API
 * 
 * Manages client/conversation assignments to advisory firms
 * Master role only for assignment operations
 * 
 * GET /api/admin/assignments - Get all assignments or filter by firm
 * POST /api/admin/assignments - Assign client(s) to a firm
 * DELETE /api/admin/assignments - Unassign client(s)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenPayload, isMasterRole, ADVISORY_FIRMS } from '@/lib/auth/admin'
import { createAdminSupabaseClient } from '@/lib/supabase/index'

interface AssignmentRecord {
  id: string
  conversation_id: string
  assigned_to_firm: string
  assigned_by: string
  notes: string | null
  assigned_at: string
  updated_at: string
}

/**
 * GET - Retrieve assignments
 */
export async function GET(request: NextRequest) {
  try {
    const tokenResult = await getAdminTokenPayload(request)
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const firm = searchParams.get('firm')
    const conversationId = searchParams.get('conversationId')

    let query = supabase.from('client_assignments').select('*')

    // Filter by firm if specified
    if (firm) {
      query = query.eq('assigned_to_firm', firm)
    }

    // Filter by conversation if specified
    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    }

    const { data: assignments, error } = await query.order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    // For advisors, only show their firm's assignments
    let filteredAssignments = assignments as AssignmentRecord[]
    if (!isMasterRole(tokenResult.payload)) {
      filteredAssignments = filteredAssignments.filter(
        a => a.assigned_to_firm === tokenResult.payload?.firmName
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        assignments: filteredAssignments,
        firms: ADVISORY_FIRMS
      }
    })

  } catch (error) {
    console.error('Assignments GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create or update assignments
 * Master role only
 */
export async function POST(request: NextRequest) {
  try {
    const tokenResult = await getAdminTokenPayload(request)
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only master role can assign
    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Only master role can assign clients' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { conversationIds, firmName, notes } = body as {
      conversationIds: string | string[]
      firmName: string
      notes?: string
    }

    // Validate firm name
    if (!firmName || !ADVISORY_FIRMS.includes(firmName as typeof ADVISORY_FIRMS[number])) {
      return NextResponse.json(
        { success: false, message: 'Invalid firm name' },
        { status: 400 }
      )
    }

    // Normalize to array
    const ids = Array.isArray(conversationIds) ? conversationIds : [conversationIds]
    
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No conversation IDs provided' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Upsert assignments (update if exists, insert if not)
    const assignmentsToUpsert = ids.map(id => ({
      conversation_id: id,
      assigned_to_firm: firmName,
      assigned_by: tokenResult.payload!.username,
      notes: notes || null,
      assigned_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('client_assignments')
      .upsert(assignmentsToUpsert, {
        onConflict: 'conversation_id',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('Error creating assignments:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${ids.length} client(s) to ${firmName}`,
      data: {
        assignments: data,
        count: ids.length
      }
    })

  } catch (error) {
    console.error('Assignments POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create assignments' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove assignments
 * Master role only
 */
export async function DELETE(request: NextRequest) {
  try {
    const tokenResult = await getAdminTokenPayload(request)
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only master role can unassign
    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Only master role can unassign clients' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { conversationIds } = body as { conversationIds: string | string[] }

    // Normalize to array
    const ids = Array.isArray(conversationIds) ? conversationIds : [conversationIds]
    
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No conversation IDs provided' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    const { error } = await supabase
      .from('client_assignments')
      .delete()
      .in('conversation_id', ids)

    if (error) {
      console.error('Error deleting assignments:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to delete assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unassigned ${ids.length} client(s)`,
      data: {
        count: ids.length
      }
    })

  } catch (error) {
    console.error('Assignments DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete assignments' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Bulk assignment with filters
 * Master role only
 */
export async function PATCH(request: NextRequest) {
  try {
    const tokenResult = await getAdminTokenPayload(request)
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only master role can bulk assign
    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Only master role can bulk assign clients' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      firmName, 
      filters,
      notes 
    } = body as {
      firmName: string
      filters: {
        minLeadScore?: number
        maxLeadScore?: number
        status?: string
        unassignedOnly?: boolean
        minPortfolioValue?: number
        maxPortfolioValue?: number
      }
      notes?: string
    }

    // Validate firm name
    if (!firmName || !ADVISORY_FIRMS.includes(firmName as typeof ADVISORY_FIRMS[number])) {
      return NextResponse.json(
        { success: false, message: 'Invalid firm name' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Get all conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')

    if (convError) {
      console.error('Error fetching conversations:', convError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // Get existing assignments if filtering by unassigned
    let existingAssignments: Set<string> = new Set()
    if (filters.unassignedOnly) {
      const { data: assignments } = await supabase
        .from('client_assignments')
        .select('conversation_id')
      
      assignments?.forEach(a => existingAssignments.add(a.conversation_id))
    }

    // Get user_data for additional filtering
    const { data: userData } = await supabase
      .from('user_data')
      .select('conversation_id, goals, portfolio_data, analysis_results')

    const userDataMap = new Map<string, {
      goals?: Record<string, unknown>
      portfolio_data?: { portfolio_value?: number }
      analysis_results?: unknown
    }>()
    
    userData?.forEach(ud => {
      userDataMap.set(ud.conversation_id, {
        goals: ud.goals as Record<string, unknown>,
        portfolio_data: ud.portfolio_data as { portfolio_value?: number },
        analysis_results: ud.analysis_results
      })
    })

    // Apply filters
    let filteredIds = conversations?.map(c => c.id) || []

    // Filter by unassigned
    if (filters.unassignedOnly) {
      filteredIds = filteredIds.filter(id => !existingAssignments.has(id))
    }

    // Filter by portfolio value
    if (filters.minPortfolioValue !== undefined || filters.maxPortfolioValue !== undefined) {
      filteredIds = filteredIds.filter(id => {
        const data = userDataMap.get(id)
        const value = data?.portfolio_data?.portfolio_value
        if (value === undefined) return false
        if (filters.minPortfolioValue !== undefined && value < filters.minPortfolioValue) return false
        if (filters.maxPortfolioValue !== undefined && value > filters.maxPortfolioValue) return false
        return true
      })
    }

    // Filter by status (has analysis)
    if (filters.status === 'completed') {
      filteredIds = filteredIds.filter(id => {
        const data = userDataMap.get(id)
        return !!data?.analysis_results
      })
    }

    if (filteredIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No clients match the specified filters',
        data: { count: 0 }
      })
    }

    // Create assignments
    const assignmentsToUpsert = filteredIds.map(id => ({
      conversation_id: id,
      assigned_to_firm: firmName,
      assigned_by: tokenResult.payload!.username,
      notes: notes || `Bulk assigned via filters`,
      assigned_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('client_assignments')
      .upsert(assignmentsToUpsert, {
        onConflict: 'conversation_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error bulk assigning:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to bulk assign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${filteredIds.length} client(s) to ${firmName}`,
      data: {
        count: filteredIds.length,
        firmName
      }
    })

  } catch (error) {
    console.error('Assignments PATCH error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to bulk assign' },
      { status: 500 }
    )
  }
}

