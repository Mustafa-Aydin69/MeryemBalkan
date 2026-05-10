'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface OrderItem {
  id: number;
  orderId: string;
  productName: string;
  eventDate: string;
  orderDate: string;
  status: string;
  price: string;
  customerName: string;
  color: string;
  size: string;
}

interface PopupState {
  order: OrderItem;
  x: number;
  y: number;
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS_SHORT = ['PT', 'SA', 'ÇA', 'PE', 'CU', 'CT', 'PZ'];
const POPUP_W = 224;
const POPUP_H = 200;

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'Hazırlanıyor': { label: 'Hazırlanıyor', color: 'text-amber-300', bg: 'bg-amber-500/25', border: 'border-amber-400', dot: 'bg-amber-400' },
  'Kirada':       { label: 'Kirada',       color: 'text-green-300', bg: 'bg-green-500/25', border: 'border-green-400', dot: 'bg-green-400' },
  'Tamamlandı':   { label: 'Tamamlandı',   color: 'text-blue-300',  bg: 'bg-blue-500/25',  border: 'border-blue-400',  dot: 'bg-blue-400'  },
  'İptal Edildi': { label: 'İptal Edildi', color: 'text-red-300',   bg: 'bg-red-500/25',   border: 'border-red-400',   dot: 'bg-red-400'   },
};

const parsePrice = (price: string): number =>
  parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0;

const normalizeStatus = (s: string) => s === 'Sipariş Tamamlandı' ? 'Tamamlandı' : s;
const getStatusCfg = (s: string) => STATUS_CFG[normalizeStatus(s)] ?? STATUS_CFG['Hazırlanıyor'];

const toLocalDateStr = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const daysBetween = (a: string, b: string) =>
  Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000);

function computePopupPos(rect: DOMRect): { x: number; y: number } {
  const margin = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Önce yukarıda dene, sığmazsa aşağıda
  let y = rect.top - POPUP_H - 8;
  if (y < margin) y = rect.bottom + 8;

  // Sola hizala, sığmazsa sağa yasla
  let x = rect.left;
  if (x + POPUP_W > vw - margin) x = vw - POPUP_W - margin;
  if (x < margin) x = margin;

  // Y clamp
  if (y + POPUP_H > vh - margin) y = vh - POPUP_H - margin;
  if (y < margin) y = margin;

  return { x, y };
}

interface Props {
  onNavigate?: (tab: string) => void;
}

