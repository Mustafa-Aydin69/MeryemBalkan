import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://meryembalkan.com.tr',
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: 'https://meryembalkan.com.tr/hakkimizda',
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: 'https://meryembalkan.com.tr/iletisim',
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: 'https://meryembalkan.com.tr/portfolio',
      lastModified: new Date(),
      priority: 0.8,
    },
  ]
}
