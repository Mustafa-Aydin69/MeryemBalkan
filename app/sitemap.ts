import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { createSlug } from './utils/slugUtils'

// 1 saatte bir yeniden üret — yeni ürünler otomatik girer
export const revalidate = 3600

const BASE = 'https://meryembalkan.com.tr'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticUrls: MetadataRoute.Sitemap = [
    // Ana sayfalar
    { url: `${BASE}`,          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/portfolio`, lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/hakkimda`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/iletisim`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // SEO landing sayfaları
    { url: `${BASE}/erzincan-gelinlik-kiralama`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/erzincan-abiye-kiralama`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/erzincan-nisanlik-kiralama`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/gelinlik-kiralama`,           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/abiye-kiralama`,              lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/nisanlik-kiralama`,           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Yasal/kurumsal sayfalar
    { url: `${BASE}/gizlilik-politikasi`,           lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/kvkk`,                          lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/aydinlatma-metni`,              lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/kiralama-sozlesmesi`,           lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/mesafeli-satis-sozlesmesi`,     lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/teslimat-ve-iade-politikasi`,   lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dinamik ürün sayfaları — hata durumunda graceful degradation (statik URL'ler yine döner)
  const { data } = await supabase
    .from('urunler')
    .select('id, title')
    .eq('status', 'Yayında')

  const productUrls: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
    url: `${BASE}/portfolio/${createSlug(p.id, p.title)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticUrls, ...productUrls]
}
