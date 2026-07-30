# Deployment Guide: GitHub + Vercel

## Step 1: Verify GitHub Repository ✅ (Already Done)
Your code is already pushed to GitHub. Verify:
```bash
git remote -v
# Should show your GitHub repo URL
```

## Step 2: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account
5. Click "Create" to create your Vercel account

## Step 3: Import Project from GitHub
1. After logging in to Vercel, click "Add New..."
2. Select "Project"
3. Click "Continue with GitHub"
4. Search for your repository name (e.g., "next" or "clinic-management")
5. Click "Import"

## Step 4: Configure Project Settings
**Project Name:** 
- Default is your repo name, you can change it
- Example: `c2m-clinic` or `clinic-management`

**Framework Preset:**
- Should auto-detect as "Next.js" ✅

**Root Directory:**
- Leave as `./` (default)

## Step 5: Environment Variables
Before deploying, add your environment variables in Vercel:

1. In the "Environment Variables" section, add:

```
DATABASE_URL=mysql://[username]:[password]@[host]:[port]/[database_name]
```

**Options for DATABASE_URL:**

### Option A: Use Existing MySQL Database
If you have a remote MySQL database:
```
DATABASE_URL=mysql://root:password@your-host.com:3306/next_db
```

### Option B: Set Up Free Database (Recommended for Deployment)
- **PlanetScale** (MySQL): https://planetscale.com (Free tier available)
- **Railway** (MySQL): https://railway.app (Free credits)
- **AWS RDS**: https://aws.amazon.com (Free tier)

**To use PlanetScale:**
1. Create account at https://planetscale.com
2. Create new database
3. Copy the connection string
4. Add to Vercel environment variables

Example:
```
DATABASE_URL=mysql://abcd1234:pscale_pw_xxx@aws.connect.psdb.cloud/next_db?sslaccept=strict
```

## Step 6: Build & Deploy
1. Click "Deploy"
2. Vercel will:
   - Build your Next.js project
   - Run `npm install`
   - Run `npm run build`
   - Deploy to Vercel's servers
3. Wait for the build to complete (usually 2-5 minutes)

## Step 7: Post-Deployment Setup

### Update Database Schema (if using new database)
After deployment, run migrations:

```bash
# In your local terminal
npx prisma migrate deploy
# or
npx prisma db push
```

### Update Environment Variables in Production
If you need to make changes:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Update variables
4. Redeploy (Vercel will auto-redeploy on code push)

## Step 8: Visit Your Live Site
After deployment completes:
- Vercel provides a live URL like: `https://your-project-name.vercel.app`
- Your app is now live! 🚀

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Common issue: Missing environment variables
- Solution: Add DATABASE_URL to Vercel environment variables

### Database Connection Error
- Verify DATABASE_URL is correct
- Check if database is accessible from Vercel's servers
- PlanetScale requires SSL (already configured)

### Prisma Migration Issues
Run locally before deployment:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Login/Auth Not Working
- Check NEXT_PUBLIC_* variables if needed for client-side
- Verify database has users table
- Check authentication routes are working

---

## Automatic Deployments
Once connected, Vercel will automatically deploy when you:
1. Push to your GitHub `main` branch
2. Create pull requests (Preview deployments)
3. Merge pull requests

## Useful Commands

```bash
# Check deployment status
vercel status

# Redeploy latest version
vercel --prod

# View logs
vercel logs

# Open in browser
vercel open
```

---

## Next Steps After Deployment
1. ✅ Set custom domain (if you have one)
2. ✅ Enable Analytics
3. ✅ Set up automatic backups for database
4. ✅ Monitor application performance
5. ✅ Set up CI/CD for automated testing
