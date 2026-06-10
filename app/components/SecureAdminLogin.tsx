'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SecureAdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'credentials' | 'waiting' | 'approved';

export default function SecureAdminLogin({ isOpen, onClose }: SecureAdminLoginProps) {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if ((step === 'waiting' || step === 'approved') && sessionId) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/auth/status/${sessionId}`);
          const data = await res.json();

          if (data.status === 'complete') {
            stopPolling();
            handleClose();
            router.push('/admin');
          } else if (data.status === 'expired') {
            stopPolling();
            setError('Oturum süresi doldu. Lütfen tekrar deneyin.');
            setStep('credentials');
          } else if (data.approved && !approved) {
            setApproved(true);
            setStep('approved');
          }
        } catch {
          // ağ hatası — sessizce devam et
        }
      }, 3000);
    }
    return stopPolling;
  }, [step, sessionId]);

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function handleClose() {
    stopPolling();
    onClose();
    setTimeout(() => {
      setStep('credentials');
      setEmail('');
      setPassword('');
      setSessionId('');
      setApproved(false);
      setError('');
      setIsLoading(false);
    }, 300);
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (res.ok && data.sessionId) {
        setSessionId(data.sessionId);
        setStep('waiting');
      } else {
        setError('E-posta veya şifre hatalı.');
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const steps: Step[] = ['credentials', 'waiting', 'approved'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="rounded-xl max-w-md w-full bg-gray-900 shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-light tracking-[0.2em] font-serif italic text-white">
              MERYEM BALKAN
            </h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              aria-label="Kapat"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>

          <div className="flex items-center mt-4 space-x-2">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-white' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-900/50 border border-red-800 text-red-200 text-sm">
              <i className="ri-error-warning-line mr-2"></i>
              {error}
            </div>
          )}

          {/* Step 1: E-posta + Şifre */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium mb-2 text-gray-300">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="E-posta adresinizi girin"
                  className="w-full px-4 py-3 rounded-lg border bg-gray-800 border-gray-700 text-white focus:border-white focus:outline-none placeholder-gray-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium mb-2 text-gray-300">
                  Şifre
                </label>
                <input
                  type="password"
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Şifrenizi girin"
                  className="w-full px-4 py-3 rounded-lg border bg-gray-800 border-gray-700 text-white focus:border-white focus:outline-none placeholder-gray-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-full font-medium transition-all ${
                  isLoading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    İşleniyor...
                  </span>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Telefon onayı bekleniyor */}
          {step === 'waiting' && (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  <i className="ri-smartphone-line text-3xl text-white animate-pulse"></i>
                </div>
              </div>
              <div>
                <p className="text-white font-medium mb-2">Telefon onayı bekleniyor</p>
                <p className="text-sm text-gray-400">
                  Telefonuna bildirim gönderildi. Uygulamayı açıp girişi onayla.
                </p>
              </div>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <button
                onClick={handleClose}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                İptal Et
              </button>
            </div>
          )}

          {/* Step 3: Onaylandı — OTP bekleniyor */}
          {step === 'approved' && (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center">
                  <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
                </div>
              </div>
              <div>
                <p className="text-white font-medium mb-2">Telefon onayladı</p>
                <p className="text-sm text-gray-400">
                  Maile gelen 6 haneli kodu telefon uygulamasına gir.
                </p>
              </div>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-600 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">Kod girilince otomatik yönlendirileceksin</p>
              <button
                onClick={handleClose}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                İptal Et
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
