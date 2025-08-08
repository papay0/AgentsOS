'use client';

import { MobileApp } from './MobileWorkspace';
import AppIcon from '../ui/AppIcon';
import React from 'react';

// Glass Effect Components
interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  return (
    <div
      className={`relative flex overflow-visible transition-all duration-300 ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-3xl"
        style={{
          backdropFilter: "blur(10px)",
          filter: "url(#mobile-glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-3xl"
        style={{ background: "rgba(255, 255, 255, 0.1)" }}
      />
      <div
        className="absolute inset-0 z-20 rounded-3xl overflow-hidden"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.35), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.25)",
        }}
      />

      {/* Content */}
      <div className="relative z-30 w-full">{children}</div>
    </div>
  );
};

// SVG Filter Component for Mobile
const MobileGlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="mobile-glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="19"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="3"
        specularConstant="1"
        specularExponent="80"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-150" y="-150" z="250" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="150"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

interface MobileDockProps {
  apps: MobileApp[];
  onAppOpen: (app: MobileApp, element: HTMLElement) => void;
  onHomePress?: () => void; // Optional since not currently used
}

export default function MobileDock({ apps, onAppOpen }: MobileDockProps) {
  const GlassDockIcon = ({ app }: { app: MobileApp }) => (
    <div className="relative">
      <button
        onClick={(e) => onAppOpen(app, e.currentTarget)}
        onTouchStart={(e) => onAppOpen(app, e.currentTarget)}
        className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all duration-500 touch-manipulation bg-white/8 backdrop-blur-sm border border-white/15 ${
          app.comingSoon ? 'opacity-50' : ''
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
        }}
        disabled={app.comingSoon}
      >
        <AppIcon icon={app.icon} size="lg" className="text-white" />
      </button>
      {app.comingSoon && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white shadow-lg" />
      )}
    </div>
  );

  return (
    <>
      <MobileGlassFilter />
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-4">
        <div className="mx-4">
          <GlassEffect className="rounded-3xl p-3 hover:p-3.5 transition-all duration-300">
            <div className="flex items-center justify-center space-x-2 px-1 py-0.5">
              {apps.map((app) => (
                <GlassDockIcon key={app.id} app={app} />
              ))}
            </div>
          </GlassEffect>
        </div>
      </div>
    </>
  );
}