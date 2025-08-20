import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const region = searchParams.get('region') ?? 'us';
    
    if (!q.trim()) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }
    
    const backendUrl = process.env.TRAILWRIGHT_API_URL || 'https://trailwright-api.fly.dev';
    const url = `${backendUrl}/places/search?q=${encodeURIComponent(q)}&region=${encodeURIComponent(region)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    const body = await response.text();
    const contentType = response.headers.get('content-type') ?? 'application/json';
    
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error: unknown) {
    console.error('Places search proxy failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Places search temporarily unavailable',
        details: message,
      },
      { status: 500 }
    );
  }
}