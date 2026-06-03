import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import PricingModal from './PricingModal';

interface DemoOverlayProps {
  children: React.ReactNode;
}

/**
 * Wraps content with a blur effect + CTA in demo mode.
 * Authenticated users without subscription also see blur.
 */
const DemoOverlay: React.FC<DemoOverlayProps> = ({ children }) => {
  const { isAuthenticated, isDemo, hasSubscription, exitDemo } = useAuth();
  const [showPricing, setShowPricing] = useState(false);

  // Users with active subscription see everything
  if (isAuthenticated && hasSubscription) {
    return <>{children}</>;
  }

  // Authenticated but no subscription — show blur + pricing CTA
  if (isAuthenticated && !hasSubscription) {
    return (
      <div className="relative">
        <div className="filter blur-[6px] pointer-events-none select-none">
          {children}
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-brand-card/95 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-white mb-2">Оформите подписку</h3>
            <p className="text-gray-400 text-sm mb-5">
              Для полного доступа к данным аналитики оформите подписку
            </p>
            <button
              onClick={() => setShowPricing(true)}
              className="px-6 py-2.5 bg-brand-accent hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all text-sm"
            >
              Выбрать тариф →
            </button>
          </div>
        </div>

        {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      </div>
    );
  }

  // Demo mode: show content with blur
  if (isDemo) {
    return (
      <div className="relative">
        <div className="filter blur-[6px] pointer-events-none select-none">
          {children}
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-brand-card/95 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-white mb-2">Демо-режим</h3>
            <p className="text-gray-400 text-sm mb-5">
              Авторизуйтесь и оформите подписку для полного доступа к данным аналитики
            </p>
            <button
              onClick={exitDemo}
              className="px-6 py-2.5 bg-brand-accent hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all text-sm"
            >
              Войти через Email →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DemoOverlay;
