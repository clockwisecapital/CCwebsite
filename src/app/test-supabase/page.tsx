'use client'

import { useState } from 'react'

export default function TestSupabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  type ApiResult = { success: boolean; message: string; error?: string; timestamp?: string }
  const [result, setResult] = useState<ApiResult | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-supabase', {
        method: 'GET',
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to run test',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Supabase Integration Test
          </h1>
          
          <p className="text-gray-600 mb-6">
            This page tests the Supabase integration by running a series of database operations
            including creating conversations, saving messages, and storing user data.
          </p>

          <button
            onClick={runTest}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Tests...
              </>
            ) : (
              'Run Integration Test'
            )}
          </button>

          {result && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              
              <div className={`p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">
                    {result.success ? '✅' : '❌'}
                  </span>
                  <span className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Success!' : 'Failed'}
                  </span>
                </div>
                
                <p className={`${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {result.error && (
                  <div className="mt-3 p-3 bg-red-100 rounded border-l-4 border-red-400">
                    <p className="text-red-700 font-mono text-sm">
                      Error: {result.error}
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-3">
                  Timestamp: {result.timestamp}
                </p>
              </div>

              {result.success && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">What was tested:</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>✓ Database connection</li>
                    <li>✓ Conversation creation</li>
                    <li>✓ Message saving with DisplaySpec</li>
                    <li>✓ User data storage (goals, portfolio, analysis)</li>
                    <li>✓ Data retrieval</li>
                    <li>✓ Session initialization</li>
                    <li>✓ Data cleanup</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Next Steps:</h3>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>1. Make sure your Supabase environment variables are set in .env</li>
              <li>2. Verify the database schema has been applied</li>
              <li>3. Check the browser console and server logs for detailed output</li>
              <li>4. If tests pass, the integration is ready for production use!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
