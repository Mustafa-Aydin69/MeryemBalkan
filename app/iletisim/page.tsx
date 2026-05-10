
'use client';
import Link from 'next/link';
import LoginModal from '../components/LoginModal';
import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Iletisim() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    konu: '',
    siparisNo: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Sepet durumunu kontrol et
    const checkCartItems = () => {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setHasCartItems(cartItems.length > 0);
    };

    checkCartItems();

    // Storage değişikliklerini dinle
    window.addEventListener('storage', checkCartItems);

    // Custom event dinle
    window.addEventListener('cartUpdated', checkCartItems);

    return () => {
      window.removeEventListener('storage', checkCartItems);
      window.removeEventListener('cartUpdated', checkCartItems);
    };
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient]);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const showNavBackground = isClient && scrollY > 200;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { name, email, phone, konu, siparisNo, message } = formData;

      if (!name || !email || !konu || !message) {
        alert("Lütfen tüm zorunlu alanları doldurun.");
        return;
      }

      const fullMessage = siparisNo
        ? `Sipariş No: ${siparisNo}\n\n${message}`
        : message;

      const { error } = await supabase
        .from("mesajlar")
        .insert([
          {
            name,
            email,
            phone,
            hizmet: konu,
            mesaj: fullMessage,
            cevap: "Bekliyor",
            tarih: new Date().toISOString().split("T")[0],
          },
        ]);

      if (error) {
        console.error("Supabase ekleme hatası:", error);
        alert("Mesaj gönderilirken bir hata oluştu!");
        return;
      }

      if (konu === 'İade Talebi') {
        fetch('/api/send-return-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, siparisNo: siparisNo || undefined }),
        }).catch(() => {});
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", phone: "", konu: "", siparisNo: "", message: "" });
    } catch (err) {
      console.error("Beklenmedik hata:", err);
      alert("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${showNavBackground ? (isDarkMode ? 'bg-gray-900 shadow-lg' : 'bg-white shadow-lg') : 'bg-transparent'}`}>
        <div className="flex flex-col items-center px-4 sm:px-8 py-4 sm:py-6">
          {/* Üst Satır: Dark Mode Toggle - Meryem Balkan - Sepet + Giriş */}
          <div className="flex justify-between items-center w-full mb-3 sm:mb-4">
            <button onClick={toggleTheme} className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-sm sm:text-lg`}></i>
            </button>

            <div className="text-center">
              <h1 className={`text-lg sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] font-serif italic transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white' : 'text-black') : 'text-white'}`}>MERYEM BALKAN</h1>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/sepet"
                className={`relative w-5 h-5 sm:w-6 sm:h-6 hidden sm:flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}
              >
                <i className={`ri-shopping-bag-line text-sm sm:text-lg ${hasCartItems ? 'animate-bounce' : ''}`}></i>
              </Link>
              <button onClick={() => setIsLoginModalOpen(true)} className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center cursor-pointer transition-colors duration-300 ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>
                <i className="ri-user-line text-sm sm:text-lg"></i>
              </button>
            </div>
          </div>

          {/* Alt Satır: Menü Öğeleri */}
          <div className="hidden sm:flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium tracking-wide">
            <Link href="/" className={`cursor-pointer transition-colors duration-300 font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ANASAYFA</Link>
            <Link href="/portfolio" className={`cursor-pointer transition-colors duration-300 font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>ELBİSELER</Link>
            <Link href="/hakkimda" className={`cursor-pointer transition-colors duration-300 font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>HAKKIMDA</Link>
            <Link href="/iletisim" className={`cursor-pointer transition-colors duration-300 font-light whitespace-nowrap ${showNavBackground ? (isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600') : 'text-white hover:text-gray-300'}`}>İLETİŞİM</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-8 pt-28 sm:pt-32 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-4 sm:mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>İLETİŞİM</h2>
          <p className={`text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Size özel tasarımlar için benimle iletişime geçin
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className={`pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">

            {/* Contact Form */}
            <div>
              <h3 className={`text-xl sm:text-2xl font-light tracking-wide mb-6 sm:mb-8 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>İLETİŞİM FORMU</h3>

              {isSubmitted ? (
                <div className={`rounded-2xl border p-10 sm:p-14 text-center transition-colors ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
                  <div className={`w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-full border-2 transition-colors ${isDarkMode ? 'border-gray-500' : 'border-gray-400'}`}>
                    <i className={`ri-check-line text-xl transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}></i>
                  </div>
                  <h4 className={`text-base font-medium mb-2 tracking-wide transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Mesajınız Alındı</h4>
                  <p className={`text-sm mb-8 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>En kısa sürede size dönüş yapacağız.</p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className={`text-xs tracking-widest underline underline-offset-4 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}
                  >
                    YENİ MESAJ GÖNDER
                  </button>
                </div>
              ) : (
                <form id="contact-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label htmlFor="name" className={`block text-xs font-medium mb-2 tracking-wide transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        AD SOYAD <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Adınız ve soyadınız"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-200 text-black placeholder-gray-400 focus:ring-gray-300 focus:border-gray-400'}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className={`block text-xs font-medium mb-2 tracking-wide transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        E-POSTA <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="ornek@email.com"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-200 text-black placeholder-gray-400 focus:ring-gray-300 focus:border-gray-400'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className={`block text-xs font-medium mb-2 tracking-wide transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>TELEFON</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0XXX XXX XX XX"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-200 text-black placeholder-gray-400 focus:ring-gray-300 focus:border-gray-400'}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="konu" className={`block text-xs font-medium mb-2 tracking-wide transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      KONU <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="konu"
                        name="konu"
                        value={formData.konu}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm appearance-none transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-200 text-black focus:ring-gray-300 focus:border-gray-400'} ${formData.konu === '' ? (isDarkMode ? 'text-gray-500' : 'text-gray-400') : ''}`}
                      >
                        <option value="" disabled>Konuyu seçiniz</option>
                        <option value="Tasarım & Kıyafet Seçimi">Tasarım & Kıyafet Seçimi</option>
                        <option value="Randevu Talebi">Randevu Talebi</option>
                        <option value="Kargo & Teslimat">Kargo & Teslimat</option>
                        <option value="İade Talebi">İade Talebi</option>
                        <option value="Genel Bilgi">Genel Bilgi</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                      <div className={`pointer-events-none absolute inset-y-0 right-3 flex items-center transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <i className="ri-arrow-down-s-line text-lg"></i>
                      </div>
                    </div>
                  </div>

                  {(formData.konu === 'İade Talebi' || formData.konu === 'Kargo & Teslimat') && (
                    <div>
                      <label htmlFor="siparisNo" className={`block text-xs font-medium mb-2 tracking-wide transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>SİPARİŞ NUMARASI</label>
                      <input
                        type="text"
                        id="siparisNo"
                        name="siparisNo"
                        value={formData.siparisNo}
                        onChange={handleInputChange}
                        placeholder="Sipariş numaranızı giriniz"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-200 text-black placeholder-gray-400 focus:ring-gray-300 focus:border-gray-400'}`}
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="message" className={`block text-xs font-medium mb-2 tracking-wide transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      MESAJ <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={5}
                      maxLength={500}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm resize-none transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-200 text-black placeholder-gray-400 focus:ring-gray-300 focus:border-gray-400'}`}
                      placeholder={
                        formData.konu === 'Tasarım & Kıyafet Seçimi' ? 'Tasarım tercihlerinizi, renk seçimlerinizi ve özel isteklerinizi belirtiniz...' :
                        formData.konu === 'Randevu Talebi' ? 'Tercih ettiğiniz tarih ve saati, hangi ürün için randevu istediğinizi belirtiniz...' :
                        formData.konu === 'Kargo & Teslimat' ? 'Kargo ile ilgili sorunuzu paylaşınız...' :
                        formData.konu === 'İade Talebi' ? 'İade nedeninizi ve ürün durumunu kısaca belirtiniz...' :
                        'Mesajınızı buraya yazabilirsiniz...'
                      }
                    ></textarea>
                    <div className={`flex justify-end text-xs mt-1.5 transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formData.message.length}/500
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className={`w-full py-3.5 text-xs tracking-widest font-medium rounded-lg transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                      GÖNDER
                    </button>
                    <p className={`text-xs mt-3 transition-colors ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      <span className="text-rose-400">*</span> zorunlu alanlar
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div>
              <h3 className={`text-xl sm:text-2xl font-light tracking-wide mb-6 sm:mb-8 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>İLETİŞİM BİLGİLERİ</h3>

              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border transition-colors ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <i className={`ri-map-pin-line text-base sm:text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}></i>
                  </div>
                  <div>
                    <h4 className={`font-medium mb-2 text-sm sm:text-base transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>ATÖLYE ADRESİ</h4>
                    <p className={`leading-relaxed text-xs sm:text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Atatürk Mahallesi<br />
                      Muhsin Yazıcıoğlu Caddesi No: 15/B<br />
                      Merkez / Erzincan
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border transition-colors ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <i className={`ri-mail-line text-base sm:text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}></i>
                  </div>
                  <div>
                    <h4 className={`font-medium mb-2 text-sm sm:text-base transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>E-POSTA</h4>
                    <p className={`text-xs sm:text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>meryembalkantasarimatolye@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border transition-colors ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <i className={`ri-time-line text-base sm:text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}></i>
                  </div>
                  <div>
                    <h4 className={`font-medium mb-2 text-sm sm:text-base transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>ÇALIŞMA SAATLERİ</h4>
                    <p className={`text-xs sm:text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pazartesi - Cuma: 09:00 - 18:00</p>
                    <p className={`text-xs sm:text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cumartesi: 10:00 - 16:00</p>
                    <p className={`text-xs sm:text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pazar: Randevulu</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-12">
                <h4 className={`font-medium mb-4 text-sm sm:text-base transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>SOSYAL MEDYA</h4>
                <div className="flex space-x-4">
                  <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border transition-colors cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
                    <i className={`ri-instagram-line text-base sm:text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className={`pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <h3 className={`text-xl sm:text-2xl font-light tracking-wide mb-6 sm:mb-8 text-center transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>KONUM</h3>
          <div className="relative h-64 sm:h-80 lg:h-96 bg-gray-200">
            <iframe
              src="https://www.google.com/maps?q=Atatürk+Mahallesi+Muhsin+Yazıcıoğlu+Caddesi+No:+15/B+Merkez+Erzincan&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Atölye Konumu - Merkez, Erzincan"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 sm:py-16 px-4 sm:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="col-span-1">
              <h4 className="text-xl sm:text-2xl font-light tracking-wide mb-4 font-serif italic">MERYEM BALKAN</h4>
              <p className={`mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Modern kadının zarafet ve gücünü yansıtan, kaliteli ve sürdürülebilir moda tasarımları
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/meryembalkan_ateiler/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
                  <i className="ri-instagram-line text-lg"></i>
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">KURUMSAL</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li><Link href="/hakkimda" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Hakkımızda</Link></li>
                <li><Link href="/iletisim" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>İletişime Geç</Link></li>
                <li><Link href="/gizlilik-politikasi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>KVKK</Link></li>
                <li><Link href="/aydinlatma-metni" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Aydınlatma Metni</Link></li>
                <li><Link href="/kiralama-sozlesmesi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Kiralama Sözleşmesi ve Yükümlülükleri</Link></li>
                <li><Link href="/mesafeli-satis-sozlesmesi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Mesafeli Satış Sözleşmesi</Link></li>
                <li><Link href="/teslimat-ve-iade-politikasi" className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Teslimat ve İade Politikası</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-4 tracking-wide text-sm sm:text-base">İLETİŞİM</h5>
              <ul className={`space-y-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Erzincan, Türkiye</li>
                <li>meryembalkantasarimatolye@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className={`border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <p>&copy; 2026 Meryem Balkan Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
