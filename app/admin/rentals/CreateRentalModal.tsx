'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getCache, setCache, hasCache } from '../lib/adminCache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IMAGE_BASE_URL = 'https://orplwznpdpwnyflkbuoy.supabase.co/storage/v1/object/public/urunler/';

// Types
interface Product {
  id: number;
  title: string;
  price: string;
  size: string[];
  colors: string[];
  images: string[];
}

interface SelectedProduct {
  id: number;
  title: string;
  price: number;
  image: string;
  size: string;
  color: string;
}

interface CustomerForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
}

interface CreateRentalModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Elbise' },
    { num: 2, label: 'Tarih' },
    { num: 3, label: 'Bilgiler' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {steps.map((step, index) => (
        <div key={step.num} className="flex items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              currentStep >= step.num
                ? 'bg-white text-black'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {currentStep > step.num ? (
              <i className="ri-check-line"></i>
            ) : (
              step.num
            )}
          </div>
          <span className={`ml-1.5 text-xs hidden sm:inline ${
            currentStep >= step.num ? 'text-white' : 'text-gray-500'
          }`}>
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className={`w-8 sm:w-12 h-0.5 mx-2 ${
              currentStep > step.num ? 'bg-white' : 'bg-gray-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Mini Calendar Component for Step 2
function MiniCalendar({
  selectedDate,
  onDateSelect,
  disabledDates,
  onBack,
}: {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  disabledDates: string[];
  onBack: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
  const MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const disabledSet = useMemo(() => new Set(disabledDates), [disabledDates]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return disabledSet.has(`${year}-${month}-${dayStr}`);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return (
      day === selected.getDate() &&
      currentMonth.getMonth() === selected.getMonth() &&
      currentMonth.getFullYear() === selected.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    if (isDateDisabled(day)) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    onDateSelect(`${year}-${month}-${dayStr}`);
  };

  return (
    <div className="p-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <i className="ri-arrow-left-line"></i>
        <span className="text-sm">Geri</span>
      </button>

      <h3 className="text-lg font-medium text-white mb-4 text-center">Etkinlik Tarihi Seçin</h3>

      {/* Calendar */}
      <div className="bg-gray-800 rounded-xl p-4 max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setSlideDirection('left');
              setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>

          <AnimatePresence mode="wait">
            <motion.span
              key={`${currentMonth.getMonth()}-${currentMonth.getFullYear()}`}
              initial={{ opacity: 0, x: slideDirection === 'right' ? 15 : -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection === 'right' ? -15 : 15 }}
              transition={{ duration: 0.15 }}
              className="font-medium text-sm text-white"
            >
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </motion.span>
          </AnimatePresence>

          <button
            onClick={() => {
              setSlideDirection('right');
              setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentMonth.getMonth()}-${currentMonth.getFullYear()}`}
            initial={{ opacity: 0, x: slideDirection === 'right' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection === 'right' ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-7 gap-1"
          >
            {days.map((day, index) => (
              <div key={index} className="aspect-square flex items-center justify-center">
                {day !== null ? (
                  <button
                    onClick={() => handleDateClick(day)}
                    disabled={isDateDisabled(day)}
                    className={`w-full h-full rounded-lg text-sm font-medium transition-all relative flex items-center justify-center ${
                      isSelected(day)
                        ? 'bg-white text-black'
                        : isToday(day)
                          ? 'bg-gray-700 text-white ring-1 ring-gray-600'
                          : isDateDisabled(day)
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                ) : null}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {selectedDate && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Seçilen: <span className="text-white font-medium">
            {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </p>
      )}
    </div>
  );
}

export default function CreateRentalModal({ onClose, onSuccess }: CreateRentalModalProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Product selection
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Step 1.5: Size & Color selection
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  // Step 2: Date selection
  const [selectedDate, setSelectedDate] = useState('');
  const [disabledDates, setDisabledDates] = useState<string[]>([]);
  
  // Step 3: Customer form
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch products from cache or database
  useEffect(() => {
    async function fetchProducts() {
      setLoadingProducts(true);
      
      // Check cache first
      if (hasCache('products')) {
        const cached = getCache<Product>('products');
        if (cached) {
          setProducts(cached);
          setLoadingProducts(false);
          return;
        }
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('urunler')
        .select('id, title, price, size, colors, images')
        .eq('status', 'Yayında');

      if (error) {
        console.error('Ürünler alınamadı:', error);
        toast.error('Ürünler yüklenemedi');
      } else if (data) {
        const formattedProducts = data.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          size: item.size || [],
          colors: item.colors || [],
          images: item.images || [],
        }));
        setProducts(formattedProducts);
        setCache('products', formattedProducts);
      }
      
      setLoadingProducts(false);
    }

    fetchProducts();
  }, []);

  // Fetch disabled dates when product is selected
  useEffect(() => {
    async function fetchDisabledDates() {
      if (!selectedProductId) return;
      
      const product = products.find(p => p.id === selectedProductId);
      if (!product) return;

      const { data, error } = await supabase
        .from('siparisler')
        .select('eventDate')
        .eq('productName', product.title);

      if (error) {
        console.error('Dolu tarihler alınamadı:', error);
        return;
      }

      const dates: string[] = [];
      data?.forEach(({ eventDate }) => {
        if (!eventDate) return;
        const event = new Date(eventDate);
        for (let i = -7; i <= 7; i++) {
          const d = new Date(event);
          d.setDate(event.getDate() + i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dates.push(`${year}-${month}-${day}`);
        }
      });

      setDisabledDates([...new Set(dates)]);
    }

    if (currentStep === 2) {
      fetchDisabledDates();
    }
  }, [currentStep, selectedProductId, products]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Get selected product
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Get product image URL
  const getImageUrl = (images: string[]) => {
    if (!images || images.length === 0) return '/images/Anasayfa/Meryem_Balkan_Logo.jpg';
    const img = images[0];
    if (img.startsWith('http')) return img;
    return IMAGE_BASE_URL + img;
  };

  // Format price
  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' 
      ? parseFloat(price.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'))
      : price;
    return num.toLocaleString('tr-TR') + ' ₺';
  };

  // Parse price to number
  const parsePrice = (price: string | number) => {
    if (typeof price === 'number') return price;
    return parseFloat(price.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Handle product card click
  const handleProductClick = (productId: number) => {
    if (selectedProductId === productId) {
      // Deselect
      setSelectedProductId(null);
      setSelectedSize('');
      setSelectedColor('');
    } else {
      setSelectedProductId(productId);
      setSelectedSize('');
      setSelectedColor('');
    }
  };

  // Handle size/color confirmation
  const handleConfirmSelection = () => {
    if (selectedSize && selectedColor) {
      setCurrentStep(2);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCurrentStep(3);
  };

  // Handle back from calendar
  const handleBackFromCalendar = () => {
    setCurrentStep(1);
    setSelectedProductId(null);
    setSelectedSize('');
    setSelectedColor('');
    setSelectedDate('');
  };

  // Handle form change
  const handleFormChange = (field: keyof CustomerForm, value: string) => {
    setCustomerForm(prev => ({ ...prev, [field]: value }));
  };

  // Validate form
  const isFormValid = useMemo(() => {
    return (
      customerForm.firstName.trim() !== '' &&
      customerForm.lastName.trim() !== '' &&
      customerForm.phone.trim() !== '' &&
      (!customerForm.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email))
    );
  }, [customerForm]);

  // Submit order
  const handleSubmit = async () => {
    if (!selectedProduct || !isFormValid) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('siparisler').insert({
        customerName: `${customerForm.firstName} ${customerForm.lastName}`,
        productName: selectedProduct.title,
        size: selectedSize,
        color: selectedColor,
        eventDate: selectedDate,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'Hazırlanıyor',
        phone: customerForm.phone,
        email: customerForm.email || null,
        address: customerForm.address || null,
        price: selectedProduct.price,
        shippingCode: null,
        paymentMethod: 'Mağazadan',
      });

      if (error) throw error;

      toast.success('Kiralama başarıyla oluşturuldu!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Sipariş oluşturulamadı:', error);
      toast.error('Bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // Show confirmation modal
  const handleShowConfirm = () => {
    if (!selectedProduct || !isFormValid) return;
    setShowConfirmModal(true);
  };

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden bg-gray-900 text-white border border-gray-700 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base sm:text-lg font-medium">Yeni Kiralama Oluştur</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1: Product Selection */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 sm:p-6"
              >
                {/* Search */}
                <div className="relative mb-4">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Elbise ara..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gray-600 focus:outline-none text-sm"
                  />
                </div>

                {/* Products Grid */}
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <i className="ri-search-line text-4xl mb-2"></i>
                    <p>Elbise bulunamadı</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProductId === product.id;
                      
                      return (
                        <div
                          key={product.id}
                          className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-white ring-2 ring-white/30'
                              : selectedProductId && !isSelected
                                ? 'border-gray-800 opacity-40'
                                : 'border-gray-800 hover:border-gray-600'
                          }`}
                          onClick={() => handleProductClick(product.id)}
                        >
                          {/* Product Image */}
                          <div className="relative aspect-[3/4]">
                            <img
                              src={getImageUrl(product.images)}
                              alt={product.title}
                              className={`w-full h-full object-cover object-top transition-all ${
                                isSelected ? 'blur-sm brightness-50' : ''
                              }`}
                            />

                            {/* Size & Color Overlay (Step 1.5) */}
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 p-3 flex flex-col justify-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Sizes */}
                                <div className="mb-3">
                                  <p className="text-xs text-gray-300 mb-1.5">Beden</p>
                                  <div className="flex flex-wrap gap-1">
                                    {product.size.map((size) => (
                                      <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-2 py-1 text-xs rounded-md transition-all ${
                                          selectedSize === size
                                            ? 'bg-white text-black'
                                            : 'bg-gray-800/80 text-white hover:bg-gray-700'
                                        }`}
                                      >
                                        {size}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Colors */}
                                <div className="mb-3">
                                  <p className="text-xs text-gray-300 mb-1.5">Renk</p>
                                  <div className="flex flex-wrap gap-1">
                                    {product.colors.map((color) => (
                                      <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`px-2 py-1 text-xs rounded-md transition-all ${
                                          selectedColor === color
                                            ? 'bg-white text-black'
                                            : 'bg-gray-800/80 text-white hover:bg-gray-700'
                                        }`}
                                      >
                                        {color}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Confirm Button */}
                                <button
                                  onClick={handleConfirmSelection}
                                  disabled={!selectedSize || !selectedColor}
                                  className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                                    selectedSize && selectedColor
                                      ? 'bg-white text-black hover:bg-gray-100'
                                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  {selectedSize && selectedColor ? 'Devam Et' : 'Seçim Yapın'}
                                </button>
                              </motion.div>
                            )}
                          </div>

                          {/* Product Info */}
                          {!isSelected && (
                            <div className="p-2 sm:p-3 bg-gray-800">
                              <p className="text-xs sm:text-sm font-medium text-white truncate">{product.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatPrice(product.price)}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Date Selection */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <MiniCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  disabledDates={disabledDates}
                  onBack={handleBackFromCalendar}
                />
              </motion.div>
            )}

            {/* STEP 3: Customer Form */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 sm:p-6"
              >
                {/* Back button */}
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                >
                  <i className="ri-arrow-left-line"></i>
                  <span className="text-sm">Geri</span>
                </button>

                {/* Summary */}
                {selectedProduct && (
                  <div className="bg-gray-800 rounded-xl p-4 mb-6 flex gap-4">
                    <img
                      src={getImageUrl(selectedProduct.images)}
                      alt={selectedProduct.title}
                      className="w-16 h-20 sm:w-20 sm:h-24 object-cover object-top rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm sm:text-base truncate">{selectedProduct.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedSize} • {selectedColor}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm font-medium text-white mt-2">{formatPrice(selectedProduct.price)}</p>
                    </div>
                  </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ad *</label>
                      <input
                        type="text"
                        value={customerForm.firstName}
                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                        placeholder="Ad"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gray-600 focus:outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Soyad *</label>
                      <input
                        type="text"
                        value={customerForm.lastName}
                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                        placeholder="Soyad"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gray-600 focus:outline-none text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Telefon *</label>
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        placeholder="0532 123 4567"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gray-600 focus:outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        placeholder="ornek@email.com"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gray-600 focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Açık Adres</label>
                    <textarea
                      value={customerForm.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      placeholder="Adres"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gray-600 focus:outline-none text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-full border font-medium transition-colors border-gray-600 text-white hover:bg-gray-800 text-sm"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleShowConfirm}
                    disabled={!isFormValid}
                    className={`flex-1 py-3 px-4 rounded-full font-medium transition-colors text-sm flex items-center justify-center gap-2 ${
                      isFormValid
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Kiralama Oluştur
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <i className="ri-question-line text-2xl text-white"></i>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Kiralama Oluştur</h3>
              <p className="text-sm text-gray-400">
                Kiralama oluşturmak istediğinize emin misiniz?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-full border border-gray-600 text-white hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Hayır
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-full bg-white text-black hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <i className="ri-loader-4-line animate-spin"></i>}
                Evet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
