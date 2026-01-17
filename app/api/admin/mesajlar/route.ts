// Admin Messages API - Server-side only
// RLS bypass için Service Role Key kullanır

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { cookies } from 'next/headers';

// JWT doğrulama
async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) return false;

    const secret = process.env.ADMIN_JWT_SECRET || 'fallback-secret-change-in-production';
    
    // JWT doğrulama
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerEncoded, payloadEncoded, signatureProvided] = parts;

    // Base64URL decode
    const base64UrlDecode = (str: string): string => {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) str += '=';
      return atob(str);
    };

    // Base64URL encode
    const base64UrlEncode = (str: string): string => {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    // İmza doğrulama
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

    // Payload parse & expire check
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

// GET: Tüm mesajları getir
export async function GET(request: NextRequest) {
  try {
    // Admin token kontrolü
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('mesajlar').select('*');

    if (error) {
      console.error('Mesajlar alınamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/admin/mesajlar error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Mesaj güncelle (cevap durumu)
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
      .from('mesajlar')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Mesaj güncellenemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('PUT /api/admin/mesajlar error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Mesaj sil
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
    const { error } = await supabase
      .from('mesajlar')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Mesaj silinemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/mesajlar error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
