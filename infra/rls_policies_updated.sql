-- Row Level Security Policies for Public Demo Support
-- This file contains updated/additional RLS policies to support anonymous public demo access

-- Enable RLS on places table (missing from original schema)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Places policies
-- Allow public read access to places referenced by public trips
CREATE POLICY "Anyone can view places in public trips" ON places FOR SELECT USING (
    id IN (
        SELECT DISTINCT dp.place_id 
        FROM day_places dp
        JOIN days d ON dp.day_id = d.id
        JOIN trips t ON d.trip_id = t.id
        WHERE t.is_public = true
    )
);

-- Allow authenticated users to create places (needed for adding stops)
CREATE POLICY "Authenticated users can create places" ON places FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- Allow trip editors to update places (for editing stop metadata)
CREATE POLICY "Trip editors can update places in their trips" ON places FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    id IN (
        SELECT DISTINCT dp.place_id 
        FROM day_places dp
        JOIN days d ON dp.day_id = d.id
        JOIN trips t ON d.trip_id = t.id
        WHERE t.owner_id = auth.uid() OR
              t.id IN (
                  SELECT trip_id FROM trip_members 
                  WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
              )
    )
);

-- Additional anonymous access policies for existing tables
-- These policies specifically support public demo access without authentication

-- Enhanced trips policy for anonymous access
DROP POLICY IF EXISTS "Users can view trips they are members of" ON trips;
CREATE POLICY "Anyone can view public trips and members can view their trips" ON trips FOR SELECT USING (
    is_public = true OR
    (auth.uid() IS NOT NULL AND (
        owner_id = auth.uid() OR 
        id IN (
            SELECT trip_id FROM trip_members 
            WHERE user_id = auth.uid()
        )
    ))
);

-- Enhanced days policy for anonymous access
DROP POLICY IF EXISTS "Users can view days for accessible trips" ON days;
CREATE POLICY "Anyone can view days for public trips and members can view their trip days" ON days FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE is_public = true
    ) OR
    (auth.uid() IS NOT NULL AND trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    ))
);

-- Enhanced day_places policy for anonymous access
DROP POLICY IF EXISTS "Users can view day places for accessible trips" ON day_places;
CREATE POLICY "Anyone can view day places for public trips and members can view their trip day places" ON day_places FOR SELECT USING (
    day_id IN (
        SELECT id FROM days WHERE trip_id IN (
            SELECT id FROM trips WHERE is_public = true
        )
    ) OR
    (auth.uid() IS NOT NULL AND day_id IN (
        SELECT id FROM days WHERE trip_id IN (
            SELECT id FROM trips WHERE 
            owner_id = auth.uid() OR 
            id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
        )
    ))
);

-- Enhanced notes policy for anonymous access
DROP POLICY IF EXISTS "Users can view notes for accessible trips" ON notes;
CREATE POLICY "Anyone can view notes for public trips and members can view their trip notes" ON notes FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE is_public = true
    ) OR
    (auth.uid() IS NOT NULL AND trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    ))
);

-- Enhanced comments policy for anonymous access
DROP POLICY IF EXISTS "Users can view comments for accessible trips" ON comments;
CREATE POLICY "Anyone can view comments for public trips and members can view their trip comments" ON comments FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE is_public = true
    ) OR
    (auth.uid() IS NOT NULL AND trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    ))
);

-- Enhanced budgets policy for anonymous access
DROP POLICY IF EXISTS "Users can view budgets for accessible trips" ON budgets;
CREATE POLICY "Anyone can view budgets for public trips and members can view their trip budgets" ON budgets FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE is_public = true
    ) OR
    (auth.uid() IS NOT NULL AND trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    ))
);

-- Enhanced attachments policy for anonymous access
DROP POLICY IF EXISTS "Users can view attachments for accessible trips" ON attachments;
CREATE POLICY "Anyone can view attachments for public trips and members can view their trip attachments" ON attachments FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE is_public = true
    ) OR
    (auth.uid() IS NOT NULL AND trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    ))
);

-- Enhanced AI suggestions policy for anonymous access
DROP POLICY IF EXISTS "Users can view AI suggestions for accessible trips" ON ai_suggestions;
CREATE POLICY "Anyone can view AI suggestions for public trips and members can view their trip AI suggestions" ON ai_suggestions FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE is_public = true
    ) OR
    (auth.uid() IS NOT NULL AND trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    ))
);

-- Grant necessary permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON trips TO anon;
GRANT SELECT ON days TO anon;
GRANT SELECT ON day_places TO anon;
GRANT SELECT ON places TO anon;
GRANT SELECT ON notes TO anon;
GRANT SELECT ON comments TO anon;
GRANT SELECT ON budgets TO anon;
GRANT SELECT ON attachments TO anon;
GRANT SELECT ON ai_suggestions TO anon;
GRANT SELECT ON profiles TO anon;

-- Create a helper function to check if a trip is publicly accessible
CREATE OR REPLACE FUNCTION is_trip_publicly_accessible(trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips 
        WHERE id = trip_id AND is_public = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;