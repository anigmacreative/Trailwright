-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trips policies
CREATE POLICY "Users can view trips they are members of" ON trips FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (
        SELECT trip_id FROM trip_members 
        WHERE user_id = auth.uid()
    ) OR
    is_public = true
);

CREATE POLICY "Users can create trips" ON trips FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Trip owners can update their trips" ON trips FOR UPDATE USING (
    owner_id = auth.uid() OR 
    id IN (
        SELECT trip_id FROM trip_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
);

CREATE POLICY "Trip owners can delete their trips" ON trips FOR DELETE USING (owner_id = auth.uid());

-- Trip members policies
CREATE POLICY "Users can view trip members for trips they belong to" ON trip_members FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE owner_id = auth.uid()
    ) OR
    trip_id IN (
        SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Trip owners can manage trip members" ON trip_members FOR ALL USING (
    trip_id IN (
        SELECT id FROM trips WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can accept invitations" ON trip_members FOR UPDATE USING (
    user_id = auth.uid() AND invite_token IS NOT NULL
);

-- Days policies
CREATE POLICY "Users can view days for accessible trips" ON days FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
        is_public = true
    )
);

CREATE POLICY "Trip editors can manage days" ON days FOR ALL USING (
    trip_id IN (
        SELECT id FROM trips WHERE owner_id = auth.uid()
    ) OR
    trip_id IN (
        SELECT trip_id FROM trip_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
);

-- Day places policies
CREATE POLICY "Users can view day places for accessible trips" ON day_places FOR SELECT USING (
    day_id IN (
        SELECT id FROM days WHERE trip_id IN (
            SELECT id FROM trips WHERE 
            owner_id = auth.uid() OR 
            id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
            is_public = true
        )
    )
);

CREATE POLICY "Trip editors can manage day places" ON day_places FOR ALL USING (
    day_id IN (
        SELECT id FROM days WHERE trip_id IN (
            SELECT id FROM trips WHERE owner_id = auth.uid()
        ) OR trip_id IN (
            SELECT trip_id FROM trip_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    )
);

-- Notes policies
CREATE POLICY "Users can view notes for accessible trips" ON notes FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
        is_public = true
    )
);

CREATE POLICY "Trip members can create notes" ON notes FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    trip_id IN (
        SELECT id FROM trips WHERE owner_id = auth.uid()
    ) OR
    trip_id IN (
        SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own notes" ON notes FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete their own notes" ON notes FOR DELETE USING (created_by = auth.uid());

-- Comments policies
CREATE POLICY "Users can view comments for accessible trips" ON comments FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
        is_public = true
    )
);

CREATE POLICY "Trip members can create comments" ON comments FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    trip_id IN (
        SELECT id FROM trips WHERE owner_id = auth.uid()
    ) OR
    trip_id IN (
        SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (user_id = auth.uid());

-- Budgets policies
CREATE POLICY "Users can view budgets for accessible trips" ON budgets FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
        is_public = true
    )
);

CREATE POLICY "Trip editors can manage budgets" ON budgets FOR ALL USING (
    trip_id IN (
        SELECT id FROM trips WHERE owner_id = auth.uid()
    ) OR
    trip_id IN (
        SELECT trip_id FROM trip_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
);

-- Attachments policies
CREATE POLICY "Users can view attachments for accessible trips" ON attachments FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
        is_public = true
    )
);

CREATE POLICY "Trip members can create attachments" ON attachments FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    trip_id IN (
        SELECT id FROM trips WHERE owner_id = auth.uid()
    ) OR
    trip_id IN (
        SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own attachments" ON attachments FOR DELETE USING (user_id = auth.uid());

-- AI suggestions policies
CREATE POLICY "Users can view AI suggestions for accessible trips" ON ai_suggestions FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
        is_public = true
    )
);

CREATE POLICY "Trip members can create AI suggestions" ON ai_suggestions FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    trip_id IN (
        SELECT id FROM trips WHERE owner_id = auth.uid()
    ) OR
    trip_id IN (
        SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
);

-- Public share view for read-only access
CREATE VIEW public_trip_view AS
SELECT 
    t.id,
    t.title,
    t.start_date,
    t.end_date,
    t.currency,
    t.share_id,
    p.display_name as owner_name
FROM trips t
JOIN profiles p ON t.owner_id = p.id
WHERE t.is_public = true;

-- Grant access to public share view
GRANT SELECT ON public_trip_view TO anon, authenticated;