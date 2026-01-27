# Supabase User Deletion Guide

## Problem
When trying to delete a user from the Supabase Authentication tab, you encounter the error:
```
Failed to delete user: Database error deleting use
```

This happens because users in `auth.users` have related records in multiple tables that need to be cleaned up first.

## Solution

I've created **3 different methods** to delete users. Choose the one that works best for your situation:

---

## Method 1: Using SQL Script (Recommended for Direct Deletion)

### Steps:

1. **Run the migration first** (if not already done):
   - Go to Supabase Dashboard → SQL Editor
   - Open and run: `supabase/migrations/027_fix_user_deletion_cascade.sql`
   - This ensures all CASCADE constraints are properly set up

2. **Use the deletion script**:
   - Open: `supabase/scripts/delete-auth-user.sql`
   - Replace `'USER_EMAIL_HERE'` with the actual user email
   - Run STEP 1 to see what will be deleted
   - If you're sure, uncomment STEP 2 and run again to delete

### Example:
```sql
-- Change this line:
v_user_email TEXT := 'john.doe@example.com'; -- The user you want to delete
```

---

## Method 2: Using the Admin API Endpoint

### Steps:

1. **Deploy the new API endpoint**:
   ```bash
   npm run build
   ```

2. **Use the API to delete users**:
   ```bash
   # First, get info about what will be deleted
   GET /api/admin/users/delete-auth-user?userId=USER_UUID_HERE

   # Then delete the user
   DELETE /api/admin/users/delete-auth-user?userId=USER_UUID_HERE
   ```

### From your admin panel (future enhancement):
You can add a button in `src/app/admin/users/page.tsx` to call this API endpoint.

---

## Method 3: Directly in Supabase SQL Editor (Quick Fix)

If you just need to delete a user **right now**, run this in the Supabase SQL Editor:

```sql
-- Replace with the actual user email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'USER_EMAIL@example.com';
  
  -- Delete all related records
  DELETE FROM public.portfolio_rankings 
    WHERE portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = v_user_id);
  DELETE FROM public.user_follows WHERE follower_id = v_user_id OR following_id = v_user_id;
  DELETE FROM public.comment_likes WHERE user_id = v_user_id;
  DELETE FROM public.question_likes WHERE user_id = v_user_id;
  DELETE FROM public.question_tests WHERE user_id = v_user_id;
  DELETE FROM public.question_comments WHERE user_id = v_user_id;
  DELETE FROM public.scenario_questions WHERE user_id = v_user_id;
  DELETE FROM public.portfolios WHERE user_id = v_user_id;
  DELETE FROM public.users WHERE id = v_user_id;
  
  -- Finally delete from auth
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RAISE NOTICE 'User deleted successfully';
END $$;
```

---

## What These Solutions Fix

1. **Cascade Issues**: Ensures all foreign key constraints have `ON DELETE CASCADE`
2. **Related Records**: Explicitly deletes records in the correct order:
   - Portfolio rankings
   - User follows
   - Comment likes
   - Question likes
   - Question tests
   - Question comments
   - Scenario questions
   - Portfolios
   - Public user profile
   - Auth user (finally)

3. **Error Reporting**: Better error messages so you can see exactly what's wrong

---

## Why This Was Happening

Your database has this structure:
```
auth.users (Supabase Auth)
    ↓ (CASCADE)
public.users
    ↓ (CASCADE)
portfolios, scenario_questions, comments, etc.
```

When deleting from the Supabase Authentication tab, it tries to delete from `auth.users`, but if any table's CASCADE wasn't properly set up, or if there's a constraint without CASCADE, the deletion fails.

The migration and scripts I created ensure all related records are deleted in the correct order.

---

## Testing

To test that it works:

1. Create a test user in Supabase Auth
2. Have them create a portfolio or question
3. Use one of the methods above to delete them
4. Verify they're gone from:
   - Authentication tab
   - public.users table
   - All related tables

---

## Need Help?

If you still get errors:

1. Run Method 1 STEP 1 to see what records exist
2. Check the error message in the Supabase logs
3. The error will tell you which table/constraint is causing issues

Common issues:
- **"violates foreign key constraint"**: Run migration 027 first
- **"permission denied"**: Use service role key or run in SQL Editor
- **"function does not exist"**: Run migration 027 first
