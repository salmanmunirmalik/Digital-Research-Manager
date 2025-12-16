# DirectAdmin Deployment Guide

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run all migrations including `20250127_safety_systems.sql`
- [ ] Verify database connection settings in `.env`
- [ ] Ensure PostgreSQL extensions are enabled (pgvector if needed)

### 2. Environment Variables
Create `.env` file with:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digital_research_manager
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_here

# Frontend
VITE_API_URL=https://yourdomain.com/api

# AI Providers (optional, users can add their own)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GEMINI_API_KEY=
PERPLEXITY_API_KEY=
```

### 3. Build Commands
```bash
# Install dependencies
pnpm install

# Build frontend
pnpm run build

# Build backend (if using TypeScript compilation)
pnpm run build:server
```

### 4. DirectAdmin Setup Steps

#### Step 1: Create Application Directory
1. Log into DirectAdmin
2. Navigate to File Manager
3. Create directory: `public_html/researchlab` (or your preferred path)

#### Step 2: Upload Files
Upload the following:
- `dist/` (frontend build)
- `server/` (backend source)
- `database/` (migrations)
- `package.json`
- `.env` (create on server, don't upload from local)
- `node_modules/` (or install on server)

#### Step 3: Node.js Application Setup
1. In DirectAdmin, go to **Advanced Features** → **Node.js App**
2. Click **Create Node.js App**
3. Configure:
   - **App Name**: `researchlab`
   - **App URL**: `/researchlab` or root domain
   - **App Root**: `/home/username/researchlab`
   - **App Startup File**: `server/index.js` or `server/index.ts`
   - **Node.js Version**: Latest LTS (18.x or 20.x)
   - **App Mode**: Production

#### Step 4: Environment Variables in DirectAdmin
1. In Node.js App settings, add environment variables:
   - `NODE_ENV=production`
   - `PORT=3000` (or port assigned by DirectAdmin)
   - All database and API keys from `.env`

#### Step 5: Database Configuration
1. Create PostgreSQL database in DirectAdmin:
   - Go to **Advanced Features** → **PostgreSQL Databases**
   - Create database: `digital_research_manager`
   - Create user and grant privileges
   - Note connection details

2. Run migrations:
   ```bash
   # SSH into server
   cd /home/username/researchlab
   psql -U db_user -d digital_research_manager -f database/migrations/20250127_safety_systems.sql
   # Run other migrations in order
   ```

#### Step 6: Reverse Proxy Setup (if needed)
If using DirectAdmin's Apache/Nginx:
1. Go to **Advanced Features** → **Custom HTTPD Config**
2. Add reverse proxy configuration:

**For Apache:**
```apache
<Location /api>
    ProxyPass http://localhost:3000/api
    ProxyPassReverse http://localhost:3000/api
</Location>
```

**For Nginx:**
```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

#### Step 7: SSL Certificate
1. In DirectAdmin, go to **SSL Certificates**
2. Install Let's Encrypt certificate for your domain
3. Force HTTPS redirect

#### Step 8: Start Application
1. In Node.js App settings, click **Start**
2. Check logs for errors
3. Test API endpoint: `https://yourdomain.com/api/health`

### 5. File Permissions
```bash
# Set proper permissions
chmod 755 /home/username/researchlab
chmod 644 /home/username/researchlab/.env
chmod 755 /home/username/researchlab/server
```

### 6. Process Manager (PM2) - Optional
If DirectAdmin doesn't manage Node.js processes:
```bash
# Install PM2 globally
npm install -g pm2

# Start application
cd /home/username/researchlab
pm2 start server/index.js --name researchlab

# Save PM2 configuration
pm2 save
pm2 startup
```

### 7. Cron Jobs (if needed)
For scheduled tasks:
1. Go to **Advanced Features** → **Cron Jobs**
2. Add cron jobs for:
   - Database backups
   - Cleanup tasks
   - Scheduled workflows

### 8. Monitoring
- Check DirectAdmin Node.js App logs
- Monitor database connections
- Check server resources (CPU, Memory)
- Set up error alerts

## Post-Deployment Verification

1. **Health Check**: `https://yourdomain.com/api/health`
2. **Frontend**: `https://yourdomain.com`
3. **Database**: Verify all tables created
4. **API Endpoints**: Test key endpoints
5. **Authentication**: Test login/register
6. **AI Features**: Test AI Research Agent (requires API keys)

## Troubleshooting

### Application Won't Start
- Check Node.js version compatibility
- Verify environment variables
- Check file permissions
- Review application logs

### Database Connection Issues
- Verify database credentials
- Check PostgreSQL is running
- Verify network access
- Check firewall rules

### API Not Responding
- Verify reverse proxy configuration
- Check port assignments
- Review Apache/Nginx error logs
- Verify application is running

### Frontend Not Loading
- Check build output in `dist/`
- Verify `VITE_API_URL` in environment
- Check browser console for errors
- Verify static file serving

## Security Checklist

- [ ] Use HTTPS only
- [ ] Secure `.env` file (not in public directory)
- [ ] Set strong JWT secret
- [ ] Enable CORS only for your domain
- [ ] Use database connection pooling
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Audit logging enabled
- [ ] API keys stored securely

## Backup Strategy

1. **Database Backups**:
   ```bash
   pg_dump -U db_user digital_research_manager > backup_$(date +%Y%m%d).sql
   ```

2. **File Backups**:
   - Backup `server/` directory
   - Backup `.env` file
   - Backup `database/migrations/`

3. **Automated Backups**:
   - Set up cron job for daily database backups
   - Store backups off-server

## Performance Optimization

1. **Enable Caching**:
   - Redis for session storage (optional)
   - CDN for static assets

2. **Database Optimization**:
   - Regular VACUUM and ANALYZE
   - Monitor query performance
   - Add indexes as needed

3. **Application Optimization**:
   - Enable gzip compression
   - Optimize images
   - Minify JavaScript/CSS

## Support

For issues:
1. Check application logs in DirectAdmin
2. Review database logs
3. Check server error logs
4. Review this deployment guide

