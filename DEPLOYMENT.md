# Deployment Guide

This guide walks through deploying Trailwright to production environments.

## Prerequisites

- Supabase account
- Google Cloud Platform account (for Maps API)
- Vercel account (for frontend)
- Fly.io account (for backend API)
- Anthropic or OpenAI API key

## 1. Database Setup (Supabase)

### Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Note your project URL and API keys

### Run Migrations

1. In the Supabase dashboard, go to SQL Editor
2. Create a new query and paste the contents of `infra/schema.sql`
3. Run the query to create tables and functions
4. Create another query with `infra/rls_policies.sql` and run it
5. Verify tables are created in the Table Editor

### Configure Authentication

1. Go to Authentication > Settings
2. Enable Google OAuth:
   - Add your Google OAuth client ID and secret
   - Add authorized redirect URLs: `https://yourdomain.com/auth/callback`
3. Enable Apple OAuth (optional):
   - Configure Apple OAuth credentials
   - Add redirect URLs

### Environment Variables

Note these values for later:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

## 2. Google Maps API Setup

### Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable billing for the project

### Enable APIs

Enable these APIs in the API Library:
- Maps JavaScript API
- Places API  
- Directions API
- Distance Matrix API

### Create API Key

1. Go to Credentials > Create Credentials > API Key
2. Restrict the key:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your domains
   - **API restrictions**: Select only the enabled APIs above
3. Note your API key for environment variables

## 3. AI Provider Setup

Choose either Anthropic Claude or OpenAI:

### Anthropic Claude (Recommended)

1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Set `AI_PROVIDER=anthropic`
3. Set `ANTHROPIC_API_KEY=your_key`

### OpenAI GPT

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Set `AI_PROVIDER=openai`  
3. Set `OPENAI_API_KEY=your_key`

## 4. Frontend Deployment (Vercel)

### Connect Repository

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Choose the **Next.js** framework preset
3. Set the root directory to `apps/web`

### Environment Variables

In Vercel dashboard, add these environment variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_DEMO_MODE=true

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# AI Provider
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Optional
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Deploy

1. Click **Deploy** in Vercel
2. Wait for build to complete
3. Visit your deployment URL
4. Verify the app loads and shows demo data

## 5. Backend Deployment (Fly.io)

### Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux/Windows
curl -L https://fly.io/install.sh | sh
```

### Deploy API

```bash
cd apps/api

# Login to Fly.io
fly auth login

# Launch app (creates fly.toml)
fly launch --copy-config --name trailwright-api

# Set secrets
fly secrets set \
  SUPABASE_URL="your_supabase_url" \
  SUPABASE_SERVICE_ROLE_KEY="your_service_key" \
  ANTHROPIC_API_KEY="your_anthropic_key" \
  GOOGLE_MAPS_API_KEY="your_google_maps_key" \
  PDF_SECRET="random_string_here"

# Deploy
fly deploy
```

### Update Frontend

Update your Vercel environment variables:

```bash
NEXT_PUBLIC_API_URL=https://trailwright-api.fly.dev
```

Redeploy the frontend in Vercel.

## 6. Seed Demo Data

### Install Dependencies

```bash
cd infra
npm install
```

### Configure Environment

Create `.env.local` in the infra directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Run Seed Script

```bash
cd infra
npx tsx seed.ts
```

This creates demo trips and a test user:
- Email: `demo@trailwright.com`
- Password: `demo123456`

## 7. Domain Setup (Optional)

### Custom Domain in Vercel

1. Go to your project settings in Vercel
2. Add your custom domain
3. Configure DNS records as instructed
4. Update Google OAuth and Maps API restrictions

### Custom Domain in Fly.io

```bash
cd apps/api
fly certs add api.yourdomain.com
```

Update environment variables to use your custom domains.

## 8. Monitoring Setup

### Error Tracking

Add error tracking with Sentry:

```bash
# Add to environment variables
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_DSN=your_sentry_dsn
```

### Analytics

Enable PostHog analytics:

```bash
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## 9. SSL Certificates

Both Vercel and Fly.io automatically provision SSL certificates. Verify:

1. Visit your domains with `https://`
2. Check certificate validity in browser
3. Test API endpoints with HTTPS

## 10. Testing Production

### Smoke Tests

1. **Landing page loads**: Visit your domain
2. **Authentication works**: Try Google/Apple sign-in
3. **Maps render**: Check Google Maps load correctly
4. **AI suggestions**: Test day planning features
5. **Real-time features**: Open trip in multiple tabs
6. **Export functions**: Test PDF generation
7. **Mobile responsive**: Test on mobile devices

### Performance Testing

1. **Lighthouse audit**: Run in Chrome DevTools
2. **Core Web Vitals**: Check loading performance
3. **API response times**: Monitor FastAPI endpoints
4. **Database queries**: Check Supabase performance

## 11. Security Checklist

- [ ] Environment variables are secret (not in code)
- [ ] Google Maps API key is restricted to your domains
- [ ] Supabase RLS policies are enabled and tested
- [ ] HTTPS is enforced on all endpoints
- [ ] Authentication callbacks use secure domains
- [ ] API keys have minimal required permissions
- [ ] Database has connection limits configured
- [ ] Rate limiting is enabled on APIs

## 12. Backup Strategy

### Database Backups

Supabase automatically backs up your database. For additional security:

1. Enable point-in-time recovery in Supabase
2. Schedule regular database dumps
3. Store backups in separate cloud storage

### Code Backups

1. Ensure code is in GitHub with multiple collaborators
2. Tag stable releases
3. Document deployment procedures

## Troubleshooting

### Common Issues

**Build fails in Vercel**
- Check all environment variables are set
- Verify TypeScript compilation locally
- Check build logs for specific errors

**Maps don't load**
- Verify Google Maps API key is correct
- Check API restrictions match your domain
- Ensure all required APIs are enabled

**Database connection errors**
- Verify Supabase URL and keys
- Check if RLS policies block your queries
- Confirm network connectivity

**AI features don't work**
- Check AI provider API key is valid
- Verify provider is set correctly (anthropic/openai)
- Check API has sufficient credits/quota

### Getting Help

1. Check application logs in Vercel and Fly.io dashboards
2. Monitor Supabase logs for database issues
3. Use browser DevTools to debug frontend issues
4. Check this repository's Issues for known problems

## Cost Optimization

### Free Tier Limits

- **Vercel**: 100GB bandwidth, unlimited static sites
- **Supabase**: 500MB database, 2GB bandwidth
- **Fly.io**: 3 shared VMs, 160GB volume storage  
- **Google Maps**: $200 monthly credit

### Scaling Considerations

Monitor usage and upgrade plans as needed:
- Supabase Pro for larger databases
- Vercel Pro for team features
- Fly.io scale for higher API traffic
- Google Cloud billing alerts

## Success Metrics

Track these metrics post-deployment:

- **Uptime**: > 99.9% availability
- **Response time**: < 2s page loads
- **Error rate**: < 1% of requests
- **User engagement**: Session duration, feature usage
- **Conversion**: Demo to sign-up rates

Your Trailwright deployment should now be live and ready for users! 🎉