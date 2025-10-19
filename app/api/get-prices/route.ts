import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://orplwznpdpwnyflkbuoy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycGx3em5wZHB3bnlmbGtidW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM5MzksImV4cCI6MjA3NTM0OTkzOX0.vjYN3-jHAJknRjOFv2V21MyQR8KrG6zFRmEJ6PoVW0c"

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
