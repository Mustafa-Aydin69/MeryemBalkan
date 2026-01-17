// Admin Storage API - Server-side only
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

// POST: Dosya yükle
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'urunler';
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    // File'ı buffer'a çevir
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uniqueName = fileName || `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Dosya yüklenemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueName);

    return NextResponse.json({ 
      success: true, 
      fileName: uniqueName,
      publicUrl: urlData.publicUrl 
    });
  } catch (error: any) {
    console.error('POST /api/admin/storage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Dosya sil
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { files, bucket = 'urunler' } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.storage
      .from(bucket)
      .remove(files);

    if (error) {
      console.error('Dosyalar silinemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/storage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
