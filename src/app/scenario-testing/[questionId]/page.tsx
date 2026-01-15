'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestionDetailPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/scenario-testing/questions');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
          bg-teal-500/20 border-2 border-teal-500/30 mb-4">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
