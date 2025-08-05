'use client';

import { cn } from "@/lib/utils";
import React from "react";

export interface AgentsOSArchitectureProps {
  className?: string;
  width?: string;
  height?: string;
  showConnections?: boolean;
  lineMarkerSize?: number;
  animateText?: boolean;
  animateLines?: boolean;
  animateMarkers?: boolean;
}

const AgentsOSArchitecture = ({
  className,
  width = "100%",
  height = "100%",
  showConnections = true,
  animateText = true,
  lineMarkerSize = 18,
  animateLines = true,
  animateMarkers = true,
}: AgentsOSArchitectureProps) => {
  return (
    <svg
      className={cn("text-muted", className)}
      width={width}
      height={height}
      viewBox="0 0 200 100"
    >
      {/* Paths */}
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth="0.3"
        strokeDasharray="100 100"
        pathLength="100"
        markerStart="url(#agents-circle-marker)"
      >
        {/* 1st */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 10 20 h 79.5 q 5 0 5 5 v 30"
        />
        {/* 2nd */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 180 10 h -69.7 q -5 0 -5 5 v 30"
        />
        {/* 3rd */}
        <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" />
        {/* 4th */}
        <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" />
        {/* 5th */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20"
        />
        {/* 6th */}
        <path d="M 94.8 95 v -36" />
        {/* 7th */}
        <path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14" />
        {/* 8th */}
        <path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20" />
        {/* Animation For Path Starting */}
        {animateLines && (
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        )}
      </g>

      {/* 1. Blue Light */}
      <g mask="url(#agents-mask-1)">
        <circle
          className="agents-architecture agents-line-1"
          cx="0"
          cy="0"
          r="8"
          fill="url(#agents-blue-grad)"
        />
      </g>
      {/* 2. Yellow Light */}
      <g mask="url(#agents-mask-2)">
        <circle
          className="agents-architecture agents-line-2"
          cx="0"
          cy="0"
          r="8"
          fill="url(#agents-yellow-grad)"
        />
      </g>
      {/* 3. Pinkish Light */}
      <g mask="url(#agents-mask-3)">
        <circle
          className="agents-architecture agents-line-3"
          cx="0"
          cy="0"
          r="8"
          fill="url(#agents-pinkish-grad)"
        />
      </g>
      {/* 4. White Light */}
      <g mask="url(#agents-mask-4)">
        <circle
          className="agents-architecture agents-line-4"
          cx="0"
          cy="0"
          r="8"
          fill="url(#agents-white-grad)"
        />
      </g>
      {/* 5. Green Light */}
      <g mask="url(#agents-mask-5)">
        <circle
          className="agents-architecture agents-line-5"
          cx="0"
          cy="0"
          r="8"
          fill="url(#agents-green-grad)"
        />
      </g>
      {/* 6. Orange Light */}
      <g mask="url(#agents-mask-6)">
        <circle
          className="agents-architecture agents-line-6"
          cx="0"
          cy="0"
          r="8"
          fill="url(#agents-orange-grad)"
        />
      </g>
      {/* 7. Cyan Light */}
      <g mask="url(#agents-mask-7)">
        <circle
          className="agents-architecture agents-line-7"
          cx="0"
          cy="0"
          r="8"
          fill="url(#agents-cyan-grad)"
        />
      </g>
      {/* 8. Rose Light */}
      <g mask="url(#agents-mask-8)">
        <circle
          className="agents-architecture agents-line-8"
          cx="0"
          cy="0"
          r="8"
          fill="url(#agents-rose-grad)"
        />
      </g>
      {/* AgentsOS Box */}
      <g>
        {/* OS connections */}
        {showConnections && (
          <g fill="url(#agents-connection-gradient)">
            <rect x="85" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="96" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="107" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="112" y="37" width="2.5" height="5" rx="0.7" />
            <rect
              x="116.3"
              y="44"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(90 117.5 46.5)"
            />
            <rect
              x="116.3"
              y="49"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(90 117.5 51.5)"
            />
            <rect
              x="96"
              y="16"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(180 97.25 18.5)"
            />
            <rect
              x="107"
              y="16"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(180 108.25 18.5)"
            />
            <rect
              x="80"
              y="44"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(270 81.25 46.5)"
            />
            <rect
              x="80"
              y="49"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(270 81.25 51.5)"
            />
          </g>
        )}
        {/* Main AgentsOS Rectangle */}
        <rect
          x="85"
          y="40"
          width="35"
          height="20"
          rx="3"
          fill="url(#agents-main-gradient)"
          filter="url(#agents-light-shadow)"
        />
        {/* AgentsOS Text */}
        <text
          x="102.5"
          y="52.5"
          fontSize="5.5"
          fill={animateText ? "url(#agents-text-gradient)" : "white"}
          fontWeight="700"
          letterSpacing="0.02em"
          textAnchor="middle"
        >
          AgentsOS
        </text>
      </g>
      {/* Masks */}
      <defs>
        <mask id="agents-mask-1">
          <path
            d="M 10 20 h 79.5 q 5 0 5 5 v 24"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="agents-mask-2">
          <path
            d="M 180 10 h -69.7 q -5 0 -5 5 v 24"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="agents-mask-3">
          <path
            d="M 130 20 v 21.8 q 0 5 -5 5 h -10"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="agents-mask-4">
          <path
            d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="agents-mask-5">
          <path
            d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="agents-mask-6">
          <path d="M 94.8 95 v -36" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="agents-mask-7">
          <path
            d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="agents-mask-8">
          <path
            d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        {/* Gradients */}
        <radialGradient id="agents-blue-grad" fx="1">
          <stop offset="0%" stopColor="#00E8ED" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="agents-yellow-grad" fx="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="agents-pinkish-grad" fx="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="agents-white-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="agents-green-grad" fx="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="agents-orange-grad" fx="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="agents-cyan-grad" fx="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="agents-rose-grad" fx="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* Main box gradient */}
        <linearGradient id="agents-main-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="50%" stopColor="#111827" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>
        <filter
          id="agents-light-shadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="2"
            dy="2"
            stdDeviation="2"
            floodColor="#3b82f6"
            floodOpacity="0.3"
          />
        </filter>
        <marker
          id="agents-circle-marker"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth={lineMarkerSize}
          markerHeight={lineMarkerSize}
        >
          <circle
            id="innerMarkerCircle"
            cx="5"
            cy="5"
            r="2"
            fill="#1f2937"
            stroke="#6366f1"
            strokeWidth="0.5"
          >
            {animateMarkers && (
              <animate attributeName="r" values="0; 3; 2" dur="0.5s" />
            )}
          </circle>
        </marker>
        {/* Connection gradient */}
        <linearGradient
          id="agents-connection-gradient"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="60%" stopColor="#1e40af" />
        </linearGradient>
        {/* Text Gradient */}
        <linearGradient id="agents-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6b7280">
            <animate
              attributeName="offset"
              values="-2; -1; 0"
              dur="3s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
          <stop offset="25%" stopColor="white">
            <animate
              attributeName="offset"
              values="-1; 0; 1"
              dur="3s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
          <stop offset="50%" stopColor="#6b7280">
            <animate
              attributeName="offset"
              values="0; 1; 2;"
              dur="3s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
        </linearGradient>
      </defs>
    </svg>
  );
};

export { AgentsOSArchitecture };