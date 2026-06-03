import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import PricingModal from './PricingModal';

interface DemoOverlayProps {
  children: React.ReactNode;
}

/**
 * Wraps data content with a blur effect when user has no access.
 * Only blurs the data cards — not the full page layout.
 * Authenticated users with subscription see everything normally.
 */
const DemoOverlay: React.FC<DemoOverlayProps> = ({ children }) => {
  const { isAuthenticated, isDemo, hasSubscription, exitDemo } = useAuth();
  const [showPricing, setShowPricing] = useState(false);

  // Full access
  if (isAuthenticated && hasSubscription) {
    return <>{children}</>;
  }

  // Need to blur: either demo mode, or auth without sub
  const needsBlur = isDemo || (isAuthenticated && !hasSubscription);

  if (!needsBlur) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Content: only .data-card elements get blurred via CSS */}
      <div className="demo-blur">
        {children}
      </div>

      {/* Floating CTA banner at top */}
      <div className="sticky top-16 z-30 mx-auto max-w-2xl px-4 mt-4 mb-2">
        <div className="bg-brand-card/95 backdrop-blur-md border border-gray-700 rounded-xl px-5 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-sm font-medium text-white">
                {isDemo ? 'Демо-режим' : 'Требуется подписка'}
              </p>
              <p className="text-xs text-gray-400">Данные монет и контрактов скрыты</p>
            </div>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => setShowPricing(true)}
              className="px-4 py-2 bg-brand-accent hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all text-xs whitespace-nowrap"
            >
              Выбрать тариф
            </button>
          ) : (
            <button
              onClick={exitDemo}
              className="px-4 py-2 bg-brand-accent hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all text-xs whitespace-nowrap"
            >
              Войти
            </button>
          )}
        </div>
      </div>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
};

export default DemoOverlay;
