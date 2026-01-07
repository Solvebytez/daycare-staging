import { MetadataRoute } from 'next';

interface Daycare {
  _id: string;
  id?: string;
  name: string;
  slug?: string;
}

// Get API base URL for server-side
function getApiBaseUrl(): string {
  // Server-side: check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.kinderbridge.ca';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  process.env.FRONTEND_URL || 
                  'https://www.kinderbridge.ca';

  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/classes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/toys`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // Fetch all daycares for dynamic routes
  let daycarePages: MetadataRoute.Sitemap = [];
  
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/daycares`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache revalidation - revalidate every hour
      next: { revalidate: 3600 }
    });

    if (response.ok) {
      const data = await response.json();
      const daycares: Daycare[] = data.success ? data.data : [];

      daycarePages = daycares.map((daycare) => {
        const daycareId = daycare._id || daycare.id || '';
        return {
          url: `${baseUrl}/daycare/${daycareId}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });
    } else {
      console.warn('Failed to fetch daycares for sitemap, using fallback');
    }
  } catch (error) {
    console.error('Error fetching daycares for sitemap:', error);
    // Fallback: try to use static JSON data
    try {
      const daycaresData = await import('@/data/daycares.json');
      const daycares: Daycare[] = Array.isArray(daycaresData.default) 
        ? daycaresData.default 
        : [];

      daycarePages = daycares.map((daycare) => {
        const daycareId = daycare.id || daycare._id || '';
        return {
          url: `${baseUrl}/daycare/${daycareId}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });
    } catch (fallbackError) {
      console.error('Fallback to static data also failed:', fallbackError);
    }
  }

  // Combine static and dynamic pages
  return [...staticPages, ...daycarePages];
}

