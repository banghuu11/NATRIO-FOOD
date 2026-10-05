'use client';

import React from 'react';

export default function BotanicalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* 1. Top-Right Delicate Botanical Branch (matching mockup) */}
      <div className="absolute -top-10 -right-10 w-80 sm:w-96 lg:w-[520px] h-80 sm:h-96 lg:h-[520px] opacity-25 text-[#7A8E7E]">
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform rotate-6"
        >
          {/* Main graceful curved stem */}
          <path
            d="M380,10 Q280,120 180,260 T60,380"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Leaves with delicate inner veins */}
          <path
            d="M320,70 Q370,55 385,25 Q355,45 320,70 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
          <path
            d="M280,120 Q240,95 220,90 Q245,115 280,120 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
          <path
            d="M245,165 Q295,150 315,125 Q285,145 245,165 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
          <path
            d="M195,225 Q160,195 140,195 Q165,220 195,225 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
          <path
            d="M155,275 Q200,260 220,235 Q190,255 155,275 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
          <path
            d="M105,335 Q75,305 55,310 Q80,330 105,335 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
        </svg>
      </div>

      {/* 2. Bottom-Left Subtle Botanical Leaves */}
      <div className="absolute -bottom-12 -left-12 w-72 sm:w-96 lg:w-[460px] h-72 sm:h-96 lg:h-[460px] opacity-20 text-[#7A8E7E]">
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
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
          <path
            d="M140,270 Q180,290 200,295 Q175,275 140,270 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
          <path
            d="M185,215 Q140,230 120,255 Q150,235 185,215 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
          <path
            d="M235,155 Q270,180 290,180 Q265,160 235,155 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="#F5EFE6"
            fillOpacity="0.6"
          />
        </svg>
      </div>

    </div>
  );
}
