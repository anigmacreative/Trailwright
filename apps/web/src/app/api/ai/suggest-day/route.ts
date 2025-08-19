import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, dayIndex, currentStops } = body;

    // Get the FastAPI backend URL
    const backendUrl = process.env.TRAILWRIGHT_API_URL || 'https://trailwright-api.fly.dev';
    console.log('Backend URL:', backendUrl);
    
    // Extract city from current stops or default
    let city = 'New York';
    if (currentStops && currentStops.length > 0) {
      // Could use reverse geocoding here, for now use a default
      city = 'Current Location';
    }

    // Forward the request to the FastAPI backend
    const fullUrl = `${backendUrl}/ai/generate-day-plan`;
    console.log('Making request to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        interests: ['sightseeing', 'food', 'culture'], // Default interests
        hours: 8,
        travel_mode: 'DRIVING',
        trip_id: tripId,
        day_id: `day-${dayIndex}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FastAPI returned ${response.status}: ${errorText}`);
      throw new Error(`FastAPI returned ${response.status}`);
    }

    const suggestions = await response.json();
    
    return NextResponse.json(suggestions);
  } catch (error: unknown) {
    // log the full error for debugging
    console.error('AI suggestions failed:', error);

    // narrow the error type safely
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      // handle non-Error objects with a message field
      message = (error as any).message;
    }

    return NextResponse.json(
      {
        error: 'AI suggestions temporarily unavailable',
        details: message,
      },
      { status: 500 }
    );
  }
}