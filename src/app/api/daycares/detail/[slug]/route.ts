import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    // Proxy to backend MongoDB (v15.0.0 - supports slug)
    const backendUrl = getApiBaseUrl();
    
    const response = await fetch(`${backendUrl}/api/daycares/detail/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    
    // Fallback to static data if backend is unavailable
    try {
      const daycaresData = await import('@/data/daycares.json');
      // Try to find by slug first, then by id (backward compatibility)
      const daycare = daycaresData.default.find(
        (d: { id: string; slug?: string }) => d.slug === slug || d.id === slug
      );
      
      if (!daycare) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Daycare not found',
            message: `No daycare found with ID: ${id}`
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: daycare,
        note: 'Using static data (backend unavailable)'
      });
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch daycare details',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
}
