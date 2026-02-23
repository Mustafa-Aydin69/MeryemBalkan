import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://meryembalkan.com.tr',
      lastModified: new Date(),
    },
    {
      url: 'https://meryembalkan.com.tr/hakkimda',
      lastModified: new Date(),
    },
    {
      url: 'https://meryembalkan.com.tr/iletisim',
      lastModified: new Date(),
    },
    {
      url: 'https://meryembalkan.com.tr/portfolio',
      lastModified: new Date(),
    },
  ]
}

export const dynamic = 'force-static'
