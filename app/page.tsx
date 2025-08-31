'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { trackPageView } from '@/lib/analytics';
import { isDevelopment } from '@/lib/env';
import {
  HeroSection,
  FeaturesSection,
  ShowcaseSection,
  CTASection
} from './components/landing';
import './components/landing/AgentsOSArchitecture.css';

export default function HomePage() {
  const [isDevMode] = useState(isDevelopment());
  const [showProdMode, setShowProdMode] = useState(false);

  // Track landing page view on client side
  useEffect(() => {
    trackPageView('landing_page');
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#030303] overflow-x-hidden transition-colors">
      <Header />
      
      {/* Debug toggle - only show in dev mode */}
      {isDevMode && (
        <div className="fixed top-20 right-4 z-50">
          <Button
            onClick={() => setShowProdMode(!showProdMode)}
            variant="outline"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            {showProdMode ? 'Dev Mode' : 'Prod Mode'}
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* OS Interface Showcase */}
      <ShowcaseSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
}