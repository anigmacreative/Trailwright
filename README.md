# Trailwright 🗺️

> Adventure planning with minimal fuss. Collaborative trip planning with an adventure-minimal aesthetic.

A production-ready MVP for small groups to plan extraordinary journeys together. Built with Next.js, FastAPI, and Supabase.

## ✨ Features

- **Interactive Map Planning**: Google Maps integration with draggable markers and multi-day routing
- **AI-Powered Suggestions**: Generate day plans using Claude/GPT with intelligent place recommendations
- **Real-time Collaboration**: Live cursors, comments, and seamless team editing via Supabase Realtime
- **Route Optimization**: TSP-based algorithms to optimize travel routes within days
- **Export & Sharing**: PDF exports, public links, calendar integration (ICS)
- **File Imports**: KML/GPX file parsing for existing itineraries
- **Budget Tracking**: Cost management with currency formatting and category breakdowns
- **Adventure-Minimal Design**: Aesop-inspired aesthetic with earthy tones and elegant typography

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router and React Server Components
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: shadcn/ui with custom adventure-minimal theme
- **Maps**: Google Maps JavaScript API with Places, Directions, Distance Matrix
- **State**: React hooks with optimistic updates
- **Auth**: Supabase Auth with Google/Apple OAuth

### Backend (FastAPI)
- **Framework**: FastAPI with async/await
- **Features**: Route optimization (TSP), AI integration, file parsing
- **Deployment**: Docker + Fly.io/Railway ready
- **Testing**: Pytest with async support

### Database (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Realtime**: Live collaboration features
- **Storage**: File uploads for attachments
- **Auth**: Built-in authentication with social providers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.11+
- Supabase account
- Google Maps API key
- AI API key (Anthropic Claude or OpenAI)

### 1. Clone and Install

```bash
git clone <repository-url>
cd trailwright
pnpm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and keys
3. Run the database setup:

```sql
-- In Supabase SQL Editor, run:
\i infra/schema.sql
\i infra/rls_policies.sql
```

4. Enable Google/Apple auth in Supabase Auth settings

### 3. Configure Google Maps

1. Create a Google Cloud project
2. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Distance Matrix API
3. Create an API key and restrict it to your domain

### 4. Environment Setup

Copy and configure environment files:

```bash
# Web app
cp apps/web/.env.example apps/web/.env.local

# API service
cp apps/api/.env.example apps/api/.env
```

Fill in your API keys and Supabase credentials.

### 5. Start Development

```bash
# Start all services
pnpm dev

# Or individually:
cd apps/web && pnpm dev     # Next.js on :3000
cd apps/api && python main.py  # FastAPI on :8000
```

### 6. Seed Demo Data

```bash
pnpm db:seed
```

This creates demo trips and a test user:
- Email: `demo@trailwright.com`
- Password: `demo123456`

## 📁 Project Structure

```
trailwright/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/app/         # App router pages
│   │   ├── src/components/  # React components
│   │   ├── src/lib/         # Utilities & Supabase client
│   │   └── public/          # Static assets
│   └── api/                 # FastAPI backend
│       ├── main.py          # API routes
│       ├── test_main.py     # Tests
│       └── requirements.txt # Python dependencies
├── packages/
│   ├── ui/                  # Shared component library
│   └── config/              # Shared configs (ESLint, Tailwind, etc.)
├── infra/
│   ├── schema.sql           # Database schema
│   ├── rls_policies.sql     # Row Level Security policies
│   ├── seed.ts              # Database seeding script
│   └── seed_data.json       # Demo trip data
└── docs/                    # Additional documentation
```

## 🎨 Design System

The adventure-minimal aesthetic uses:

- **Colors**: 
  - `--ink`: #0D0D0C (near-black)
  - `--bone`: #F5F2EB (ivory)
  - `--clay`: #C7B9A5 (warm beige)
  - `--olive`: #6C6B57 (muted green)
  - `--slate`: #2E2E2B (dark grey)

- **Typography**: 
  - Headings: Ibarra Real Nova (serif)
  - UI: Inter (humanist sans-serif)

- **Components**: Rounded corners (rounded-2xl), soft shadows, ample whitespace

## 🧪 Testing

```bash
# Frontend tests
cd apps/web && pnpm test

# Backend tests  
cd apps/api && pytest

# E2E tests
pnpm test:e2e
```

## 🚢 Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Fly.io)

```bash
cd apps/api
fly launch
fly secrets set SUPABASE_URL=... ANTHROPIC_API_KEY=...
fly deploy
```

### Database (Supabase)

Already hosted! Just run your SQL migrations in the Supabase dashboard.

## 📊 7-Day Investor Demo Checklist

- [ ] **Day 1**: Deploy to Vercel + Fly.io with demo data
- [ ] **Day 2**: Google/Apple OAuth working, invite flows functional  
- [ ] **Day 3**: AI day planning generates realistic suggestions
- [ ] **Day 4**: Route optimization visibly improves travel efficiency
- [ ] **Day 5**: Real-time collaboration shows live cursors/updates
- [ ] **Day 6**: PDF export produces beautiful, branded documents
- [ ] **Day 7**: Public sharing links work, mobile responsive

## 🔧 Configuration

### Feature Flags

Control features via environment variables:

```bash
NEXT_PUBLIC_DEMO_MODE=true           # Skip auth, load demo data
NEXT_PUBLIC_ENABLE_ANALYTICS=false   # PostHog tracking
NEXT_PUBLIC_ENABLE_AI=true           # AI suggestions
ENABLE_STRIPE=false                  # Payment processing (future)
```

### AI Providers

Switch between AI providers:

```bash
AI_PROVIDER=anthropic  # or "openai"
ANTHROPIC_API_KEY=...  # if using Claude
OPENAI_API_KEY=...     # if using GPT
```

## 🛣️ Roadmap

### Phase 1: MVP (Current)
- ✅ Core trip planning
- ✅ Google Maps integration
- ✅ Basic collaboration
- ✅ AI suggestions
- ✅ Export functionality

### Phase 2: Enhancement
- [ ] Offline PWA support
- [ ] Advanced route optimization
- [ ] Weather integration
- [ ] Booking integration APIs
- [ ] Mobile app (React Native)

### Phase 3: Scale
- [ ] Freemium with Stripe
- [ ] Advanced analytics
- [ ] Team management
- [ ] White-label solutions
- [ ] API for third parties

## 🐛 Troubleshooting

### Common Issues

**Google Maps not loading**
- Check API key has correct APIs enabled
- Verify domain restrictions
- Check browser console for errors

**Database connection failed**
- Verify Supabase URL and keys
- Check RLS policies are enabled
- Ensure user has proper permissions

**AI suggestions not working**
- Verify AI_PROVIDER environment variable
- Check API key is valid and has credits
- Review FastAPI logs for errors

**Build failures**
- Clear `.next` and `node_modules`
- Check all environment variables are set
- Verify TypeScript compilation

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🎯 Contact

Built with ❤️ for adventurers who plan with purpose.

For support or questions, please open an issue on GitHub.