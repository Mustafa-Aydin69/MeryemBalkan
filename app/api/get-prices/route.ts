import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { productIds } = await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // ✅ Supabase'den ürün fiyatlarını çek
    const { data, error } = await supabase
      .from("urunler")
      .select("id, price")
      .in("id", productIds);

    if (error) throw error;

    return NextResponse.json(data || [], { status: 200 });
  } catch (err: any) {
    console.error("get-prices error:", err.message);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
