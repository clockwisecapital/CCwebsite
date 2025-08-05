"use client";

import React, { useState, useEffect } from "react";
import { openGleapChat } from "@/utils/gleap";

export default function TimedPopup() {
  const [show, setShow] = useState(false);

  // show after 10 seconds on page
  useEffect(() => {
    const id = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(id);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[9998] w-72 max-w-[90vw] animate-slide-in">
      <div className="relative bg-[#1A3A5F] text-white p-4 rounded-xl shadow-xl">
        <button
          onClick={() => setShow(false)}
          className="absolute top-2 right-3 text-white/70 hover:text-white text-lg leading-none"
          aria-label="Close popup"
        >
          &times;
        </button>
        <h4 className="text-lg font-semibold mb-2">Need help?</h4>
        <p className="text-sm mb-4">
          Find An Advisor or book a free portfolio review with one click.
        </p>
        <button
          className="inline-block px-4 py-2 bg-[#1FAAA3] hover:bg-[#159c8d] rounded-md text-sm font-medium transition-colors duration-200"
          onClick={() => {
            setShow(false);
            openGleapChat();
          }}
        >
          Chat now
        </button>
      </div>
    </div>
  );
}
