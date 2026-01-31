'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';

interface KronosNotificationToastProps {
  firstName?: string;
  onDismiss?: () => void;
}

export default function KronosNotificationToast({ firstName, onDismiss }: KronosNotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Slide in after a short delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 300);
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[10000] transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border-2 border-teal-500/50 backdrop-blur-lg overflow-hidden max-w-sm">
        {/* Decorative gradient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-teal-500/20 rounded-full blur-2xl" />
        
        <div className="relative p-5">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded-lg"
            aria-label="Dismiss notification"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Kronos Avatar */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal-500/60 shadow-lg shadow-teal-500/30">
                <Image
                  src="/team/kronos.png"
                  alt="Kronos"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              {/* Pulse indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-teal-400 mb-1">Kronos</div>
              <p className="text-sm text-gray-200 leading-relaxed">
                Hey {firstName || 'there'}, your personalized video and analysis is complete! 
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-300 mb-4 ml-0">
            Head to your <span className="text-teal-400 font-semibold">My Account</span> page to view your Portfolio Intelligence.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <Link
              href="/account?tab=intelligence"
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-teal-500/25 hover:scale-105 text-center"
            >
              View Analysis
            </Link>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
