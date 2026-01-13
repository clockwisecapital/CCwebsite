/**
 * Community Features Types
 * Types for scenario questions, comments, likes, and social engagement
 */

// =====================================================================================
// SCENARIO QUESTION TYPES
// =====================================================================================

export interface HistoricalPeriod {
  start: string; // Year
  end: string; // Year
  label: string; // e.g., "Pre-GFC", "Dot-Com Bust"
}

export interface ScenarioQuestionBase {
  id: string;
  user_id: string;
  title: string;
  description: string;
  question_text: string;
  historical_period: HistoricalPeriod[];
  tags: string[];
  likes_count: number;
  comments_count: number;
  tests_count: number;
  views_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  metadata: Record<string, any>;
}

export interface ScenarioQuestionWithAuthor extends ScenarioQuestionBase {
  author: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  is_liked_by_user?: boolean;
  is_following_author?: boolean;
}

export interface CreateScenarioQuestionInput {
  title: string;
  description?: string;
  question_text: string;
  historical_period?: HistoricalPeriod[];
  tags?: string[];
}

export interface UpdateScenarioQuestionInput {
  title?: string;
  description?: string;
  question_text?: string;
  historical_period?: HistoricalPeriod[];
  tags?: string[];
  is_active?: boolean;
}

// =====================================================================================
// QUESTION LIKE TYPES
// =====================================================================================

export interface QuestionLike {
  id: string;
  question_id: string;
  user_id: string;
  created_at: string;
}

// =====================================================================================
// COMMENT TYPES
// =====================================================================================

export interface QuestionCommentBase {
  id: string;
  question_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  likes_count: number;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface QuestionCommentWithAuthor extends QuestionCommentBase {
  author: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  is_liked_by_user?: boolean;
  replies?: QuestionCommentWithAuthor[];
}

export interface CreateCommentInput {
  question_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface UpdateCommentInput {
  content: string;
}

// =====================================================================================
// COMMENT LIKE TYPES
// =====================================================================================

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

// =====================================================================================
// QUESTION TEST TYPES
// =====================================================================================

export interface QuestionTest {
  id: string;
  question_id: string;
  portfolio_id: string;
  user_id: string;
  score: number;
  expected_return: number;
  upside: number;
  downside: number;
  comparison_data: Record<string, any>; // PortfolioComparison object
  is_public: boolean;
  created_at: string;
  metadata: Record<string, any>;
}

export interface QuestionTestWithDetails extends QuestionTest {
  portfolio_name: string;
  user: {
    id: string;
    email: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface CreateQuestionTestInput {
  question_id: string;
  portfolio_id: string;
  score: number;
  expected_return: number;
  upside: number;
  downside: number;
  comparison_data: Record<string, any>;
  is_public?: boolean;
}

// =====================================================================================
// USER FOLLOW TYPES
// =====================================================================================

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// =====================================================================================
// FEED & FILTER TYPES
// =====================================================================================

export type FeedFilter = 'trending' | 'recent' | 'top' | 'discussed' | 'following';

export interface FeedOptions {
  filter: FeedFilter;
  limit?: number;
  offset?: number;
  tag?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// =====================================================================================
// LEADERBOARD TYPES
// =====================================================================================

export interface QuestionLeaderboardEntry {
  rank: number;
  portfolio_id: string;
  portfolio_name: string;
  user_id: string;
  username?: string;
  display_name?: string;
  score: number;
  expected_return: number;
  upside: number;
  downside: number;
  tested_at: string;
}

// =====================================================================================
// NOTIFICATION TYPES (for future use)
// =====================================================================================

export type NotificationType = 
  | 'question_like' 
  | 'question_comment' 
  | 'comment_reply' 
  | 'comment_like'
  | 'new_follower'
  | 'follower_question';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string; // User who triggered the notification
  question_id?: string;
  comment_id?: string;
  is_read: boolean;
  created_at: string;
}

// =====================================================================================
// USER PROFILE TYPES
// =====================================================================================

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  questions_count: number;
  is_following?: boolean; // For current user context
}

// =====================================================================================
// ENGAGEMENT STATS
// =====================================================================================

export interface EngagementStats {
  likes: number;
  comments: number;
  tests: number;
  views: number;
  shares?: number;
}

// =====================================================================================
// TRENDING SCORE
// =====================================================================================

export interface TrendingQuestion extends ScenarioQuestionWithAuthor {
  trending_score: number;
}
