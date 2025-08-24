"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/ui";
import { Plus, MapPin, Calendar, Users, Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Mock data for demo
const mockTrips = [
  {
    id: "demo-trip-1",
    title: "Iceland Volcano Trekking",
    startDate: "2024-06-15",
    endDate: "2024-06-22",
    memberCount: 3,
    dayCount: 8,
    isPublic: true,
  },
  {
    id: "demo-trip-2", 
    title: "Diving in the Red Sea",
    startDate: "2024-07-10",
    endDate: "2024-07-17",
    memberCount: 2,
    dayCount: 8,
    isPublic: true,
  },
  {
    id: "demo-trip-3",
    title: "Patagonia Expedition", 
    startDate: "2024-11-05",
    endDate: "2024-11-18",
    memberCount: 4,
    dayCount: 14,
    isPublic: true,
  },
];

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Check if demo mode is enabled
        const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
        
        if (!demoMode) {
          // Try to load live data
          const { data, error: supabaseError } = await supabase
            .from('trips')
            .select('*')
            .order('created_at', { ascending: false });

          if (supabaseError) {
            console.warn('Failed to load live trips, falling back to demo data:', supabaseError);
            setIsDemo(true);
            setTrips(mockTrips);
          } else {
            setTrips(data || []);
            setIsDemo(false);
          }
        } else {
          // Use demo data
          setIsDemo(true);
          setTrips(mockTrips);
        }
      } catch (err) {
        console.warn('Error loading trips, using demo data:', err);
        setIsDemo(true);
        setTrips(mockTrips);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrips();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold">Your Expeditions</h1>
            <p className="mt-2 text-olive">Loading your trips...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {isDemo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-blue-800 text-sm font-medium">Demo Data</span>
          <span className="text-blue-700 text-sm">Showing example trips for demonstration</span>
        </div>
      )}
      
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold">Your Expeditions</h1>
          <p className="mt-2 text-olive">Plan, collaborate, and embark on extraordinary journeys.</p>
        </div>
        <Button asChild>
          <Link href="/app/trips/new">
            <Plus className="mr-2 h-4 w-4" />
            New Trip
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <Card key={trip.id} className="group cursor-pointer transition-all hover:shadow-soft-lg">
            <Link href={`/app/trips/${trip.id}`}>
              <CardHeader>
                <CardTitle className="group-hover:text-olive transition-colors">
                  {trip.title}
                </CardTitle>
                <CardDescription>
                  {trip.startDate ? `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}` : 
                   trip.start_date ? `${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()}` :
                   'No dates set'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-olive">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{trip.dayCount || trip.day_count || 0} days</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{trip.memberCount || trip.member_count || 1} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.isPublic || trip.is_public ? "Public" : "Private"}</span>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-64 h-64 rounded-2xl bg-clay/10 flex items-center justify-center mb-6">
            <MapPin className="h-16 w-16 text-clay" />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-2">No expeditions yet</h3>
          <p className="text-olive mb-6">Start planning your next adventure.</p>
          <Button asChild size="lg">
            <Link href="/app/trips/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Trip
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}