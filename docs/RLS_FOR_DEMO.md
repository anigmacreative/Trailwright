# RLS for Demo - Row Level Security Configuration

This document explains the Row Level Security (RLS) configuration for public demo access in Trailwright.

## Overview

The application supports **anonymous public demo access** while maintaining proper security for authenticated users. This is achieved through:

1. **RLS policies** that allow reading public trips without authentication
2. **API endpoints** using service role for complex queries
3. **Dual access patterns** - public API for anonymous users, direct Supabase for authenticated users

## Access Patterns

### Anonymous Users (Public Demo)
- ✅ **Can read**: Public trips via API endpoints
- ✅ **Can view**: Trip details, days, stops, places for public trips
- ❌ **Cannot write**: Any data (redirected to sign up)
- ❌ **Cannot access**: Private trips

### Authenticated Users
- ✅ **Can read**: Their own trips + trips they're members of + public trips
- ✅ **Can write**: Add/edit/delete stops, optimize routes, etc.
- ✅ **Can manage**: Trip settings, member invitations

## Current RLS Policies

### Working Policies (from `infra/rls_policies.sql`)

#### Trips Table
```sql
CREATE POLICY "Users can view trips they are members of" ON trips FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
    is_public = true
);
```

#### Days Table
```sql
CREATE POLICY "Users can view days for accessible trips" ON days FOR SELECT USING (
    trip_id IN (
        SELECT id FROM trips WHERE 
        owner_id = auth.uid() OR 
        id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()) OR
        is_public = true
    )
);
```

#### Day Places Table
```sql
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
```

#### Public Trip View
```sql
CREATE VIEW public_trip_view AS
SELECT 
    t.id, t.title, t.start_date, t.end_date, t.currency, t.share_id,
    p.display_name as owner_name
FROM trips t
JOIN profiles p ON t.owner_id = p.id
WHERE t.is_public = true;

GRANT SELECT ON public_trip_view TO anon, authenticated;
```

### Known Issues

⚠️ **Places Table**: Missing RLS policies - currently accessible via joins only
⚠️ **Direct Trip Access**: Some policies cause infinite recursion when accessed anonymously

## API Endpoints & Authentication

### Public Endpoints (Anonymous Access)
| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/public-trip/[shareId]` | GET | ❌ No | Get complete public trip data |
| Public trip view | SELECT | ❌ No | List all public trips |

### Authenticated Endpoints (Service Role)
| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| Supabase Direct | All | ✅ Yes | CRUD operations for authenticated users |
| `/api/ai/suggest-day` | POST | ✅ Yes | AI-powered suggestions |
| Trip persistence | All | ✅ Yes | Add/remove/reorder stops |

## Implementation Details

### Frontend Access Strategy

The frontend uses a **dual access pattern**:

```typescript
// 1. Try public API first (works for anonymous users)
try {
  const response = await fetch(`/api/public-trip/${shareId}`);
  if (response.ok) {
    const { trip } = await response.json();
    return trip; // ✅ Anonymous access successful
  }
} catch (error) {
  // 2. Fallback to authenticated Supabase access
  const { data } = await supabase.from('trips')...
}
```

### Service Role API Pattern

```typescript
// API Route: /api/public-trip/[shareId]/route.ts
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

const { data } = await serviceClient
  .from('trips')
  .select('*, days(*, day_places(*, places(*)))')
  .eq('share_id', shareId)
  .eq('is_public', true)
  .single();
```

## Security Guarantees

### Read Access
- ✅ Anonymous users can only read public trip data
- ✅ Authenticated users can read their accessible trips + public trips
- ✅ Private trips are never exposed to unauthorized users

### Write Access
- ✅ All write operations require authentication
- ✅ Users can only modify trips they own or have editor permissions
- ✅ Anonymous users get clear "sign up to edit" messaging

### Data Isolation
- ✅ User profiles protected by RLS
- ✅ Private trip data isolated by ownership/membership
- ✅ Public trips explicitly marked with `is_public = true`

## Demo Access URLs

### Anonymous Demo Access
- `/app/trips/demo-trip-1` - Iceland Volcano Trekking
- `/app/trips/demo-trip-2` - Diving in the Red Sea  
- `/app/trips/demo-trip-3` - Patagonia Expedition
- `/app/trips/demo-trip-4` - K2 Basecamp Approach
- `/app/trips/demo-trip-5` - Extreme Arctic Expedition
- `/app/trips/demo-trip-6` - Border-to-Border Adventure Cycling

### Testing Anonymous Access
```bash
# Test public API endpoint
curl http://localhost:3000/api/public-trip/demo-trip-1

# Test public trip view
npx tsx infra/test-current-access.ts
```

## Deployment Considerations

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### RLS Policy Deployment
1. Apply base policies: `infra/rls_policies.sql`
2. Verify public access: Run test scripts
3. Seed demo data: `pnpm db:seed`

### Performance Notes
- Public API endpoints use service role for complex joins
- Anonymous RLS queries are simpler but limited
- Consider caching for high-traffic public trips

## Troubleshooting

### "Infinite recursion detected in policy"
- **Cause**: Conflicting RLS policies referencing each other
- **Solution**: Use public API endpoints instead of direct RLS access

### "Permission denied for table"
- **Cause**: Missing GRANT statements for anonymous role
- **Solution**: Ensure `GRANT SELECT TO anon` is applied

### "Trip not found" for public trips
- **Cause**: Trip not marked as `is_public = true`
- **Solution**: Update trip or re-run seed script

## Future Improvements

1. **Simplified RLS**: Resolve policy conflicts for direct anonymous access
2. **Caching**: Add Redis/CDN caching for public trip API
3. **Rate Limiting**: Implement rate limits for anonymous endpoints
4. **Analytics**: Track public demo usage patterns