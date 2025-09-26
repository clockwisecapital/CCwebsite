/**
 * Supabase Integration - Main Export File
 * 
 * Clean imports for Supabase functionality throughout the app
 */

// Client exports
export { createClient, supabase } from './client'

// Server exports
export { 
  createServerSupabaseClient, 
  createAdminSupabaseClient,
  getServerUser 
} from './server'

// Database utilities
export {
  createConversation,
  getConversationBySessionId,
  updateConversation,
  saveMessage,
  getConversationMessages,
  saveUserData,
  getUserData,
  initializeSession,
  saveSessionState,
  getConversationAnalytics
} from './database'

// Types
export type {
  Database,
  Conversation,
  ConversationInsert,
  ConversationUpdate,
  Message,
  MessageInsert,
  MessageUpdate,
  UserData,
  UserDataInsert,
  UserDataUpdate,
  SessionData,
  DisplaySpec,
  DisplayBlock
} from './types.js'
