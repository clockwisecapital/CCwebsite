/**
 * Supabase Integration Test
 * 
 * Simple test to verify Supabase connection and basic CRUD operations
 * Run this to ensure everything is working properly
 */

import { 
  createAdminSupabaseClient,
  createConversation,
  saveMessage,
  saveUserData,
  getConversationBySessionId,
  initializeSession
} from './index'

export async function testSupabaseIntegration() {
  console.log('🧪 Starting Supabase Integration Test...\n')

  try {
    // Test 1: Basic Connection
    console.log('1️⃣ Testing basic connection...')
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase.from('conversations').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    console.log('✅ Connection successful!\n')

    // Test 2: Create Conversation
    console.log('2️⃣ Testing conversation creation...')
    const testSessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const testEmail = 'test@clockwisecapital.com'
    
    const conversation = await createConversation({
      userEmail: testEmail,
      sessionId: testSessionId,
      metadata: { test: true, created_by: 'integration_test' }
    })

    if (!conversation) {
      console.error('❌ Failed to create conversation')
      return false
    }
    console.log('✅ Conversation created:', conversation.id)
    console.log('   Session ID:', conversation.session_id)
    console.log('   Email:', conversation.user_email, '\n')

    // Test 3: Save Message
    console.log('3️⃣ Testing message saving...')
    const testMessage = await saveMessage({
      conversationId: conversation.id,
      role: 'user',
      content: 'Hello, this is a test message!',
      displaySpec: {
        blocks: [
          {
            type: 'summary_bullets',
            content: JSON.stringify(['Test message', 'Integration test'])
          }
        ]
      },
      metadata: { test: true }
    })

    if (!testMessage) {
      console.error('❌ Failed to save message')
      return false
    }
    console.log('✅ Message saved:', testMessage.id)
    console.log('   Role:', testMessage.role)
    console.log('   Content:', testMessage.content, '\n')

    // Test 4: Save User Data
    console.log('4️⃣ Testing user data saving...')
    const testUserData = await saveUserData({
      conversationId: conversation.id,
      goals: {
        goal_type: 'growth',
        target_amount: 100000,
        timeline_years: 10
      },
      portfolio: {
        portfolio_value: 50000,
        holdings: [
          { name: 'AAPL', value: 25000 },
          { name: 'MSFT', value: 25000 }
        ],
        new_investor: false
      },
      analysis: {
        beta: 1.2,
        volatility: 0.15,
        risk_score: 7,
        recommendations: ['Diversify holdings', 'Consider bonds']
      }
    })

    if (!testUserData) {
      console.error('❌ Failed to save user data')
      return false
    }
    console.log('✅ User data saved:', testUserData.id)
    console.log('   Goals:', testUserData.goals)
    console.log('   Portfolio value:', (testUserData.portfolio_data as any)?.portfolio_value, '\n')

    // Test 5: Retrieve Conversation
    console.log('5️⃣ Testing conversation retrieval...')
    const retrievedConversation = await getConversationBySessionId(testSessionId)
    
    if (!retrievedConversation) {
      console.error('❌ Failed to retrieve conversation')
      return false
    }
    console.log('✅ Conversation retrieved:', retrievedConversation.id)
    console.log('   Matches original:', retrievedConversation.id === conversation.id, '\n')

    // Test 6: Initialize Session (Full Integration)
    console.log('6️⃣ Testing session initialization...')
    const sessionData = await initializeSession(testSessionId, testEmail)
    
    if (!sessionData.conversation || !sessionData.userData || sessionData.messages.length === 0) {
      console.error('❌ Session initialization incomplete')
      console.log('   Conversation:', !!sessionData.conversation)
      console.log('   User Data:', !!sessionData.userData)
      console.log('   Messages:', sessionData.messages.length)
      return false
    }
    console.log('✅ Session initialized successfully!')
    console.log('   Conversation ID:', sessionData.conversation.id)
    console.log('   User Data ID:', sessionData.userData.id)
    console.log('   Messages count:', sessionData.messages.length, '\n')

    // Test 7: Cleanup (Optional)
    console.log('7️⃣ Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation.id)

    if (deleteError) {
      console.warn('⚠️ Cleanup warning:', deleteError.message)
    } else {
      console.log('✅ Test data cleaned up\n')
    }

    console.log('🎉 All tests passed! Supabase integration is working correctly.')
    return true

  } catch (error) {
    console.error('💥 Test failed with error:', error)
    return false
  }
}

// Export for easy testing
export default testSupabaseIntegration