export default function DashboardPage({ onNavigate }: Props) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [popup, setPopup] = useState<PopupState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/siparisler').then(r => r.json()),
      fetch('/api/admin/mesajlar').then(r => r.json()),
    ]).then(([ord, msg]) => {
      setOrders(ord.data || []);
      const rawMessages: any[] = msg.data || [];
      const transformed = rawMessages.map(m => ({
        status: m.cevap === 'Verildi' ? 'Verildi' : 'Bekliyor',
      }));
      setPendingCount(transformed.filter(m => m.status === 'Bekliyor').length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEventEnter = (e: React.MouseEvent, order: OrderItem) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { x, y } = computePopupPos(rect);
    setPopup({ order, x, y });
  };

  const handleEventLeave = () => {
    hideTimer.current = setTimeout(() => setPopup(null), 120);
  };

  const handlePopupEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  const handlePopupLeave = () => {
    hideTimer.current = setTimeout(() => setPopup(null), 120);
  };

  const now = new Date();
  const todayStr = toLocalDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCount = useMemo(() =>
    orders.filter(o => (o.eventDate || '').startsWith(thisMonthPrefix)).length,
  [orders, thisMonthPrefix]);
  const preparingCount = useMemo(() => orders.filter(o => o.status === 'Hazırlanıyor').length, [orders]);
  const rentedCount    = useMemo(() => orders.filter(o => o.status === 'Kirada').length, [orders]);

  const revenueChartData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const revenue = orders
        .filter(o => (o.orderDate || '').startsWith(prefix))
        .reduce((sum, o) => sum + parsePrice(o.price), 0);
      return { ay: MONTHS[d.getMonth()].slice(0, 3), gelir: revenue };
    }),
  [orders]);

  const ordersByDate = useMemo(() => {
    const map: Record<string, OrderItem[]> = {};
    orders.forEach(o => {
      const d = o.eventDate?.split('T')[0];
      if (!d) return;
      (map[d] = map[d] || []).push(o);
    });
    return map;
  }, [orders]);

  const upcomingOrders = useMemo(() =>
    orders
      .filter(o => {
        const d = daysBetween(o.eventDate?.split('T')[0] || '', todayStr);
        return d >= 0 && d <= 30 && (o.status === 'Hazırlanıyor' || o.status === 'Kirada');
      })
      .sort((a, b) => (a.eventDate > b.eventDate ? 1 : -1))
      .slice(0, 5),
    [orders, todayStr]
  );

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const stats = [
    { icon: 'ri-shopping-bag-line', color: 'text-blue-400',    iconBg: 'bg-blue-500/10',    change: MONTHS[now.getMonth()], title: 'Bu Ay Sipariş',  value: String(thisMonthCount) },
    { icon: 'ri-t-shirt-line',      color: 'text-amber-400',   iconBg: 'bg-amber-500/10',   change: 'Hazırlanıyor',         title: 'Aktif Kiralama', value: String(preparingCount) },
    { icon: 'ri-store-2-line',      color: 'text-emerald-400', iconBg: 'bg-emerald-500/10', change: 'Şu an kirada',         title: 'Kiradakiler',    value: String(rentedCount) },
    { icon: 'ri-message-3-line',    color: 'text-rose-400',    iconBg: 'bg-rose-500/10',    change: 'bekleyen mesaj',       title: 'Mesajlar',       value: String(pendingCount) },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 hover:border-amber-500/40 transition-all duration-500 group">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className={`p-2 sm:p-3 rounded-xl border border-gray-700 ${stat.iconBg} group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-500`}>
                <i className={`${stat.icon} text-base sm:text-xl ${stat.color}`}></i>
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full bg-gray-700 border border-gray-600 ${stat.color} hidden sm:inline`}>
                {stat.change}
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 mb-1 font-medium">{stat.title}</p>
            <h3 className="text-xl sm:text-2xl font-light tracking-tight text-white group-hover:text-amber-50 transition-all">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Gelir Grafiği */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-1">Son 6 Ay</p>
            <h2 className="text-base font-serif italic text-amber-100">Gelir Trendi</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 mb-0.5">Bu ay</p>
            <p className="text-lg font-light text-white">
              {(revenueChartData[5]?.gelir ?? 0).toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gelirGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="ay"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={55}
              tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: '#D1D5DB', marginBottom: 4 }}
              itemStyle={{ color: '#F59E0B' }}
              formatter={(v: number) => [`${v.toLocaleString('tr-TR')} ₺`, 'Gelir']}
            />
            <Area
              type="monotone"
              dataKey="gelir"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#gelirGradient)"
              dot={{ fill: '#F59E0B', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#F59E0B', stroke: '#1F2937', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Ana İçerik */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

        {/* Takvim */}
        <div className="lg:col-span-8">
          <div className="bg-gray-800 border border-gray-700 rounded-[2rem] p-4 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>

            {/* Başlık */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8 relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg sm:text-xl font-serif italic tracking-wide border-l-2 border-amber-500 pl-3 sm:pl-4 text-amber-100">
                  Atölye Takvimi
                </h2>
                <div className="flex items-center gap-1 bg-gray-900 rounded-full p-1 border border-gray-600">
                  <button
                    onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    className="p-1.5 hover:bg-gray-700 rounded-full transition-colors text-gray-300 hover:text-white"
                  >
                    <i className="ri-arrow-left-s-line text-sm"></i>
                  </button>
                  <span className="text-[11px] px-2 sm:px-3 font-bold uppercase tracking-widest text-gray-200 w-28 sm:w-32 text-center">
                    {MONTHS[month]} {year}
                  </span>
                  <button
                    onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    className="p-1.5 hover:bg-gray-700 rounded-full transition-colors text-gray-300 hover:text-white"
                  >
                    <i className="ri-arrow-right-s-line text-sm"></i>
                  </button>
                </div>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-gray-600 hover:text-white transition-all active:scale-95 flex-shrink-0 disabled:opacity-50"
              >
                <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
                <span className="hidden sm:inline">Yenile</span>
              </button>
            </div>

            {/* Takvim Grid — mobilde yatay kaydır */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 relative z-10">
              <div className="min-w-[560px] sm:min-w-0 px-4 sm:px-0">
                <div className="grid grid-cols-7 border border-gray-700 rounded-2xl">
                  {DAYS_SHORT.map(d => (
                    <div key={d} className="bg-gray-900 p-2 sm:p-3 text-center text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] border-b border-gray-700">
                      {d}
                    </div>
                  ))}

                  {cells.map((day, i) => {
                    if (day === null) {
                      return <div key={`e-${i}`} className="bg-gray-900/50 min-h-[80px] border-r border-b border-gray-700/60 last:border-r-0" />;
                    }

                    const dateStr = toLocalDateStr(year, month, day);
                    const dayOrders = ordersByDate[dateStr] || [];
                    const isToday = dateStr === todayStr;
                    const isBusy = dayOrders.length >= 3;

                    return (
                      <div
                        key={day}
                        className={`min-h-[80px] p-1.5 sm:p-2 relative group/day transition-colors border-r border-b border-gray-700/60 last:border-r-0 ${
                          isBusy ? 'bg-rose-950/40 hover:bg-rose-950/60' : 'bg-gray-800 hover:bg-gray-750'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] sm:text-[11px] font-semibold inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors ${
                            isToday
                              ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/30'
                              : isBusy
                              ? 'bg-rose-500/30 text-rose-300'
                              : 'text-gray-400 group-hover/day:text-white'
                          }`}>
                            {day}
                          </span>
                          {isBusy && (
                            <span className="text-[7px] font-bold text-rose-400 bg-rose-500/20 border border-rose-500/30 rounded px-1 leading-4">
                              {dayOrders.length}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 space-y-0.5">
                          {dayOrders.map((o, oi) => {
                            const cfg = getStatusCfg(o.status);
                            return (
                              <div
                                key={oi}
                                onMouseEnter={e => handleEventEnter(e, o)}
                                onMouseLeave={handleEventLeave}
                                className={`cursor-pointer ${cfg.bg} border-l-2 ${cfg.border} px-1 sm:px-1.5 py-0.5 rounded-r-md`}
                              >
                                <p className={`text-[7px] sm:text-[8px] font-bold uppercase truncate leading-tight ${cfg.color}`}>
                                  {o.customerName.split(' ')[0]} · {o.productName}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Lejant */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-6 relative z-10">
              {Object.values(STATUS_CFG).map(cfg => (
                <div key={cfg.label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                  <span className="text-[10px] text-gray-400">{cfg.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-[10px] text-gray-400">Yoğun gün (3+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Yaklaşan Etkinlikler */}
        <div className="lg:col-span-4">
          <div className="bg-gray-800 border border-gray-700 rounded-[2rem] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-[11px] uppercase tracking-[0.3em] text-amber-300 flex items-center gap-2 font-bold">
                <span className="w-5 h-[1px] bg-amber-500"></span>
                Yaklaşan Etkinlikler
              </h2>
              <i className="ri-alert-line text-amber-400 text-sm"></i>
            </div>

            {upcomingOrders.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">Önümüzdeki 30 günde etkinlik yok.</p>
            ) : (
              <div className="space-y-3">
                {upcomingOrders.map(o => {
                  const days = daysBetween(o.eventDate?.split('T')[0] || '', todayStr);
                  const isUrgent = days <= 2;
                  const cfg = getStatusCfg(o.status);
                  return (
                    <div key={o.id} className="group flex items-center justify-between p-3 rounded-2xl bg-gray-700/40 border border-gray-700 hover:bg-gray-700 hover:border-amber-500/30 transition-all cursor-pointer">
                      <div className="flex gap-3 items-center overflow-hidden">
                        <div className={`text-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border flex-shrink-0 ${
                          isUrgent
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                            : 'bg-gray-900 border-gray-600 text-amber-300'
                        }`}>
                          <span className="text-[7px] uppercase tracking-tighter text-gray-500">gün</span>
                          <span className="text-base font-light leading-none">{days}</span>
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-amber-100 transition-colors">{o.customerName}</h4>
                          <p className="text-[10px] text-gray-400 truncate">{o.productName}</p>
                          <span className={`text-[9px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>
                      <i className="ri-arrow-right-up-line text-gray-500 group-hover:text-amber-400 transition-colors flex-shrink-0 text-sm ml-2"></i>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => onNavigate?.('orders')}
              className="w-full mt-4 sm:mt-5 py-3 border border-gray-600 bg-gray-700/30 rounded-2xl text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold hover:text-white hover:bg-gray-700 transition-all"
            >
              Tüm Sipariş Listesi
            </button>
          </div>
        </div>

      </div>

      {/* Fixed Popup — viewport'a göre konumlanır, hiçbir overflow'a takılmaz */}
      {popup && (() => {
        const cfg = getStatusCfg(popup.order.status);
        return (
          <div
            onMouseEnter={handlePopupEnter}
            onMouseLeave={handlePopupLeave}
            style={{ left: popup.x, top: popup.y, width: POPUP_W }}
            className="fixed z-[9999] p-4 bg-gray-900 border border-gray-600 rounded-2xl shadow-2xl pointer-events-auto"
          >
            <p className={`text-[8px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 ${cfg.dot} rounded-full animate-pulse`}></span>
              {cfg.label}
              <span className="text-gray-500 normal-case font-normal tracking-normal">· Order #{popup.order.id}</span>
            </p>
            <h4 className="text-sm font-serif italic text-white mb-1 truncate">{popup.order.productName}</h4>
            <p className="text-[10px] text-gray-400 mb-2 pb-2 border-b border-gray-700">
              {popup.order.color} · Beden: {popup.order.size}
            </p>
            <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 space-y-1">
              <div>
                <span className="text-[8px] uppercase tracking-widest text-gray-500 block mb-0.5">Müşteri</span>
                <p className="text-[10px] text-gray-200">{popup.order.customerName}</p>
              </div>
              <div className="pt-1 border-t border-gray-700 text-right">
                <p className="text-[10px] text-amber-400">{popup.order.price}</p>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
