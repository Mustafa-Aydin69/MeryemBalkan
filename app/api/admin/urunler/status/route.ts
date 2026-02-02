// Admin Product Status Bulk Update API
// Toplu ürün durumu değiştirme

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

// PATCH: Toplu ürün durumu güncelle
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { urunIds, status } = body;

    // Validation
    if (!urunIds || !Array.isArray(urunIds) || urunIds.length === 0) {
      return NextResponse.json(
        { error: 'urunIds array gerekli ve boş olmamalı' },
        { status: 400 }
      );
    }

    if (!status || !['Yayında', 'Yayında Değil'].includes(status)) {
      return NextResponse.json(
        { error: 'status "Yayında" veya "Yayında Değil" olmalı' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Toplu güncelleme
    const { data, error } = await supabase
      .from('urunler')
      .update({ status })
      .in('id', urunIds)
      .select('id');

    if (error) {
      console.error('Toplu güncelleme hatası:', error);
      return NextResponse.json(
        { error: 'Ürünler güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${data?.length || 0} ürün başarıyla güncellendi`,
      updatedCount: data?.length || 0,
    });
  } catch (error) {
    console.error('Status API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
