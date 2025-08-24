import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

// Create service role client for privileged access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Fetch the complete public trip data using service role
    const { data: tripData, error: tripError } = await serviceClient
      .from('trips')
      .select(`
        id,
        title,
        start_date,
        end_date,
        currency,
        share_id,
        is_public,
        days (
          id,
          date,
          index,
          day_places (
            id,
            sort_order,
            start_time,
            end_time,
            notes,
            cost_cents,
            places (
              id,
              name,
              lat,
              lng
            )
          )
        )
      `)
      .eq('share_id', shareId)
      .eq('is_public', true)
      .single();

    if (tripError) {
      console.error('Trip fetch error:', tripError);
      if (tripError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Trip not found or not public' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch trip data' },
        { status: 500 }
      );
    }

    // Transform the data to match our frontend format
    const transformedTrip = {
      id: tripData.id,
      title: tripData.title,
      start_date: tripData.start_date,
      end_date: tripData.end_date,
      currency: tripData.currency,
      share_id: tripData.share_id,
      is_public: tripData.is_public,
      activeDayIndex: 0,
      days: tripData.days
        .sort((a: any, b: any) => a.index - b.index)
        .map((day: any) => ({
          id: day.id,
          title: `Day ${day.index + 1}`,
          date: day.date,
          index: day.index,
          stops: day.day_places
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((dp: any) => ({
              id: dp.id,
              title: dp.places.name,
              lat: dp.places.lat,
              lng: dp.places.lng,
              note: dp.notes || '',
              cost: dp.cost_cents ? dp.cost_cents / 100 : 0,
              dayPlaceId: dp.id,
              placeId: dp.places.id,
            })),
        })),
    };

    // Add CORS headers for public access
    const response = NextResponse.json({
      trip: transformedTrip,
      success: true,
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}