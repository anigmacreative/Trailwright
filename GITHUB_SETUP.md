# GitHub Repository Setup

Follow these steps to create the GitHub repository and push your code:

## Option 1: Using GitHub Web Interface (Recommended)

1. **Go to GitHub.com and create a new repository:**
   - Visit: https://github.com/new
   - Repository name: `trailwright`
   - Description: `Adventure-minimal trip planner for small groups. Built with Next.js, FastAPI, and Supabase.`
   - Choose: **Public** (for open source) or **Private** 
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

2. **Push your local repository:**
   ```bash
   cd "/Volumes/ACS/Documents/Wanderlust 2.0"
   git remote add origin https://github.com/YOUR_USERNAME/trailwright.git
   git branch -M main
   git push -u origin main
   ```

## Option 2: Using GitHub CLI (if you have it)

```bash
# Install GitHub CLI first (if not installed)
brew install gh

# Authenticate
gh auth login

# Create repository and push
cd "/Volumes/ACS/Documents/Wanderlust 2.0"
gh repo create trailwright --public --description "Adventure-minimal trip planner for small groups"
git remote add origin https://github.com/YOUR_USERNAME/trailwright.git
git push -u origin main
```

## Repository Settings

After creating the repository, configure these settings:

### 1. Repository Description & Topics
- Description: `Adventure-minimal trip planner for small groups. Built with Next.js, FastAPI, and Supabase.`
- Topics: `nextjs`, `fastapi`, `supabase`, `typescript`, `travel`, `trip-planning`, `maps`, `ai`, `react`

### 2. Branch Protection (Optional)
- Go to Settings > Branches
- Add rule for `main` branch:
  - ✅ Require pull request reviews
  - ✅ Require status checks to pass (if using CI/CD)

### 3. Secrets for GitHub Actions
Go to Settings > Secrets and variables > Actions and add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
TURBO_TOKEN (optional - for Turborepo caching)
```

### 4. Enable Issues & Discussions
- Go to Settings > General
- ✅ Enable Issues
- ✅ Enable Discussions (optional)

## Current Git Status

Your repository has been initialized with:
- ✅ 52 files committed
- ✅ Initial commit message with feature summary  
- ✅ .gitignore configured for Node.js, Python, and Supabase
- ✅ README.md with comprehensive documentation
- ✅ CI/CD pipeline configured

## Next Steps After Push

1. **Set up Vercel deployment:**
   - Connect your GitHub repo to Vercel
   - Configure environment variables
   
2. **Set up Supabase:**
   - Create new project
   - Run schema and RLS policies
   
3. **Deploy FastAPI:**
   - Set up Fly.io account
   - Deploy from your repository

4. **Configure domain (optional):**
   - Set up custom domain in Vercel
   - Update Google Maps API restrictions

Your repository is ready to go live! 🚀