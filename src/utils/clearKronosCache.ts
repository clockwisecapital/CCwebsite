/**
 * Utility to clear all Kronos-related cache data
 * Use this when you need to force a fresh start
 */
export function clearKronosCache() {
  try {
    const keys = [
      'kronos-dashboard-state',
      'kronos_intelligence_notification',
      'kronos_intelligence_viewed'
    ];
    
    keys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared: ${key}`);
    });
    
    console.log('✅ All Kronos cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear Kronos cache:', error);
    return false;
  }
}

/**
 * Check if cached data belongs to current user
 * Returns true if cache is valid, false if it should be cleared
 */
export function validateKronosCache(currentUserId: string | null | undefined): boolean {
  try {
    const savedState = localStorage.getItem('kronos-dashboard-state');
    if (!savedState) {
      console.log('📭 No cache to validate');
      return true; // No cache is valid (fresh start)
    }
    
    const parsed = JSON.parse(savedState);
    const cachedUserId = parsed.userId;
    
    // Both are guests (no userId)
    if (!cachedUserId && !currentUserId) {
      console.log('✅ Cache valid: Both guest sessions');
      return true;
    }
    
    // User IDs match
    if (cachedUserId && currentUserId && cachedUserId === currentUserId) {
      console.log('✅ Cache valid: User IDs match');
      return true;
    }
    
    // Mismatch - cache is invalid
    console.log('❌ Cache invalid: User mismatch');
    console.log('   Cached:', cachedUserId || 'guest');
    console.log('   Current:', currentUserId || 'guest');
    return false;
    
  } catch (error) {
    console.error('❌ Error validating cache:', error);
    return false; // On error, consider cache invalid
  }
}
