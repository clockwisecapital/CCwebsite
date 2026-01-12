# Authentication Fix for API Routes

## Problem
The portfolio dashboard was returning "Unauthorized" errors when fetching portfolios from `/api/portfolios/list`. 

### Root Causes
1. **Missing Authorization Header**: The client-side fetch requests weren't including the Supabase access token in the `Authorization` header
2. **Server-side Client Not Reading Auth**: The `createServerSupabaseClient()` function wasn't configured to read the auth token from request headers or cookies

## Solution

### 1. Updated Server Supabase Client (`src/lib/supabase/server.ts`)
- Made `createServerSupabaseClient()` async
- Added extraction of access token from cookies and Authorization header
- Properly sets the session on the Supabase client using `setSession()`
- Updated `getServerUser()` to await the async client creation

```typescript
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  const headersList = await headers()
  
  // Extract the access token from cookies or Authorization header
  const accessToken = cookieStore.get('sb-access-token')?.value || 
                      headersList.get('authorization')?.replace('Bearer ', '')
  
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    // ... config
  })
  
  // Set session if we have an access token
  if (accessToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: cookieStore.get('sb-refresh-token')?.value || '',
    })
  }
  
  return client
}
```

### 2. Updated API Routes
Updated all portfolio API routes to await the async `createServerSupabaseClient()`:
- `src/app/api/portfolios/list/route.ts` (GET)
- `src/app/api/portfolios/[id]/route.ts` (GET, PUT, DELETE)
- `src/app/api/portfolios/save/route.ts` (POST)

### 3. Updated Dashboard Page (`src/app/dashboard/page.tsx`)
Added Authorization headers to all API fetch requests:

```typescript
// Get the current session to include auth token
const { data: { session } } = await supabase.auth.getSession();
const headers: HeadersInit = {};

if (session?.access_token) {
  headers['Authorization'] = `Bearer ${session.access_token}`;
}

const response = await fetch('/api/portfolios/list', { headers });
```

Updated functions:
- `fetchPortfolios()` - Fetches list of user portfolios
- `handleRename()` - Renames a portfolio
- `handleDelete()` - Deletes a portfolio

## How It Works

### Client-Side Flow
1. User authenticates via Supabase Auth
2. Supabase stores session (access_token + refresh_token) in localStorage
3. When making API calls, we:
   - Get the current session using `supabase.auth.getSession()`
   - Extract the `access_token`
   - Include it in the `Authorization: Bearer <token>` header

### Server-Side Flow
1. API route receives request with Authorization header
2. `createServerSupabaseClient()` extracts the token from:
   - `Authorization` header (for explicit client requests)
   - Cookies (for SSR/server components)
3. Sets the session on the Supabase client
4. Supabase client now knows the authenticated user
5. Row Level Security (RLS) automatically filters queries by user_id

## Testing
After this fix:
- ✅ Dashboard should load user's portfolios without "Unauthorized" error
- ✅ Rename portfolio should work
- ✅ Delete portfolio should work
- ✅ RLS policies ensure users only see their own data

## Build Error Fix

After implementing the server-side authentication, a build error occurred:
```
You're importing a component that needs "next/headers". That only works in a Server Component
```

### Cause
The `server.ts` file now imports `next/headers` (for cookies/headers), which is server-only. When client components imported from the barrel file (`@/lib/supabase`), it tried to evaluate `server.ts`, causing the error.

### Solution
Updated client components to import directly from `@/lib/supabase/client` instead of the barrel file:
- `src/lib/auth/AuthContext.tsx`
- `src/app/dashboard/page.tsx`

**Before:**
```typescript
import { supabase } from '@/lib/supabase';
```

**After:**
```typescript
import { supabase } from '@/lib/supabase/client';
```

Server-side code (API routes) can continue importing from the barrel file since they run on the server.

## Next Steps
This fix resolves the immediate authentication issue. Future enhancements:
1. Create a reusable helper function for making authenticated API calls
2. Add proper error handling for expired tokens
3. Implement token refresh logic if needed

