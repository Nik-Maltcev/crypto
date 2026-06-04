import React from 'react';

const PAY_LINKS = {
  week: 'https://self.payanyway.ru/17806005973',
  // month: '' // добавим позже
};

interface PricingModalProps {
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-brand-card border border-gray-800 rounded-2xl p-8 max-w-md w-full relative">
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
          <h2 className="text-xl font-bold text-white mb-2">Подписка CryptoPulse AI</h2>
          <p className="text-gray-400 text-sm">Полный доступ к аналитике, прогнозам и сигналам</p>
        </div>

        {/* Week plan */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-400">Неделя</div>
              <div className="text-2xl font-bold text-white">990 ₽</div>
            </div>
            <div className="text-xs text-gray-500">7 дней доступа</div>
          </div>
          <ul className="text-xs text-gray-400 space-y-1 mb-4">
            <li>✓ Все прогнозы без blur</li>
            <li>✓ Гипотезы и щитки</li>
            <li>✓ История анализов</li>
          </ul>
          <a
            href={PAY_LINKS.week}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 bg-brand-accent hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all text-sm text-center"
          >
            Оплатить 990 ₽
          </a>
        </div>

        {/* Month plan — скоро */}
        <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-5 opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Месяц</div>
              <div className="text-2xl font-bold text-white">3 490 ₽</div>
            </div>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Скоро</span>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-5">
          Оплата через PayAnyWay. Безопасно. Чек на email.
        </p>
      </div>
    </div>
  );
};

export default PricingModal;
