import React, { useState } from 'react';
import { sendMagicLink } from '../services/authService';

interface LoginPageProps {
  onDemoMode: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onDemoMode }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки ссылки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-accent to-blue-600 mb-4">
            <span className="text-white font-bold text-2xl">CP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            CryptoPulse <span className="text-brand-accent">AI</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">dexflow.xyz — AI-аналитика крипторынка</p>
        </div>

        {/* Card */}
        <div className="bg-brand-card border border-gray-800 rounded-2xl p-8">
          {!sent ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-2">Вход в дашборд</h2>
              <p className="text-gray-400 text-sm mb-6">
                Введите email — мы отправим ссылку для моментального входа
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 
                               focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 px-4 bg-brand-accent hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500
                             text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Отправка...
                    </>
                  ) : (
                    '📧 Отправить ссылку для входа'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                <button
                  onClick={onDemoMode}
                  className="text-sm text-gray-400 hover:text-brand-accent transition-colors"
                >
                  Посмотреть демо без авторизации →
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-lg font-semibold text-white mb-2">Проверьте почту</h2>
              <p className="text-gray-400 text-sm mb-4">
                Ссылка для входа отправлена на<br />
                <span className="text-brand-accent font-medium">{email}</span>
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Не получили? Проверьте папку "Спам" или попробуйте ещё раз через минуту.
              </p>
              <button
                onClick={() => { setSent(false); setError(''); }}
                className="text-sm text-brand-accent hover:text-emerald-400 transition-colors"
              >
                ← Отправить ещё раз
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Без паролей. Безопасный вход через email.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
