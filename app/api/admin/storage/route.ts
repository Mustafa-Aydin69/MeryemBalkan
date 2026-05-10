// Admin Storage API - Cloudflare R2
// S3 compatible API kullanır

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import sharp from 'sharp';

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

import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

function sanitizeName(raw: string): string {
  return raw
    .replace(/\.[^.]+$/, '')          // uzantıyı çıkar
    .replace(/[^\x00-\x7F]/g, '')     // emoji ve non-ASCII kaldır
    .replace(/[^a-zA-Z0-9_-]/g, '_') // geçersiz karakterleri _ yap
    .replace(/_+/g, '_')              // ardışık _'leri tekleştir
    .replace(/^_+|_+$/g, '')          // baştaki/sondaki _'leri temizle
    || `file_${Date.now()}`;           // tümü temizlendiyse fallback
}

// POST: Dosya yükle
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    // Environment variable guard
    const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    if (!bucketName) {
      console.error("NEXT_PUBLIC_R2_BUCKET_NAME is missing");
      return NextResponse.json({ error: 'NEXT_PUBLIC_R2_BUCKET_NAME is missing' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const r2 = getR2Client();

    // File'ı buffer'a çevir
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer));
    let contentType = file.type;

    const rawName = fileName || `${Date.now()}_${file.name}`;
    const baseName = sanitizeName(rawName);

    // Video dosyalarını olduğu gibi yükle, görselleri WebP'ye çevir
    const isVideo = file.type.startsWith('video/');
    let uniqueName: string;

    if (isVideo) {
      const ext = rawName.replace(/.*\./, '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
      uniqueName = `${baseName}.${ext}`;
    } else {
      buffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      contentType = 'image/webp';
      uniqueName = `${baseName}.webp`;
    }

    // Object key: urunler/<fileName>
    const objectKey = `urunler/${uniqueName}`;

    // R2'ye yükle
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    });

    await r2.send(command);

    // Public URL oluştur
    const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${uniqueName}`;

    return NextResponse.json({ 
      success: true, 
      fileName: uniqueName,  // DB'ye sadece dosya adı kaydedilir (urunler/ prefix'i olmadan)
      publicUrl 
    });
  } catch (error: any) {
    console.error('POST /api/admin/storage error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// DELETE: Dosya sil (batch)
export async function DELETE(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    // Environment variable guard
    const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    if (!bucketName) {
      console.error("NEXT_PUBLIC_R2_BUCKET_NAME is missing");
      return NextResponse.json({ error: 'NEXT_PUBLIC_R2_BUCKET_NAME is missing' }, { status: 500 });
    }

    const body = await request.json();
    const { files } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const r2 = getR2Client();

    // Object keys: urunler/<fileName> formatında
    const objectKeys = files.map((fileName: string) => ({ Key: `urunler/${fileName}` }));

    // R2'den sil
    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectKeys,
      },
    });

    await r2.send(command);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/storage error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// GET: Dosyaları listele (optional)
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    // Environment variable guard
    const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    if (!bucketName) {
      console.error("NEXT_PUBLIC_R2_BUCKET_NAME is missing");
      return NextResponse.json({ error: 'NEXT_PUBLIC_R2_BUCKET_NAME is missing' }, { status: 500 });
    }

    const r2 = getR2Client();

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'urunler/',  // Sadece urunler klasöründekileri listele
      MaxKeys: 100,
    });

    const response = await r2.send(command);

    const files = response.Contents?.map(item => ({
      key: item.Key,
      // fileName: key'den urunler/ prefix'ini çıkar
      fileName: item.Key?.replace('urunler/', ''),
      size: item.Size,
      lastModified: item.LastModified,
      url: `${process.env.R2_PUBLIC_BASE_URL}/${item.Key?.replace('urunler/', '')}`,
    })) || [];

    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error('GET /api/admin/storage error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
