-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE trip_member_role AS ENUM ('owner', 'editor', 'viewer');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Trips table
CREATE TABLE trips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_public BOOLEAN DEFAULT FALSE,
    currency TEXT DEFAULT 'USD',
    share_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'base64url'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Trip members table
CREATE TABLE trip_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role trip_member_role DEFAULT 'viewer',
    invited_email TEXT,
    invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64url'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT user_or_email_required CHECK (user_id IS NOT NULL OR invited_email IS NOT NULL),
    UNIQUE(trip_id, user_id),
    UNIQUE(trip_id, invited_email)
);

ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

-- Days table
CREATE TABLE days (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(trip_id, date),
    UNIQUE(trip_id, index)
);

ALTER TABLE days ENABLE ROW LEVEL SECURITY;

-- Places table
CREATE TABLE places (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    google_place_id TEXT UNIQUE,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT,
    types JSONB,
    photo_ref TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Day places (many-to-many with ordering)
CREATE TABLE day_places (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    day_id UUID REFERENCES days(id) ON DELETE CASCADE NOT NULL,
    place_id UUID REFERENCES places(id) ON DELETE CASCADE NOT NULL,
    sort_order INTEGER NOT NULL,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    cost_cents INTEGER,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(day_id, place_id),
    UNIQUE(day_id, sort_order)
);

ALTER TABLE day_places ENABLE ROW LEVEL SECURITY;

-- Trip notes
CREATE TABLE notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    body TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Comments on places/trip
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    day_place_id UUID REFERENCES day_places(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Budget tracking
CREATE TABLE budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    daily_budget_cents INTEGER,
    total_budget_cents INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(trip_id)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- File attachments
CREATE TABLE attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- AI suggestions
CREATE TABLE ai_suggestions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    day_id UUID REFERENCES days(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    result JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_trips_owner_id ON trips(owner_id);
CREATE INDEX idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user_id ON trip_members(user_id);
CREATE INDEX idx_days_trip_id ON days(trip_id);
CREATE INDEX idx_day_places_day_id ON day_places(day_id);
CREATE INDEX idx_day_places_place_id ON day_places(place_id);
CREATE INDEX idx_places_google_place_id ON places(google_place_id);
CREATE INDEX idx_notes_trip_id ON notes(trip_id);
CREATE INDEX idx_comments_trip_id ON comments(trip_id);
CREATE INDEX idx_comments_day_place_id ON comments(day_place_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();