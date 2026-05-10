'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface InstagramPost {
  id: number;
  image_path: string;
  instagram_link?: string | null;
  sort_order: number;
  created_at: string;
}

const getR2BaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || 'https://cdn.meryembalkan.com.tr';
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || 'urunler';
  return `${base.replace(/\/$/, '')}/${bucket.replace(/^\//, '')}/`;
};

export function useInstagram() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/instagram', { credentials: 'include' });
      const { posts: data } = await res.json();
      setPosts(data || []);
    } catch {
      toast.error('Fotoğraflar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const uploadAndAdd = async (file: File, instagramLink?: string) => {
    if (posts.length >= 15) {
      toast.error('En fazla 15 gönderi eklenebilir');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `${Date.now()}_${file.name}`);

      const uploadRes = await fetch('/api/admin/storage', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Yükleme başarısız');
      const { fileName } = await uploadRes.json();

      const addRes = await fetch('/api/admin/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image_path: fileName, instagram_link: instagramLink || null }),
      });
      if (!addRes.ok) throw new Error('Kayıt başarısız');
      const { post } = await addRes.json();
      setPosts((prev) => [...prev, post]);
      toast.success('Gönderi eklendi ✅');
    } catch {
      toast.error('Gönderi eklenemedi ❌');
    } finally {
      setUploading(false);
    }
  };

  const deletePost = async (id: number, imagePath: string) => {
    try {
      // R2'den sil
      const r2Res = await fetch('/api/images/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: imagePath }),
      });
      if (!r2Res.ok) throw new Error('R2 silme başarısız');

      // DB'den sil
      const res = await fetch('/api/admin/instagram', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('DB silme başarısız');
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Fotoğraf silindi');
    } catch {
      toast.error('Fotoğraf silinemedi');
    }
  };

  const movePost = async (index: number, direction: 'up' | 'down') => {
    const newPosts = [...posts];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newPosts.length) return;

    [newPosts[index], newPosts[swapIndex]] = [newPosts[swapIndex], newPosts[index]];
    const updated = newPosts.map((p, i) => ({ ...p, sort_order: i }));
    setPosts(updated);

    await fetch('/api/admin/instagram', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orders: updated.map((p) => ({ id: p.id, sort_order: p.sort_order })) }),
    });
  };

  return { posts, loading, uploading, uploadAndAdd, deletePost, movePost, getR2BaseUrl };
}
