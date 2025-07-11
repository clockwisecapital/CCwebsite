'use client';

import React from 'react';
import Link from 'next/link';
import { FiDownload } from 'react-icons/fi';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
      
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <p className="mb-6">
          At Clockwise Capital, we take your privacy seriously. Our privacy policy outlines how we collect, 
          use, and protect your personal information when you visit our website or use our services.
        </p>

        <p className="mb-6">
          For detailed information about our privacy practices, please download our complete 
          Privacy Policy document using the link below.
        </p>

        <div className="flex justify-center my-8">
          <Link 
            href="/Clockwise Capital Privacy Policy.pdf" 
            target="_blank"
            className="flex items-center gap-2 bg-[#1A3A5F] hover:bg-[#142d4a] text-white px-6 py-3 rounded-md transition-colors"
          >
            <FiDownload className="text-lg" />
            Download Privacy Policy PDF
          </Link>
        </div>


      </div>
    </div>
  );
}
