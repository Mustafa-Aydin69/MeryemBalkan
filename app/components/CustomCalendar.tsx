'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  disabledDates?: Date[];
  isDarkMode: boolean;
  placeholder?: string;
}

const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function CustomCalendar({
  selectedDate,
  onDateSelect,
  disabledDates = [],
  isDarkMode,
  placeholder = 'Tarih seçiniz'
}: CustomCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Disable dates lookup set for faster comparison (ISO string formatında)
  const disabledSet = useMemo(() => {
    return new Set(disabledDates.map(d => {
      // Tarihi yerel saat dilimine göre ISO formatına çevir
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }));
  }, [disabledDates]);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week (0 = Sunday, we want Monday = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const toLocalDateStr = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    return disabledSet.has(toLocalDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  // Gelecekte ama dolu olan günler (kırmızı)
  const isDateBooked = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    return disabledSet.has(toLocalDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), day));
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
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setSlideDirection('left');
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSlideDirection('right');
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    if (isDateDisabled(day)) return;
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(newDate);
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    if (!isDateDisabled(today.getDate())) {
      onDateSelect(today);
      setIsOpen(false);
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return placeholder;
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const year = selectedDate.getFullYear();
    return `${day} ${MONTHS[selectedDate.getMonth()]} ${year}`;
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-calendar-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <div className="custom-calendar-container relative">
      {/* Input Field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border text-left text-sm transition-all duration-300 flex items-center justify-between group ${
          isDarkMode
            ? 'bg-gray-800/50 border-gray-700 text-white hover:border-gray-500 focus:border-white'
            : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-gray-400 focus:border-black'
        } ${isOpen ? (isDarkMode ? 'border-white ring-1 ring-white/20' : 'border-black ring-1 ring-black/10') : ''}`}
      >
        <span className={`text-sm ${selectedDate ? '' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>
          {formatSelectedDate()}
        </span>
        <i className={`ri-calendar-2-line text-base transition-transform duration-300 ${
          isOpen ? 'rotate-12' : ''
        } ${isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'}`}></i>
      </button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl overflow-hidden ${
              isDarkMode
                ? 'bg-gray-900 border border-gray-700'
                : 'bg-white border border-gray-200'
            }`}
            style={{
              boxShadow: isDarkMode
                ? '0 10px 25px -5px rgba(0, 0, 0, 0.7)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Header */}
            <div className={`px-2 py-2 sm:px-3 sm:py-2.5 flex items-center justify-between ${
              isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-100'
            }`}>
              <button
                type="button"
                onClick={handlePrevMonth}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-black'
                }`}
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
                  className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </motion.span>
              </AnimatePresence>

              <button
                type="button"
                onClick={handleNextMonth}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-black'
                }`}
              >
                <i className="ri-arrow-right-s-line text-lg"></i>
              </button>
            </div>

            {/* Days Header */}
            <div className={`grid grid-cols-7 px-1.5 sm:px-2 pt-2 pb-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {DAYS.map(day => (
                <div key={day} className="text-center text-[10px] sm:text-xs font-medium py-1">
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
                className="grid grid-cols-7 gap-0.5 px-1.5 sm:px-2 pb-2"
              >
                {days.map((day, index) => (
                  <div key={index} className="aspect-square flex items-center justify-center p-0.5">
                    {day !== null ? (
                      <button
                        type="button"
                        onClick={() => handleDateClick(day)}
                        disabled={isDateDisabled(day)}
                        className={`w-full h-full rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 relative flex items-center justify-center ${
                          isSelected(day)
                            ? isDarkMode
                              ? 'bg-white text-black shadow-sm'
                              : 'bg-black text-white shadow-sm'
                            : isToday(day) && !isDateBooked(day)
                              ? isDarkMode
                                ? 'bg-gray-800 text-white ring-1 ring-gray-600'
                                : 'bg-gray-100 text-black ring-1 ring-gray-300'
                              : isDateBooked(day)
                                ? isDarkMode
                                  ? 'bg-rose-500/10 text-rose-500 cursor-not-allowed line-through decoration-rose-500/60'
                                  : 'bg-rose-50 text-rose-400 cursor-not-allowed line-through decoration-rose-300'
                                : isDateDisabled(day)
                                  ? isDarkMode
                                    ? 'text-gray-700 cursor-not-allowed'
                                    : 'text-gray-300 cursor-not-allowed'
                                  : isDarkMode
                                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                        }`}
                      >
                        {day}
                        {isToday(day) && !isSelected(day) && (
                          <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full ${
                            isDarkMode ? 'bg-white' : 'bg-black'
                          }`}></span>
                        )}
                      </button>
                    ) : null}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Lejant */}
            <div className={`px-3 py-1.5 flex items-center justify-center gap-4 text-[10px] ${
              isDarkMode ? 'border-t border-gray-800 text-gray-600' : 'border-t border-gray-100 text-gray-400'
            }`}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-rose-400/70" />
                Dolu
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-sm ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                Müsait
              </span>
            </div>

            {/* Footer */}
            <div className={`px-1.5 sm:px-2 pb-2 pt-0.5 flex gap-1.5 ${
              isDarkMode ? 'border-t border-gray-800' : 'border-t border-gray-100'
            }`}>
              <button
                type="button"
                onClick={handleTodayClick}
                className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                Bugün
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => {
                    onDateSelect(null);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  Temizle
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
