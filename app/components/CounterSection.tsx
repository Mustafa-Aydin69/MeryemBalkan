'use client';
import { useState, useEffect } from 'react';

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

const Counter = ({ end, duration = 2000, suffix = '' }: CounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

const CounterSection = () => {
  const stats = [
    { number: 12, suffix: '+', label: 'Yıllık Deneyim' },
    { number: 22, suffix: '', label: 'Özel Koleksiyon' }
  ];

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-8">
        <div className="text-center mb-16">
          <h3 className="text-3xl sm:text-4xl font-light tracking-wide mb-4">BAŞARILARIMIZ</h3>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            12 yıllık profesyonel deneyimimizle, moda dünyasında özgün ve zarif tasarımlar ortaya koyduk. Her koleksiyonumuz, kaliteli işçilik ve özenle hazırlanmış detaylarla fark yaratıyor.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 justify-items-center text-center">
          {stats.map((stat, index) => (
            <div key={index} className="p-6 sm:p-8">
              <div className="text-6xl sm:text-7xl font-light text-purple-400 mb-4">
                <Counter end={stat.number} suffix={stat.suffix} />
              </div>
              <h4 className="text-lg sm:text-xl font-medium tracking-wide">{stat.label}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CounterSection;
