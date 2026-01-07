import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  process.env.FRONTEND_URL || 
                  'https://www.kinderbridge.ca';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/profile/',
          '/favorites/',
          '/payment/',
          '/purchase-report/',
          '/test-',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/register-success',
          '/apply',
          '/drive',
          '/parent/',
          '/provider/',
          '/employer/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/profile/',
          '/favorites/',
          '/payment/',
          '/purchase-report/',
          '/test-',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/register-success',
          '/apply',
          '/drive',
          '/parent/',
          '/provider/',
          '/employer/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

