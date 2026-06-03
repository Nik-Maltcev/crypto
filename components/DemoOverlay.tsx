import React from 'react';
import { useAuth } from './AuthProvider';

interface DemoOverlayProps {
  children: React.ReactNode;
}

/**
 * Wraps content with a blur effect + CTA in demo mode.
 * Authenticated users see content normally.
 */
const DemoOverlay: React.FC<DemoOverlayProps> = ({ children }) => {
  const { isAuthenticated, isDemo, exitDemo } = useAuth();

  // Authenticated users see everything
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Demo mode: show content with blur
  if (isDemo) {
    return (
      <div className="relative">
        {/* Blurred content */}
        <div className="filter blur-[6px] pointer-events-none select-none">
          {children}
        </div>

        {/* Overlay CTA */}
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-brand-card/95 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-white mb-2">Демо-режим</h3>
            <p className="text-gray-400 text-sm mb-5">
              Авторизуйтесь для полного доступа к данным аналитики в реальном времени
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

  // Shouldn't reach here, but just in case
  return <>{children}</>;
};

export default DemoOverlay;
