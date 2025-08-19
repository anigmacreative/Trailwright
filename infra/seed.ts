import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import { randomUUID } from "crypto";

// Load environment variables
config({ path: path.join(__dirname, "../apps/web/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // Read seed data
    const seedDataPath = path.join(__dirname, "seed_data.json");
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, "utf8"));

    // Create demo user for trip ownership
    const demoUser = {
      id: "demo-user-id",
      email: "demo@trailwright.com",
      password: "demo123456",
    };

    // First, create or get demo user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: demoUser.email,
      password: demoUser.password,
      user_metadata: {
        display_name: "Demo Explorer",
      },
    });

    let userId: string;
    
    if (authError && (authError.message.includes("email_exists") || authError.code === "email_exists")) {
      // User already exists, get their ID
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email === demoUser.email);
      userId = existingUser?.id || "demo-user-fallback";
      console.log(`✅ Demo user already exists: ${userId}`);
    } else if (authError) {
      console.error("Error creating demo user:", authError);
      return;
    } else {
      userId = authData?.user?.id || "demo-user-fallback";
      console.log(`✅ Demo user created: ${userId}`);
    }
    // Clear existing demo data for this user
    console.log("🧹 Cleaning existing demo data...");
    const { data: existingTrips } = await supabase
      .from("trips")
      .select("id")
      .eq("owner_id", userId);
    
    if (existingTrips && existingTrips.length > 0) {
      const tripIds = existingTrips.map(t => t.id);
      const { data: existingDays } = await supabase
        .from("days")
        .select("id")
        .in("trip_id", tripIds);
      
      if (existingDays && existingDays.length > 0) {
        const dayIds = existingDays.map(d => d.id);
        await supabase.from("day_places").delete().in("day_id", dayIds);
      }
      
      await supabase.from("days").delete().in("trip_id", tripIds);
      await supabase.from("trips").delete().in("id", tripIds);
    }

    // Seed each trip
    for (const tripData of seedData.trips) {
      console.log(`🗺️  Seeding trip: ${tripData.title}`);

      // Create trip with explicit share_id to avoid encoding issue
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          owner_id: userId,
          title: tripData.title,
          start_date: tripData.start_date,
          end_date: tripData.end_date,
          is_public: tripData.is_public,
          currency: tripData.currency,
          share_id: `demo-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        })
        .select()
        .single();

      if (tripError) {
        console.error(`Error creating trip ${tripData.title}:`, tripError);
        continue;
      }

      // Create days and places
      for (const dayData of tripData.days) {
        const { data: day, error: dayError } = await supabase
          .from("days")
          .insert({
            trip_id: trip.id,
            date: dayData.date,
            index: dayData.index,
          })
          .select()
          .single();

        if (dayError) {
          console.error(`Error creating day:`, dayError);
          continue;
        }

        // Create places and day_places
        for (const placeData of dayData.places) {
          // First, create or find the place
          let { data: existingPlace } = await supabase
            .from("places")
            .select("id")
            .eq("name", placeData.name)
            .eq("lat", placeData.lat)
            .eq("lng", placeData.lng)
            .single();

          let placeId: string;

          if (existingPlace) {
            placeId = existingPlace.id;
          } else {
            const { data: newPlace, error: placeError } = await supabase
              .from("places")
              .insert({
                name: placeData.name,
                lat: placeData.lat,
                lng: placeData.lng,
              })
              .select("id")
              .single();

            if (placeError) {
              console.error(`Error creating place ${placeData.name}:`, placeError);
              continue;
            }

            placeId = newPlace.id;
          }

          // Create day_place relationship
          const { error: dayPlaceError } = await supabase
            .from("day_places")
            .insert({
              day_id: day.id,
              place_id: placeId,
              sort_order: placeData.sort_order,
              start_time: placeData.start_time || null,
              end_time: placeData.end_time || null,
              notes: placeData.notes || null,
              cost_cents: placeData.cost_cents || null,
              tags: placeData.tags || null,
            });

          if (dayPlaceError) {
            console.error(`Error creating day_place:`, dayPlaceError);
          }
        }
      }

      console.log(`✅ Completed seeding: ${tripData.title}`);
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log(`\n📝 Demo login credentials:`);
    console.log(`Email: ${demoUser.email}`);
    console.log(`Password: ${demoUser.password}`);
    console.log(`\n🔗 Access demo trips at: /app/trips`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log("✨ Seed process completed");
  process.exit(0);
});