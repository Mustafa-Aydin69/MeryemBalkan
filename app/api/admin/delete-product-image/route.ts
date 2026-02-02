// Admin Product Image Delete API
// Atomik olarak R2'den ve DB'den resim siler

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

// R2 Client oluştur
function getR2Client() {
  // Environment variable guards
  if (!process.env.R2_ENDPOINT) {
    throw new Error("R2_ENDPOINT is missing");
  }
  if (!process.env.R2_ACCESS_KEY_ID) {
    throw new Error("R2_ACCESS_KEY_ID is missing");
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2_SECRET_ACCESS_KEY is missing");
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

// POST: Atomik resim silme (R2 + DB)
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, imagePath } = body;

    if (!productId || !imagePath) {
      return NextResponse.json({ error: 'productId ve imagePath gerekli' }, { status: 400 });
    }

    // Environment variable guard
    if (!process.env.NEXT_PUBLIC_R2_BUCKET_NAME) {
      console.error("NEXT_PUBLIC_R2_BUCKET_NAME is missing");
      return NextResponse.json({ error: 'NEXT_  PUBLIC_R2_BUCKET_NAME is missing' }, { status: 500 });
    }

    const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    
    // Object key: urunler/<imagePath>
    const objectKey = `urunler/${imagePath}`;

    const r2 = getR2Client();

    // 1. Önce R2'den sil
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    try {
      await r2.send(deleteCommand);
    } catch (r2Error: any) {
      console.error('R2 silme hatası:', r2Error.message);
      return NextResponse.json({ 
        error: 'R2\'den dosya silinemedi', 
        details: r2Error.message,
        code: r2Error.Code || r2Error.name
      }, { status: 500 });
    }

    // 2. R2 silme başarılı, şimdi DB'den kaldır
    const supabase = getSupabaseAdmin();

    // Önce mevcut ürünü al
    const { data: product, error: fetchError } = await supabase
      .from('urunler')
      .select('images')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      console.error('Ürün bulunamadı:', fetchError);
      return NextResponse.json({ 
        error: 'Ürün bulunamadı',
        warning: 'R2\'den silindi ancak DB güncellenmedi' 
      }, { status: 404 });
    }

    // images dizisinden path'i kaldır
    const currentImages = product.images || [];
    const updatedImages = currentImages.filter((img: string) => img !== imagePath);

    // DB'yi güncelle
    const { error: updateError } = await supabase
      .from('urunler')
      .update({ images: updatedImages })
      .eq('id', productId);

    if (updateError) {
      console.error('DB güncelleme hatası:', updateError);
      return NextResponse.json({ 
        error: 'Veritabanı güncellenemedi',
        warning: 'R2\'den silindi ancak DB güncellenmedi'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Resim başarıyla silindi',
      updatedImages 
    });

  } catch (error: any) {
    console.error('POST /api/admin/delete-product-image error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
