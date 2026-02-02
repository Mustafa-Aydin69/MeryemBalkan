// Admin Orders API - Server-side only
// RLS bypass için Service Role Key kullanır

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

// Cookie'den token al (tutarlı authentication için)
function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('admin_token')?.value;
  if (cookieToken) return cookieToken;
  
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['admin_token'] || null;
}

// JWT doğrulama
async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  try {
    const token = getTokenFromRequest(request);
    
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

// GET: Tüm siparişleri getir (opsiyonel status filtresi)
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const productName = searchParams.get('productName');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('siparisler')
      .select('id, customerName, address, productName, size, color, eventDate, orderDate, status, price, phone, email, shippingCode, paymentMethod');

    // Status filtresi
    if (status) {
      query = query.eq('status', status);
    }

    // Product name filtresi
    if (productName) {
      query = query.eq('productName', productName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Siparişler alınamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/admin/siparisler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Yeni sipariş oluştur
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('siparisler')
      .insert(body)
      .select();

    if (error) {
      console.error('Sipariş oluşturulamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('POST /api/admin/siparisler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Sipariş güncelle
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
      .from('siparisler')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Sipariş güncellenemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('PUT /api/admin/siparisler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
