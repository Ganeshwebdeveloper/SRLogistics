# Deployment Guide for Render.com

This guide explains how to deploy the SR Logistics application to Render.com.

## Prerequisites

- A Render.com account
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Connect Your Repository to Render

1. Log in to your Render.com dashboard
2. Click "New +" and select "Blueprint"
3. Connect your Git repository
4. Render will automatically detect the `render.yaml` file

### 2. Configure the Deployment

The `render.yaml` file already contains all necessary configuration:
- **Web Service**: sr-logistics (your main application)
- **Database**: sr-logistics-db (PostgreSQL database)
- **Environment Variables**: Automatically configured

### 3. Database Migrations (Automatic)

Database migrations are automatically applied during deployment using `scripts/start-production.sh`:

```bash
1. Runs npm run db:push (with 60-second timeout)
2. If successful, starts the server with npm start
3. If failed, deployment stops with an error
```

**Why This Approach:**
- Render's free tier doesn't support pre-deploy hooks
- Migrations must complete before serving traffic (to avoid schema mismatches)
- Drizzle's push command is fast (typically < 5 seconds) and idempotent
- Render allows 60 seconds for health checks, which is sufficient

**Trade-offs:**
- ✅ Automatic schema updates on every deployment
- ✅ No manual intervention needed
- ✅ Schema always matches code
- ⚠️ Service restart delayed by migration time (usually < 5s)
- ⚠️ If database is unavailable, deployment will fail (as it should)

**Manual Migration (Break-Glass Only)**

If you need to run migrations manually:

1. Go to Render dashboard → `sr-logistics` → Shell tab
2. Run: `npm run db:push`
3. Restart the service if needed

### 4. Verify the Deployment

1. Click on the service URL provided by Render (e.g., `https://sr-logistics.onrender.com`)
2. The application should load successfully
3. Test the following features:
   - User login/registration
   - Real-time chat functionality
   - GPS location tracking
   - All CRUD operations

## WebSocket Support

The application uses WebSockets for real-time features (chat and GPS tracking). Render.com automatically supports WebSocket upgrades on Web Services, so no additional configuration is needed.

The WebSocket connection will automatically use:
- `ws://` for HTTP connections (local development)
- `wss://` for HTTPS connections (production on Render)

## Environment Variables

The following environment variables are automatically configured by Render:

- `NODE_ENV`: Set to "production"
- `DATABASE_URL`: Connection string for the PostgreSQL database
- `SESSION_SECRET`: Auto-generated secure random string
- `PORT`: Automatically set by Render (defaults to 5000)

## Troubleshooting

### Deployment Failed

If deployment fails, check the build logs:
1. Go to your service in the Render dashboard
2. Click on "Logs"
3. Look for error messages during the build process

Common issues:
- **npm install fails**: Check if all dependencies are in `package.json`
- **Build fails**: Check for TypeScript errors locally with `npm run check`

### Database Connection Issues

If the application can't connect to the database:
1. Verify that `DATABASE_URL` is set in the environment variables
2. Check that the database service is running
3. Ensure you ran `npm run db:push` to create the schema

### Real-time Features Not Working

If WebSocket connections fail:
1. Check browser console for WebSocket errors
2. Verify the application is using HTTPS (not HTTP) in production
3. Check that the server is listening on the correct port

### Health Check Failures

If the health check keeps failing:
1. Check the application logs for startup errors
2. Verify that the server starts within 60 seconds
3. Ensure the root path (`/`) returns a 200 status code

## Updating the Application

To deploy updates:

1. Push your changes to the Git repository
2. Render will automatically detect the changes and redeploy
3. Database migrations are applied automatically during deployment

**Note:** You do NOT need to manually run migrations. The deployment script handles this automatically.

## Free Tier Limitations

Render's free tier has some limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours of runtime per month
- Limited database storage (1GB)

For production use with high availability, consider upgrading to a paid plan.
