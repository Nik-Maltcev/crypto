import React, { useState } from 'react';
import { createPayment } from '../services/paymentService';
import { getSessionToken } from '../services/authService';

interface PricingModalProps {
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handlePay = async (plan: string) => {
    setError('');
    setLoading(plan);

    try {
      const token = getSessionToken();
      if (!token) {
        setError('Необходимо авторизоваться');
        return;
      }

      const paymentUrl = await createPayment(plan, token);
      // Redirect to PayAnyWay payment form
      window.location.href = paymentUrl;
    } catch (err: any) {
      setError(err.message || 'Ошибка создания платежа');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-brand-card border border-gray-800 rounded-2xl p-8 max-w-lg w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Тарифы CryptoPulse AI</h2>
          <p className="text-gray-400 text-sm">Полный доступ к аналитике, прогнозам и сигналам</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Week plan */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col">
            <div className="text-sm text-gray-400 mb-1">Неделя</div>
            <div className="text-2xl font-bold text-white mb-1">990 ₽</div>
            <div className="text-xs text-gray-500 mb-4">7 дней доступа</div>
            <ul className="text-xs text-gray-400 space-y-1 mb-4 flex-grow">
              <li>✓ Все прогнозы без blur</li>
              <li>✓ Гипотезы и щитки</li>
              <li>✓ История анализов</li>
            </ul>
            <button
              onClick={() => handlePay('week')}
              disabled={loading !== null}
              className="w-full py-2.5 bg-brand-accent hover:bg-emerald-600 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-all text-sm"
            >
              {loading === 'week' ? 'Перенаправление...' : 'Оплатить 990 ₽'}
            </button>
          </div>

          {/* Month plan */}
          <div className="bg-gray-900 border-2 border-brand-accent rounded-xl p-5 flex flex-col relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-xs px-2 py-0.5 rounded font-semibold">
              Выгодно
            </div>
            <div className="text-sm text-gray-400 mb-1">Месяц</div>
            <div className="text-2xl font-bold text-white mb-1">3 490 ₽</div>
            <div className="text-xs text-gray-500 mb-4">30 дней доступа</div>
            <ul className="text-xs text-gray-400 space-y-1 mb-4 flex-grow">
              <li>✓ Все прогнозы без blur</li>
              <li>✓ Гипотезы и щитки</li>
              <li>✓ История анализов</li>
              <li>✓ Экономия ~12%</li>
            </ul>
            <button
              onClick={() => handlePay('month')}
              disabled={loading !== null}
              className="w-full py-2.5 bg-brand-accent hover:bg-emerald-600 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-all text-sm"
            >
              {loading === 'month' ? 'Перенаправление...' : 'Оплатить 3 490 ₽'}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <p className="text-center text-gray-600 text-xs">
          Оплата через PayAnyWay. Безопасно. Чек на email.
        </p>
      </div>
    </div>
  );
};

export default PricingModal;
