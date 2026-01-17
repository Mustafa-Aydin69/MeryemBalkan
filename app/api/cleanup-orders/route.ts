// Sipariş temizleme API - Server-side
// Service Role Key ile RLS bypass eder

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return new Response(JSON.stringify({ error: "orderIds gerekli" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabaseAdmin();

    // Sadece "Ödeme Yapıyor" durumundaki siparişleri sil
    const { error } = await supabase
      .from("siparisler")
      .delete()
      .in("id", orderIds)
      .eq("status", "Ödeme Yapıyor");

    if (error) {
      console.error("Sipariş silme hatası:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cleanup API hatası:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
