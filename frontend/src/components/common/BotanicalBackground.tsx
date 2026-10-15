'use client';

import React from 'react';

export default function BotanicalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* 1. Top-Right Subtle Botanical Line Art */}
      <div className="absolute -top-12 -right-12 w-80 sm:w-96 lg:w-[480px] h-80 sm:h-96 lg:h-[480px] opacity-[0.07] dark:opacity-[0.04] text-emerald-900 dark:text-emerald-300">
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform rotate-6"
        >
          <path
            d="M380,10 Q280,120 180,260 T60,380"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M320,70 Q370,55 385,25 Q355,45 320,70 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M280,120 Q240,95 220,90 Q245,115 280,120 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M245,165 Q295,150 315,125 Q285,145 245,165 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M195,225 Q160,195 140,195 Q165,220 195,225 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M155,275 Q200,260 220,235 Q190,255 155,275 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* 2. Bottom-Left Subtle Botanical Line Art */}
      <div className="absolute -bottom-16 -left-16 w-72 sm:w-96 lg:w-[420px] h-72 sm:h-96 lg:h-[420px] opacity-[0.06] dark:opacity-[0.03] text-emerald-900 dark:text-emerald-300">
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform -rotate-30"
        >
          <path
            d="M20,390 Q120,280 220,150 T360,20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M90,320 Q50,345 35,375 Q65,355 90,320 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M140,270 Q180,290 200,295 Q175,275 140,270 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M185,215 Q140,230 120,255 Q150,235 185,215 Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>

    </div>
  );
}
