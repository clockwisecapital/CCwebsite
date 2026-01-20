/**
 * API Route: /api/community/questions
 * Handles listing and creating scenario questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CreateScenarioQuestionInput } from '@/types/community';

// =====================================================================================
// GET /api/community/questions
// List questions with filtering and pagination
// =====================================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tag = searchParams.get('tag');
    
    // Get current user (optional - for personalization)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Build query based on filter
    let query = supabase
      .from('scenario_questions')
      .select(`
        *,
        author:users!scenario_questions_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('is_active', true);
    
    // Apply tag filter
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    // Apply sorting based on filter
    switch (filter) {
      case 'trending':
        // For trending, use the helper function
        const { data: trendingData, error: trendingError } = await (supabase as any)
          .rpc('get_trending_questions', { limit_count: limit });
        
        if (trendingError) {
          console.error('Trending query error:', trendingError);
          // Fallback to recent if trending fails
          query = query.order('created_at', { ascending: false });
          break;
        }
        
        // If no trending data, return empty
        if (!trendingData || trendingData.length === 0) {
          return NextResponse.json({
            success: true,
            questions: [],
            total: 0,
            hasMore: false
          });
        }
        
        // Get full details for trending questions
        const trendingIds = trendingData.map((q: any) => q.id);
        const { data: fullTrendingData, error: fullTrendingError } = await supabase
          .from('scenario_questions')
          .select(`
            *,
            author:users!scenario_questions_user_id_fkey(
              id,
              email,
              first_name,
              last_name
            )
          `)
          .in('id', trendingIds);
        
        if (fullTrendingError) {
          console.error('Full trending data error:', fullTrendingError);
          // Fallback to recent if details fetch fails
          query = query.order('created_at', { ascending: false });
          break;
        }
        
        // Sort by trending score
        const sortedTrending = (fullTrendingData || []).sort((a, b) => {
          const scoreA = trendingData.find((t: any) => t.id === a.id)?.trending_score || 0;
          const scoreB = trendingData.find((t: any) => t.id === b.id)?.trending_score || 0;
          return scoreB - scoreA;
        });
        
        return NextResponse.json({
          success: true,
          questions: sortedTrending.slice(offset, offset + limit),
          total: sortedTrending.length,
          hasMore: offset + limit < sortedTrending.length
        });
        
      case 'top':
        query = query.order('likes_count', { ascending: false });
        break;
        
      case 'discussed':
        query = query.order('comments_count', { ascending: false });
        break;
        
      case 'following':
        // Only available for authenticated users
        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required for following feed' },
            { status: 401 }
          );
        }
        
        // Get users that current user follows
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        if (follows && follows.length > 0) {
          const followingIds = follows.map(f => f.following_id);
          query = query.in('user_id', followingIds);
        } else {
          // No follows, return empty
          return NextResponse.json({
            success: true,
            questions: [],
            total: 0,
            hasMore: false
          });
        }
        query = query.order('created_at', { ascending: false });
        break;
        
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data: questions, error, count } = await query;
    
    if (error) {
      console.error('Questions query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions', details: error.message },
        { status: 500 }
      );
    }
    
    // If user is authenticated, check which questions they've liked and which authors they follow
    if (user && questions) {
      const questionIds = questions.map(q => q.id);
      const authorIds = questions.map(q => q.user_id);
      
      // Get liked questions
      const { data: likes } = await supabase
        .from('question_likes')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', questionIds);
      
      const likedQuestionIds = new Set(likes?.map(l => l.question_id) || []);
      
      // Get followed authors
      const { data: followedAuthors } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', authorIds);
      
      const followedAuthorIds = new Set(followedAuthors?.map(f => f.following_id) || []);
      
      // Add flags to questions
      questions.forEach((q: any) => {
        q.is_liked_by_user = likedQuestionIds.has(q.id);
        q.is_following_author = followedAuthorIds.has(q.user_id);
      });
      
      // Debug: Log likes data for authenticated users
      console.log('👤 User:', user.id);
      console.log('❤️ Liked question IDs:', Array.from(likedQuestionIds));
      console.log('📋 Questions being returned:', questions.map((q: any) => ({
        id: q.id,
        title: q.title.substring(0, 30),
        likes_count: q.likes_count,
        is_liked_by_user: q.is_liked_by_user
      })));
    }
    
    return NextResponse.json({
      success: true,
      questions: questions || [],
      total: count || questions?.length || 0,
      hasMore: questions ? questions.length === limit : false
    });
    
  } catch (error: any) {
    console.error('Unexpected error in GET /api/community/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================================
// POST /api/community/questions
// Create a new scenario question
// =====================================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in to create questions' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body: CreateScenarioQuestionInput = await request.json();
    
    // Validate required fields
    if (!body.title || body.title.length < 5 || body.title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 200 characters' },
        { status: 400 }
      );
    }
    
    // Description is optional, but if provided must be valid
    if (body.description && (body.description.length < 10 || body.description.length > 2000)) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 2000 characters if provided' },
        { status: 400 }
      );
    }
    
    if (!body.question_text || body.question_text.length < 10 || body.question_text.length > 500) {
      return NextResponse.json(
        { error: 'Question text must be between 10 and 500 characters' },
        { status: 400 }
      );
    }
    
    // Insert question
    const { data: question, error: insertError } = await supabase
      .from('scenario_questions')
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        question_text: body.question_text.trim(),
        historical_period: (body.historical_period || []) as any,
        tags: body.tags || [],
        metadata: body.metadata || {} // Store metadata including S&P 500 return
      })
      .select(`
        *,
        author:users!scenario_questions_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .single();
    
    if (insertError) {
      console.error('Question insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create question', details: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      question
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Unexpected error in POST /api/community/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
