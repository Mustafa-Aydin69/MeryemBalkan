'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

interface Order {
  id: string;
  productTitle: string;
  productPrice: string;
  selectedSize: string;
  selectedColor: string;
  selectedDate: string;
  eventType: string;
  eventDate: string;
  status: 'pending' | 'confirmed' | 'completed';
  orderDate: string;
}

export default function LoginModal({ isOpen, onClose, isDarkMode }: LoginModalProps) {
  const [step, setStep] = useState<'email' | 'verification' | 'orders' | 'admin'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
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
    setStep('email');
    setEmail('');
    setVerificationCode('');
    setAdminUsername('');
    setAdminPassword('');
    setError('');
    setIsLoading(false);
    setOrders([]);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('E-posta adresi gereklidir');
      setIsLoading(false);
      return;
    }

    try {
      // Backend'e doğrulama kodu gönderme isteği
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStep('verification');
      } else {
        const data = await response.json();
        setError(data.error || 'Kod gönderilemedi, lütfen tekrar deneyin');
      }
    } catch (error) {
      // Demo için direkt ikinci adıma geç
      setStep('verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!verificationCode || verificationCode.length !== 6) {
      setError('6 haneli doğrulama kodu giriniz');
      setIsLoading(false);
      return;
    }

    try {
      // Backend'e doğrulama isteği
      const response = await fetch('/api/send-verification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      if (response.ok) {
        const data = await response.json();
        // Kod doğru ise
        alert(data.message || '✅ Kod doğru');

        localStorage.setItem('user', JSON.stringify({
          email,
          loginTime: new Date().toISOString(),
          isLoggedIn: true
        }));
      } else {
        const data = await response.json();
        setError(data.error || 'Doğrulama kodu hatalı');
      }
    } catch (error) {
      // Demo için kod kontrolü (123456)
      if (verificationCode === '123456') {
        const mockOrders: Order[] = [
          {
            id: '1',
            productTitle: 'Siyah Gece Elbisesi',
            productPrice: '18.000TL',
            selectedSize: '38',
            selectedColor: 'Siyah',
            selectedDate: '2024-06-15',
            eventType: 'dugun',
            eventDate: '2024-06-15',
            status: 'confirmed',
            orderDate: '2024-05-01'
          },
          {
            id: '2',
            productTitle: 'Pudra Nişan Elbisesi',
            productPrice: '25.000TL',
            selectedSize: '36',
            selectedColor: 'Pudra',
            selectedDate: '2024-07-20',
            eventType: 'nisan',
            eventDate: '2024-07-20',
            status: 'pending',
            orderDate: '2024-05-10'
          }
        ];
        setOrders(mockOrders);
        setStep('orders');

        localStorage.setItem('user', JSON.stringify({
          email: email,
          loginTime: new Date().toISOString(),
          isLoggedIn: true
        }));
      } else {
        setError('Doğrulama kodu hatalı');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!adminUsername || !adminPassword) {
      setError('Kullanıcı adı ve şifre gereklidir');
      setIsLoading(false);
      return;
    }

    // Demo için admin girişi
    if (adminUsername === 'admin' && adminPassword === 'password') {
      localStorage.setItem('admin', JSON.stringify({
        username: adminUsername,
        loginTime: new Date().toISOString(),
        isLoggedIn: true
      }));

      handleClose();
      router.push('/admin');
    } else {
      setError('Kullanıcı adı veya şifre hatalı');
    }

    setIsLoading(false);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`p-6 border-b transition-colors ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xl font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {step === 'email' && 'Giriş Yap'}
              {step === 'verification' && 'Doğrulama Kodu'}
              {step === 'orders' && 'Siparişlerim'}
              {step === 'admin' && 'Admin Girişi'}
            </h3>
            <button
              onClick={handleClose}
              className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'}`}
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Email Step */}
          {step === 'email' && (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                {error && (
                  <div className={`p-4 rounded border transition-colors ${isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <i className="ri-error-warning-line mr-2"></i>
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="E-posta adresinizi girin"
                    className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-white placeholder-gray-400' : 'bg-white border-gray-300 text-black focus:border-black placeholder-gray-500'}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 tracking-wide font-medium transition-colors whitespace-nowrap rounded-full ${isLoading ? 'bg-gray-400 text-white cursor-not-allowed' : (isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800')}`}
                >
                  {isLoading ? 'KOD GÖNDERİLİYOR...' : 'DOĞRULAMA KODU GÖNDER'}
                </button>

                <div className={`text-center text-xs p-3 rounded transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                  <p>Size 6 haneli bir doğrulama kodu gönderilecektir.</p>
                </div>
              </form>

              {/* Admin Girişi Bölümü */}
              <div className="mt-8 pt-6 transition-colors">
                <div className="text-center">
                  <button
                    onClick={() => setStep('admin')}
                    className={`text-sm italic cursor-pointer transition-colors ${isDarkMode
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                      }`}
                  >
                    Meryem Balkan
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Admin Step */}
          {step === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              {error && (
                <div className={`p-4 rounded border transition-colors ${isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <i className="ri-error-warning-line mr-2"></i>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="adminUsername" className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Kullanıcı Adı *
                </label>
                <input
                  type="text"
                  id="adminUsername"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  placeholder="Admin kullanıcı adı"
                  className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-white placeholder-gray-400' : 'bg-white border-gray-300 text-black focus:border-black placeholder-gray-500'}`}
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Şifre *
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="Admin şifresi"
                  className={`w-full px-4 py-3 border focus:outline-none text-sm transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-white placeholder-gray-400' : 'bg-white border-gray-300 text-black focus:border-black placeholder-gray-500'}`}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 tracking-wide font-medium transition-colors whitespace-nowrap rounded-full ${isLoading ? 'bg-gray-400 text-white cursor-not-allowed' : (isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800')}`}
              >
                {isLoading ? 'GİRİŞ YAPILIYOR...' : 'ADMİN GİRİŞİ YAP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className={`text-sm underline cursor-pointer transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  Kullanıcı Girişine Dön
                </button>
              </div>

              <div className={`text-center text-xs p-3 rounded transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                <p><strong>Demo Giriş:</strong> admin / password</p>
              </div>
            </form>
          )}

          {/* Verification Step */}
          {step === 'verification' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              {error && (
                <div className={`p-4 rounded border transition-colors ${isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <i className="ri-error-warning-line mr-2"></i>
                  {error}
                </div>
              )}

              <div>
                <p className={`text-sm mb-4 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>{email}</strong> adresine gönderilen 6 haneli doğrulama kodunu girin.
                </p>
                <label htmlFor="code" className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Doğrulama Kodu *
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="6 haneli kod"
                  className={`w-full px-4 py-3 border focus:outline-none text-sm text-center tracking-widest text-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-white placeholder-gray-400' : 'bg-white border-gray-300 text-black focus:border-black placeholder-gray-500'}`}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 tracking-wide font-medium transition-colors whitespace-nowrap rounded-full ${isLoading ? 'bg-gray-400 text-white cursor-not-allowed' : (isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800')}`}
              >
                {isLoading ? 'DOĞRULANIYOR...' : 'DOĞRULA VE GİRİŞ YAP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className={`text-sm underline cursor-pointer transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  E-posta Adresini Değiştir
                </button>
              </div>

              <div className={`text-center text-xs p-3 rounded transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                <p><strong>Demo Doğrulama Kodu:</strong> 123456</p>
              </div>
            </form>
          )}

          {/* Orders Step */}
          {step === 'orders' && (
            <div className="space-y-6">
              <div className={`text-center pb-4 border-b transition-colors ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Hoş geldiniz, <strong>{email}</strong>
                </p>
              </div>

              {orders.length === 0 ? (
                <div className={`text-center p-8 rounded transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                  <i className="ri-shopping-bag-line text-4xl mb-4 opacity-50"></i>
                  <p className="text-lg mb-2">Henüz siparişiniz bulunmamaktadır</p>
                  <p className="text-sm">Koleksiyonumuzu incelemek için</p>
                  <button
                    onClick={() => {
                      handleClose();
                      router.push('/portfolio');
                    }}
                    className={`mt-4 px-6 py-2 rounded-full text-sm font-medium transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    Elbise Koleksiyonunu İncele
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Siparişleriniz ({orders.length})
                  </h4>

                  {orders.map((order) => (
                    <div key={order.id} className={`p-4 border rounded-lg transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h5 className={`font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {order.productTitle}
                        </h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      <div className={`text-sm space-y-1 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <p><strong>Fiyat:</strong> {order.productPrice}</p>
                        <p><strong>Beden:</strong> {order.selectedSize} | <strong>Renk:</strong> {order.selectedColor}</p>
                        <p><strong>Etkinlik Tarihi:</strong> {new Date(order.eventDate).toLocaleDateString('tr-TR')}</p>
                        <p><strong>Sipariş Tarihi:</strong> {new Date(order.orderDate).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center pt-4">
                <button
                  onClick={handleClose}
                  className={`px-6 py-2 border rounded-full text-sm font-medium transition-colors ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}