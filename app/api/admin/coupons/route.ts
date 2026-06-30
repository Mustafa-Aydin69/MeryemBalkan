// Admin Coupons API — service-role only, Flutter Bearer token ile çağrılır.
// Web admin panelinde kupon arayüzü yok; bu endpoint yalnızca Flutter admin uygulaması içindir.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { verifyAdminToken, enforceAdminRateLimit } from '@/app/lib/admin-auth';

// Whitelist: client'ın gönderebileceği alanlar (injection engeli)
const ALLOWED_FIELDS = [
  'code', 'discount_type', 'discount_value',
  'max_uses', 'min_order_amount', 'assigned_email',
  'expires_at', 'is_active',
] as const;

// GET: Tüm kuponları listele (created_at desc)
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Kuponlar alınamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    console.error('GET /api/admin/coupons error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Yeni kupon oluştur
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();

    // Yalnızca izin verilen alanları al
    const safeInsert: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body && body[field] !== undefined && body[field] !== '') {
        safeInsert[field] = body[field];
      }
    }

    // Zorunlu alan kontrolü
    if (!safeInsert.code || !safeInsert.discount_type || safeInsert.discount_value === undefined) {
      return NextResponse.json(
        { error: 'code, discount_type ve discount_value zorunludur.' },
        { status: 400 }
      );
    }

    // Kodu büyük harfe normalize et (okunabilirlik + case-insensitive index ile uyum)
    safeInsert.code = String(safeInsert.code).trim().toUpperCase();

    // assigned_email varsa küçük harfe normalize et
    if (safeInsert.assigned_email) {
      safeInsert.assigned_email = String(safeInsert.assigned_email).trim().toLowerCase();
    }

    // percent tipinde değer 0-100 arası olmalı
    if (safeInsert.discount_type === 'percent') {
      const val = Number(safeInsert.discount_value);
      if (val <= 0 || val > 100) {
        return NextResponse.json(
          { error: 'Yüzde indirim değeri 1-100 arasında olmalıdır.' },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('coupons')
      .insert(safeInsert)
      .select()
      .single();

    if (error) {
      // 23505 = unique violation (aynı kod)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Bu kupon kodu zaten mevcut.' }, { status: 400 });
      }
      console.error('Kupon oluşturulamadı:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    console.error('POST /api/admin/coupons error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Kupon güncelle (alanlar + is_active toggle)
export async function PUT(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id parametresi gerekli.' }, { status: 400 });
    }

    const body = await request.json();
    const safeUpdate: Record<string, unknown> = {};
    const updatableFields = [...ALLOWED_FIELDS, 'is_active'] as const;
    for (const field of updatableFields) {
      if (field in body) {
        const v = body[field];
        safeUpdate[field] = v === '' ? null : v;
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok.' }, { status: 400 });
    }

    if (safeUpdate.code) {
      safeUpdate.code = String(safeUpdate.code).trim().toUpperCase();
    }
    if (safeUpdate.assigned_email) {
      safeUpdate.assigned_email = String(safeUpdate.assigned_email).trim().toLowerCase();
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('coupons')
      .update(safeUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Bu kupon kodu zaten mevcut.' }, { status: 400 });
      }
      console.error('Kupon güncellenemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    console.error('PUT /api/admin/coupons error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Kuponu iptal et (soft delete — is_active = false)
export async function DELETE(request: NextRequest) {
  try {
    const payload = await verifyAdminToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitRes = await enforceAdminRateLimit(request, payload);
    if (rateLimitRes) return rateLimitRes;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id parametresi gerekli.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Kupon iptal edilemedi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('DELETE /api/admin/coupons error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
