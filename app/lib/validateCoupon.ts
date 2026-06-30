// validateCoupon — tek kaynak kupon doğrulama yardımcısı
// Hem /api/coupon/validate hem /api/payment/create tarafından kullanılır.
// İndirim YALNIZCA ürün ara toplamı üzerinden hesaplanır; kargo etkilenmez.

import { getSupabaseAdmin } from './supabaseAdmin';

export type CouponResult =
  | { ok: true; discount: number; code: string }
  | { ok: false; reason: string };

export async function validateCoupon(
  code: string,
  itemsTotal: number,
  customerEmail?: string
): Promise<CouponResult> {
  if (!code || !code.trim()) {
    return { ok: false, reason: 'Kupon kodu boş olamaz.' };
  }

  const supabase = getSupabaseAdmin();
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    // case-insensitive eşleşme; idx_coupons_code_lower index'i kullanılır
    .ilike('code', code.trim())
    .maybeSingle();

  if (error) {
    console.error('[validateCoupon] DB hatası:', error.message);
    return { ok: false, reason: 'Kupon doğrulanamadı.' };
  }

  if (!coupon) {
    return { ok: false, reason: 'Geçersiz veya aktif olmayan kupon kodu.' };
  }

  // Süre kontrolü
  if (coupon.expires_at && new Date(coupon.expires_at as string) < new Date()) {
    return { ok: false, reason: 'Bu kuponun süresi dolmuş.' };
  }

  // Kullanım limiti
  if (coupon.max_uses !== null && (coupon.used_count as number) >= (coupon.max_uses as number)) {
    return { ok: false, reason: 'Bu kuponun kullanım limiti dolmuş.' };
  }

  // Minimum sipariş tutarı (ürün ara toplamına bakar; kargo hariç)
  if (coupon.min_order_amount !== null && itemsTotal < Number(coupon.min_order_amount)) {
    return {
      ok: false,
      reason: `Bu kupon için minimum ürün tutarı ${Number(coupon.min_order_amount).toLocaleString('tr-TR')} TL olmalıdır.`,
    };
  }

  // Kişiye özel kontrol
  if (coupon.assigned_email) {
    if (!customerEmail) {
      return { ok: false, reason: 'Bu kupon kişiye özeldir. Lütfen e-posta adresinizi girin.' };
    }
    if ((coupon.assigned_email as string).toLowerCase() !== customerEmail.trim().toLowerCase()) {
      return { ok: false, reason: 'Bu kupon bu e-posta adresine özel değildir.' };
    }
  }

  // İndirim hesaplama (yalnız ürün ara toplamı üzerinden)
  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = itemsTotal * (Number(coupon.discount_value) / 100);
  } else {
    // fixed
    discount = Math.min(Number(coupon.discount_value), itemsTotal);
  }
  // Güvenlik: asla negatif veya itemsTotal'ı aşamaz
  discount = Math.min(Math.max(discount, 0), itemsTotal);

  return { ok: true, discount, code: coupon.code as string };
}
