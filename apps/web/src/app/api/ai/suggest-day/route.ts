import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, dayIndex, currentStops } = body;

    // Get the FastAPI backend URL
    const backendUrl = process.env.TRAILWRIGHT_API_URL || 'https://trailwright-api.fly.dev';
    
    // Forward the request to the FastAPI backend
    const response = await fetch(`${backendUrl}/ai/generate-day-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city: 'New York', // TODO: Extract from trip data or current stops
        interests: ['sightseeing', 'food'], // TODO: Extract from user preferences
        hours: 8,
        travel_mode: 'DRIVING',
        trip_id: tripId,
        day_id: `day-${dayIndex}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI returned ${response.status}`);
    }

    const suggestions = await response.json();
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('AI suggestions failed:', error);
    return NextResponse.json(
      { error: 'AI suggestions temporarily unavailable' },
      { status: 500 }
    );
  }
}