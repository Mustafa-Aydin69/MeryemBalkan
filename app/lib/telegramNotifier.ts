interface TelegramOrderPayload {
  conversationId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  totalPrice: number;
  shippingCost: number;
  items: Array<{ product_name: string; color: string; size: string; event_date: string; price: number }>;
}

export async function sendTelegramAdminOrderNotification(payload: TelegramOrderPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN veya TELEGRAM_ADMIN_CHAT_ID ayarlı değil — bildirim atlandı');
    return;
  }

  const { conversationId, customerName, phone, email, address, totalPrice, shippingCost, items } = payload;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const itemLines = items
    .map(i => `▸ <b>${i.product_name}</b> · ${i.color} / Beden ${i.size}\n  📅 ${formatDate(i.event_date)} · ${i.price.toLocaleString('tr-TR')} TL`)
    .join('\n');

  const kargo = shippingCost > 0 ? `\n🚚 Kargo: ${shippingCost.toLocaleString('tr-TR')} TL` : '\n🏪 Mağazadan teslim';

  const text = [
    `🛍 <b>Yeni Sipariş!</b>`,
    ``,
    `👤 <b>${customerName}</b>`,
    `📞 ${phone}`,
    `📧 ${email}`,
    `📍 ${address}`,
    ``,
    `<b>Ürünler:</b>`,
    itemLines,
    ``,
    kargo,
    `💰 <b>Toplam: ${totalPrice.toLocaleString('tr-TR')} TL</b>`,
    ``,
    `🆔 <code>${conversationId}</code>`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API hatası: ${res.status} ${body}`);
  }
}
