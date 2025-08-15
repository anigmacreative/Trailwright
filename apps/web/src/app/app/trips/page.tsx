import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/ui";
import { Plus, MapPin, Calendar, Users } from "lucide-react";
import Link from "next/link";

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
  return (
    <div className="container mx-auto px-6 py-8">
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
        {mockTrips.map((trip) => (
          <Card key={trip.id} className="group cursor-pointer transition-all hover:shadow-soft-lg">
            <Link href={`/app/trips/${trip.id}`}>
              <CardHeader>
                <CardTitle className="group-hover:text-olive transition-colors">
                  {trip.title}
                </CardTitle>
                <CardDescription>
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-olive">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{trip.dayCount} days</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{trip.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.isPublic ? "Public" : "Private"}</span>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {mockTrips.length === 0 && (
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