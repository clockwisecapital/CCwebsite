'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScenarioTestingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/scenario-testing/questions');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
          bg-teal-500/20 border-2 border-teal-500/30 mb-4">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400">Loading scenarios...</p>
      </div>
    </div>
  );
}


