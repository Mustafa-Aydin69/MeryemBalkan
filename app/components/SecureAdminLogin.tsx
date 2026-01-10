'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SecureAdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp' | 'password';

export default function SecureAdminLogin({ isOpen, onClose }: SecureAdminLoginProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    // State'leri temizle
    setTimeout(() => {
      setStep('email');
      setEmail('');
      setOtp('');
      setPassword('');
      setVerificationToken('');
      setError('');
      setIsLoading(false);
    }, 300);
  };

  // Email regex validation
  const isValidEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim()) && email.length <= 254;
  };

  // OTP validation
  const isValidOTP = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  // Email submit - OTP gönder
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      setError('Geçerli bir e-posta adresi giriniz');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      // Her durumda aynı mesajı göster (güvenlik)
      setStep('otp');
    } catch {
      // Hata olsa bile devam et (güvenlik)
      setStep('otp');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP doğrulama
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedOTP = otp.replace(/\D/g, '');

    if (!isValidOTP(trimmedOTP)) {
      setError('6 haneli doğrulama kodu giriniz');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          code: trimmedOTP 
        }),
      });

      const data = await response.json();

      if (data.success && data.verificationToken) {
        setVerificationToken(data.verificationToken);
        setStep('password');
      } else {
        setError('Doğrulama başarısız. Lütfen tekrar deneyin.');
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Şifre ile giriş
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!password || password.length < 4) {
      setError('Şifre gereklidir');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Cookie'ler için gerekli
        body: JSON.stringify({ 
          verificationToken,
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        handleClose();
        router.push('/admin');
      } else {
        setError('Giriş başarısız. Lütfen tekrar deneyin.');
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
          
          {/* Progress indicator */}
          <div className="flex items-center mt-4 space-x-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${
              step === 'email' ? 'bg-white' : 'bg-gray-700'
            }`}></div>
            <div className={`h-1 flex-1 rounded-full transition-colors ${
              step === 'otp' ? 'bg-white' : 'bg-gray-700'
            }`}></div>
            <div className={`h-1 flex-1 rounded-full transition-colors ${
              step === 'password' ? 'bg-white' : 'bg-gray-700'
            }`}></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-900/50 border border-red-800 text-red-200 text-sm">
              <i className="ri-error-warning-line mr-2"></i>
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                ) : 'Devam Et'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div>
                <p className="text-sm mb-4 text-gray-400">
                  Yetkiniz varsa <strong className="text-white">{email}</strong> adresine gönderilen kodu girin.
                </p>
                <label htmlFor="admin-otp" className="block text-sm font-medium mb-2 text-gray-300">
                  Doğrulama Kodu
                </label>
                <input
                  type="text"
                  id="admin-otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="6 haneli kod"
                  className="w-full px-4 py-3 rounded-lg border bg-gray-800 border-gray-700 text-white focus:border-white focus:outline-none placeholder-gray-500 text-center text-2xl tracking-[0.5em] font-mono transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className={`w-full py-3 rounded-full font-medium transition-all ${
                  isLoading || otp.length !== 6
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Doğrulanıyor...
                  </span>
                ) : 'Doğrula'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                E-posta adresini değiştir
              </button>
            </form>
          )}

          {/* Step 3: Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <div className="flex items-center mb-4 p-3 rounded-lg bg-green-900/30 border border-green-800">
                  <i className="ri-checkbox-circle-fill text-green-400 mr-2"></i>
                  <span className="text-sm text-green-300">E-posta doğrulandı</span>
                </div>
                
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
                    Giriş yapılıyor...
                  </span>
                ) : 'Giriş Yap'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

