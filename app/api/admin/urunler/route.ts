// Admin Products API - Server-side only
// RLS bypass için Service Role Key kullanır

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { cookies } from 'next/headers';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// R2 Client oluştur
function getR2Client() {
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 environment variables are missing");
  }

  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// JWT doğrulama
async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) return false;

    const secret = process.env.ADMIN_JWT_SECRET || 'fallback-secret-change-in-production';
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerEncoded, payloadEncoded, signatureProvided] = parts;

    const base64UrlDecode = (str: string): string => {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) str += '=';
      return atob(str);
    };

    const base64UrlEncode = (str: string): string => {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${headerEncoded}.${payloadEncoded}`)
    );
    const expectedSignature = base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    );

    if (signatureProvided !== expectedSignature) return false;

    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return false;
    if (payload.role !== 'admin') return false;
    if (!payload.otp_verified) return false;

    return true;
  } catch {
    return false;
  }
}

// GET: Tüm ürünleri getir
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const fields = searchParams.get('fields');

    const supabase = getSupabaseAdmin();
    
    // Custom fields veya tümü
    const selectFields = fields || '*';
    let query = supabase.from('urunler').select(selectFields);

    // Status filtresi
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Ürünler alınamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/admin/urunler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Yeni ürün ekle
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('urunler')
      .insert(body)
      .select();

    if (error) {
      console.error('Ürün eklenemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('POST /api/admin/urunler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Ürün güncelle
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('urunler')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Ürün güncellenemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('PUT /api/admin/urunler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Ürün sil
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Önce ürünün resimlerini al
    const { data: productData, error: fetchError } = await supabase
      .from('urunler')
      .select('images')
      .eq('id', parseInt(id))
      .single();

    if (fetchError) {
      console.error('Ürün bilgisi alınamadı:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Cloudflare R2'den resimleri sil
    if (productData?.images && Array.isArray(productData.images) && productData.images.length > 0) {
      try {
        if (!process.env.NEXT_PUBLIC_R2_BUCKET_NAME) {
          throw new Error("NEXT_PUBLIC_R2_BUCKET_NAME is missing");
        }

        const r2 = getR2Client();
        const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;

        // Object keys: urunler/<fileName> formatında
        const objectKeys = productData.images.map((fileName: string) => ({ Key: `urunler/${fileName}` }));

        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: objectKeys,
          },
        });

        await r2.send(deleteCommand);
      } catch (r2Error: any) {
        console.warn('R2\'den fotoğraflar silinemedi:', r2Error.message);
        // R2 silme başarısız olsa bile ürünü silmeye devam et
      }
    }

    // Ürünü veritabanından sil
    const { error } = await supabase
      .from('urunler')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Ürün silinemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/urunler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
