// Image Delete API - Cloudflare R2
// Basit resim silme endpoint'i

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { cookies } from 'next/headers';

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

// JWT doğrulama
async function verifyAdminToken(): Promise<boolean> {
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

// POST: Resim silme
// Body: { "image": "1768502027938_unnamed.jpg" }
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Environment variable guard
    if (!process.env.NEXT_PUBLIC_R2_BUCKET_NAME) {
      console.error("R2_BUCKET_NAME is missing");
      return NextResponse.json({ error: 'R2_BUCKET_NAME is missing' }, { status: 500 });
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'image parameter is required' }, { status: 400 });
    }

    const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    
    // Object key: urunler/<image>
    const objectKey = `urunler/${image}`;

    const r2 = getR2Client();

    // R2'den sil
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

    return NextResponse.json({ 
      success: true, 
      message: 'Resim başarıyla silindi',
      deletedKey: objectKey
    });

  } catch (error: any) {
    console.error('POST /api/images/delete error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
